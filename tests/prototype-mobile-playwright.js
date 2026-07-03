"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium, devices } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ...devices["iPhone 13"] });
  const fileUrl = pathToFileURL(path.join(process.cwd(), "prototype", "index.html")).href;

  try {
    await page.goto(fileUrl, { waitUntil: "load" });

    const before = await page.evaluate(() => ({
      stickyPosition: getComputedStyle(document.querySelector(".chapter-sticky")).position,
      focusPosition: getComputedStyle(document.querySelector(".chapter-focus-stack")).position,
      calloutOpacity: Number.parseFloat(getComputedStyle(document.querySelector(".chapter-callout")).opacity),
      progress: Number.parseFloat(
        getComputedStyle(document.querySelector(".chapter-shell")).getPropertyValue("--chapter-progress").trim(),
      ),
    }));

    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      stickyPosition: getComputedStyle(document.querySelector(".chapter-sticky")).position,
      focusPosition: getComputedStyle(document.querySelector(".chapter-focus-stack")).position,
      calloutOpacity: Number.parseFloat(getComputedStyle(document.querySelector(".chapter-callout")).opacity),
      progress: Number.parseFloat(
        getComputedStyle(document.querySelector(".chapter-shell")).getPropertyValue("--chapter-progress").trim(),
      ),
    }));

    assert.equal(before.stickyPosition, "sticky", "Mobile chapters should stay sticky while scrolling");
    assert.equal(before.focusPosition, "absolute", "Mobile focus cards should remain media overlays");
    assert.ok(before.calloutOpacity < 1, "Mobile callouts should not start fully visible");
    assert.equal(after.stickyPosition, "sticky", "Mobile chapters should remain sticky after scrolling");
    assert.equal(after.focusPosition, "absolute", "Mobile focus cards should remain overlays after scrolling");
    assert.ok(after.scrollY > 0, "The page should scroll on mobile");
    assert.ok(after.progress > before.progress, "Chapter progress should advance while scrolling on mobile");
    assert.ok(after.calloutOpacity > before.calloutOpacity, "Callouts should reveal progressively on mobile");

    console.log("prototype mobile Playwright test passed");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
