const assert = require("node:assert/strict");
const { devices, webkit } = require("@playwright/test");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH;

async function videoState(page) {
  return page.locator('[data-testid="journey-video"]').evaluate((video) => ({
    currentTime: video.currentTime,
    paused: video.paused,
    playbackRate: video.playbackRate,
  }));
}

async function waitForSettledScene(page, sceneId, timeout = 9000) {
  try {
    await page.waitForFunction(
      (expectedScene) => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        const video = document.querySelector('[data-testid="journey-video"]');
        return (
          stage?.dataset.confirmedSceneId === expectedScene &&
          stage.dataset.playbackState === "settled" &&
          video?.paused === true &&
          Math.abs(video.currentTime - Number(stage.dataset.targetTime)) <= 0.16
        );
      },
      sceneId,
      { timeout },
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      const video = document.querySelector('[data-testid="journey-video"]');
      return {
        stage: stage instanceof HTMLElement ? { ...stage.dataset } : null,
        video: video instanceof HTMLVideoElement
          ? {
              currentTime: video.currentTime,
              duration: video.duration,
              paused: video.paused,
              readyState: video.readyState,
              networkState: video.networkState,
              error: video.error?.code ?? null,
            }
          : null,
      };
    });
    console.error(`Journey diagnostic: ${JSON.stringify(diagnostic)}`);
    throw error;
  }
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
    const video = page.locator('[data-testid="journey-video"]');
    await video.waitFor({ state: "visible" });
    assert.equal(
      await page.locator('[data-testid="hero-stage"]').getAttribute("data-media-mode"),
      "video",
      "Healthy WebKit playback must expose video mode",
    );
    assert.equal(
      await page.locator('[data-testid="journey-canvas"]').count(),
      0,
      "Healthy WebKit playback must use the real MP4",
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

    await waitForSettledScene(page, "arrivo");
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: "auto" }));
    await page.waitForFunction(
      () => document.querySelector('[data-testid="journey-video"]')?.paused === false,
      undefined,
      { timeout: 2500 },
    );
    const moving = await videoState(page);
    assert.ok(
      moving.playbackRate <= 1.25,
      `Mobile playback rate must stay decoder-safe, received ${moving.playbackRate}`,
    );
    const samples = [moving.currentTime];
    for (let index = 0; index < 3; index += 1) {
      await page.waitForTimeout(140);
      samples.push((await videoState(page)).currentTime);
    }
    assert.ok(
      samples.every((sample, index) => index === 0 || sample > samples[index - 1]),
      `WebKit MP4 time must increase monotonically: ${samples.join(", ")}`,
    );
    await waitForSettledScene(page, "bar");

    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 2, behavior: "auto" });
      window.setTimeout(
        () => window.scrollTo({ top: window.innerHeight * 4, behavior: "auto" }),
        50,
      );
    });
    await page.waitForTimeout(180);
    assert.equal(
      await page.locator('[data-testid="hero-stage"]').getAttribute("data-confirmed-scene-id"),
      "bar",
      "Momentum scroll must queue the latest destination without replacing the active segment",
    );
    assert.equal(
      (await page.locator('[data-testid="scene-eyebrow"]').textContent())?.trim(),
      "Cocktail bar",
      "Copy must remain on the confirmed scene while a destination is queued",
    );
    assert.equal(
      await page.locator('[data-soul-link][aria-current="location"]').getAttribute("href"),
      "#bar",
      "Soul Rail selection must remain on the confirmed scene while moving",
    );

    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 5, behavior: "auto" }));
    await page.waitForFunction(
      () => document.querySelector('[data-testid="journey-video"]')?.paused === false,
      undefined,
      { timeout: 9000 },
    );
    await page.locator('[data-testid="journey-video"]').evaluate((node) => node.pause());
    await page.waitForFunction(
      () => document.querySelector('[data-testid="journey-video"]')?.paused === false,
      undefined,
      { timeout: 2500 },
    );
    const recovered = await videoState(page);
    assert.equal(
      recovered.paused,
      false,
      "A system-imposed pause before the checkpoint must retry playback",
    );

    console.log("webkit mobile journey playback checks passed");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
