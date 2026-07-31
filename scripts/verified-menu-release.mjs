#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const documentIds = ["menu-hawaii", "menu-muulab"];
const venues = {
  "menu-hawaii": "hawaii",
  "menu-muulab": "muulab",
};
const snapshotFile = "menu-snapshot.json";
const archiveFile = "site.tar.gz";
const manifestFile = "content-manifest.json";
const workflowPath = ".github/workflows/deploy-pages.yml";
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const webRequire = createRequire(new URL("../web/package.json", import.meta.url));
const { createJiti } = webRequire("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false });
const { areUniqueAllergenCodes, isMenuPrice } = await jiti.import(
  "../shared/menu-contract.ts",
);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    fail(`${label} non valido.`);
  }
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} mancante.`);
  return value;
}

function assertExactIds(actualIds, label) {
  if (
    !Array.isArray(actualIds) ||
    actualIds.length !== documentIds.length ||
    actualIds.some((id, index) => id !== documentIds[index])
  ) {
    fail(`${label}: sono ammessi soltanto ${documentIds.join(", ")}.`);
  }
}

function validateDocuments(documents, source) {
  if (source !== "sanity" && source !== "local-fallback") {
    fail("Sorgente snapshot non valida.");
  }
  if (!Array.isArray(documents)) fail("Snapshot documenti mancante.");
  const sorted = [...documents].sort((left, right) => left._id.localeCompare(right._id));
  assertExactIds(
    sorted.map(({ _id }) => _id),
    "Identificativi documento non validi",
  );

  for (const document of sorted) {
    if (document.venue !== venues[document._id]) {
      fail(`Venue non coerente per ${document._id}.`);
    }
    requireText(document._rev, `_rev di ${document._id}`);
    if (
      source === "sanity" &&
      (typeof document._updatedAt !== "string" ||
        Number.isNaN(Date.parse(document._updatedAt)))
    ) {
      fail(`_updatedAt non valido per ${document._id}.`);
    }
    if (
      source === "local-fallback" &&
      document._updatedAt !== null
    ) {
      fail(`_updatedAt locale non valido per ${document._id}.`);
    }
    if (!Array.isArray(document.categories)) {
      fail(`Categorie mancanti per ${document._id}.`);
    }

    const categoryKeys = new Set();
    for (const category of document.categories) {
      const categoryKey = requireText(category?._key, `_key categoria di ${document._id}`);
      if (categoryKeys.has(categoryKey)) fail(`_key categoria duplicata: ${categoryKey}.`);
      categoryKeys.add(categoryKey);
      requireText(category.title, `Titolo categoria ${categoryKey}`);
      if (category.note !== undefined && typeof category.note !== "string") {
        fail(`Nota categoria non valida per ${categoryKey}.`);
      }
      if (!Array.isArray(category.dishes)) fail(`Piatti mancanti in ${categoryKey}.`);

      const dishKeys = new Set();
      for (const dish of category.dishes) {
        const dishKey = requireText(dish?._key, `_key piatto di ${categoryKey}`);
        if (dishKeys.has(dishKey)) fail(`_key piatto duplicata: ${dishKey}.`);
        dishKeys.add(dishKey);
        requireText(dish.name, `Nome piatto ${dishKey}`);
        if (dish.price !== undefined && !isMenuPrice(dish.price)) {
          fail(`Prezzo non valido per ${dishKey}.`);
        }
        if (dish.note !== undefined && typeof dish.note !== "string") {
          fail(`Nota piatto non valida per ${dishKey}.`);
        }
        if (typeof dish.available !== "boolean") {
          fail(`Disponibilità non valida per ${dishKey}.`);
        }
        if (
          dish.allergens !== undefined &&
          !areUniqueAllergenCodes(dish.allergens)
        ) {
          fail(`Allergeni non validi per ${dishKey}.`);
        }
      }
    }
  }

  return sorted;
}

function copyOptional(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key)
    ? { [key]: source[key] }
    : {};
}

function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) return documents;

  return documents.map((document) => ({
    _id: document?._id,
    _rev: document?._rev,
    _updatedAt: document?._updatedAt,
    venue: document?.venue,
    categories: Array.isArray(document?.categories)
      ? document.categories.map((category) => ({
          _key: category?._key,
          title: category?.title,
          ...copyOptional(category || {}, "note"),
          dishes: Array.isArray(category?.dishes)
            ? category.dishes.map((dish) => ({
                _key: dish?._key,
                name: dish?.name,
                ...copyOptional(dish || {}, "note"),
                ...copyOptional(dish || {}, "price"),
                ...copyOptional(dish || {}, "allergens"),
                available: dish?.available,
              }))
            : category?.dishes,
        }))
      : document?.categories,
  }));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    ...options,
  });
  if (result.status !== 0) {
    fail(options.errorMessage || `${command} non riuscito.`);
  }
  return result;
}

function localDocuments() {
  const seed = run("npm", ["run", "--silent", "menu:seed:studio"], {
    capture: true,
    cwd: repositoryRoot,
    errorMessage: "Esportazione menu locale non riuscita.",
  });
  const revision = `local-fallback:${process.env.GITHUB_SHA || "uncommitted"}`;
  return normalizeDocuments(seed.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => ({
      ...JSON.parse(line),
      _rev: revision,
      _updatedAt: null,
    })));
}

async function sanityDocuments() {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const apiVersion = process.env.SANITY_API_VERSION;
  const token = process.env.SANITY_API_TOKEN;
  const configuration = [projectId, dataset, apiVersion, token];

  if (configuration.every((value) => !value)) return null;
  if (configuration.some((value) => !value)) {
    fail("Configurazione Sanity parziale: il rilascio è stato interrotto.");
  }
  if (!/^[a-z0-9-]+$/.test(projectId)) fail("SANITY_PROJECT_ID non valido.");
  if (!/^[A-Za-z0-9_-]+$/.test(dataset)) fail("SANITY_DATASET non valido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(apiVersion)) fail("SANITY_API_VERSION non valida.");

  const query =
    '*[_id in ["menu-hawaii","menu-muulab"]]{_id,_rev,_updatedAt,venue,categories[]{_key,_type,title,note,dishes[]{_key,_type,name,price,note,available,allergens}}}';
  const url =
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/` +
    `${encodeURIComponent(dataset)}?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) fail(`Sanity ha risposto con stato ${response.status}.`);
  const payload = await response.json();
  return normalizeDocuments(payload.result);
}

async function capture(releaseDirectory) {
  mkdirSync(releaseDirectory, { recursive: true });
  const cmsRevision = process.env.RELEASE_CMS_REVISION?.trim() || "";
  const remoteDocuments = await sanityDocuments();
  if (!remoteDocuments && cmsRevision) {
    fail("cms_revision richiede una configurazione Sanity completa.");
  }
  const source = remoteDocuments ? "sanity" : "local-fallback";
  const documents = validateDocuments(remoteDocuments || localDocuments(), source);

  if (cmsRevision && !documents.some((document) => document._rev === cmsRevision)) {
    fail("cms_revision non coincide con nessuno dei documenti pubblicati.");
  }

  writeFileSync(
    join(releaseDirectory, snapshotFile),
    `${JSON.stringify({ schemaVersion: 1, source, result: documents }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

function seal(releaseDirectory, siteDirectory) {
  const snapshotPath = join(releaseDirectory, snapshotFile);
  if (!existsSync(snapshotPath)) fail("Snapshot menu non trovato.");
  if (!existsSync(siteDirectory) || readdirSync(siteDirectory).length === 0) {
    fail("Export statico vuoto o mancante.");
  }

  const snapshot = readJson(snapshotPath, "Snapshot menu");
  const documents = validateDocuments(snapshot.result, snapshot.source);
  const archivePath = join(releaseDirectory, archiveFile);
  rmSync(archivePath, { force: true });
  run("tar", ["-czf", archivePath, "-C", siteDirectory, "."], {
    errorMessage: "Creazione archivio statico non riuscita.",
  });

  const sourceCommit = requireText(process.env.GITHUB_SHA, "GITHUB_SHA");
  const branch = requireText(process.env.GITHUB_REF_NAME, "GITHUB_REF_NAME");
  const sourceRunId = requireText(process.env.GITHUB_RUN_ID, "GITHUB_RUN_ID");
  const configuredWorkflowPath =
    process.env.RELEASE_WORKFLOW_PATH || workflowPath;
  if (configuredWorkflowPath !== workflowPath) fail("Workflow sorgente non valido.");

  const manifest = {
    schemaVersion: 1,
    workflowPath: configuredWorkflowPath,
    branch,
    sourceCommit,
    sourceRunId,
    cmsRevision: process.env.RELEASE_CMS_REVISION?.trim() || "",
    documentIds,
    documentRevisions: Object.fromEntries(
      documents.map((document) => [document._id, document._rev]),
    ),
    documentUpdatedAt: Object.fromEntries(
      documents.map((document) => [document._id, document._updatedAt]),
    ),
    snapshot: {
      file: snapshotFile,
      sha256: sha256(snapshotPath),
    },
    site: {
      file: archiveFile,
      sha256: sha256(archivePath),
    },
  };
  writeFileSync(
    join(releaseDirectory, manifestFile),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o600 },
  );
}

function assertSafeArtifactName(file, expected) {
  if (file !== expected || basename(file) !== file) {
    fail(`Nome artifact non valido: ${file}.`);
  }
}

function verify(releaseDirectory, outputDirectory) {
  const manifest = readJson(join(releaseDirectory, manifestFile), "Manifest");
  const expectedWorkflow = requireText(
    process.env.RELEASE_EXPECTED_WORKFLOW_PATH,
    "RELEASE_EXPECTED_WORKFLOW_PATH",
  );
  const expectedBranch = requireText(
    process.env.RELEASE_EXPECTED_BRANCH,
    "RELEASE_EXPECTED_BRANCH",
  );
  const expectedCommit = requireText(
    process.env.RELEASE_EXPECTED_SOURCE_COMMIT,
    "RELEASE_EXPECTED_SOURCE_COMMIT",
  );
  const expectedRunId = requireText(
    process.env.RELEASE_EXPECTED_SOURCE_RUN_ID,
    "RELEASE_EXPECTED_SOURCE_RUN_ID",
  );
  const expectedIds = requireText(
    process.env.RELEASE_EXPECTED_DOCUMENT_IDS,
    "RELEASE_EXPECTED_DOCUMENT_IDS",
  ).split(",");

  if (manifest.schemaVersion !== 1) fail("Versione manifest non supportata.");
  if (manifest.workflowPath !== expectedWorkflow) fail("Workflow identity non valida.");
  if (manifest.branch !== expectedBranch) fail("Branch del rilascio non valida.");
  if (manifest.sourceCommit !== expectedCommit) fail("Source commit non valido.");
  if (String(manifest.sourceRunId) !== expectedRunId) fail("Source run ID non valido.");
  assertExactIds(manifest.documentIds, "Document IDs del manifest non validi");
  assertExactIds(expectedIds, "Document IDs attesi non validi");
  assertSafeArtifactName(manifest.snapshot?.file, snapshotFile);
  assertSafeArtifactName(manifest.site?.file, archiveFile);

  const snapshotPath = join(releaseDirectory, manifest.snapshot.file);
  const archivePath = join(releaseDirectory, manifest.site.file);
  if (sha256(snapshotPath) !== manifest.snapshot.sha256) {
    fail("Snapshot checksum non valido.");
  }
  if (sha256(archivePath) !== manifest.site.sha256) {
    fail("Site checksum non valido.");
  }

  const snapshot = readJson(snapshotPath, "Snapshot menu");
  const documents = validateDocuments(snapshot.result, snapshot.source);
  for (const document of documents) {
    if (manifest.documentRevisions?.[document._id] !== document._rev) {
      fail(`Revisione manifest non valida per ${document._id}.`);
    }
    if (manifest.documentUpdatedAt?.[document._id] !== document._updatedAt) {
      fail(`_updatedAt manifest non valido per ${document._id}.`);
    }
  }

  const archiveList = run("tar", ["-tzf", archivePath], {
    capture: true,
    errorMessage: "Archivio statico illeggibile.",
  }).stdout
    .split("\n")
    .filter(Boolean);
  if (
    archiveList.length === 0 ||
    archiveList.some((entry) => {
      const normalized = entry.startsWith("./") ? entry.slice(2) : entry;
      return normalized.startsWith("/") || normalized.split("/").includes("..");
    })
  ) {
    fail("Archivio statico non sicuro.");
  }

  rmSync(outputDirectory, { force: true, recursive: true });
  mkdirSync(outputDirectory, { recursive: true });
  run("tar", ["-xzf", archivePath, "-C", outputDirectory], {
    errorMessage: "Estrazione artifact non riuscita.",
  });
}

async function main() {
  const [command, releaseDirectoryArg, outputDirectoryArg] = process.argv.slice(2);
  const releaseDirectory = resolve(releaseDirectoryArg || ".verified-menu-release");

  if (command === "capture") await capture(releaseDirectory);
  else if (command === "seal") {
    seal(releaseDirectory, resolve(outputDirectoryArg || "web/out"));
  } else if (command === "verify") {
    verify(releaseDirectory, resolve(outputDirectoryArg || "web/out"));
  } else {
    fail("Comando supportato: capture, seal, verify.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
