const assert = require("node:assert/strict");
const { devices, webkit } = require("@playwright/test");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH;

async function videoState(page) {
  return page.locator('[data-testid="journey-video"]').evaluate((video) => ({
    currentTime: Number(video.currentTime),
    duration: Number(video.duration),
    paused: video.paused,
  }));
}

async function main() {
  const browser = await webkit.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const stage = page.locator('[data-testid="hero-stage"]');
    const video = page.locator('[data-testid="journey-video"]');
    await video.waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const journeyVideo = document.querySelector('[data-testid="journey-video"]');
      return journeyVideo && Number.isFinite(journeyVideo.duration) && journeyVideo.duration > 0;
    });

    assert.equal(
      await stage.getAttribute("data-media-mode"),
      "video",
      "Healthy WebKit playback must expose video mode",
    );
    assert.equal(
      await page.locator('[data-testid="journey-canvas"]').count(),
      0,
      "Healthy WebKit playback must use the real MP4",
    );
    assert.equal(
      await stage.locator('[data-testid="scroll-video-stage"] img').count(),
      0,
      "Healthy video mode must not render a cover still over the MP4",
    );

    const mobileHotspotState = await page.locator(".journey-marker").evaluateAll((markers) => ({
      viewportWidth: window.innerWidth,
      displays: markers.map((marker) => getComputedStyle(marker).display),
    }));
    assert.equal(
      mobileHotspotState.displays.filter((display) => display !== "none").length,
      0,
      `Mobile must not expose visible journey hotspots: ${JSON.stringify(mobileHotspotState)}`,
    );

    const snapState = await page.evaluate(() => ({
      hasSnapClass: document.documentElement.classList.contains("journey-snap-root"),
      rootSnapType: getComputedStyle(document.documentElement).scrollSnapType,
      chapterSnapStops: [...document.querySelectorAll("[data-chapter]")].map(
        (chapter) => getComputedStyle(chapter).scrollSnapStop,
      ),
    }));
    assert.equal(snapState.hasSnapClass, false, "The journey must not enable a snap root");
    assert.ok(
      !snapState.rootSnapType.includes("mandatory"),
      `The journey must not use mandatory scroll snap: ${JSON.stringify(snapState)}`,
    );
    assert.equal(
      snapState.chapterSnapStops.filter((value) => value === "always").length,
      0,
      `Journey scene spacers must not force snap stops: ${JSON.stringify(snapState)}`,
    );

    await page.evaluate(() => {
      const mediaStage = document.querySelector('[data-testid="scroll-video-stage"]');
      window.__journeyCoverImagesSeen = mediaStage?.querySelectorAll("img").length ?? 0;
      window.__journeyCoverObserver = new MutationObserver(() => {
        window.__journeyCoverImagesSeen = Math.max(
          window.__journeyCoverImagesSeen,
          mediaStage?.querySelectorAll("img").length ?? 0,
        );
      });
      if (mediaStage) {
        window.__journeyCoverObserver.observe(mediaStage, { childList: true, subtree: true });
      }
    });

    const initial = await videoState(page);
    const targetProgress = 0.35;
    await page.evaluate((progress) => {
      const journey = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
      const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
      window.scrollTo({ top: journeyTop + scrollable * progress, behavior: "auto" });
    }, targetProgress);

    const samples = [];
    for (let index = 0; index < 7; index += 1) {
      await page.waitForTimeout(140);
      samples.push(await videoState(page));
    }

    const times = [initial.currentTime, ...samples.map(({ currentTime }) => currentTime)];
    const deltas = times.slice(1).map((time, index) => time - times[index]);
    const targetTime = initial.duration * targetProgress;
    assert.ok(
      times.at(-1) > initial.currentTime + 0.1,
      `WebKit MP4 time must advance with document scroll: ${times.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta >= -0.05),
      `WebKit MP4 time must progress monotonically: ${times.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta < 1.5),
      `WebKit MP4 time must move in bounded steps instead of jumping: ${times.join(", ")}`,
    );
    assert.ok(
      samples[0].currentTime < targetTime - 1,
      `The first WebKit scrub step must not jump directly to ${targetTime.toFixed(2)}s: ${times.join(", ")}`,
    );
    assert.ok(
      samples.every(({ paused }) => paused),
      `Continuous scrubbing must seek the paused video without autonomous playback: ${JSON.stringify(samples)}`,
    );
    assert.equal(
      await page.evaluate(() => {
        window.__journeyCoverObserver?.disconnect();
        return window.__journeyCoverImagesSeen;
      }),
      0,
      "WebKit scrubbing must not add a destination cover still",
    );
    await page.waitForFunction(
      () => {
        const journeyStage = document.querySelector('[data-testid="hero-stage"]');
        const journeyVideo = document.querySelector('[data-testid="journey-video"]');
        return (
          journeyStage?.dataset.playbackState === "settled" &&
          journeyVideo?.seeking === false &&
          Math.abs(journeyVideo.currentTime - Number(journeyStage.dataset.targetTime)) <= 0.08
        );
      },
      undefined,
      { timeout: 12000 },
    );

    console.log("webkit mobile continuous journey checks passed");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
