"use strict";

const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const webRoot = path.join(root, "web");
const nextBin = path.join(webRoot, "node_modules", ".bin", "next");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) {
          reject(error);
        } else if (!port) {
          reject(new Error("Could not obtain a free port"));
        } else {
          resolve(port);
        }
      });
    });
  });
}

function requestReady(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(true);
    });
    request.setTimeout(500, () => request.destroy());
    request.once("error", () => resolve(false));
  });
}

function waitForReady(child, url) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15_000;
    let timer;
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      child.off("error", onError);
      child.off("exit", onExit);
      callback();
    };

    const onError = (error) => {
      finish(() => reject(error));
    };

    const onExit = (code, signal) => {
      finish(() =>
        reject(
          new Error(
            `Next dev exited before readiness (code ${code}, signal ${signal || "none"})`,
          ),
        ),
      );
    };

    const poll = async () => {
      if (settled) {
        return;
      }

      if (await requestReady(url)) {
        finish(resolve);
        return;
      }

      if (Date.now() >= deadline) {
        finish(() => reject(new Error("Next dev did not become ready within 15 seconds")));
        return;
      }

      timer = setTimeout(poll, 100);
    };

    child.once("error", onError);
    child.once("exit", onExit);
    void poll();
  });
}

function runBrowserTest(baseUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "tests", "web-booking.js")], {
      cwd: root,
      env: { ...process.env, WEB_BASE_URL: baseUrl },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Browser test terminated by ${signal}`));
      } else {
        resolve(code ?? 1);
      }
    });
  });
}

async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const forceTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
    child.once("exit", () => {
      clearTimeout(forceTimer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

async function main() {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(nextBin, ["dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: webRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "inherit", "inherit"],
  });

  try {
    await waitForReady(server, baseUrl);
    process.exitCode = await runBrowserTest(baseUrl);
  } finally {
    await stopChild(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
