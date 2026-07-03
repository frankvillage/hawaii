"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const htmlPath = path.join(root, "prototype", "index.html");
const jsPath = path.join(root, "prototype", "app.js");
const cssPath = path.join(root, "prototype", "styles.css");

const html = fs.readFileSync(htmlPath, "utf8");
const js = fs.readFileSync(jsPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

assert.match(html, /chapterContainer/, "The prototype should include a chapter container");
assert.match(html, /chapter-progress/, "The prototype should include chapter progress UI");
assert.match(js, /chapter-focus-stack/, "Expected integrated focus overlays in chapter rendering");

["facciata", "cucina", "bar", "spiaggia", "terrazza"].forEach((scene) => {
  assert.match(js, new RegExp(scene), `Expected chapter "${scene}" in app.js`);
});

assert.match(js, /updateChapterProgress/, "Expected scroll sync logic in the prototype");
assert.match(js, /chapter-shell/, "Expected chapter-based sticky rendering in app.js");
assert.match(css, /chapter-shell/, "Expected chapter shell styling");
assert.match(css, /chapter-focus-stack/, "Expected focus stack styling");
assert.doesNotMatch(html, /immersiveToggle/, "The prototype should not include an immersive mode toggle");
assert.doesNotMatch(js, /Modalita immersiva/, "The prototype should not include immersive mode copy");
assert.doesNotMatch(html, /Creative direction/, "The prototype should avoid technical design labels in visible copy");
assert.doesNotMatch(html, /Concept/, "The prototype should avoid concept framing in navigation");
assert.doesNotMatch(js, /Pattern Apple-style/, "The prototype should avoid internal design explanations in visible copy");

console.log("prototype smoke test passed");
