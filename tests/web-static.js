"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { gzipSync } = require("node:zlib");

const root = process.cwd();

function sourceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing source range ${start} -> ${end}`);
  return source.slice(startIndex, endIndex);
}

function cssRuleBody(css, selector) {
  const uncommentedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = uncommentedCss.match(
    new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`),
  );
  assert.ok(match, `Missing standalone CSS rule for ${selector}`);
  return match[1];
}

function cssBlock(css, headerPattern, description) {
  const uncommentedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const match = headerPattern.exec(uncommentedCss);
  assert.ok(match, `Missing ${description}`);
  const start = match.index;
  const openingBrace = uncommentedCss.indexOf("{", start + match[0].length);
  assert.ok(openingBrace >= 0, `Missing opening brace for ${description}`);

  let depth = 1;
  for (let index = openingBrace + 1; index < uncommentedCss.length; index += 1) {
    if (uncommentedCss[index] === "{") depth += 1;
    if (uncommentedCss[index] === "}") depth -= 1;
    if (depth === 0) {
      return {
        body: uncommentedCss.slice(openingBrace + 1, index),
        start,
      };
    }
  }

  assert.fail(`Missing closing brace for ${description}`);
}

function compactCssDeclarations(body) {
  return body.replace(/\s+/g, "");
}

function writeExecutable(filePath, contents) {
  fs.writeFileSync(filePath, contents);
  fs.chmodSync(filePath, 0o755);
}

function createPagesBuildFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hawaii-pages-build-test-"));
  const webDir = path.join(fixtureRoot, "web");
  const outputDir = path.join(fixtureRoot, "pages-preview", "hawaii");
  const fakeNpmPath = path.join(fixtureRoot, "fake-npm");
  const apiPath = path.join(webDir, "src", "app", "api", "test", "route.ts");
  const tempDir = path.join(fixtureRoot, "tmp");

  fs.mkdirSync(path.join(webDir, "node_modules", ".bin"), { recursive: true });
  fs.mkdirSync(path.dirname(apiPath), { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(tempDir);
  writeExecutable(path.join(webDir, "node_modules", ".bin", "next"), "#!/bin/sh\nexit 0\n");
  fs.writeFileSync(apiPath, "source-api-marker\n");
  fs.writeFileSync(path.join(webDir, "page.txt"), "fixture-source\n");
  fs.writeFileSync(path.join(outputDir, "previous.txt"), "previous-artifact\n");
  writeExecutable(
    fakeNpmPath,
    [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "if [[ -e src/app/api ]]; then",
      '  echo "Source API routes leaked into the static build copy" >&2',
      "  exit 91",
      "fi",
      'case "${FAKE_BUILD_MODE:-success}" in',
      "  success)",
      "    mkdir -p out",
      "    cat > out/index.html <<'EOF'",
      '"/media/one.jpg"',
      "'/media/two.jpg'",
      "(/media/three.jpg)",
      "EOF",
      "    printf '%s\\n' 'fresh-artifact' > out/fresh.txt",
      "    ;;",
      "  fail)",
      "    exit 23",
      "    ;;",
      "  memory)",
      "    node -e 'const block = Buffer.alloc(48 * 1024 * 1024, 1); setTimeout(() => block.length, 10000)'",
      "    ;;",
      "  *)",
      "    exit 92",
      "    ;;",
      "esac",
      "",
    ].join("\n"),
  );

  return { apiPath, fakeNpmPath, fixtureRoot, outputDir, tempDir, webDir };
}

function runPagesBuildFixture(fixture, mode, options = {}) {
  const {
    extraEnv = {},
    rssHeadroomMb = "16",
    rssLimitMb = "512",
    rssPollSeconds = "0.05",
  } = options;
  return spawnSync("bash", [pagesPreviewBuildPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_BUILD_MODE: mode,
      PAGES_BUILD_NPM: fixture.fakeNpmPath,
      PAGES_BUILD_OUTPUT_DIR: fixture.outputDir,
      PAGES_BUILD_RSS_HEADROOM_MB: rssHeadroomMb,
      PAGES_BUILD_RSS_LIMIT_MB: rssLimitMb,
      PAGES_BUILD_RSS_POLL_SECONDS: rssPollSeconds,
      PAGES_BUILD_WEB_DIR: fixture.webDir,
      TMPDIR: fixture.tempDir,
      ...extraEnv,
    },
    timeout: 8_000,
  });
}

function pagesBuildSiblingTemps(outputDir) {
  const parent = path.dirname(outputDir);
  const prefix = `.${path.basename(outputDir)}.`;
  return fs.readdirSync(parent).filter((entry) => entry.startsWith(prefix));
}

function assertPagesBuildSuccessBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "success");
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = fs.readFileSync(path.join(fixture.outputDir, "index.html"), "utf8");
    assert.match(html, /"\/hawaii\/media\/one\.jpg/);
    assert.match(html, /'\/hawaii\/media\/two\.jpg/);
    assert.match(html, /\(\/hawaii\/media\/three\.jpg/);
    assert.equal(fs.existsSync(path.join(fixture.outputDir, "previous.txt")), false);
    assert.equal(fs.readFileSync(fixture.apiPath, "utf8"), "source-api-marker\n");
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildFailureBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "fail");
    assert.equal(result.status, 23, result.stderr || result.stdout);
    assert.equal(
      fs.readFileSync(path.join(fixture.outputDir, "previous.txt"), "utf8"),
      "previous-artifact\n",
    );
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildMemoryBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "memory", {
      rssHeadroomMb: "200",
      rssLimitMb: "256",
    });
    assert.equal(result.status, 137, result.stderr || result.stdout);
    const breach = result.stderr.match(
      /RSS safety threshold exceeded: (\d+)KB > 57344KB \(256MB hard ceiling, 200MB headroom\)/,
    );
    assert.ok(breach, result.stderr);
    assert.ok(Number(breach[1]) < 256 * 1024, "The fixture must breach headroom before its hard limit");
    assert.equal(
      fs.readFileSync(path.join(fixture.outputDir, "previous.txt"), "utf8"),
      "previous-artifact\n",
    );
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildInvalidConfigCleanup() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "success", {
      rssLimitMb: "invalid",
    });
    assert.equal(result.status, 2, result.stderr || result.stdout);
    assert.match(result.stderr, /PAGES_BUILD_RSS_LIMIT_MB must be a positive integer/);
    assert.deepEqual(
      fs.readdirSync(fixture.tempDir),
      [],
      "Invalid RSS config must not leak a temp build",
    );
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function readSourceTree(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readSourceTree(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fs.readFileSync(entryPath, "utf8")] : [];
  });
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeTarGzEntry(filePath, entryName, contents) {
  const body = Buffer.from(contents);
  const header = Buffer.alloc(512);
  const writeString = (value, offset, length) => {
    header.write(value, offset, Math.min(Buffer.byteLength(value), length), "utf8");
  };
  const writeOctal = (value, offset, length) => {
    writeString(`${value.toString(8).padStart(length - 1, "0")}\0`, offset, length);
  };

  writeString(entryName, 0, 100);
  writeOctal(0o644, 100, 8);
  writeOctal(0, 108, 8);
  writeOctal(0, 116, 8);
  writeOctal(body.length, 124, 12);
  writeOctal(0, 136, 12);
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  writeString("ustar\0", 257, 6);
  writeString("00", 263, 2);
  const checksum = header.reduce((total, byte) => total + byte, 0);
  writeString(`${checksum.toString(8).padStart(6, "0")}\0 `, 148, 8);

  const padding = Buffer.alloc((512 - (body.length % 512)) % 512);
  fs.writeFileSync(
    filePath,
    gzipSync(Buffer.concat([header, body, padding, Buffer.alloc(1024)])),
  );
}

function assertVerifiedMenuReleaseBehavior() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hawaii-menu-release-test-"));
  const releaseDir = path.join(fixtureRoot, "release");
  const siteDir = path.join(fixtureRoot, "site");
  const outputDir = path.join(fixtureRoot, "restored");
  const snapshotPath = path.join(releaseDir, "menu-snapshot.json");
  const archivePath = path.join(releaseDir, "site.tar.gz");
  const manifestPath = path.join(releaseDir, "content-manifest.json");

  try {
    fs.mkdirSync(releaseDir, { recursive: true });
    fs.mkdirSync(siteDir, { recursive: true });
    fs.writeFileSync(path.join(siteDir, "index.html"), "<h1>Verified release</h1>\n");
    const archive = spawnSync("tar", ["-czf", archivePath, "-C", siteDir, "."], {
      encoding: "utf8",
    });
    assert.equal(archive.status, 0, archive.stderr || archive.stdout);

    const snapshot = {
      schemaVersion: 1,
      source: "sanity",
      result: [
        {
          _id: "menu-hawaii",
          _rev: "hawaii-revision",
          _updatedAt: "2026-07-31T12:00:00.000Z",
          venue: "hawaii",
          categories: [
            {
              _key: "hawaii-antipasti",
              title: "Antipasti",
              dishes: [
                {
                  _key: "hawaii-dish",
                  name: "Piatto Hawaii",
                  price: "€ 12",
                  available: true,
                },
              ],
            },
          ],
        },
        {
          _id: "menu-muulab",
          _rev: "muulab-revision",
          _updatedAt: "2026-07-31T12:00:01.000Z",
          venue: "muulab",
          categories: [
            {
              _key: "muulab-per-cominciare",
              title: "Per cominciare",
              dishes: [
                {
                  _key: "muulab-dish",
                  name: "Piatto MUULab",
                  price: "€ 14",
                  available: true,
                },
              ],
            },
          ],
        },
      ],
    };
    fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);

    const manifest = {
      schemaVersion: 1,
      workflowPath: ".github/workflows/deploy-pages.yml",
      branch: "main",
      sourceCommit: "0123456789abcdef0123456789abcdef01234567",
      sourceRunId: "12345",
      cmsRevision: "hawaii-revision",
      documentIds: ["menu-hawaii", "menu-muulab"],
      documentRevisions: {
        "menu-hawaii": "hawaii-revision",
        "menu-muulab": "muulab-revision",
      },
      documentUpdatedAt: {
        "menu-hawaii": "2026-07-31T12:00:00.000Z",
        "menu-muulab": "2026-07-31T12:00:01.000Z",
      },
      snapshot: {
        file: "menu-snapshot.json",
        sha256: sha256File(snapshotPath),
      },
      site: {
        file: "site.tar.gz",
        sha256: sha256File(archivePath),
      },
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const env = {
      ...process.env,
      RELEASE_EXPECTED_BRANCH: manifest.branch,
      RELEASE_EXPECTED_DOCUMENT_IDS: manifest.documentIds.join(","),
      RELEASE_EXPECTED_SOURCE_COMMIT: manifest.sourceCommit,
      RELEASE_EXPECTED_SOURCE_RUN_ID: manifest.sourceRunId,
      RELEASE_EXPECTED_WORKFLOW_PATH: manifest.workflowPath,
    };
    const valid = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "verify", releaseDir, outputDir],
      { cwd: root, encoding: "utf8", env },
    );
    assert.equal(valid.status, 0, valid.stderr || valid.stdout);
    assert.equal(
      fs.readFileSync(path.join(outputDir, "index.html"), "utf8"),
      "<h1>Verified release</h1>\n",
    );

    fs.appendFileSync(snapshotPath, "tampered\n");
    const tampered = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "verify", releaseDir, outputDir],
      { cwd: root, encoding: "utf8", env },
    );
    assert.notEqual(tampered.status, 0, "A modified snapshot must never be restored");
    assert.match(tampered.stderr, /checksum/i);

    fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    fs.symlinkSync("/etc/hosts", path.join(siteDir, "external-link"));
    const linkedArchive = spawnSync(
      "tar",
      ["-czf", archivePath, "-C", siteDir, "."],
      { encoding: "utf8" },
    );
    assert.equal(linkedArchive.status, 0, linkedArchive.stderr || linkedArchive.stdout);
    manifest.snapshot.sha256 = sha256File(snapshotPath);
    manifest.site.sha256 = sha256File(archivePath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const linked = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "verify", releaseDir, outputDir],
      { cwd: root, encoding: "utf8", env },
    );
    assert.notEqual(linked.status, 0, "Symlink entries must never be extracted");
    assert.match(linked.stderr, /link|tipi di file/i);
    fs.unlinkSync(path.join(siteDir, "external-link"));

    fs.linkSync(
      path.join(siteDir, "index.html"),
      path.join(siteDir, "hard-linked-index.html"),
    );
    const hardLinkedArchive = spawnSync(
      "tar",
      ["-czf", archivePath, "-C", siteDir, "."],
      { encoding: "utf8" },
    );
    assert.equal(
      hardLinkedArchive.status,
      0,
      hardLinkedArchive.stderr || hardLinkedArchive.stdout,
    );
    manifest.site.sha256 = sha256File(archivePath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const hardLinked = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "verify", releaseDir, outputDir],
      { cwd: root, encoding: "utf8", env },
    );
    assert.notEqual(hardLinked.status, 0, "Hardlink entries must never be extracted");
    assert.match(hardLinked.stderr, /link|tipi di file/i);
    fs.unlinkSync(path.join(siteDir, "hard-linked-index.html"));

    writeTarGzEntry(archivePath, "../escape.html", "must-not-extract\n");
    manifest.snapshot.sha256 = sha256File(snapshotPath);
    manifest.site.sha256 = sha256File(archivePath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const unsafe = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "verify", releaseDir, outputDir],
      { cwd: root, encoding: "utf8", env },
    );
    assert.notEqual(unsafe.status, 0, "Path traversal entries must never be extracted");
    assert.match(unsafe.stderr, /Archivio statico non sicuro/i);
  } finally {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

function assertLocalMenuSnapshotCapture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hawaii-menu-capture-test-"));
  const baseEnv = {
    ...process.env,
    GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
  };
  for (const variable of [
    "RELEASE_CMS_REVISION",
    "SANITY_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_API_VERSION",
    "SANITY_API_TOKEN",
  ]) {
    delete baseEnv[variable];
  }

  try {
    const releaseDir = path.join(fixtureRoot, "release");
    const capture = spawnSync(
      process.execPath,
      [verifiedMenuReleasePath, "capture", releaseDir],
      { cwd: root, encoding: "utf8", env: baseEnv },
    );
    assert.equal(capture.status, 0, capture.stderr || capture.stdout);
    assert.equal(
      capture.stderr.trim(),
      "[menu-release] Sanity unavailable; using local menu fallback.",
    );

    const snapshot = JSON.parse(
      fs.readFileSync(path.join(releaseDir, "menu-snapshot.json"), "utf8"),
    );
    assert.equal(snapshot.schemaVersion, 1);
    assert.equal(snapshot.source, "local-fallback");
    assert.deepEqual(
      snapshot.result.map(({ _id }) => _id),
      ["menu-hawaii", "menu-muulab"],
    );
    assert.ok(snapshot.result.every(({ _rev }) => _rev.startsWith("local-fallback:")));
    assert.ok(snapshot.result.every(({ _updatedAt }) => _updatedAt === null));
    assert.doesNotMatch(JSON.stringify(snapshot), /"_type":/);

    const dishes = snapshot.result.flatMap(({ categories }) =>
      categories.flatMap(({ dishes: categoryDishes }) => categoryDishes),
    );
    assert.ok(dishes.some(({ price }) => price === "€ 12 l'etto"));
    assert.ok(
      dishes.some((dish) => !Object.prototype.hasOwnProperty.call(dish, "allergens")),
      "Empty allergen lists must remain omitted instead of becoming required arrays",
    );

    const fetchMockPath = path.join(fixtureRoot, "mock-fetch.mjs");
    fs.writeFileSync(
      fetchMockPath,
      [
        "globalThis.fetch = async () => {",
        '  const secret = "TOKEN-AND-CONTENT-MUST-NOT-LEAK";',
        '  if (process.env.CAPTURE_FAILURE === "fetch") throw new Error(secret);',
        '  if (process.env.CAPTURE_FAILURE === "http") return { ok: false, status: 503 };',
        '  if (process.env.CAPTURE_FAILURE === "json") return { ok: true, json: async () => { throw new Error(secret); } };',
        '  if (process.env.CAPTURE_FAILURE === "schema") return { ok: true, json: async () => ({ result: [{ _id: secret }] }) };',
        '  throw new Error("Unexpected capture test mode");',
        "};",
        "",
      ].join("\n"),
    );

    const failureScenarios = [
      {
        name: "partial-config",
        env: { SANITY_PROJECT_ID: "project-id" },
      },
      ...["fetch", "http", "json", "schema"].map((failure) => ({
        name: failure,
        env: {
          CAPTURE_FAILURE: failure,
          NODE_OPTIONS: `--import=${fetchMockPath}`,
          SANITY_API_TOKEN: "TOKEN-AND-CONTENT-MUST-NOT-LEAK",
          SANITY_API_VERSION: "2026-04-07",
          SANITY_DATASET: "production",
          SANITY_PROJECT_ID: "project-id",
        },
      })),
    ];

    for (const scenario of failureScenarios) {
      const fallbackDir = path.join(fixtureRoot, `fallback-${scenario.name}`);
      const fallback = spawnSync(
        process.execPath,
        [verifiedMenuReleasePath, "capture", fallbackDir],
        {
          cwd: root,
          encoding: "utf8",
          env: { ...baseEnv, ...scenario.env },
        },
      );
      assert.equal(fallback.status, 0, fallback.stderr || fallback.stdout);
      assert.equal(
        fallback.stderr.trim(),
        "[menu-release] Sanity unavailable; using local menu fallback.",
      );
      assert.doesNotMatch(
        fallback.stderr,
        /TOKEN-AND-CONTENT-MUST-NOT-LEAK|project-id|production|503/,
      );
      const fallbackSnapshot = JSON.parse(
        fs.readFileSync(path.join(fallbackDir, "menu-snapshot.json"), "utf8"),
      );
      assert.equal(fallbackSnapshot.source, "local-fallback");

      const requiredDir = path.join(fixtureRoot, `required-${scenario.name}`);
      const required = spawnSync(
        process.execPath,
        [verifiedMenuReleasePath, "capture", requiredDir],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...baseEnv,
            ...scenario.env,
            RELEASE_CMS_REVISION: "required-revision",
          },
        },
      );
      assert.notEqual(
        required.status,
        0,
        `${scenario.name} must fail closed when cms_revision is required`,
      );
      assert.equal(
        required.stderr.trim(),
        "[menu-release] Required Sanity snapshot unavailable.",
      );
      assert.doesNotMatch(
        required.stderr,
        /TOKEN-AND-CONTENT-MUST-NOT-LEAK|project-id|production|503/,
      );
      assert.equal(
        fs.existsSync(path.join(requiredDir, "menu-snapshot.json")),
        false,
        "Fail-closed capture must not leave a stale snapshot",
      );
    }
  } finally {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

const productionSources = readSourceTree(path.join(root, "web", "src")).join("\n");
const pagesWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "deploy-pages.yml"),
  "utf8",
);
const productionRunner = fs.readFileSync(
  path.join(root, "tests", "run-web-production.js"),
  "utf8",
);
const pagesPreviewBuildPath = path.join(root, "scripts", "build-pages-preview.sh");
const arubaBuildPath = path.join(root, "scripts", "build-static-aruba.sh");
const arubaHeadersPath = path.join(root, "deploy", "aruba", ".htaccess.example");
const arubaOldGuardPath = path.join(root, "deploy", "aruba", "old.htaccess");
const arubaReadinessPath = path.join(root, "tests", "aruba-static-readiness.js");
const arubaGuidePath = path.join(root, "docs", "deploy", "aruba-static-readiness.md");
const arubaReleasePath = path.join(root, "scripts", "aruba-release.mjs");
const verifiedMenuReleasePath = path.join(root, "scripts", "verified-menu-release.mjs");
const verifiedMenuRelease = fs.existsSync(verifiedMenuReleasePath)
  ? fs.readFileSync(verifiedMenuReleasePath, "utf8")
  : "";
const adminContentBlueprint = fs.readFileSync(
  path.join(root, "docs", "admin-content-management-blueprint.md"),
  "utf8",
);
const homePagePath = path.join(root, "web", "src", "app", "page.tsx");
const arubaBuild = fs.existsSync(arubaBuildPath) ? fs.readFileSync(arubaBuildPath, "utf8") : "";
const pagesPreviewBuild = fs.existsSync(pagesPreviewBuildPath)
  ? fs.readFileSync(pagesPreviewBuildPath, "utf8")
  : "";
const arubaHeaders = fs.existsSync(arubaHeadersPath)
  ? fs.readFileSync(arubaHeadersPath, "utf8")
  : "";
const arubaOldGuard = fs.readFileSync(arubaOldGuardPath, "utf8");
const arubaReadiness = fs.existsSync(arubaReadinessPath)
  ? fs.readFileSync(arubaReadinessPath, "utf8")
  : "";
const arubaGuide = fs.existsSync(arubaGuidePath) ? fs.readFileSync(arubaGuidePath, "utf8") : "";
const arubaRelease = fs.readFileSync(arubaReleasePath, "utf8");
const homePage = fs.readFileSync(homePagePath, "utf8");
const verifyJob = pagesWorkflow.match(/\n  verify:\n([\s\S]*?)\n  restore:/)?.[1] || "";
const restoreJob = pagesWorkflow.match(/\n  restore:\n([\s\S]*?)\n  deploy:/)?.[1] || "";
const deployJob = pagesWorkflow.match(/\n  deploy:\n([\s\S]*)$/)?.[1] || "";
const layoutPath = path.join(root, "web", "src", "app", "layout.tsx");
const stagePath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "scroll-video-stage.tsx",
);
const globalStylesPath = path.join(root, "web", "src", "app", "globals.css");
const soulRailPath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "soul-rail.tsx",
);
const siteHeaderPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "site-header.tsx",
);
const theForkPath = path.join(
  root,
  "web",
  "src",
  "components",
  "booking",
  "thefork-booking.tsx",
);
const cookieBannerPath = path.join(
  root,
  "web",
  "src",
  "components",
  "legal",
  "cookie-banner.tsx",
);
const consentPath = path.join(root, "web", "src", "lib", "consent.ts");
const bookingHubPath = path.join(root, "web", "src", "app", "prenotazioni", "page.tsx");
const cookiePagePath = path.join(root, "web", "src", "app", "cookie", "page.tsx");
const bookingFormPath = path.join(
  root,
  "web",
  "src",
  "components",
  "forms",
  "booking-inquiry-form.tsx",
);
const nextConfigPath = path.join(root, "web", "next.config.ts");
const bookingConfigPath = path.join(root, "web", "src", "lib", "booking-config.ts");
const siteContentPath = path.join(root, "web", "src", "lib", "site-content.ts");
const menuCmsPath = path.join(root, "web", "src", "lib", "menu-cms.ts");
const menuSeedPath = path.join(
  root,
  "web",
  "scripts",
  "export-sanity-menu-seed.ts",
);
const webEnvExamplePath = path.join(root, "web", ".env.example");
const seoPath = path.join(root, "web", "src", "lib", "seo.ts");
const sitemapPath = path.join(root, "web", "src", "app", "sitemap.ts");
const whatsappButtonPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "whatsapp-button.tsx",
);
const footerPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "site-footer.tsx",
);
const contactPagePath = path.join(root, "web", "src", "app", "contatti", "page.tsx");
const menuPagePath = path.join(root, "web", "src", "app", "menu", "page.tsx");
const muulabWinesPath = path.join(root, "web", "src", "lib", "muulab-wines.ts");
const villagePagePath = path.join(root, "web", "src", "app", "villaggio", "page.tsx");
const eventPagePath = path.join(root, "web", "src", "app", "eventi", "page.tsx");
const hawaiiWineListPath = path.join(
  root,
  "docs",
  "content",
  "hawaii-wine-list-2026-07-23.md",
);

const layout = fs.readFileSync(layoutPath, "utf8");
const stage = fs.readFileSync(stagePath, "utf8");
const globalStyles = fs.readFileSync(globalStylesPath, "utf8");
const soulRail = fs.readFileSync(soulRailPath, "utf8");
const siteHeader = fs.readFileSync(siteHeaderPath, "utf8");
const theFork = fs.existsSync(theForkPath) ? fs.readFileSync(theForkPath, "utf8") : "";
const cookieBanner = fs.readFileSync(cookieBannerPath, "utf8");
const consent = fs.existsSync(consentPath) ? fs.readFileSync(consentPath, "utf8") : "";
const consentSources = [theFork, cookieBanner, consent].join("\n");
const bookingHub = fs.readFileSync(bookingHubPath, "utf8");
const cookiePage = fs.readFileSync(cookiePagePath, "utf8");
const bookingForm = fs.readFileSync(bookingFormPath, "utf8");
const nextConfig = fs.readFileSync(nextConfigPath, "utf8");
const bookingConfig = fs.readFileSync(bookingConfigPath, "utf8");
const siteContent = fs.readFileSync(siteContentPath, "utf8");
const seo = fs.readFileSync(seoPath, "utf8");
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const whatsappButton = fs.readFileSync(whatsappButtonPath, "utf8");
const footer = fs.readFileSync(footerPath, "utf8");
const contactPage = fs.readFileSync(contactPagePath, "utf8");
const menuPage = fs.readFileSync(menuPagePath, "utf8");
const muulabWines = fs.existsSync(muulabWinesPath)
  ? fs.readFileSync(muulabWinesPath, "utf8")
  : "";
const villagePage = fs.readFileSync(villagePagePath, "utf8");
const eventPage = fs.readFileSync(eventPagePath, "utf8");
const hawaiiWineList = fs.readFileSync(hawaiiWineListPath, "utf8");
const menuContractPath = path.join(root, "shared", "menu-contract.ts");
const sharedPackagePath = path.join(root, "shared", "package.json");
const menuSchemaPath = path.join(root, "studio", "schemaTypes", "menuType.ts");
const sanityCliPath = path.join(root, "studio", "sanity.cli.ts");
const sanityConfigPath = path.join(root, "studio", "sanity.config.ts");
const studioEnvExamplePath = path.join(root, "studio", ".env.example");
const studioStructurePath = path.join(root, "studio", "structure.ts");
const propagatedBookingSources = [
  bookingConfig,
  siteContent,
  whatsappButton,
  footer,
  contactPage,
  menuPage,
  villagePage,
].join("\n");

assert.ok(fs.existsSync(menuContractPath), "The shared menu contract must exist");
assert.deepEqual(
  JSON.parse(fs.readFileSync(sharedPackagePath, "utf8")),
  { private: true, type: "module" },
  "The shared contract needs a local ESM boundary for Turbopack",
);
const menuContractCheck = spawnSync(
  process.execPath,
  [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module-typescript",
    "--eval",
    `
      ${fs.readFileSync(menuContractPath, "utf8")}
      import assert from "node:assert/strict";
      const expectedDefinitions = [
        { code: 1, label: "Cereali contenenti glutine" },
        { code: 2, label: "Crostacei e prodotti a base di crostacei" },
        { code: 3, label: "Uova e prodotti a base di uova" },
        { code: 4, label: "Pesce e prodotti a base di pesce" },
        { code: 5, label: "Arachidi e prodotti a base di arachidi" },
        { code: 6, label: "Soia e prodotti a base di soia" },
        { code: 7, label: "Latte e prodotti a base di latte (incluso lattosio)" },
        { code: 8, label: "Frutta a guscio" },
        { code: 9, label: "Sedano e prodotti a base di sedano" },
        { code: 10, label: "Senape e prodotti a base di senape" },
        { code: 11, label: "Semi di sesamo e prodotti a base di semi di sesamo" },
        { code: 12, label: "Anidride solforosa e solfiti" },
        { code: 13, label: "Lupini e prodotti a base di lupini" },
        { code: 14, label: "Molluschi e prodotti a base di molluschi" },
      ];

      assert.deepEqual(allergenDefinitions, expectedDefinitions);
      assert.deepEqual(allergenCodes, expectedDefinitions.map(({ code }) => code));
      assert.deepEqual(menuCategoryKeys, {
        "menu-hawaii": {
          antipasti: "hawaii-antipasti",
          primi: "hawaii-primi",
          secondiGriglia: "hawaii-secondi-griglia",
          contorni: "hawaii-contorni",
          pizzaCena: "hawaii-pizza-cena",
          dessert: "hawaii-dessert",
          cantina: "hawaii-cantina",
        },
        "menu-muulab": {
          perCominciare: "muulab-per-cominciare",
          crudiCarne: "muulab-crudi-carne",
          secondiBrace: "muulab-secondi-brace",
          tagliBrace: "muulab-tagli-brace",
          contorni: "muulab-contorni",
          dolci: "muulab-dolci",
          cocktailAperitivo: "muulab-cocktail-aperitivo",
          cantinaCoravin: "muulab-cantina-coravin",
        },
      });
      assert.equal(isAllergenCode(1), true);
      assert.equal(isAllergenCode(14), true);
      for (const value of [0, 15, 1.5, "1", null, undefined]) {
        assert.equal(isAllergenCode(value), false);
      }
      assert.equal(areUniqueAllergenCodes([]), true);
      assert.equal(areUniqueAllergenCodes([1, 8, 14]), true);
      assert.equal(areUniqueAllergenCodes([1, 1]), false);
      assert.equal(areUniqueAllergenCodes([1, 15]), false);
      assert.equal(areUniqueAllergenCodes([1, , 14]), false);
      for (const value of ["€ 8", "€ 8,50", "da € 8", "€ 12 l'etto"]) {
        assert.equal(isMenuPrice(value), true, \`Expected valid menu price: \${value}\`);
      }
      for (const value of [
        "",
        "8",
        "€8",
        "€ 0",
        "€ -2",
        "€ 8,5",
        "€ 8 each",
        "da € 8 l'etto",
        "da € 8,50 l'etto",
        8,
        null,
      ]) {
        assert.equal(isMenuPrice(value), false, \`Expected invalid menu price: \${value}\`);
      }
    `,
  ],
  { cwd: root, encoding: "utf8" },
);
assert.equal(
  menuContractCheck.status,
  0,
  menuContractCheck.stderr || menuContractCheck.stdout,
);

assert.ok(fs.existsSync(menuCmsPath), "The build-only menu CMS adapter must exist");
const menuCms = fs.readFileSync(menuCmsPath, "utf8");
const webEnvExample = fs.readFileSync(webEnvExamplePath, "utf8");
const zodModuleUrl = pathToFileURL(
  require.resolve("zod", { paths: [path.join(root, "web")] }),
).href;
const executableMenuContract = fs
  .readFileSync(menuContractPath, "utf8")
  .replace(/^export type .*$/gm, "")
  .replace(/^export /gm, "");
const localVenueMenus = [
  {
    id: "ristorante-mare",
    eyebrow: "Local Hawaii eyebrow",
    title: "Local Hawaii title",
    description: "Local Hawaii description",
    action: { label: "Book Hawaii", href: "/book-hawaii" },
    photos: [{ src: "/hawaii.jpg", alt: "Hawaii" }],
    categories: [
      {
        title: "Antipasti",
        anchor: "fixed-hawaii-antipasti",
        dishes: [{ name: "Local Hawaii antipasto", price: "€ 9" }],
      },
      {
        title: "I primi",
        note: "Local Hawaii primi note",
        anchor: "fixed-hawaii-primi",
        action: { label: "Fixed Hawaii primi action", href: "#fixed-hawaii-primi" },
        dishes: [{ name: "Local Hawaii dish", price: "€ 9" }],
      },
    ],
  },
  {
    id: "muulab",
    eyebrow: "Local MUULab eyebrow",
    title: "Local MUULab title",
    description: "Local MUULab description",
    action: { label: "Book MUULab", href: "/book-muulab" },
    documentAction: { label: "MUULab PDF", href: "https://example.test/menu.pdf" },
    logo: { src: "/muulab.png", alt: "MUULab" },
    photos: [{ src: "/muulab.jpg", alt: "MUULab" }],
    categories: [
      {
        title: "Per cominciare",
        anchor: "fixed-muulab-starter",
        dishes: [{ name: "Local MUULab starter", price: "€ 10" }],
      },
      {
        title: "Cocktail e aperitivo",
        anchor: "fixed-muulab-cocktail",
        dishes: [{ name: "Local MUULab dish", price: "€ 10" }],
      },
    ],
  },
];
const executableMenuCms = menuCms
  .replace(/^import "server-only";\s*/m, "")
  .replace(
    'import { z } from "zod";',
    `import { z } from ${JSON.stringify(zodModuleUrl)};`,
  )
  .replace(
    /^import \{ areUniqueAllergenCodes, isMenuPrice, menuCategoryKeys \} from "\.\.\/\.\.\/\.\.\/shared\/menu-contract";$/m,
    executableMenuContract,
  )
  .replace(
    /^import \{ venueMenus, type MenuCategory, type VenueMenu \} from "\.\/site-content";$/m,
    `const venueMenus = ${JSON.stringify(localVenueMenus)};`,
  );
const menuCmsCheck = spawnSync(
  process.execPath,
  [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module-typescript",
    "--eval",
    `
      ${executableMenuCms}
      import assert from "node:assert/strict";

      const validEnv = {
        SANITY_PROJECT_ID: "project-id",
        SANITY_DATASET: "production",
        SANITY_API_VERSION: "2026-04-07",
        SANITY_API_TOKEN: "super-secret-token",
      };
      const validDocuments = [
        {
          _id: "menu-muulab",
          _rev: "muulab-revision",
          _updatedAt: "2026-07-31T12:00:01.000Z",
          venue: "muulab",
          categories: [
            {
              _key: "muulab-cocktail-aperitivo",
              title: "CMS MUULab category",
              note: "CMS MUULab category note",
              dishes: [
                {
                  _key: "muulab-hidden",
                  name: "CMS hidden MUULab dish",
                  available: false,
                  price: "€ 12",
                  allergens: [1],
                },
                {
                  _key: "muulab-visible",
                  name: "CMS visible MUULab dish",
                  note: "CMS dish note",
                  available: true,
                  price: "€ 14,50",
                  allergens: [1, 7],
                },
              ],
            },
          ],
        },
        {
          _id: "menu-hawaii",
          _rev: "hawaii-revision",
          _updatedAt: "2026-07-31T12:00:00.000Z",
          venue: "hawaii",
          categories: [
            {
              _key: "hawaii-primi",
              title: "CMS Hawaii category",
              dishes: [
                {
                  _key: "hawaii-visible",
                  name: "CMS visible Hawaii dish",
                  available: true,
                  price: "da € 16",
                  allergens: [2, 14],
                },
              ],
            },
          ],
        },
      ];

      function responseWith(documents) {
        return new Response(JSON.stringify({ result: documents }), { status: 200 });
      }

      async function loadWith(documents, options = {}) {
        const calls = [];
        const warnings = [];
        const menus = await loadBuildMenuContent({
          env: options.env || validEnv,
          fetcher:
            options.fetcher ||
            (async (...args) => {
              calls.push(args);
              return responseWith(documents);
            }),
          warn: (message) => warnings.push(message),
        });
        return { calls, menus, warnings };
      }

      const successful = await loadWith(validDocuments);
      assert.deepEqual(
        successful.menus.map(({ id }) => id),
        ["ristorante-mare", "muulab"],
        "CMS documents must map back onto the fixed local venue order",
      );
      assert.deepEqual(successful.menus[0], {
        ...venueMenus[0],
        categories: [
          {
            ...venueMenus[0].categories[1],
            title: "CMS Hawaii category",
            note: undefined,
            dishes: [
              {
                name: "CMS visible Hawaii dish",
                price: "da € 16",
                allergens: [2, 14],
                note: undefined,
              },
            ],
          },
        ],
      });
      assert.deepEqual(successful.menus[1], {
        ...venueMenus[1],
        categories: [
          {
            ...venueMenus[1].categories[1],
            title: "CMS MUULab category",
            note: "CMS MUULab category note",
            dishes: [
              {
                name: "CMS visible MUULab dish",
                price: "€ 14,50",
                allergens: [1, 7],
                note: "CMS dish note",
              },
            ],
          },
        ],
      });
      assert.deepEqual(successful.warnings, []);
      assert.equal(successful.calls.length, 1);
      const [requestUrl, requestInit] = successful.calls[0];
      const parsedUrl = new URL(requestUrl);
      assert.equal(parsedUrl.hostname, "project-id.api.sanity.io");
      assert.equal(parsedUrl.pathname, "/v2026-04-07/data/query/production");
      assert.equal(parsedUrl.searchParams.get("perspective"), "published");
      assert.equal(
        parsedUrl.searchParams.get("query"),
        '*[_type == "menu" && _id in ["menu-hawaii", "menu-muulab"]]{_id, _rev, _updatedAt, venue, categories[]{_key, title, note, dishes[]{_key, name, note, price, allergens, available}}}',
      );
      assert.equal(requestInit.cache, "force-cache");
      assert.equal(requestInit.headers.Authorization, "Bearer super-secret-token");
      assert.doesNotMatch(requestUrl, /super-secret-token/);

      let snapshotFetchCalled = false;
      const snapshotMenus = await loadBuildMenuContent({
        env: { MENU_CMS_SNAPSHOT_PATH: "/tmp/frozen-menu-snapshot.json" },
        fetcher: async () => {
          snapshotFetchCalled = true;
          throw new Error("Snapshot builds must not fetch Sanity");
        },
        readSnapshot: async (snapshotPath) => {
          assert.equal(snapshotPath, "/tmp/frozen-menu-snapshot.json");
          return JSON.stringify({
            schemaVersion: 1,
            source: "sanity",
            result: validDocuments,
          });
        },
        warn: () => {},
      });
      assert.equal(snapshotFetchCalled, false);
      assert.deepEqual(
        snapshotMenus.map(({ id }) => id),
        ["ristorante-mare", "muulab"],
        "The build must consume the exact frozen snapshot when configured",
      );

      await assert.rejects(
        () =>
          loadBuildMenuContent({
            env: { MENU_CMS_SNAPSHOT_PATH: "/tmp/frozen-menu-snapshot.json" },
            readSnapshot: async () =>
              JSON.stringify({
                schemaVersion: 1,
                source: "sanity",
                result: validDocuments.slice(0, 1),
              }),
            warn: () => {},
          }),
        /Required build snapshot is invalid/,
        "A configured immutable snapshot must fail closed instead of signing fallback content",
      );
      await assert.rejects(
        () =>
          loadBuildMenuContent({
            env: { MENU_CMS_SNAPSHOT_PATH: "/tmp/missing-menu-snapshot.json" },
            readSnapshot: async () => {
              throw new Error("missing");
            },
            warn: () => {},
          }),
        /Required build snapshot could not be read/,
      );

      for (const env of [
        {},
        { SANITY_PROJECT_ID: "project-id" },
        {
          SANITY_PROJECT_ID: "project-id",
          SANITY_DATASET: "production",
          SANITY_API_VERSION: "2026-04-07",
        },
      ]) {
        let fetched = false;
        const fallback = await loadBuildMenuContent({
          env,
          fetcher: async () => {
            fetched = true;
            return responseWith(validDocuments);
          },
          warn: () => {},
        });
        assert.equal(fallback, venueMenus);
        assert.equal(fetched, false, "Absent or partial config must not make a request");
      }

      const atomicFailures = [
        validDocuments.slice(0, 1),
        [validDocuments[0], validDocuments[0]],
        [
          validDocuments[0],
          { ...validDocuments[1], categories: [] },
        ],
        [
          validDocuments[0],
          { ...validDocuments[1], venue: "muulab" },
        ],
        [
          validDocuments[0],
          { ...validDocuments[1], _id: "drafts.menu-hawaii" },
        ],
      ];
      for (const documents of atomicFailures) {
        const fallback = await loadWith(documents);
        assert.equal(fallback.menus, venueMenus);
        assert.deepEqual(fallback.warnings, [
          "[menu-cms] Using local menu fallback (invalid-schema).",
        ]);
      }

      const requiredFieldFailures = [
        ["categories", 0, "_key"],
        ["categories", 0, "title"],
        ["dishes", 0, "_key"],
        ["dishes", 0, "name"],
        ["dishes", 0, "available"],
      ];
      for (const [level, index, field] of requiredFieldFailures) {
        const documents = structuredClone(validDocuments);
        const hawaii = documents.find(({ _id }) => _id === "menu-hawaii");
        const target =
          level === "categories"
            ? hawaii.categories[index]
            : hawaii.categories[0].dishes[index];
        delete target[field];
        const fallback = await loadWith(documents);
        assert.equal(fallback.menus, venueMenus, \`Missing required \${field} must reject both docs\`);
      }

      for (const invalidDish of [
        { price: "€8" },
        { allergens: [1, 1] },
        { allergens: [15] },
      ]) {
        const documents = structuredClone(validDocuments);
        Object.assign(
          documents.find(({ _id }) => _id === "menu-hawaii").categories[0].dishes[0],
          invalidDish,
        );
        const fallback = await loadWith(documents);
        assert.equal(fallback.menus, venueMenus);
      }

      const reorderedAndUnknown = structuredClone(validDocuments);
      const reorderedHawaii = reorderedAndUnknown.find(
        ({ _id }) => _id === "menu-hawaii",
      );
      reorderedHawaii.categories = [
        {
          _key: "new-seasonal-category",
          title: "Fuori carta",
          note: "Solo dal CMS",
          dishes: [
            {
              _key: "new-seasonal-dish",
              name: "Piatto del giorno",
              available: true,
              price: "€ 18",
            },
          ],
        },
        reorderedHawaii.categories[0],
      ];
      const reorderedResult = await loadWith(reorderedAndUnknown);
      assert.deepEqual(reorderedResult.menus[0].categories[0], {
        title: "Fuori carta",
        note: "Solo dal CMS",
        dishes: [
          {
            name: "Piatto del giorno",
            price: "€ 18",
            allergens: undefined,
            note: undefined,
          },
        ],
      });
      assert.equal(
        reorderedResult.menus[0].categories[1].anchor,
        "fixed-hawaii-primi",
        "Known metadata must follow the stable category key, not the CMS index",
      );
      assert.deepEqual(
        reorderedResult.menus[0].categories[1].action,
        venueMenus[0].categories[1].action,
      );

      for (const duplicateMutation of [
        (documents) => {
          const hawaii = documents.find(({ _id }) => _id === "menu-hawaii");
          hawaii.categories.push(structuredClone(hawaii.categories[0]));
        },
        (documents) => {
          const hawaii = documents.find(({ _id }) => _id === "menu-hawaii");
          hawaii.categories[0].dishes.push(
            structuredClone(hawaii.categories[0].dishes[0]),
          );
        },
      ]) {
        const documents = structuredClone(validDocuments);
        duplicateMutation(documents);
        const fallback = await loadWith(documents);
        assert.equal(
          fallback.menus,
          venueMenus,
          "Duplicate Sanity keys must reject the complete CMS response",
        );
      }

      const invalidUnavailable = structuredClone(validDocuments);
      Object.assign(invalidUnavailable[0].categories[0].dishes[0], {
        available: false,
        price: "not a price",
      });
      const invalidUnavailableResult = await loadWith(invalidUnavailable);
      assert.equal(
        invalidUnavailableResult.menus,
        venueMenus,
        "Unavailable dishes must be validated before they are filtered",
      );

      const warningScenarios = [
        {
          expected: "fetch-failed",
          fetcher: async () => {
            throw new Error("super-secret-token CMS visible Hawaii dish");
          },
        },
        {
          expected: "http-error",
          fetcher: async () =>
            new Response("super-secret-token CMS visible Hawaii dish", { status: 503 }),
        },
        {
          expected: "invalid-json",
          fetcher: async () => new Response("{not-json", { status: 200 }),
        },
      ];
      for (const { expected, fetcher } of warningScenarios) {
        const fallback = await loadWith(validDocuments, { fetcher });
        assert.equal(fallback.menus, venueMenus);
        assert.deepEqual(fallback.warnings, [
          \`[menu-cms] Using local menu fallback (\${expected}).\`,
        ]);
        assert.doesNotMatch(fallback.warnings[0], /super-secret-token|CMS visible/i);
      }
    `,
  ],
  { cwd: root, encoding: "utf8" },
);
assert.equal(menuCmsCheck.status, 0, menuCmsCheck.stderr || menuCmsCheck.stdout);

assert.match(menuCms, /^import "server-only";/);
assert.match(menuCms, /from "zod"/);
assert.match(
  menuCms,
  /import \{ areUniqueAllergenCodes, isMenuPrice, menuCategoryKeys \} from "\.\.\/\.\.\/\.\.\/shared\/menu-contract"/,
  "The adapter must use the dependency-free shared price and allergen contract",
);
assert.doesNotMatch(menuCms, /NEXT_PUBLIC_/);
for (const variable of [
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_API_VERSION",
  "SANITY_API_TOKEN",
]) {
  assert.match(menuCms, new RegExp(`process\\.env\\.${variable}`));
  assert.match(webEnvExample, new RegExp(`^${variable}=`, "m"));
}
assert.doesNotMatch(webEnvExample, /^NEXT_PUBLIC_SANITY_/m);
assert.match(menuCms, /process\.env\.MENU_CMS_SNAPSHOT_PATH/);
assert.match(webEnvExample, /^MENU_CMS_SNAPSHOT_PATH=\s*$/m);
assert.doesNotMatch(webEnvExample, /^NEXT_PUBLIC_MENU_CMS_SNAPSHOT_PATH/m);
assert.match(menuCms, /readSnapshot/);
assert.match(
  webEnvExample,
  /^SANITY_API_TOKEN=\s*$/m,
  "The example must not contain a token-like placeholder",
);
assert.match(webEnvExample, /read-only/i);
assert.match(webEnvExample, /server-only/i);
assert.match(
  nextConfig,
  /turbopack:\s*\{\s*root:\s*path\.resolve\(__dirname,\s*"\.\."\),?\s*\}/,
  "Turbopack must resolve the shared contract from the monorepo root",
);
assert.match(
  menuPage,
  /export default async function MenuPage\(\)[\s\S]*?await loadBuildMenuContent\(\)/,
);
assert.match(menuPage, /const menus = await loadBuildMenuContent\(\)/);
assert.match(menuPage, /\{menus\.map\(\(menu\) => \(/);
assert.match(menuPage, /dish\.note[\s\S]{0,220}text-\[0\.72rem\]/);

assert.ok(
  fs.existsSync(menuSeedPath),
  "The deterministic Studio menu seed exporter must exist",
);
const menuSeed = fs.readFileSync(menuSeedPath, "utf8");
const rootPackage = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
assert.equal(
  rootPackage.scripts["menu:seed:studio"],
  "web/node_modules/.bin/jiti web/scripts/export-sanity-menu-seed.ts",
  "The Studio seed command must execute the checked-in exporter",
);
assert.match(
  menuSeed,
  /jiti\.import<\{ venueMenus: VenueMenu\[\] \}>\(\s*"\.\.\/src\/lib\/site-content\.ts",?\s*\)/,
  "The seed must derive directly from the approved local venueMenus",
);
assert.match(
  menuSeed,
  /import \{ menuCategoryKeys \} from "\.\.\/\.\.\/shared\/menu-contract";/,
  "The seed must consume the shared stable category keys",
);
assert.match(menuSeed, /fsCache:\s*false/);
assert.doesNotMatch(
  menuSeed,
  /\bfetch\s*\(|https?:\/\/|process\.env|SANITY_API_TOKEN|writeFile|appendFile|createWriteStream/,
  "The seed exporter must not use the network, credentials or filesystem writes",
);

function runMenuSeed() {
  return spawnSync("npm", ["run", "--silent", "menu:seed:studio"], {
    cwd: root,
    encoding: "utf8",
  });
}

const firstMenuSeedRun = runMenuSeed();
assert.equal(
  firstMenuSeedRun.status,
  0,
  firstMenuSeedRun.stderr || firstMenuSeedRun.stdout,
);
assert.equal(
  firstMenuSeedRun.stderr,
  "",
  "The seed command must emit NDJSON to stdout only",
);
const secondMenuSeedRun = runMenuSeed();
assert.equal(
  secondMenuSeedRun.status,
  0,
  secondMenuSeedRun.stderr || secondMenuSeedRun.stdout,
);
assert.equal(
  secondMenuSeedRun.stdout,
  firstMenuSeedRun.stdout,
  "The Studio seed export must be deterministic",
);

const menuSeedDocuments = firstMenuSeedRun.stdout
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
assert.deepEqual(
  menuSeedDocuments.map(({ _id, _type, venue }) => ({ _id, _type, venue })),
  [
    { _id: "menu-hawaii", _type: "menu", venue: "hawaii" },
    { _id: "menu-muulab", _type: "menu", venue: "muulab" },
  ],
  "The seed must contain only the two fixed menu documents",
);
assert.deepEqual(
  menuSeedDocuments[0].categories.map(({ _key }) => _key),
  [
    "hawaii-antipasti",
    "hawaii-primi",
    "hawaii-secondi-griglia",
    "hawaii-contorni",
    "hawaii-pizza-cena",
    "hawaii-dessert",
    "hawaii-cantina",
  ],
  "Hawaii category keys must exactly match the shared contract",
);
assert.deepEqual(
  menuSeedDocuments[1].categories.map(({ _key }) => _key),
  [
    "muulab-per-cominciare",
    "muulab-crudi-carne",
    "muulab-secondi-brace",
    "muulab-tagli-brace",
    "muulab-contorni",
    "muulab-dolci",
    "muulab-cocktail-aperitivo",
    "muulab-cantina-coravin",
  ],
  "MUULab category keys must exactly match the shared contract",
);

for (const document of menuSeedDocuments) {
  for (const category of document.categories) {
    assert.equal(category._type, "menuCategory");
    assert.ok(Array.isArray(category.dishes));
    const dishKeys = category.dishes.map(({ _key }) => _key);
    assert.equal(
      new Set(dishKeys).size,
      dishKeys.length,
      `${document._id}/${category._key} dish keys must be unique`,
    );
    for (const dish of category.dishes) {
      assert.equal(dish._type, "menuDish");
      assert.equal(dish.available, true);
      assert.match(dish._key, /^dish-[a-z0-9-]+-\d{2}$/);
    }
  }
}
const localMenuSeedResult = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "--eval",
    `
      import { createRequire } from "node:module";
      import { pathToFileURL } from "node:url";
      const require = createRequire(import.meta.url);
      const { createJiti } = require(${JSON.stringify(
        path.join(root, "web", "node_modules", "jiti"),
      )});
      const sourceUrl = pathToFileURL(${JSON.stringify(
        path.join(root, "web", "scripts", "seed-test-loader.ts"),
      )}).href;
      const loader = createJiti(sourceUrl, {
        alias: { "@": ${JSON.stringify(path.join(root, "web", "src"))} },
        fsCache: false,
      });
      const { venueMenus } = await loader.import(${JSON.stringify(
        path.join(root, "web", "src", "lib", "site-content.ts"),
      )});
      console.log(JSON.stringify(venueMenus));
    `,
  ],
  { cwd: path.join(root, "web"), encoding: "utf8" },
);
assert.equal(
  localMenuSeedResult.status,
  0,
  localMenuSeedResult.stderr || localMenuSeedResult.stdout,
);
assert.deepEqual(
  JSON.parse(localMenuSeedResult.stdout).map(({ id, categories }) => ({
    id,
    categories: categories.map(({ title, note, dishes }) => ({ title, note, dishes })),
  })),
  menuSeedDocuments.map(({ _id, categories }) => ({
    id: _id === "menu-hawaii" ? "ristorante-mare" : "muulab",
    categories: categories.map(({ title, note, dishes }) => ({
      title,
      note,
      dishes: dishes.map(
        ({ _key: _dishKey, _type: _dishType, available: _available, ...dish }) => dish,
      ),
    })),
  })),
  "Every local dish, price, note and allergen array must survive the seed export",
);

const menuSchema = fs.readFileSync(menuSchemaPath, "utf8");
const menuDishSchema = sourceBetween(
  menuSchema,
  "const menuDish = defineArrayMember({",
  "const menuCategory = defineArrayMember({",
);
const menuCategorySchema = sourceBetween(
  menuSchema,
  "const menuCategory = defineArrayMember({",
  "export const menuType = defineType({",
);
const menuDocumentSchema = menuSchema.slice(
  menuSchema.indexOf("export const menuType = defineType({"),
);
const menuDocumentIdMapping =
  menuSchema.match(/const menuDocumentIds = \{([\s\S]*?)\} as const;/)?.[1] || "";

assert.match(
  menuSchema,
  /import \{ allergenDefinitions, areUniqueAllergenCodes, isMenuPrice \} from "\.\.\/\.\.\/shared\/menu-contract";/,
  "The Studio schema must import the dependency-free shared menu contract",
);
assert.deepEqual(
  [...menuDocumentIdMapping.matchAll(/(\w+): "(menu-[^"]+)"/g)].map(
    ([, venue, documentId]) => [venue, documentId],
  ),
  [
    ["hawaii", "menu-hawaii"],
    ["muulab", "menu-muulab"],
  ],
  "The Studio schema must expose exactly the two fixed venue/document ID mappings",
);
assert.match(menuSchema, /const menuVenueOptions = \[[\s\S]*?value: "hawaii"/);
assert.match(menuSchema, /const menuVenueOptions = \[[\s\S]*?value: "muulab"/);
assert.match(menuSchema, /function validateVenueDocumentPair\(/);
assert.match(menuSchema, /menuDocumentIds\[venue\]/);
assert.match(menuSchema, /replace\(\/\^drafts\\\.\/, ""\)/);

assert.match(menuDishSchema, /type: "object"/);
assert.match(
  menuDishSchema,
  /name: "name"[\s\S]*?type: "string"[\s\S]*?validation: \(Rule\) => Rule\.required\(\)/,
  "Dish names must block publishing when absent",
);
assert.match(
  menuDishSchema,
  /name: "price"[\s\S]*?type: "string"[\s\S]*?Rule\.custom\(validateMenuPrice\)/,
  "Optional dish prices must use the shared price validator",
);
assert.match(menuDishSchema, /name: "note"[\s\S]*?type: "text"/);
assert.match(
  menuDishSchema,
  /name: "available"[\s\S]*?type: "boolean"[\s\S]*?initialValue: true[\s\S]*?Rule\.required\(\)/,
  "Dish availability must default to true and remain explicit",
);
assert.match(
  menuDishSchema,
  /name: "allergens"[\s\S]*?type: "array"[\s\S]*?of: \[\{ type: "number" \}\][\s\S]*?list: allergenOptions[\s\S]*?Rule\.custom\(validateAllergens\)/,
  "Dish allergens must be checkbox options backed by the shared definitions",
);
assert.match(menuSchema, /allergenDefinitions\.map\(/);
assert.match(menuSchema, /areUniqueAllergenCodes\(allergens\)/);
assert.match(menuSchema, /isMenuPrice\(price\)/);

assert.match(menuCategorySchema, /type: "object"/);
assert.match(
  menuCategorySchema,
  /name: "title"[\s\S]*?type: "string"[\s\S]*?validation: \(Rule\) => Rule\.required\(\)/,
  "Category titles must block publishing when absent",
);
assert.match(menuCategorySchema, /name: "note"[\s\S]*?type: "text"/);
assert.match(
  menuCategorySchema,
  /name: "dishes"[\s\S]*?type: "array"[\s\S]*?of: \[menuDish\][\s\S]*?Rule\.required\(\)/,
  "Categories must contain an explicit ordered dish array, including empty code-owned wine sections",
);
assert.match(
  menuDocumentSchema,
  /name: "venue"[\s\S]*?type: "string"[\s\S]*?list: menuVenueOptions[\s\S]*?Rule\.required\(\)\.custom\(validateVenueDocumentPair\)/,
  "Venue selection must be fixed and paired with the document ID",
);
assert.match(
  menuDocumentSchema,
  /name: "categories"[\s\S]*?type: "array"[\s\S]*?of: \[menuCategory\][\s\S]*?Rule\.required\(\)\.min\(1\)/,
  "Menus must contain ordered, keyed category objects",
);
assert.doesNotMatch(
  menuSchema,
  /name: "(?:_key|anchor|bookingLink|bookingUrl|html|image|media|pdfUrl)"/,
  "Code-owned anchors, links, keys, HTML and media must not be editable",
);

const studioEnvExample = fs.readFileSync(studioEnvExamplePath, "utf8");
assert.deepEqual(
  studioEnvExample
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#")),
  [
    "SANITY_STUDIO_PROJECT_ID=your-project-id",
    "SANITY_STUDIO_DATASET=your-dataset",
    "SANITY_STUDIO_HOSTNAME=your-studio-hostname",
  ],
  "Studio environment documentation must contain placeholder-only project, dataset and host values",
);
assert.doesNotMatch(
  studioEnvExample,
  /TOKEN|SECRET|PASSWORD|AUTH/i,
  "Studio environment documentation must not solicit credentials",
);

assert.ok(fs.existsSync(sanityCliPath), "The Studio deployment CLI config must exist");
const sanityCli = fs.readFileSync(sanityCliPath, "utf8");
assert.match(sanityCli, /import \{ defineCliConfig \} from "sanity\/cli";/);
assert.match(
  sanityCli,
  /projectId: process\.env\.SANITY_STUDIO_PROJECT_ID \|\| "your-project-id"/,
  "Studio deployment must read the documented project ID with a placeholder fallback",
);
assert.match(
  sanityCli,
  /dataset: process\.env\.SANITY_STUDIO_DATASET \|\| "your-dataset"/,
  "Studio deployment must read the documented dataset with a placeholder fallback",
);
assert.match(
  sanityCli,
  /studioHost: process\.env\.SANITY_STUDIO_HOSTNAME \|\| "your-studio-hostname"/,
  "Studio deployment must read the documented host with a placeholder fallback",
);
assert.doesNotMatch(
  sanityCli,
  /TOKEN|SECRET|PASSWORD|AUTH/i,
  "Studio deployment config must not read or contain credentials",
);

const sanityConfig = fs.readFileSync(sanityConfigPath, "utf8");
assert.match(sanityConfig, /import \{ structureTool \} from "sanity\/structure";/);
assert.match(sanityConfig, /import \{ structure \} from "\.\/structure";/);
assert.match(
  sanityConfig,
  /projectId: process\.env\.SANITY_STUDIO_PROJECT_ID \|\| "your-project-id"/,
  "Studio runtime must read the same documented project ID as the CLI",
);
assert.match(
  sanityConfig,
  /dataset: process\.env\.SANITY_STUDIO_DATASET \|\| "your-dataset"/,
  "Studio runtime must read the same documented dataset as the CLI",
);
assert.match(sanityConfig, /plugins: \[structureTool\(\{ structure \}\)\]/);
assert.match(
  sanityConfig,
  /templates: \(templates\) =>[\s\S]*?schemaType !== "menu"/,
  "The global create menu template must be removed",
);
assert.match(
  sanityConfig,
  /schemaType === "menu"[\s\S]*?action !== "duplicate"/,
  "Menu singleton documents must not expose duplicate creation",
);

assert.ok(fs.existsSync(studioStructurePath), "The fixed Studio structure must exist");
const studioStructure = fs.readFileSync(studioStructurePath, "utf8");
assert.match(
  studioStructure,
  /import type \{ StructureBuilder, StructureResolver \} from "sanity\/structure";/,
);
const menuSingletonMapping =
  studioStructure.match(/const menuSingletons = \[([\s\S]*?)\] as const;/)?.[1] || "";
assert.deepEqual(
  [...menuSingletonMapping.matchAll(/documentId: "(menu-[^"]+)", title: "([^"]+)"/g)].map(
    ([, documentId, title]) => [documentId, title],
  ),
  [
    ["menu-hawaii", "Menu Hawaii"],
    ["menu-muulab", "Menu MUULab"],
  ],
  "The Studio structure must expose exactly the two fixed menu singletons",
);
assert.match(studioStructure, /\.schemaType\("menu"\)\.documentId\(documentId\)/);
assert.match(
  studioStructure,
  /documentTypeListItems\(\)[\s\S]*?filter\([\s\S]*?getId\(\) !== "menu"/,
  "The generic menu document list must be removed from the Studio structure",
);
assert.doesNotMatch(
  [sanityCli, sanityConfig, studioEnvExample].join("\n"),
  /\bSANITY_(?:PROJECT_ID|DATASET)\b/,
  "Studio configuration must use only browser-safe SANITY_STUDIO-prefixed variables",
);

assert.match(
  siteContent,
  /export type MenuDish = \{[\s\S]*?allergens\?: readonly number\[\];/,
  "Menu dishes must support declared allergen codes",
);
assert.match(
  siteContent,
  /export const allergenLegend = \[/,
  "Menu content must publish the official allergen legend",
);
assert.match(
  siteContent,
  /allergens: \[2, 9, 12, 14\]/,
  "The Hawaii menu must retain verified allergen declarations",
);
assert.match(
  siteContent,
  /allergens: \[1, 3, 7\]/,
  "The MUULab menu must retain verified allergen declarations",
);
assert.match(
  menuPage,
  /data-testid="allergen-legend"/,
  "Menu page must render a visible allergen legend",
);
assert.match(
  menuPage,
  /data-testid="dish-allergens"/,
  "Menu page must render dish-level allergen declarations",
);
assert.match(
  menuPage,
  /dish\.allergens\.join\(" · "\)/,
  "Dish allergens must render as compact numeric codes",
);
assert.doesNotMatch(
  menuPage,
  /Allergeni: chiedi al personale/,
  "Menu rows without declared codes must remain visually clean",
);
const aperitivoScene = sourceBetween(
  siteContent,
  'id: "aperitivo"',
  'id: "muulab"',
);
const eventiScene = sourceBetween(
  siteContent,
  'id: "eventi"',
  "] satisfies JourneyScene[]",
);
const aperitivoHotspots = sourceBetween(
  aperitivoScene,
  "hotspots: [",
  "],\n      menu:",
);
const eventiHotspots = sourceBetween(
  eventiScene,
  "hotspots: [",
  "],\n      action:",
);
const aperitivoCocktailHotspot = (aperitivoHotspots.match(/\{[^{}]*\}/g) || []).find(
  (object) => /label:\s*"Cocktail & bollicine"/.test(object),
);
const eventiPoshHotspot = (eventiHotspots.match(/\{[^{}]*\}/g) || []).find((object) =>
  /label:\s*"Giovedì Posh"/.test(object),
);

assert.doesNotMatch(
  aperitivoScene,
  /Giovedì Posh/,
  "The aperitivo scene must not mention Giovedì Posh",
);
assert.ok(
  aperitivoCocktailHotspot,
  "The aperitivo scene must include a Cocktail & bollicine hotspot object",
);
assert.match(
  aperitivoCocktailHotspot,
  /label:\s*"Cocktail & bollicine"/,
  "The aperitivo cocktail hotspot must keep the Cocktail & bollicine label",
);
assert.match(
  aperitivoCocktailHotspot,
  /href:\s*"\/menu#cocktail"/,
  "The aperitivo cocktail hotspot must link to /menu#cocktail",
);
assert.ok(
  eventiPoshHotspot,
  "The eventi scene must include a Giovedì Posh hotspot object",
);
assert.match(
  eventiPoshHotspot,
  /label:\s*"Giovedì Posh"/,
  "The eventi hotspot must keep the Giovedì Posh label",
);
assert.match(
  eventiPoshHotspot,
  /href:\s*"\/eventi"/,
  "The Giovedì Posh hotspot must link to /eventi",
);
assert.doesNotMatch(
  eventiHotspots,
  /label:\s*"Le serate"/,
  "The eventi hotspots must not retain the generic Le serate label",
);

assert.doesNotMatch(
  layout,
  /next\/font\/google/,
  "The production layout should not depend on Google Fonts at build time",
);
assert.match(
  layout,
  /next\/font\/local/,
  "The production layout should self-host its font files with next/font/local",
);
assert.doesNotMatch(
  stage,
  /fetch\(src,\s*\{\s*cache:\s*"force-cache"/,
  "The scroll stage should not force-download the full journey video as a blob",
);
assert.match(
  stage,
  /preload=\{mediaMode === "video" \? "auto" : "none"\}/,
  "The journey should buffer only after video playback is eligible",
);
assert.match(
  stage,
  /onError=\{\(event\) => \{[\s\S]{0,260}HTMLMediaElement\.NETWORK_NO_SOURCE[\s\S]{0,180}!isVideoError && !hasNoPlayableSource[\s\S]{0,100}activateFallback\("media-error"\)/,
  "Only a real media error or exhausted sources may activate video fallback",
);
assert.match(stage, /advanceScrubTime/, "The homepage should use bounded continuous scrubbing");
assert.doesNotMatch(
  stage,
  /useJourneyClipPlayer|requestScene|coverStill/,
  "The homepage must not execute checkpoint clips or destination covers",
);
assert.doesNotMatch(
  stage,
  /journey-snap-root|scroll-snap-(?:align|stop)/,
  "The homepage must not force scene-by-scene scroll snapping",
);
const journeyViewportSupports = cssBlock(
  globalStyles,
  /@supports \(height: 100dvh\)/,
  "@supports (height: 100dvh) journey viewport block",
);
const journeyViewportBaseStyles = globalStyles.slice(0, journeyViewportSupports.start);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-stage")),
  "height:100svh;",
  "The base journey stage rule must contain only the 100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-track")),
  "margin-top:-100svh;",
  "The base journey track rule must contain only the -100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-tail")),
  "height:100svh;",
  "The base journey tail rule must contain only the 100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-stage")),
  "height:100dvh;",
  "The supported journey stage override must contain only height: 100dvh",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-track")),
  "margin-top:-100dvh;",
  "The supported journey track override must contain only margin-top: -100dvh",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-tail")),
  "height:100dvh;",
  "The supported journey tail override must contain only height: 100dvh",
);
assert.match(
  stage,
  /<div(?=[^>]*\bdata-testid="scroll-video-stage")(?=[^>]*\bclassName="journey-stage journey-viewport-stage sticky top-0 overflow-hidden")[^>]*>/,
  "The scroll video stage element must use the exact viewport-aware sticky class list",
);
assert.match(
  stage,
  /<div\s+aria-hidden="true"\s+className="pointer-events-none relative z-0 journey-viewport-track"\s*>/,
  "The aria-hidden journey track div must use the exact viewport-track class list",
);
assert.match(
  stage,
  /<div\s+data-journey-tail\s+aria-hidden="true"\s+className="journey-viewport-tail"\s*\/>/,
  "The data-journey-tail div must use only the journey-viewport-tail class",
);
assert.doesNotMatch(
  stage,
  /h-\[100svh\]|-mt-\[100svh\]/,
  "The journey component must not retain legacy 100svh Tailwind utilities",
);
assert.match(
  stage,
  /style=\{\{ height: `\$\{\(scene\.end - scene\.start\) \* 1800\}svh` \}\}/,
  "Journey scene duration must remain proportional to 1800svh",
);
assert.match(stage, /journeyFrameRef/, "Scroll measurement and media scrub should share one RAF");
assert.doesNotMatch(
  stage,
  /scrollFrameRef|scrubFrameRef|JOURNEY_FRAME_SECONDS \* 0\.7/,
  "The journey must not run competing RAF loops or seek below one full video frame",
);
assert.match(
  globalStyles,
  /\.journey-stage video\s*{[\s\S]*?object-position:\s*center;[\s\S]*?transform:\s*none;[\s\S]*?transition:\s*opacity[^;]*;[\s\S]*?@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.journey-stage video\s*{[\s\S]*?transition-duration:\s*0s;[\s\S]*?will-change:\s*auto;/,
  "Touch journey media must not allocate a continuously transformed compositor layer",
);
assert.doesNotMatch(
  soulRail,
  /px-2 py-1 backdrop-blur-md/,
  "The fixed mobile Soul Rail must not blur every video frame beneath it",
);
assert.match(
  soulRail,
  /soul-rail-surface/,
  "The Soul Rail surface must expose a touch-specific compositing hook",
);
assert.match(
  siteHeader,
  /coarsePointerQuery\.matches\s*\?\s*0\s*:/,
  "Touch scrolling must keep the header at one stable size",
);
assert.match(
  stage,
  /bufferingRef\.current = true;[\s\S]*?playAttemptIdRef\.current \+= 1;[\s\S]*?playAttemptRef\.current = false;/,
  "A buffering watchdog must invalidate any pending play lock before retrying",
);
assert.match(
  stage,
  /const primePlaybackFromGesture[\s\S]*?isTouchGesture[\s\S]*?void video\.play\(\)\.then/,
  "Touch playback must be primed synchronously from the pointer gesture handler",
);
assert.doesNotMatch(stage, /inert=\{!.*Interactive\}/);
assert.match(stage, /data-testid="journey-persistent-copy"/);
assert.match(stage, /journey-video-reverse/);
assert.match(stage, /reverseSourceAttachedRef\.current = true/);
assert.match(stage, /!railScrollingRef\.current/);

for (const variant of ["mobile", "desktop"]) {
  const forwardPath = path.join(root, "web", "public", "media", "hawaii", `journey-${variant}.mp4`);
  const reversePath = path.join(
    root,
    "web",
    "public",
    "media",
    "hawaii",
    `journey-${variant}-reverse.mp4`,
  );
  assert.ok(fs.existsSync(reversePath), `Missing ${variant} reverse journey asset`);
  assert.ok(
    fs.statSync(reversePath).size <= fs.statSync(forwardPath).size,
    `${variant} reverse journey asset must not exceed its forward counterpart`,
  );
  const header = fs.readFileSync(reversePath).subarray(0, 128).toString("latin1");
  assert.ok(header.includes("ftyp"), `${variant} reverse journey asset must be an MP4`);
  const probe = fs.readFileSync(reversePath).subarray(0, 1024 * 1024).toString("latin1");
  assert.ok(probe.indexOf("moov") > -1, `${variant} reverse journey asset must use faststart`);
}
assert.doesNotMatch(
  productionSources,
  /(?:from|import\()\s*["'][^"']*journey-segment-(?:controller|machine)/,
  "Production must not import the superseded journey controller or reducer",
);
const pushTrigger = sourceBetween(pagesWorkflow, "  push:", "  workflow_dispatch:");
assert.match(pushTrigger, /branches:\s*\n\s*- main\s*\n\s*- claude\/codex-handoff-assets-se8fjq/);
assert.doesNotMatch(pagesWorkflow, /repository_dispatch/);
assert.match(
  pagesWorkflow,
  /workflow_dispatch:\s*\n\s*inputs:\s*[\s\S]*?cms_revision:[\s\S]*?rollback_run_id:/,
  "Manual and Sanity publishing must expose the revision and optional rollback run",
);
assert.match(pagesWorkflow, /permissions:\s*\n\s*actions:\s*read/);
assert.match(verifyJob, /if:.*rollback_run_id.*== ''/);
assert.match(verifyJob, /npm run test:web:journey/);
assert.match(verifyJob, /npm run test:web:static/);
assert.match(verifyJob, /tsc --noEmit/);
assert.match(verifyJob, /lint -- --max-warnings=0/);
assert.match(verifyJob, /playwright install --with-deps chromium webkit/);
assert.match(verifyJob, /STATIC_EXPORT:\s*["']1["']/);
assert.match(verifyJob, /NEXT_PUBLIC_BASE_PATH:\s*\/\$\{\{ github\.event\.repository\.name \}\}/);
assert.match(verifyJob, /NODE_OPTIONS:\s*--max-old-space-size=2048/);
assert.match(verifyJob, /npm run build -- --webpack/);
assert.match(verifyJob, /rm -rf pages-preview/);
assert.match(verifyJob, /cp -a web\/out\/\. pages-preview\/\$\{\{ github\.event\.repository\.name \}\}\//);
assert.match(verifyJob, /npm run test:web:production/);
assert.match(verifyJob, /actions\/upload-pages-artifact@v3[\s\S]*path:\s*web\/out/);
const cmsCaptureStep = sourceBetween(
  verifyJob,
  "- name: Capture immutable menu snapshot",
  "- name: Build exact captured menu snapshot",
);
const cmsBuildStep = sourceBetween(
  verifyJob,
  "- name: Build exact captured menu snapshot",
  "- name: Prefix root media URLs",
);
for (const variable of [
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_API_VERSION",
  "SANITY_API_TOKEN",
]) {
  assert.match(
    cmsCaptureStep,
    new RegExp(`${variable}:\\s*\\$\\{\\{ secrets\\.${variable} \\}\\}`),
  );
}
assert.ok(
  verifyJob.indexOf("verified-menu-release.mjs capture") <
    verifyJob.indexOf("npm run build -- --webpack"),
  "The immutable snapshot must be captured before the static build",
);
assert.match(
  cmsBuildStep,
  /MENU_CMS_SNAPSHOT_PATH:\s*\.\.\/\.verified-menu-release\/menu-snapshot\.json/,
);
assert.doesNotMatch(
  verifyJob.replace(cmsCaptureStep, ""),
  /secrets\.SANITY_/,
  "Sanity secrets must be scoped only to snapshot capture",
);
assert.doesNotMatch(cmsBuildStep, /SANITY_API_TOKEN|secrets\.SANITY_/);
assert.match(cmsCaptureStep, /verified-menu-release\.mjs capture/);
assert.match(
  verifyJob,
  /actions\/upload-artifact@v4[\s\S]*name:\s*verified-menu-release[\s\S]*include-hidden-files:\s*true[\s\S]*retention-days:\s*90/,
  "Every normal build must retain a private verified release artifact",
);
assert.match(
  restoreJob,
  /actions\/setup-node@v4[\s\S]*node-version:\s*22/,
  "Rollback must provision the same Node runtime as the verified build",
);
assert.match(
  restoreJob,
  /name:\s*Install restore dependencies[\s\S]*working-directory:\s*web[\s\S]*run:\s*npm ci/,
  "Rollback must install the web dependencies required by the verifier",
);
assert.ok(
  restoreJob.indexOf("actions/setup-node@v4") <
    restoreJob.indexOf("Install restore dependencies") &&
    restoreJob.indexOf("Install restore dependencies") <
      restoreJob.indexOf("verified-menu-release.mjs verify"),
  "Restore runtime and dependencies must be ready before manifest verification",
);
assert.match(restoreJob, /actions\/github-script@v7/);
assert.match(restoreJob, /getWorkflowRun/);
assert.match(restoreJob, /run\.status !== "completed"/);
assert.match(restoreJob, /run\.conclusion !== "success"/);
assert.match(restoreJob, /run\.head_branch !== process\.env\.EXPECTED_BRANCH/);
assert.match(restoreJob, /workflowPath !== process\.env\.EXPECTED_WORKFLOW_PATH/);
assert.match(
  restoreJob,
  /actions\/download-artifact@v4[\s\S]*name:\s*verified-menu-release[\s\S]*run-id:/,
);
assert.match(restoreJob, /verified-menu-release\.mjs verify/);
assert.match(
  restoreJob,
  /RELEASE_EXPECTED_SOURCE_RUN_ID:\s*\$\{\{ inputs\.rollback_run_id \}\}/,
);
assert.match(
  pagesWorkflow,
  /needs:\s*\[verify, restore\]/,
  "Deployment must accept either a fresh verification or a verified rollback",
);
assert.doesNotMatch(
  pagesWorkflow.match(/permissions:\n([\s\S]*?)\n\nconcurrency:/)?.[1] || "",
  /pages:\s*write|id-token:\s*write/,
  "Deployment credentials must not be global",
);
assert.match(deployJob, /permissions:\s*[\s\S]*pages:\s*write[\s\S]*id-token:\s*write/);
assert.match(deployJob, /actions\/configure-pages@v5/);
assert.doesNotMatch(`${verifyJob}\n${restoreJob}`, /actions\/configure-pages@v5/);
assert.match(verifiedMenuRelease, /\b_rev\b/);
assert.match(verifiedMenuRelease, /\b_updatedAt\b/);
assert.match(verifiedMenuRelease, /menu-hawaii/);
assert.match(verifiedMenuRelease, /menu-muulab/);
assert.match(verifiedMenuRelease, /createHash\("sha256"\)/);
assert.match(verifiedMenuRelease, /RELEASE_EXPECTED_WORKFLOW_PATH/);
assert.match(verifiedMenuRelease, /RELEASE_EXPECTED_BRANCH/);
assert.match(verifiedMenuRelease, /RELEASE_EXPECTED_SOURCE_COMMIT/);
assert.match(verifiedMenuRelease, /RELEASE_EXPECTED_SOURCE_RUN_ID/);
assert.match(verifiedMenuRelease, /RELEASE_EXPECTED_DOCUMENT_IDS/);
assert.match(verifiedMenuRelease, /isMenuPrice/);
assert.match(verifiedMenuRelease, /areUniqueAllergenCodes/);
assert.doesNotMatch(verifiedMenuRelease, /s\\?\\?\.q|s\.q\./);
assert.doesNotMatch(
  `${pagesWorkflow}\n${verifiedMenuRelease}`,
  /github_pat_|ghp_|SANITY_API_TOKEN:\s*["'][^"']+|password\s*[:=]\s*["'][^"']+/i,
  "Publishing automation must not contain hard-coded credentials",
);
for (const requirement of [
  /workflow_dispatch/,
  /Actions:\s*write/i,
  /Contents:\s*read/i,
  /Google SSO/i,
  /MFA/i,
  /rotazione/i,
  /revoca/i,
  /configurazione esterna/i,
]) {
  assert.match(adminContentBlueprint, requirement);
}
assertVerifiedMenuReleaseBehavior();
assertLocalMenuSnapshotCapture();
assert.match(productionRunner, /server\.listen\(0, "127\.0\.0\.1"/);
assert.match(productionRunner, /tests\/web-smoke\.js/);
assert.match(productionRunner, /tests\/webkit-mobile-playback\.js/);
assert.match(productionRunner, /tests\/desktop-video-playback\.js/);
assert.match(productionRunner, /tests\/webkit-iphone-touch-playback\.js/);
assert.match(productionRunner, /tests\/webkit-slow-mobile-video\.js/);
assert.match(pagesPreviewBuild, /TMP_ROOT="\$\(mktemp -d /);
assert.match(
  pagesPreviewBuild,
  /rsync -a[\s\S]*--exclude node_modules[\s\S]*--exclude \.next[\s\S]*--exclude out[\s\S]*--exclude src\/app\/api[\s\S]*"\$WEB_DIR\/" "\$TMP_ROOT\/web\/"/,
);
assert.match(pagesPreviewBuild, /ln -s "\$WEB_DIR\/node_modules" "\$TMP_ROOT\/web\/node_modules"/);
assert.match(
  pagesPreviewBuild,
  /rsync -a "\$ROOT_DIR\/shared\/" "\$TMP_ROOT\/shared\/"/,
  "The Pages builder must copy the shared menu contract into its temporary monorepo",
);
assert.match(pagesPreviewBuild, /STATIC_EXPORT=1/);
assert.match(pagesPreviewBuild, /NEXT_PUBLIC_BASE_PATH=\/hawaii/);
assert.match(
  pagesPreviewBuild,
  /NODE_OPTIONS="\$\{NODE_OPTIONS:\+\$NODE_OPTIONS \}--max-old-space-size=2048"/,
  "The Pages build must append the 2GB cap after any caller-provided Node options",
);
assertPagesBuildInvalidConfigCleanup();
assert.match(
  pagesPreviewBuild,
  /RSS_LIMIT_MB="\$\{PAGES_BUILD_RSS_LIMIT_MB:-2048\}"/,
  "The complete Pages build process tree must default to a 2GB RSS ceiling",
);
assert.match(
  pagesPreviewBuild,
  /RSS_HEADROOM_MB="\$\{PAGES_BUILD_RSS_HEADROOM_MB:-256\}"/,
  "The Pages build must reserve 256MB below its hard RSS ceiling",
);
assert.match(
  pagesPreviewBuild,
  /RSS_POLL_SECONDS="\$\{PAGES_BUILD_RSS_POLL_SECONDS:-0\.1\}"/,
  "The Pages build must sample process-tree RSS every 0.1 seconds by default",
);
assert.match(pagesPreviewBuild, /RSS_TERMINATION_MB=\$\(\(RSS_LIMIT_MB - RSS_HEADROOM_MB\)\)/);
assert.match(pagesPreviewBuild, /ps -axo pid=,ppid=,rss=/);
assert.match(pagesPreviewBuild, /terminate_process_tree/);
assert.match(pagesPreviewBuild, /"\$NPM_BIN" run build -- --webpack/);
assert.ok(pagesPreviewBuild.includes(`-e 's|"/media/|"/hawaii/media/|g'`));
assert.ok(pagesPreviewBuild.includes(`-e "s|'/media/|'/hawaii/media/|g"`));
assert.ok(pagesPreviewBuild.includes(`-e 's|(/media/|(/hawaii/media/|g'`));
assert.match(
  pagesPreviewBuild,
  /WEB_DIR="\$\{PAGES_BUILD_WEB_DIR:-\$ROOT_DIR\/web\}"/,
);
assert.match(
  pagesPreviewBuild,
  /OUTPUT_DIR="\$\{PAGES_BUILD_OUTPUT_DIR:-\$ROOT_DIR\/pages-preview\/hawaii\}"/,
);
assert.match(pagesPreviewBuild, /NPM_BIN="\$\{PAGES_BUILD_NPM:-npm\}"/);
assert.match(pagesPreviewBuild, /STAGE_DIR="\$\(mktemp -d /);
assert.match(
  pagesPreviewBuild,
  /rsync -a --delete "\$TMP_ROOT\/web\/out\/" "\$STAGE_DIR\/"/,
);
assert.match(pagesPreviewBuild, /mv "\$OUTPUT_DIR" "\$BACKUP_DIR"/);
assert.match(pagesPreviewBuild, /mv "\$STAGE_DIR" "\$OUTPUT_DIR"/);
assert.match(pagesPreviewBuild, /trap cleanup EXIT/);
assert.match(pagesPreviewBuild, /trap 'exit 129' HUP/);
assert.match(pagesPreviewBuild, /trap 'exit 130' INT/);
assert.match(pagesPreviewBuild, /trap 'exit 143' TERM/);
assert.ok(
  pagesPreviewBuild.indexOf("trap cleanup EXIT") <
    pagesPreviewBuild.indexOf('TMP_ROOT="$(mktemp -d '),
  "Cleanup must be registered before the temporary build directory is created",
);
assert.doesNotMatch(
  pagesPreviewBuild,
  /(?:rm|mv)[^\n]*src\/app\/api/,
  "The Pages preview builder must never remove or move the source API routes",
);
assertPagesBuildSuccessBehavior();
assertPagesBuildFailureBehavior();
assertPagesBuildMemoryBehavior();
assert.match(arubaBuild, /--exclude src\/app\/api/);
assert.match(arubaBuild, /NEXT_PUBLIC_BASE_PATH=""/);
assert.match(arubaBuild, /OUTPUT_PARENT="\$ROOT_DIR\/output"/);
assert.match(arubaBuild, /OUTPUT_DIR="\$OUTPUT_PARENT\/aruba-static"/);
assert.match(arubaBuild, /aruba-static-readiness\.js/);
assert.match(
  arubaBuild,
  /rsync -a "\$ROOT_DIR\/shared\/" "\$TMP_ROOT\/shared\/"/,
  "The Aruba builder must copy the shared menu contract into its temporary monorepo",
);
assert.match(arubaHeaders, /Accept-Ranges/);
assert.match(arubaHeaders, /Content-Security-Policy/);
assert.match(arubaHeaders, /X-Content-Type-Options/);
assert.match(
  arubaHeaders,
  /RewriteRule \^OLD\(\?:\/\|\$\) - \[F,L,NC\]/,
  "The WordPress backup directory must be denied over HTTP",
);
assert.match(arubaOldGuard, /Require all denied/);
assert.match(arubaOldGuard, /Deny from all/);
assert.ok(
  arubaRelease.indexOf("uploadFile(oldAccessGuard") <
    arubaRelease.indexOf("const backupMoves = [];"),
  "The old directory must be denied before any WordPress root entry is moved",
);
assert.match(arubaRelease, /release\.worktree !== "clean"/);
assert.match(arubaRelease, /release\.commit !== head\.stdout\.trim\(\)/);
assert.match(arubaRelease, /tests\/aruba-static-readiness\.js/);
assert.match(
  arubaRelease,
  /for \(const entrypoint of entrypointFiles\)[\s\S]*verifyRemoteFile\(/,
  "The reversible deployer must verify every promoted HTML entrypoint",
);
assert.match(arubaRelease, /file\.path !== "404\/index\.html"/);
assert.match(arubaRelease, /file\.path !== "_not-found\/index\.html"/);
const promotionTransaction = sourceBetween(
  arubaRelease,
  "const promotionMoves = [];",
  "console.log(`Release promossa:",
);
assert.ok(
  promotionTransaction.indexOf("verifyRemoteFile(") <
    promotionTransaction.indexOf("} catch (error)"),
  "Remote integrity verification must remain inside the automatic rollback boundary",
);
const entrypointRepair = sourceBetween(
  arubaRelease,
  "function repairEntrypoints(",
  "function rollback(",
);
const verifiedUpload = sourceBetween(
  arubaRelease,
  "function uploadVerifiedFile(",
  "function walkFiles(",
);
assert.match(verifiedUpload, /for \(let attempt = 0;/);
assert.match(verifiedUpload, /verifyRemoteFile\(remotePath, expected\)/);
assert.match(verifiedUpload, /sleep\(/);
assert.match(entrypointRepair, /uploadVerifiedFile\(localFile, stagedFile, expected\)/);
assert.match(
  entrypointRepair,
  /const stagedFile = joinRemote\(\s*remoteRoot,\s*oldName,/,
  "Repair uploads must use the existing old root because fresh Aruba subdirectories can return empty files",
);
assert.ok(
  entrypointRepair.indexOf("uploadVerifiedFile(localFile, stagedFile, expected)") <
    entrypointRepair.indexOf("moveRemote(activeFile, archivedFile)"),
  "An entrypoint repair must verify the staged upload before replacing production",
);
assert.ok(
  entrypointRepair.indexOf("moveRemote(activeFile, archivedFile)") <
    entrypointRepair.indexOf("moveRemote(stagedFile, activeFile)"),
  "An entrypoint repair must archive the current file before promoting its replacement",
);
assert.match(entrypointRepair, /restoreMoves\(repairMoves\)/);
assert.match(arubaRelease, /command === "repair-entrypoints"/);
assert.doesNotMatch(
  arubaRelease,
  /(?:DELE|RMD)\s/,
  "The reversible deployer must not delete remote files or directories",
);
const backupTransaction = sourceBetween(
  arubaRelease,
  "const backupMoves = [];",
  "const promotionMoves = [];",
);
assert.ok(
  backupTransaction.indexOf("ROLLBACK-MANIFEST.json") <
    backupTransaction.indexOf("} catch (error)"),
  "Manifest upload failure must remain inside the automatic WordPress rollback boundary",
);
assert.match(homePage, /title:\s*"Urban Village"/);
assert.match(arubaReadiness, /journey-desktop\.mp4/);
assert.match(arubaReadiness, /\/hawaii\//);
assert.match(arubaGuide, /form/i);
assert.match(arubaGuide, /non inviano|non consegnano/i);
assert.doesNotMatch(
  theFork,
  /hawaii-thefork-consent-v1|Carica il modulo TheFork/,
  "TheFork must not require or persist a second dedicated consent",
);
assert.match(
  consentSources,
  /hawaii-consent-v1/,
  "TheFork must follow the global consent decision",
);
assert.match(
  cookieBanner,
  /subscribeToConsent/,
  "The cookie banner must stay synchronized with the shared consent store",
);
assert.match(
  cookiePage,
  /ConsentPreferencesButton/,
  "The cookie page must let visitors revise their stored consent",
);
assert.match(
  consentSources,
  /hawaii-consent-change/,
  "TheFork must react immediately when global consent changes",
);
assert.match(theFork, /allow="payment \*"/, "TheFork iframe should only allow payments");
assert.match(
  theFork,
  /referrerPolicy="strict-origin-when-cross-origin"/,
  "TheFork iframe should use a restrictive referrer policy",
);
assert.match(theFork, /loading="eager"/, "TheFork iframe should load immediately after consent");
assert.match(
  theFork,
  /height: "max\(800px, calc\(100svh - 7rem\)\)"/,
  "TheFork iframe should retain the planned responsive minimum height",
);
assert.doesNotMatch(
  theFork,
  /thefork-direct-link|Apri direttamente TheFork|href=\{venue\.theForkUrl\}/,
  "Embedded booking pages must not expose an external TheFork link",
);
assert.match(
  nextConfig,
  /frame-src https:\/\/widget\.thefork\.com;/,
  "CSP should authorize only the TheFork widget frame origin",
);
assert.doesNotMatch(
  productionSources,
  /attiva (?:il )?modulo TheFork|Carica il modulo TheFork/i,
  "Booking copy must not ask visitors to activate TheFork manually",
);
assert.match(
  nextConfig,
  /frame-ancestors 'none';/,
  "CSP must continue to deny all framing of this site",
);
assert.match(bookingHub, /title: "Food"/);
assert.match(bookingHub, /title: "Beach & Sport"/);
assert.match(bookingHub, /title: "Eventi privati"/);
assert.match(bookingHub, /Prenota Hawaii/);
assert.match(bookingHub, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(bookingHub, /Prenota MUULab/);
assert.match(bookingHub, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(bookingHub, /food-gnocchi-mare\.jpg/);
assert.match(bookingHub, /muulab-carpaccio-nero\.jpg/);
assert.match(bookingHub, /data-booking-image/);
assert.match(bookingHub, /beachBookingUrl/);
assert.match(bookingHub, /label: "Prenota padel"[\s\S]{0,160}href: "\/sport"/);
assert.match(bookingHub, /["']\/sport["']/);
assert.match(bookingHub, /["']\/feste-private["']/);
assert.doesNotMatch(bookingHub, /Prenota (?:Hawaii|MUULab) su TheFork/);
assert.doesNotMatch(siteContent, /(?:label|title): "Prenota (?:Hawaii|MUULab) su TheFork"/);
assert.doesNotMatch(productionSources, /Prenota (?:Hawaii|MUULab) su TheFork/);
assert.match(siteContent, /label: "Prenota Hawaii"/);
assert.match(siteContent, /label: "Prenota MUULab"/);
assert.match(bookingForm, /whatsappContacts\.events/);
assert.match(bookingForm, /bookingVenues\.hawaii\.phoneHref/);
assert.match(bookingForm, /bookingVenues\.muulab\.phoneHref/);
assert.doesNotMatch(bookingForm, /fetch\(|<form|input|textarea/);

assert.match(bookingConfig, /buildWhatsAppUrl/);
assert.match(bookingConfig, /393516900701/);
assert.match(bookingConfig, /393333440051/);
assert.match(bookingConfig, /393513200049/);
assert.match(bookingConfig, /vorrei prenotare un tavolo al ristorante Hawaii/);
assert.match(bookingConfig, /vorrei prenotare un tavolo sulla terrazza MUULab Riviera/);
assert.match(bookingConfig, /vorrei prenotare un campo da padel/);
assert.match(
  bookingConfig,
  /https:\/\/new-widget\.spiagge\.it\/stabilimenti-balneari\/prenotazione\/it-pe-65123-lido-hawaii\/insertPeriod\?yb_booking_license=it-pe-65123-lido-hawaii/,
);
assert.match(bookingConfig, /portalUrl: "https:\/\/wansport\.com"/);
assert.doesNotMatch(bookingConfig, /portalUrl: "https:\/\/wansport\.com\//);

assert.match(siteContent, /from "@\/lib\/booking-config"/);
assert.match(siteContent, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(siteContent, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(siteContent, /beachBookingUrl/);
assert.match(siteContent, /sportBooking\.portalUrl/);
assert.match(siteContent, /sportBooking\.registrationNotice/);
assert.match(siteContent, /sportBooking\.whatsappUrl/);
assert.match(siteContent, /whatsappContacts\.events/);
assert.match(whatsappButton, /whatsappContacts\.general/);
assert.match(footer, /bookingVenues\.hawaii/);
assert.match(footer, /bookingVenues\.muulab/);
assert.match(contactPage, /bookingVenues\.hawaii/);
assert.match(contactPage, /bookingVenues\.muulab/);
assert.match(menuPage, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(menuPage, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(villagePage, /bookingVenues\.hawaii/);
assert.match(villagePage, /bookingVenues\.muulab/);
assert.doesNotMatch(propagatedBookingSources, /393755175508|375 5175508/);
assert.doesNotMatch(propagatedBookingSources, /https:\/\/widget\.spiagge\.it/i);
assert.doesNotMatch(propagatedBookingSources, /sportclubby/i);

assert.match(
  siteContent,
  /"ristorante-mare":\s*{[\s\S]*?bookingVenueId:\s*"hawaii"[\s\S]*?schemaType:\s*"Restaurant"/,
  "Ristorante Mare must declare Hawaii as its booking venue",
);
assert.match(
  siteContent,
  /"terrazza":\s*{[\s\S]*?bookingVenueId:\s*"muulab"[\s\S]*?schemaType:\s*"Restaurant"/,
  "The terrace must declare MUULab as its booking venue",
);
assert.match(seo, /bookingVenues\[page\.bookingVenueId\]/);
assert.doesNotMatch(
  seo,
  /page\.slug\s*===\s*["'](?:ristorante-mare|terrazza)["'][\s\S]{0,240}(?:telephone|potentialAction|ReserveAction)/,
  "Restaurant booking identity must not be inferred from the page slug",
);
assert.match(seo, /telephone:\s*bookingVenue\.phoneDisplay/);
assert.match(seo, /acceptsReservations:\s*true/);
assert.match(seo, /"@type":\s*"ReserveAction"/);
assert.match(seo, /target:\s*bookingVenue\.internalBookingPath/);

assert.match(sitemap, /route:\s*"\/prenotazioni\/ristorante"/);
assert.match(sitemap, /route:\s*"\/prenotazioni\/muulab"/);
assert.match(
  sitemap,
  /route:\s*"\/prenotazioni\/(?:ristorante|muulab)"[\s\S]{0,120}priority:\s*0\.[0-7]/,
  "Booking routes should have a lower priority than entity landing pages",
);

const retiredContentPatterns = [
  /fritti al cono/i,
  /special panini/i,
  /sandwich/i,
  /hot dog/i,
  /\bbao\b/i,
  /il gioved[iì] in terrazza/i,
  /18:00\s*[—–-]\s*01:00/i,
  /prenota terrazza/i,
  /champagne e crudi/i,
  /musica dal vivo/i,
];
for (const pattern of retiredContentPatterns) {
  assert.doesNotMatch(
    productionSources,
    pattern,
    `Retired content must not remain in production sources: ${pattern}`,
  );
}

const villageSouls = [
  ...villagePage.matchAll(/^\s{4}label: "(Beach|Restaurant|Sport|MUULab|Nightlife)",$/gm),
].map((match) => match[1]);
assert.deepEqual(
  villageSouls,
  ["Beach", "Restaurant", "Sport", "MUULab", "Nightlife"],
  "Village souls must expose MUULab before Nightlife",
);
assert.match(
  villagePage,
  /label: "MUULab"[\s\S]{0,260}href: "\/terrazza"/,
  "The MUULab village soul must lead to /terrazza",
);
assert.match(villagePage, /Le cinque anime/);
assert.match(villagePage, /cinque modi di viverlo/);
assert.match(villagePage, /pesce a pranzo e a cena/i);
assert.match(
  villagePage,
  /item\.label === "Nightlife"\s*\?\s*"sm:col-span-2"/,
  "Only the Nightlife card should span the full village grid",
);

const menuHighlightBlock =
  siteContent.match(/export const menuHighlights = \[([\s\S]*?)\n\];/)?.[1] || "";
for (const [title, href] of [
  ["Ristorante Mare", "#ristorante-mare"],
  ["MUULab Riviera", "#muulab"],
  ["Cocktail", "#cocktail"],
  ["Carta vini", "#carta-vini"],
]) {
  assert.match(
    menuHighlightBlock,
    new RegExp(`title: "${title}"[\\s\\S]{0,180}href: "${href}"`),
    `${title} must map to ${href}`,
  );
}
assert.match(
  menuPage,
  /<Link[\s\S]{0,180}data-testid="menu-highlight-link"[\s\S]{0,180}href=\{item\.href\}/,
  "Every menu highlight must be a native anchor link",
);
assert.match(menuPage, /menu-highlight-link[\s\S]{0,360}focus-visible:outline/);
assert.match(siteContent, /title: "Cocktail e aperitivo"[\s\S]{0,100}anchor: "cocktail"/);
assert.match(
  menuPage,
  /id=\{category\.anchor\}[\s\S]{0,200}scroll-mt-/,
  "Menu category anchors must reserve room below the sticky header",
);
assert.match(menuPage, /<section id=\{id\} className="scroll-mt-/);
assert.match(menuPage, /id="carta-vini"/);
assert.match(menuPage, /id="carta-vini-muulab"/);
assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior: auto/);
assert.match(
  siteContent,
  /title: "Bevande, birre e cantina"[\s\S]{0,320}action: \{ label: "Carta dei vini", href: "#carta-vini" \}/,
);
assert.doesNotMatch(
  siteContent,
  /Gli sfizi, prima della pizza|La pizza si accende la sera|Crocchetta speck e tartufo/,
  "Retired Hawaii pizza starters must not be published",
);
assert.doesNotMatch(
  villagePage,
  /\bgli sfizi\b/i,
  "The village page must not advertise retired pizza starters",
);
assert.match(
  muulabWines,
  /export const muulabWineSections/,
  "MUULab wines must live in a dedicated structured data module",
);
for (const section of [
  "Coravin al calice",
  "Bollicine",
  "Vini rossi italiani",
  "Francia",
  "Vini rosati",
  "Vini bianchi",
]) {
  assert.match(muulabWines, new RegExp(`title: "${section}"`));
}
assert.match(
  menuPage,
  /menu\.id === "ristorante-mare"[\s\S]*?id="carta-vini"[\s\S]*?menu\.id === "muulab"[\s\S]*?id="carta-vini-muulab"/,
  "Each restaurant menu must be followed by its own wine list",
);
assert.match(
  menuPage,
  /data-testid="wine-list-link"[\s\S]{0,180}href=\{category\.action\.href\}/,
);
assert.match(
  siteContent,
  /label: "Menu MUULab completo"[\s\S]{0,180}href: "https:\/\/www\.muulab\.it\/wp-content\/uploads\/easy-pdf-restaurant-menu\/menu-files\/muulab\.-menu-general\.pdf"/,
);
assert.match(
  menuPage,
  /menu\.documentAction[\s\S]{0,520}target="_blank"[\s\S]{0,120}rel="noopener noreferrer"/,
  "The official MUULab PDF must open in an isolated tab",
);

const approvedHawaiiWines = hawaiiWineList
  .split("\n")
  .filter((line) => line.startsWith("- "))
  .map((line) => {
    const match = line.match(/^- (.+) - EUR (\d+)$/);
    assert.ok(match, `Invalid deterministic Hawaii wine row: ${line}`);
    return { name: match[1], price: match[2] };
  });
const publishedWineBlock =
  siteContent.match(
    /export const hawaiiWineSections[\s\S]*?\n\];\n\nexport const venueMenus/,
  )?.[0] || "";
const publishedHawaiiWines = [
  ...publishedWineBlock.matchAll(/\{ name: "([^"]+)", price: "€ (\d+)" \}/g),
].map((match) => ({ name: match[1], price: match[2] }));
assert.deepEqual(
  publishedHawaiiWines,
  approvedHawaiiWines,
  "The Hawaii wine section must exactly match the deterministic editorial source",
);

assert.match(siteContent, /title: "Giovedì Posh"/);
assert.match(
  siteContent,
  /title: "Giovedì Posh"[\s\S]{0,160}timing: "Giovedì"(?![\s\S]{0,80}\d{1,2}:\d{2})/,
  "Giovedì Posh must not publish a time",
);
assert.match(
  siteContent,
  /La serata del giovedì negli spazi esterni di Hawaii, con dj set e tavoli sotto le stelle\. In caso di pioggia, Posh si sposta in veranda\./,
);
assert.match(
  siteContent,
  /title: "Giovedì Posh"[\s\S]{0,620}href: whatsappContacts\.events/,
  "Giovedì Posh must use the contextual events WhatsApp CTA",
);
assert.match(eventPage, /eventFormats/);

const privacyDisclosure = siteContent.match(
  /privacy:\s*\[([\s\S]*?)\n\s*\],\n\s*cookie:/,
)?.[1] || "";
const cookieDisclosure = siteContent.match(
  /cookie:\s*\[([\s\S]*?)\n\s*\],\n};/,
)?.[1] || "";

for (const [policy, disclosure] of [
  ["privacy", privacyDisclosure],
  ["cookie", cookieDisclosure],
]) {
  assert.match(disclosure, /TheFork/i, `${policy} must identify TheFork`);
  assert.doesNotMatch(
    disclosure,
    /consenso specifico/i,
    `${policy} must not claim that TheFork has a separate consent control`,
  );
  assert.match(
    disclosure,
    /consenso generale|scelta generale/i,
    `${policy} must explain that TheFork follows the global consent choice`,
  );
  assert.match(
    disclosure,
    /connessione di rete|trasferimento di rete/i,
    `${policy} must disclose the third-party network transfer`,
  );
  assert.match(
    disclosure,
    /prima (?:che|di) (?:l['’]utente )?inseri/i,
    `${policy} must disclose that transfer precedes booking data entry`,
  );
}

console.log("web static regression checks passed");
