"use strict";

const assert = require("node:assert/strict");
const { devices, webkit } = require("@playwright/test");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";

async function main() {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  try {
    await page.addInitScript(() => {
      const nativePlay = HTMLMediaElement.prototype.play;
      let pointerGestureActive = false;
      let outsideGestureRejections = 0;

      window.addEventListener(
        "pointerdown",
        () => {
          pointerGestureActive = true;
          queueMicrotask(() => {
            pointerGestureActive = false;
          });
        },
        { capture: true },
      );

      HTMLMediaElement.prototype.play = function gestureBoundPlay() {
        if (this.paused && !pointerGestureActive) {
          outsideGestureRejections += 1;
          return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
        }
        return nativePlay.call(this);
      };

      window.__outsideGesturePlayRejections = () => outsideGestureRejections;
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });

    const stage = page.locator('[data-testid="scroll-video-stage"]');
    await stage.dispatchEvent("pointerdown", {
      bubbles: true,
      buttons: 1,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const journey = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
      const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
      window.scrollTo({ top: journeyTop + scrollable * 0.04, behavior: "auto" });
    });
    await stage.dispatchEvent("pointerup", {
      bubbles: true,
      buttons: 0,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });

    const samples = [];
    for (let index = 0; index < 10; index += 1) {
      await page.waitForTimeout(120);
      samples.push(
        await page.locator('[data-testid="journey-video"]').evaluate((video) =>
          Number(video.currentTime),
        ),
      );
    }

    const state = await page.evaluate(() => ({
      mediaMode: document.querySelector('[data-testid="hero-stage"]')?.dataset.mediaMode,
      mediaState: document.querySelector('[data-testid="hero-stage"]')?.dataset.mediaState,
      outsideGestureRejections: window.__outsideGesturePlayRejections?.() ?? 0,
    }));
    const deltas = samples.slice(1).map((time, index) => time - samples[index]);

    assert.equal(state.mediaMode, "video", `iPhone must keep the MP4 active: ${JSON.stringify(state)}`);
    assert.equal(
      state.outsideGestureRejections,
      0,
      `iPhone playback must start inside pointerdown: ${JSON.stringify(state)}`,
    );
    assert.notEqual(
      state.mediaState,
      "waiting-for-gesture",
      `iPhone must not stall after the first swipe: ${JSON.stringify(state)}`,
    );
    assert.ok(
      samples.at(-1) > samples[0] + 0.3,
      `iPhone swipe must present moving video frames: ${samples.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta >= -0.05 && delta < 0.35),
      `iPhone playback must remain continuous without timeline jumps: ${samples.join(", ")}`,
    );

    console.log(`webkit iPhone touch playback passed ${JSON.stringify({ samples, state })}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
