"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.cwd(), process.argv[2] || "output/aruba-static");

function requireFile(relativePath) {
  const filePath = path.join(root, relativePath);
  assert.ok(fs.existsSync(filePath), `Missing Aruba artifact: ${relativePath}`);
  assert.ok(fs.statSync(filePath).isFile(), `Aruba artifact is not a file: ${relativePath}`);
  return filePath;
}

function collectTextFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(entryPath);
    return /\.(?:css|html|js|txt)$/.test(entry.name) ? [entryPath] : [];
  });
}

requireFile("index.html");
requireFile("404.html");
const releaseFile = requireFile("RELEASE.txt");
requireFile("prenotazioni/index.html");
requireFile("media/hawaii/journey-desktop.mp4");
requireFile("media/hawaii/journey-mobile.mp4");
requireFile("media/hawaii/journey-desktop-reverse.mp4");
requireFile("media/hawaii/journey-mobile-reverse.mp4");
requireFile(".htaccess");

const release = fs.readFileSync(releaseFile, "utf8");
assert.match(release, /^commit=[0-9a-f]{40}$/m, "Aruba release must record its git commit");
assert.match(
  release,
  /^built_at_utc=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/m,
  "Aruba release must record a complete UTC build time",
);
assert.match(release, /^base_path=root$/m, "Aruba release must declare a root-domain build");
assert.match(
  release,
  /^worktree=(?:clean|dirty)$/m,
  "Aruba release must declare whether the source worktree was clean",
);

const text = collectTextFiles(root)
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

assert.doesNotMatch(text, /["'(]\/hawaii\//, "Aruba root export must not retain the Pages base path");
assert.match(text, /\/media\/hawaii\/journey-desktop\.mp4/);
assert.match(text, /\/media\/hawaii\/journey-mobile\.mp4/);
assert.match(text, /\/media\/hawaii\/journey-desktop-reverse\.mp4/);
assert.match(text, /\/media\/hawaii\/journey-mobile-reverse\.mp4/);

console.log("aruba static readiness checks passed");
