"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });

    assert.equal(
      await page.locator('[data-testid="hero-stage"]').getAttribute("data-media-mode"),
      "video",
      "Desktop must keep the real MP4 active",
    );

    await page.evaluate(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      window.__desktopPresentedFrames = 0;
      window.__desktopHasFrameCallback = Boolean(video?.requestVideoFrameCallback);
      const countFrame = () => {
        window.__desktopPresentedFrames += 1;
        video?.requestVideoFrameCallback?.(countFrame);
      };
      video?.requestVideoFrameCallback?.(countFrame);
    });

    await page.evaluate(() => {
      const journey = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
      const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
      window.scrollTo({ top: journeyTop + scrollable * 0.15, behavior: "auto" });
    });
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && !video.paused;
    });

    const samples = [];
    for (let index = 0; index < 20; index += 1) {
      await page.waitForTimeout(100);
      samples.push(
        await page.locator('[data-testid="journey-video"]').evaluate((video) => ({
          currentTime: Number(video.currentTime),
          paused: video.paused,
          playbackRate: Number(video.playbackRate),
        })),
      );
    }

    const times = samples.map(({ currentTime }) => currentTime);
    const deltas = times.slice(1).map((time, index) => time - times[index]);
    const advancingSamples = deltas.filter((delta) => delta > 0.01);
    assert.ok(
      advancingSamples.length >= 14,
      `Desktop playback must present continuous progress: ${times.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta >= -0.05 && delta < 0.5),
      `Desktop playback must remain monotonic without timeline jumps: ${times.join(", ")}`,
    );
    assert.ok(
      samples.every(({ playbackRate }) => playbackRate >= 1 && playbackRate <= 3),
      `Desktop playback rate must remain decoder-safe: ${JSON.stringify(samples)}`,
    );

    const quality = await page.locator('[data-testid="journey-video"]').evaluate((video) => {
      const playbackQuality = video.getVideoPlaybackQuality?.();
      return {
        callbackSupported: window.__desktopHasFrameCallback,
        presentedFrames: window.__desktopPresentedFrames,
        totalFrames: playbackQuality?.totalVideoFrames ?? 0,
        droppedFrames: playbackQuality?.droppedVideoFrames ?? 0,
      };
    });
    if (quality.callbackSupported) {
      assert.ok(
        quality.presentedFrames >= 14,
        `Desktop must present decoded frames continuously: ${JSON.stringify(quality)}`,
      );
    }
    if (quality.totalFrames >= 10) {
      assert.ok(
        quality.droppedFrames / quality.totalFrames <= 0.2,
        `Desktop dropped-frame ratio is too high: ${JSON.stringify(quality)}`,
      );
    }

    console.log(
      `desktop continuous journey checks passed ${JSON.stringify({
        presentedFrames: quality.presentedFrames,
        totalFrames: quality.totalFrames,
        droppedFrames: quality.droppedFrames,
      })}`,
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
