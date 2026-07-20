"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = process.cwd();
const publicRoot = path.resolve(root, process.argv[2] || "pages-preview");
const basePath = (process.env.PAGES_BASE_PATH || "/hawaii").replace(/\/+$/, "");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function resolveRequest(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, "http://localhost").pathname);
  let candidate = path.resolve(publicRoot, `.${pathname}`);
  if (!candidate.startsWith(`${publicRoot}${path.sep}`) && candidate !== publicRoot) return null;

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  } else if (!fs.existsSync(candidate) && !path.extname(candidate)) {
    candidate = path.join(candidate, "index.html");
  }
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
}

function sendFile(request, response, filePath) {
  const stat = fs.statSync(filePath);
  const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  const headers = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
  };

  if (range) {
    const suffixLength = !range[1] && range[2] ? Number(range[2]) : null;
    const start = suffixLength === null
      ? Number(range[1] || 0)
      : Math.max(stat.size - suffixLength, 0);
    const end = suffixLength === null
      ? (range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1)
      : stat.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      response.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      response.end();
      return;
    }
    response.writeHead(206, {
      ...headers,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, "Content-Length": stat.size });
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(filePath).pipe(response);
}

function run(script, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script)], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    let timedOut = false;
    let forceKill = null;
    const watchdog = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      forceKill = setTimeout(() => child.kill("SIGKILL"), 2_000);
    }, 90_000);
    const cleanup = () => {
      clearTimeout(watchdog);
      if (forceKill) clearTimeout(forceKill);
    };
    child.once("error", (error) => {
      cleanup();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      cleanup();
      if (timedOut) reject(new Error(`${script} exceeded the 90 second deadline`));
      else if (code === 0) resolve();
      else reject(new Error(`${script} exited with ${code ?? signal}`));
    });
  });
}

async function main() {
  const siteRoot = path.join(publicRoot, basePath.replace(/^\//, ""));
  if (!fs.existsSync(path.join(siteRoot, "index.html"))) {
    throw new Error(`Missing static Pages artifact under ${siteRoot}`);
  }

  const server = http.createServer((request, response) => {
    const filePath = resolveRequest(request.url || "/");
    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    sendFile(request, response, filePath);
  });

  try {
    await new Promise((resolve, reject) => {
      const watchdog = setTimeout(() => {
        server.closeAllConnections?.();
        try {
          server.close();
        } catch {
          // The listener may not have reached the listening state yet.
        }
        reject(new Error("Static server readiness timeout"));
      }, 20_000);
      server.once("error", (error) => {
        clearTimeout(watchdog);
        reject(error);
      });
      server.listen(0, "127.0.0.1", () => {
        clearTimeout(watchdog);
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Static server has no port");
    const env = { WEB_BASE_URL: `http://127.0.0.1:${address.port}${basePath}` };

    await run("tests/web-booking.js", env);
    await run("tests/web-smoke.js", env);
    try {
      await run("tests/webkit-mobile-playback.js", env);
    } catch (error) {
      if (process.env.WEBKIT_PLAYBACK_OPTIONAL !== "1") throw error;
      console.warn(`WebKit playback diagnostic did not pass: ${error.message}`);
    }
  } finally {
    server.closeAllConnections?.();
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
