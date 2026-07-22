const assert = require("node:assert/strict");
const { devices, webkit } = require("@playwright/test");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH;

async function videoState(page) {
  return page.locator('[data-testid="journey-video"]').evaluate((video) => ({
    currentTime: Number(video.currentTime),
    duration: Number(video.duration),
    paused: video.paused,
    playbackRate: Number(video.playbackRate),
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

    const mobileCompositing = await page.evaluate(() => {
      const journeyVideo = document.querySelector('[data-testid="journey-video"]');
      const soulRail = document.querySelector('[data-testid="soul-rail"] nav');
      const videoStyle = getComputedStyle(journeyVideo);
      const railStyle = getComputedStyle(soulRail);

      return {
        videoTransform: videoStyle.transform,
        videoTransition: videoStyle.transitionDuration,
        videoWillChange: videoStyle.willChange,
        railBackdropFilter: railStyle.backdropFilter,
      };
    });
    assert.equal(mobileCompositing.videoTransform, "none");
    assert.equal(mobileCompositing.videoTransition, "0s");
    assert.equal(mobileCompositing.videoWillChange, "auto");
    assert.equal(mobileCompositing.railBackdropFilter, "none");

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

      const video = document.querySelector('[data-testid="journey-video"]');
      window.__journeyDecodedFrames = 0;
      window.__journeyHasVideoFrameCallback = Boolean(video?.requestVideoFrameCallback);
      window.__journeyPlayEvents = 0;
      window.__journeyPauseEvents = 0;
      video?.addEventListener("play", () => {
        window.__journeyPlayEvents += 1;
      });
      video?.addEventListener("pause", () => {
        window.__journeyPauseEvents += 1;
      });
      const countFrame = () => {
        window.__journeyDecodedFrames += 1;
        video?.requestVideoFrameCallback?.(countFrame);
      };
      video?.requestVideoFrameCallback?.(countFrame);
    });

    const initial = await videoState(page);
    const swipeProgress = 0.03;
    const samples = [];
    const frameSamples = [];
    for (let index = 0; index < 4; index += 1) {
      await page.evaluate((progress) => {
        const journey = document.querySelector('[data-testid="hero-stage"]');
        const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
        const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
        window.scrollTo({ top: journeyTop + scrollable * progress, behavior: "auto" });
      }, swipeProgress * (index + 1));
      if (index === 0) {
        await page.waitForFunction(() => {
          const journeyVideo = document.querySelector('[data-testid="journey-video"]');
          return journeyVideo && !journeyVideo.paused;
        });
        for (let frameIndex = 0; frameIndex < 6; frameIndex += 1) {
          await page.waitForTimeout(120);
          frameSamples.push(await videoState(page));
        }
        await page.waitForTimeout(480);
      } else {
        await page.waitForTimeout(1200);
      }
      samples.push(await videoState(page));
    }

    const times = [initial.currentTime, ...samples.map(({ currentTime }) => currentTime)];
    const deltas = times.slice(1).map((time, index) => time - times[index]);
    const targetProgress = swipeProgress * samples.length;
    const targetTime = initial.duration * targetProgress;
    const firstTargetTime = initial.duration * swipeProgress;
    const frameTimes = frameSamples.map(({ currentTime }) => currentTime);
    const frameDeltas = frameTimes
      .slice(1)
      .map((time, index) => time - frameTimes[index]);
    assert.ok(
      times.at(-1) > initial.currentTime + 0.1,
      `WebKit MP4 time must advance with document scroll: ${times.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta >= -0.05),
      `WebKit MP4 time must progress monotonically: ${times.join(", ")}`,
    );
    assert.ok(
      deltas.every((delta) => delta < 1.6),
      `WebKit MP4 time must advance through decoded playback instead of jumping: ${times.join(", ")}`,
    );
    assert.ok(
      samples[0].currentTime < firstTargetTime - 0.1,
      `The first swipe must play toward ${firstTargetTime.toFixed(2)}s instead of jumping: ${times.join(", ")}`,
    );
    assert.ok(
      frameTimes.at(-1) > frameTimes[0] + 0.4 &&
        frameDeltas.every((delta) => delta >= -0.05 && delta < 0.35),
      `One swipe must present continuous intermediate frames: ${frameTimes.join(", ")}`,
    );
    assert.ok(
      samples.every(({ paused }) => !paused),
      `Consecutive mobile swipes must remain one continuous playback: ${JSON.stringify(samples)}`,
    );
    assert.ok(
      samples.every(({ playbackRate }) => Math.abs(playbackRate - 1) < 0.01),
      `Mobile playback must stay at native 1x decode speed: ${JSON.stringify(samples)}`,
    );
    const decodedFrameState = await page.evaluate(() => ({
      supported: window.__journeyHasVideoFrameCallback,
      count: window.__journeyDecodedFrames,
      playEvents: window.__journeyPlayEvents,
      pauseEvents: window.__journeyPauseEvents,
    }));
    assert.equal(
      decodedFrameState.playEvents,
      1,
      `The four swipes must produce one play session: ${JSON.stringify(decodedFrameState)}`,
    );
    assert.equal(
      decodedFrameState.pauseEvents,
      0,
      `The player must not pause at intermediate swipe targets: ${JSON.stringify(decodedFrameState)}`,
    );
    if (decodedFrameState.supported) {
      assert.ok(
        decodedFrameState.count >= 3,
        `WebKit must present decoded frames during forward playback: ${JSON.stringify(decodedFrameState)}`,
      );
    }
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
          Math.abs(journeyVideo.currentTime - Number(journeyStage.dataset.targetTime)) <= 0.13
        );
      },
      undefined,
      { timeout: 8000 },
    );

    const retryPage = await context.newPage();
    await retryPage.addInitScript(() => {
      const nativePlay = HTMLMediaElement.prototype.play;
      let rejected = false;
      HTMLMediaElement.prototype.play = function patchedPlay() {
        if (!rejected) {
          rejected = true;
          return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
        }
        return nativePlay.call(this);
      };
    });
    await retryPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await retryPage.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });
    await retryPage.evaluate(() => {
      const journey = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
      const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
      window.scrollTo({ top: journeyTop + scrollable * 0.08, behavior: "auto" });
    });
    await retryPage.waitForFunction(
      () =>
        document.querySelector('[data-testid="hero-stage"]')?.dataset.playbackState ===
        "waiting-for-gesture",
      undefined,
      { timeout: 3000 },
    );
    assert.equal(
      await retryPage.locator('[data-testid="hero-stage"]').getAttribute("data-media-mode"),
      "video",
      "A first play rejection must keep the MP4 ready for a gesture retry",
    );
    await retryPage.locator('[data-testid="scroll-video-stage"]').tap({
      position: { x: 24, y: 180 },
    });
    await retryPage.waitForFunction(
      () => {
        const video = document.querySelector('[data-testid="journey-video"]');
        return video && !video.paused && video.currentTime > 0.05;
      },
      undefined,
      { timeout: 4000 },
    );
    await retryPage.close();

    const gesturePage = await context.newPage();
    await gesturePage.addInitScript(() => {
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
    await gesturePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await gesturePage.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });
    const gestureStage = gesturePage.locator('[data-testid="scroll-video-stage"]');
    await gestureStage.dispatchEvent("pointerdown", {
      bubbles: true,
      buttons: 1,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    await gesturePage.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const journey = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
      const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
      window.scrollTo({ top: journeyTop + scrollable * 0.04, behavior: "auto" });
    });
    await gestureStage.dispatchEvent("pointerup", {
      bubbles: true,
      buttons: 0,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    await gesturePage.waitForTimeout(1200);
    const gesturePlayback = await gesturePage.evaluate(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      const stage = document.querySelector('[data-testid="hero-stage"]');
      return {
        currentTime: Number(video?.currentTime),
        mediaState: stage?.dataset.mediaState,
        outsideGestureRejections: window.__outsideGesturePlayRejections?.() ?? 0,
      };
    });
    assert.ok(
      gesturePlayback.currentTime > 0.2 && gesturePlayback.outsideGestureRejections === 0,
      `An iPhone swipe must prime playback inside pointerdown: ${JSON.stringify(gesturePlayback)}`,
    );
    await gesturePage.close();

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
