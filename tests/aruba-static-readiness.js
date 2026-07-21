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
requireFile("prenotazioni/index.html");
requireFile("media/hawaii/journey-desktop.mp4");
requireFile("media/hawaii/journey-mobile.mp4");
requireFile(".htaccess");

const text = collectTextFiles(root)
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

assert.doesNotMatch(text, /["'(]\/hawaii\//, "Aruba root export must not retain the Pages base path");
assert.match(text, /\/media\/hawaii\/journey-desktop\.mp4/);
assert.match(text, /\/media\/hawaii\/journey-mobile\.mp4/);

console.log("aruba static readiness checks passed");
