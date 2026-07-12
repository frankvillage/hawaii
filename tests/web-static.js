"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const layoutPath = path.join(root, "web", "src", "app", "layout.tsx");
const stagePath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "scroll-video-stage.tsx",
);

const layout = fs.readFileSync(layoutPath, "utf8");
const stage = fs.readFileSync(stagePath, "utf8");

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
  /preload="metadata"/,
  "The journey video should avoid full eager video preload on first paint",
);

console.log("web static regression checks passed");
