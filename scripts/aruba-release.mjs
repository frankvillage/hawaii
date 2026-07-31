#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const command = process.argv[2] ?? "inspect";
const rootDir = resolve(import.meta.dirname, "..");
const artifactDir = resolve(
  process.env.ARUBA_ARTIFACT_DIR ?? join(rootDir, "output/aruba-static"),
);
const host = process.env.ARUBA_FTP_HOST ?? "ftplnx02.aruba.it";
const remoteRoot = normalizeRemotePath(
  process.env.ARUBA_REMOTE_ROOT ?? "/www.hawaiipescara.it",
);
const oldName = validateEntryName(process.env.ARUBA_OLD_DIR ?? "old");
const requireTls = process.env.ARUBA_FTP_TLS !== "allow-plain";
const releaseStamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const releaseStateDir = join(rootDir, "output", "aruba-releases");

function fail(message) {
  throw new Error(message);
}

function normalizeRemotePath(value) {
  const normalized = `/${value}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

function joinRemote(...parts) {
  return normalizeRemotePath(parts.filter(Boolean).join("/"));
}

function validateEntryName(name) {
  if (!name || name === "." || name === ".." || /[\/\0\r\n]/.test(name)) {
    fail(`Nome remoto non sicuro: ${JSON.stringify(name)}`);
  }
  return name;
}

function resolveNetrc() {
  const configured = process.env.ARUBA_FTP_NETRC;
  if (configured) {
    const path = resolve(configured);
    if (!existsSync(path)) fail("ARUBA_FTP_NETRC non esiste.");
    return { path, cleanup: false };
  }

  const user = process.env.ARUBA_FTP_USER;
  let password = process.env.ARUBA_FTP_PASSWORD;
  if (!password && user && process.platform === "darwin") {
    const lookup = spawnSync(
      "security",
      ["find-internet-password", "-s", host, "-a", user, "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    if (lookup.status === 0) password = lookup.stdout.trimEnd();
  }

  if (!user || !password) {
    fail(
      "Credenziali assenti. Configura ARUBA_FTP_NETRC oppure ARUBA_FTP_USER e " +
        "ARUBA_FTP_PASSWORD; la password non viene mai salvata nel repository.",
    );
  }

  const directory = mkdtempSync(join(tmpdir(), "hawaii-aruba-netrc-"));
  const path = join(directory, "credentials");
  writeFileSync(path, `machine ${host}\nlogin ${user}\npassword ${password}\n`, {
    mode: 0o600,
  });
  chmodSync(path, 0o600);
  return { path, cleanup: true, directory };
}

let credentials;

function cleanupCredentials() {
  if (credentials?.cleanup) {
    rmSync(credentials.directory, { recursive: true, force: true });
  }
}

process.on("exit", cleanupCredentials);
process.on("SIGINT", () => {
  cleanupCredentials();
  process.exit(130);
});

function ftpUrl(path = remoteRoot) {
  const encoded = normalizeRemotePath(path)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `ftp://${host}${encoded || "/"}`;
}

function ftpDirectoryUrl(path = remoteRoot) {
  return `${ftpUrl(path).replace(/\/+$/, "")}/`;
}

function runCurl(args, { allowFailure = false } = {}) {
  const common = [
    "--silent",
    "--show-error",
    "--fail",
    "--connect-timeout",
    "20",
    "--max-time",
    "600",
    "--netrc-file",
    credentials.path,
  ];
  if (requireTls) common.push("--ssl-reqd");

  const result = spawnSync("curl", [...common, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 && !allowFailure) {
    fail(result.stderr.trim() || `curl terminato con codice ${result.status}`);
  }
  return result;
}

function parseMlsd(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(" ");
      if (separator < 0) return null;
      const facts = line.slice(0, separator).toLowerCase();
      const name = line.slice(separator + 1).trim();
      if (
        name === "." ||
        name === ".." ||
        facts.includes("type=cdir") ||
        facts.includes("type=pdir")
      ) {
        return null;
      }
      return validateEntryName(name);
    })
    .filter(Boolean);
}

function listRemote(path = remoteRoot) {
  const mlsd = runCurl(["--custom-request", "MLSD", ftpDirectoryUrl(path)], {
    allowFailure: true,
  });
  if (mlsd.status === 0) return [...new Set(parseMlsd(mlsd.stdout))].sort();

  const listing = runCurl(["--list-only", ftpDirectoryUrl(path)]);
  return [
    ...new Set(
      listing.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && line !== "." && line !== "..")
        .map(validateEntryName),
    ),
  ].sort();
}

function quote(commands, path = remoteRoot) {
  const args = [];
  for (const value of commands) args.push("--quote", value);
  runCurl([...args, "--list-only", ftpDirectoryUrl(path)]);
}

function makeRemoteDirectory(path) {
  quote([`MKD ${normalizeRemotePath(path)}`]);
}

function moveRemote(from, to) {
  quote([`RNFR ${normalizeRemotePath(from)}`, `RNTO ${normalizeRemotePath(to)}`]);
}

function uploadFile(localPath, remotePath) {
  runCurl([
    "--ftp-create-dirs",
    "--upload-file",
    localPath,
    ftpUrl(remotePath),
  ]);
}

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function artifactInventory() {
  if (!existsSync(artifactDir)) {
    fail(`Artefatto assente: ${artifactDir}. Esegui prima npm run build:web:aruba.`);
  }
  const files = walkFiles(artifactDir);
  if (!files.length) fail("L'artefatto Aruba è vuoto.");
  const releasePath = join(artifactDir, "RELEASE.txt");
  if (!existsSync(releasePath)) fail("RELEASE.txt assente dall'artefatto Aruba.");

  const release = Object.fromEntries(
    readFileSync(releasePath, "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
  const head = spawnSync("git", ["-C", rootDir, "rev-parse", "HEAD"], {
    encoding: "utf8",
  });
  if (head.status !== 0) fail("Impossibile verificare il commit Git corrente.");
  if (
    release.commit !== head.stdout.trim() ||
    release.worktree !== "clean" ||
    release.base_path !== "root"
  ) {
    fail("L'artefatto non corrisponde al commit corrente pulito e al base path root.");
  }

  const readiness = spawnSync(
    process.execPath,
    [join(rootDir, "tests/aruba-static-readiness.js"), artifactDir],
    { encoding: "utf8" },
  );
  if (readiness.status !== 0) {
    fail(readiness.stderr.trim() || readiness.stdout.trim() || "Readiness Aruba fallita.");
  }

  return files.map((path) => {
    const content = readFileSync(path);
    return {
      path: relative(artifactDir, path).split(sep).join("/"),
      bytes: statSync(path).size,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  });
}

function writeManifest(manifest) {
  mkdirSync(releaseStateDir, { recursive: true });
  const path = join(releaseStateDir, `${manifest.releaseId}.json`);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  return path;
}

function restoreMoves(moves) {
  const errors = [];
  for (const move of [...moves].reverse()) {
    try {
      moveRemote(move.to, move.from);
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (errors.length) fail(`Ripristino automatico incompleto: ${errors.join("; ")}`);
}

function attemptAllRestores(moveGroups) {
  const errors = [];
  for (const moves of moveGroups) {
    try {
      restoreMoves(moves);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (errors.length) fail(errors.join("; "));
}

function inspect() {
  const entries = listRemote();
  console.log(
    JSON.stringify(
      {
        host,
        remoteRoot,
        tls: requireTls ? "required" : "plain-allowed",
        oldDirectoryPresent: entries.includes(oldName),
        wordpressMarkers: ["wp-admin", "wp-content", "wp-includes", "wp-config.php"].filter(
          (entry) => entries.includes(entry),
        ),
        entries,
      },
      null,
      2,
    ),
  );
}

function deploy() {
  const rootEntries = listRemote();
  if (!rootEntries.includes(oldName)) {
    fail(`La cartella remota ${oldName} non è presente nella document root.`);
  }
  const requiredWordPressEntries = ["wp-admin", "wp-content", "wp-includes", "wp-config.php"];
  const missingWordPressEntries = requiredWordPressEntries.filter(
    (entry) => !rootEntries.includes(entry),
  );
  if (missingWordPressEntries.length) {
    fail(
      `Document root non riconosciuta come WordPress; mancano: ${missingWordPressEntries.join(", ")}`,
    );
  }

  const files = artifactInventory();
  const releaseId = `hawaii-static-${releaseStamp}`;
  const backupDirectory = joinRemote(remoteRoot, oldName, `wordpress-pre-${releaseId}`);
  const stagingDirectory = joinRemote(remoteRoot, oldName, `.staging-${releaseId}`);
  const oldEntries = rootEntries.filter((entry) => entry !== oldName);
  const topLevelEntries = [...new Set(files.map(({ path }) => path.split("/")[0]))].sort();
  const manifest = {
    schema: 1,
    releaseId,
    createdAt: new Date().toISOString(),
    host,
    remoteRoot,
    oldDirectory: joinRemote(remoteRoot, oldName),
    backupDirectory,
    stagingDirectory,
    previousRootEntries: oldEntries,
    releaseTopLevelEntries: [...topLevelEntries, "DEPLOY-MANIFEST.json"].sort(),
    files,
  };
  const localManifestPath = writeManifest(manifest);

  makeRemoteDirectory(backupDirectory);
  makeRemoteDirectory(stagingDirectory);

  for (const file of files) {
    uploadFile(join(artifactDir, file.path), joinRemote(stagingDirectory, file.path));
  }
  uploadFile(
    localManifestPath,
    joinRemote(stagingDirectory, "DEPLOY-MANIFEST.json"),
  );

  const backupMoves = [];
  try {
    for (const entry of oldEntries) {
      const move = {
        from: joinRemote(remoteRoot, entry),
        to: joinRemote(backupDirectory, entry),
      };
      moveRemote(move.from, move.to);
      backupMoves.push(move);
    }
    uploadFile(
      localManifestPath,
      joinRemote(backupDirectory, "ROLLBACK-MANIFEST.json"),
    );
  } catch (error) {
    restoreMoves(backupMoves);
    throw error;
  }

  const promotionMoves = [];
  try {
    for (const entry of manifest.releaseTopLevelEntries) {
      const move = {
        from: joinRemote(stagingDirectory, entry),
        to: joinRemote(remoteRoot, entry),
      };
      moveRemote(move.from, move.to);
      promotionMoves.push(move);
    }
  } catch (error) {
    attemptAllRestores([promotionMoves, backupMoves]);
    throw error;
  }

  console.log(`Release promossa: ${releaseId}`);
  console.log(`Backup WordPress: ${backupDirectory}`);
  console.log(`Manifest locale: ${localManifestPath}`);
}

function rollback(manifestPath) {
  if (!manifestPath) fail("Specifica il manifest locale del rilascio da ripristinare.");
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));
  if (
    manifest.host !== host ||
    normalizeRemotePath(manifest.remoteRoot) !== remoteRoot ||
    !Array.isArray(manifest.previousRootEntries) ||
    !Array.isArray(manifest.releaseTopLevelEntries)
  ) {
    fail("Manifest di rollback non valido per questo host/root.");
  }

  const rootEntries = listRemote();
  const allowed = new Set([oldName, ...manifest.releaseTopLevelEntries]);
  const unexpected = rootEntries.filter((entry) => !allowed.has(entry));
  if (unexpected.length) {
    fail(`Rollback interrotto: elementi inattesi nella root: ${unexpected.join(", ")}`);
  }

  const failedReleaseDirectory = joinRemote(
    remoteRoot,
    oldName,
    `failed-${manifest.releaseId}-${releaseStamp}`,
  );
  makeRemoteDirectory(failedReleaseDirectory);

  const staticMoves = [];
  const restoreMovesLog = [];
  try {
    for (const entry of manifest.releaseTopLevelEntries.filter((name) =>
      rootEntries.includes(name),
    )) {
      const move = {
        from: joinRemote(remoteRoot, entry),
        to: joinRemote(failedReleaseDirectory, entry),
      };
      moveRemote(move.from, move.to);
      staticMoves.push(move);
    }
    for (const entry of manifest.previousRootEntries) {
      const move = {
        from: joinRemote(manifest.backupDirectory, entry),
        to: joinRemote(remoteRoot, entry),
      };
      moveRemote(move.from, move.to);
      restoreMovesLog.push(move);
    }
  } catch (error) {
    attemptAllRestores([restoreMovesLog, staticMoves]);
    throw error;
  }

  console.log(`WordPress ripristinato da: ${manifest.backupDirectory}`);
  console.log(`Release statica conservata in: ${failedReleaseDirectory}`);
}

try {
  credentials = resolveNetrc();
  if (command === "inspect") inspect();
  else if (command === "deploy") deploy();
  else if (command === "rollback") rollback(process.argv[3]);
  else fail("Comando supportato: inspect, deploy, rollback.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
