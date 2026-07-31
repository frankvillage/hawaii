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
const oldAccessGuard = join(rootDir, "deploy", "aruba", "old.htaccess");
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

function remoteFileInventory(remotePath) {
  const directory = mkdtempSync(join(tmpdir(), "hawaii-aruba-verify-"));
  const downloadPath = join(directory, basename(remotePath) || "download");
  try {
    runCurl(["--output", downloadPath, ftpUrl(remotePath)]);
    const content = readFileSync(downloadPath);
    return {
      bytes: content.length,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function remoteFileMatches(remotePath, expected) {
  const actual = remoteFileInventory(remotePath);
  return actual.bytes === expected.bytes && actual.sha256 === expected.sha256;
}

function localFileInventory(localPath) {
  const content = readFileSync(localPath);
  return {
    bytes: content.length,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

function verifyRemoteFile(remotePath, expected) {
  const actual = remoteFileInventory(remotePath);
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    fail(
      `Verifica remota fallita per ${remotePath}: ` +
        `${actual.bytes} byte/${actual.sha256}, attesi ` +
        `${expected.bytes} byte/${expected.sha256}.`,
    );
  }
}

function findEntrypoints(files) {
  return files.filter(
    (file) =>
      file.path === "404.html" ||
      file.path === "index.html" ||
      (file.path.endsWith("/index.html") &&
        file.path !== "404/index.html" &&
        file.path !== "_not-found/index.html"),
  );
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function uploadVerifiedFile(localPath, remotePath, expected) {
  const retryDelays = [0, 3_000, 8_000, 15_000];
  let lastError;
  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt]) sleep(retryDelays[attempt]);
    try {
      uploadFile(localPath, remotePath);
      verifyRemoteFile(remotePath, expected);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function uploadVerifiedFlatFile(localPath, baseName, expected) {
  const retryDelays = [0, 3_000, 8_000, 15_000];
  let lastError;
  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt]) sleep(retryDelays[attempt]);
    const remotePath = joinRemote(
      remoteRoot,
      oldName,
      validateEntryName(`${baseName}-${attempt}`),
    );
    try {
      uploadFile(localPath, remotePath);
      verifyRemoteFile(remotePath, expected);
      return remotePath;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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

function parentDirectories(files) {
  const directories = new Set();
  for (const { path } of files) {
    const segments = path.split("/");
    segments.pop();
    for (let depth = 1; depth <= segments.length; depth += 1) {
      directories.add(segments.slice(0, depth).join("/"));
    }
  }
  return [...directories].sort((left, right) => {
    const depthDifference = left.split("/").length - right.split("/").length;
    return depthDifference || left.localeCompare(right);
  });
}

function flatStageName(releaseId, path) {
  const digest = createHash("sha256").update(path).digest("hex").slice(0, 24);
  return validateEntryName(`stage-${releaseId}-${digest}`);
}

function stageApplicationFile(releaseId, stagingDirectory, file) {
  const localFile = join(artifactDir, ...file.path.split("/"));
  const stagedFile = uploadVerifiedFlatFile(
    localFile,
    flatStageName(releaseId, file.path),
    file,
  );
  const nestedStagedFile = joinRemote(stagingDirectory, file.path);
  moveRemote(stagedFile, nestedStagedFile);
  return nestedStagedFile;
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
  const entrypointFiles = findEntrypoints(files);
  if (!entrypointFiles.some((file) => file.path === "index.html")) {
    fail("index.html assente dall'artefatto Aruba.");
  }
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

  if (!existsSync(oldAccessGuard)) fail("Protezione HTTP della cartella old assente.");
  uploadFile(oldAccessGuard, joinRemote(remoteRoot, oldName, ".htaccess"));
  makeRemoteDirectory(backupDirectory);
  makeRemoteDirectory(stagingDirectory);

  for (const file of files) {
    uploadFile(join(artifactDir, file.path), joinRemote(stagingDirectory, file.path));
  }
  uploadFile(
    localManifestPath,
    joinRemote(stagingDirectory, "DEPLOY-MANIFEST.json"),
  );
  for (const entrypoint of entrypointFiles) {
    uploadVerifiedFile(
      join(artifactDir, ...entrypoint.path.split("/")),
      joinRemote(stagingDirectory, entrypoint.path),
      entrypoint,
    );
  }

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
    for (const entrypoint of entrypointFiles) {
      verifyRemoteFile(joinRemote(remoteRoot, entrypoint.path), entrypoint);
    }
  } catch (error) {
    attemptAllRestores([promotionMoves, backupMoves]);
    throw error;
  }

  console.log(`Release promossa: ${releaseId}`);
  console.log(`Backup WordPress: ${backupDirectory}`);
  console.log(`Manifest locale: ${localManifestPath}`);
}

function updateStatic() {
  const rootEntries = listRemote();
  const requiredEntries = [oldName, "media", "_next", "index.html", "RELEASE.txt"];
  const missingEntries = requiredEntries.filter((entry) => !rootEntries.includes(entry));
  if (missingEntries.length) {
    fail(
      `Document root non riconosciuta come release statica; mancano: ${missingEntries.join(", ")}`,
    );
  }

  const files = artifactInventory();
  const preservedTopLevelEntries = ["media"];
  const applicationFiles = files.filter(
    ({ path }) => !preservedTopLevelEntries.includes(path.split("/")[0]),
  );
  const entrypointFiles = findEntrypoints(applicationFiles);
  if (!entrypointFiles.some((file) => file.path === "index.html")) {
    fail("index.html assente dall'artefatto Aruba.");
  }

  const releaseId = `hawaii-static-${releaseStamp}`;
  const backupDirectory = joinRemote(remoteRoot, oldName, `static-pre-${releaseId}`);
  const stagingDirectory = joinRemote(remoteRoot, oldName, `.staging-${releaseId}`);
  const previousRootEntries = rootEntries.filter(
    (entry) => entry !== oldName && !preservedTopLevelEntries.includes(entry),
  );
  const topLevelEntries = [
    ...new Set(applicationFiles.map(({ path }) => path.split("/")[0])),
  ].sort();
  const manifest = {
    schema: 2,
    releaseKind: "static-update",
    releaseId,
    createdAt: new Date().toISOString(),
    host,
    remoteRoot,
    oldDirectory: joinRemote(remoteRoot, oldName),
    backupDirectory,
    stagingDirectory,
    preservedTopLevelEntries,
    previousRootEntries,
    releaseTopLevelEntries: [...topLevelEntries, "DEPLOY-MANIFEST.json"].sort(),
    files,
  };
  const localManifestPath = writeManifest(manifest);
  const manifestInventory = localFileInventory(localManifestPath);

  if (!existsSync(oldAccessGuard)) fail("Protezione HTTP della cartella old assente.");
  verifyRemoteFile(
    joinRemote(remoteRoot, oldName, ".htaccess"),
    localFileInventory(oldAccessGuard),
  );
  makeRemoteDirectory(backupDirectory);
  makeRemoteDirectory(stagingDirectory);
  for (const directory of parentDirectories(applicationFiles)) {
    makeRemoteDirectory(joinRemote(stagingDirectory, directory));
  }

  for (const file of applicationFiles) {
    const stagedFile = stageApplicationFile(releaseId, stagingDirectory, file);
    if (!stagedFile.startsWith(`${stagingDirectory}/`)) {
      fail(`Staging remoto non valido per ${file.path}.`);
    }
  }
  const stagedManifestFile = uploadVerifiedFlatFile(
    localManifestPath,
    flatStageName(releaseId, "DEPLOY-MANIFEST.json"),
    manifestInventory,
  );
  moveRemote(
    stagedManifestFile,
    joinRemote(stagingDirectory, "DEPLOY-MANIFEST.json"),
  );
  const stagedRollbackManifest = uploadVerifiedFlatFile(
    localManifestPath,
    flatStageName(releaseId, "ROLLBACK-MANIFEST.json"),
    manifestInventory,
  );

  const backupMoves = [];
  try {
    for (const entry of previousRootEntries) {
      const move = {
        from: joinRemote(remoteRoot, entry),
        to: joinRemote(backupDirectory, entry),
      };
      moveRemote(move.from, move.to);
      backupMoves.push(move);
    }
    moveRemote(
      stagedRollbackManifest,
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
    for (const entrypoint of entrypointFiles) {
      verifyRemoteFile(joinRemote(remoteRoot, entrypoint.path), entrypoint);
    }
  } catch (error) {
    attemptAllRestores([promotionMoves, backupMoves]);
    throw error;
  }

  console.log(`Release statica aggiornata: ${releaseId}`);
  console.log(`Versione precedente: ${backupDirectory}`);
  console.log(`Media preservati: ${preservedTopLevelEntries.join(", ")}`);
  console.log(`Manifest locale: ${localManifestPath}`);
}

function resumeStaticUpdate(manifestPath, resumeFromPath) {
  if (!manifestPath || !resumeFromPath) {
    fail("Specifica il manifest locale e il primo percorso da riprendere.");
  }
  const localManifestPath = resolve(manifestPath);
  const manifest = JSON.parse(readFileSync(localManifestPath, "utf8"));
  if (
    manifest.releaseKind !== "static-update" ||
    manifest.host !== host ||
    normalizeRemotePath(manifest.remoteRoot) !== remoteRoot ||
    !Array.isArray(manifest.files) ||
    !Array.isArray(manifest.previousRootEntries) ||
    !Array.isArray(manifest.releaseTopLevelEntries)
  ) {
    fail("Manifest di ripresa non valido per questo host/root.");
  }

  const releaseId = validateEntryName(manifest.releaseId);
  const stagingDirectory = normalizeRemotePath(manifest.stagingDirectory);
  const backupDirectory = normalizeRemotePath(manifest.backupDirectory);
  const expectedStagingPrefix = joinRemote(remoteRoot, oldName, ".staging-");
  const expectedBackupPrefix = joinRemote(remoteRoot, oldName, "static-pre-");
  if (
    !stagingDirectory.startsWith(expectedStagingPrefix) ||
    !backupDirectory.startsWith(expectedBackupPrefix)
  ) {
    fail("Directory di ripresa esterne all'area protetta old.");
  }

  const files = artifactInventory();
  if (JSON.stringify(files) !== JSON.stringify(manifest.files)) {
    fail("L'artefatto locale non corrisponde al manifest da riprendere.");
  }
  const preservedTopLevelEntries = Array.isArray(manifest.preservedTopLevelEntries)
    ? manifest.preservedTopLevelEntries
    : [];
  const applicationFiles = files.filter(
    ({ path }) => !preservedTopLevelEntries.includes(path.split("/")[0]),
  );
  const resumeIndex = applicationFiles.findIndex(({ path }) => path === resumeFromPath);
  if (resumeIndex < 0) fail(`Percorso di ripresa assente: ${resumeFromPath}`);

  const rootEntries = listRemote();
  const missingActiveEntries = manifest.previousRootEntries.filter(
    (entry) => !rootEntries.includes(entry),
  );
  if (missingActiveEntries.length) {
    fail(`Release attiva incompleta: ${missingActiveEntries.join(", ")}`);
  }
  if (listRemote(backupDirectory).length) {
    fail("Il backup della release contiene già file; ripresa interrotta.");
  }

  for (const file of applicationFiles.slice(resumeIndex)) {
    stageApplicationFile(releaseId, stagingDirectory, file);
  }

  const manifestInventory = localFileInventory(localManifestPath);
  const stagedManifestFile = uploadVerifiedFlatFile(
    localManifestPath,
    flatStageName(releaseId, "DEPLOY-MANIFEST.json-resume"),
    manifestInventory,
  );
  moveRemote(
    stagedManifestFile,
    joinRemote(stagingDirectory, "DEPLOY-MANIFEST.json"),
  );
  const stagedRollbackManifest = uploadVerifiedFlatFile(
    localManifestPath,
    flatStageName(releaseId, "ROLLBACK-MANIFEST.json-resume"),
    manifestInventory,
  );

  const backupMoves = [];
  try {
    for (const entry of manifest.previousRootEntries) {
      const move = {
        from: joinRemote(remoteRoot, entry),
        to: joinRemote(backupDirectory, entry),
      };
      moveRemote(move.from, move.to);
      backupMoves.push(move);
    }
    moveRemote(
      stagedRollbackManifest,
      joinRemote(backupDirectory, "ROLLBACK-MANIFEST.json"),
    );
  } catch (error) {
    restoreMoves(backupMoves);
    throw error;
  }

  const entrypointFiles = findEntrypoints(applicationFiles);
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
    for (const entrypoint of entrypointFiles) {
      verifyRemoteFile(joinRemote(remoteRoot, entrypoint.path), entrypoint);
    }
  } catch (error) {
    attemptAllRestores([promotionMoves, backupMoves]);
    throw error;
  }

  console.log(`Release statica ripresa e aggiornata: ${releaseId}`);
  console.log(`Versione precedente: ${backupDirectory}`);
  console.log(`Manifest locale: ${localManifestPath}`);
}

function repairEntrypoints(manifestPath) {
  if (!manifestPath) fail("Specifica il manifest locale del rilascio da riparare.");
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));
  if (
    manifest.host !== host ||
    normalizeRemotePath(manifest.remoteRoot) !== remoteRoot ||
    !Array.isArray(manifest.files)
  ) {
    fail("Manifest di riparazione non valido per questo host/root.");
  }

  const releaseId = validateEntryName(manifest.releaseId);
  const entrypointFiles = findEntrypoints(manifest.files);
  if (!entrypointFiles.some((file) => file.path === "index.html")) {
    fail("Integrità attesa degli entrypoint assente dal manifest.");
  }
  for (const expected of entrypointFiles) {
    if (
      !Number.isSafeInteger(expected.bytes) ||
      expected.bytes < 1 ||
      !/^[a-f0-9]{64}$/.test(expected.sha256)
    ) {
      fail(`Integrità attesa non valida per ${expected.path}.`);
    }
    const localFile = join(artifactDir, ...expected.path.split("/"));
    if (!existsSync(localFile)) fail(`${expected.path} assente dall'artefatto Aruba.`);
    const localContent = readFileSync(localFile);
    const localSha256 = createHash("sha256").update(localContent).digest("hex");
    if (localContent.length !== expected.bytes || localSha256 !== expected.sha256) {
      fail(`${expected.path} locale non corrisponde al manifest del rilascio.`);
    }
  }

  const archiveDirectory = joinRemote(
    remoteRoot,
    oldName,
    `replaced-${releaseId}-${releaseStamp}`,
  );
  const pending = entrypointFiles.filter(
    (expected) => !remoteFileMatches(joinRemote(remoteRoot, expected.path), expected),
  );
  if (!pending.length) {
    console.log("Tutti gli entrypoint remoti corrispondono al manifest.");
    return;
  }

  makeRemoteDirectory(archiveDirectory);

  for (const expected of pending) {
    const archiveName = validateEntryName(expected.path.replaceAll("/", "__"));
    const localFile = join(artifactDir, ...expected.path.split("/"));
    const stagedFile = joinRemote(
      remoteRoot,
      oldName,
      validateEntryName(`repair-${releaseId}-${releaseStamp}-${archiveName}`),
    );
    const archivedFile = joinRemote(archiveDirectory, archiveName);
    const activeFile = joinRemote(remoteRoot, expected.path);

    uploadVerifiedFile(localFile, stagedFile, expected);

    const repairMoves = [];
    try {
      moveRemote(activeFile, archivedFile);
      repairMoves.push({ from: activeFile, to: archivedFile });
      moveRemote(stagedFile, activeFile);
      repairMoves.push({ from: stagedFile, to: activeFile });
      verifyRemoteFile(activeFile, expected);
    } catch (error) {
      restoreMoves(repairMoves);
      throw error;
    }
    console.log(`Entrypoint riparato: ${expected.path}`);
  }

  console.log(`Versioni precedenti archiviate in: ${archiveDirectory}`);
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
  const preservedTopLevelEntries = Array.isArray(manifest.preservedTopLevelEntries)
    ? manifest.preservedTopLevelEntries.map(validateEntryName)
    : [];
  const allowed = new Set([
    oldName,
    ...preservedTopLevelEntries,
    ...manifest.releaseTopLevelEntries,
  ]);
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

  const restoredLabel =
    manifest.releaseKind === "static-update" ? "Release statica" : "WordPress";
  console.log(`${restoredLabel} ripristinata da: ${manifest.backupDirectory}`);
  console.log(`Release statica conservata in: ${failedReleaseDirectory}`);
}

try {
  credentials = resolveNetrc();
  if (command === "inspect") inspect();
  else if (command === "deploy") deploy();
  else if (command === "update-static") updateStatic();
  else if (command === "resume-static") {
    resumeStaticUpdate(process.argv[3], process.argv[4]);
  }
  else if (command === "repair-entrypoints") repairEntrypoints(process.argv[3]);
  else if (command === "rollback") rollback(process.argv[3]);
  else fail(
    "Comando supportato: inspect, deploy, update-static, resume-static, repair-entrypoints, rollback.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
