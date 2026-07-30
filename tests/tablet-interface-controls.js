"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
];

function cssRuleBody(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Missing standalone CSS rule for ${selector}`);
  return match[1];
}

function assertStaticContracts() {
  const css = fs.readFileSync(path.join(root, "web/src/app/globals.css"), "utf8");
  const component = fs.readFileSync(
    path.join(root, "web/src/components/home/scroll-video-stage.tsx"),
    "utf8",
  );
  const videoRule = cssRuleBody(css, ".journey-stage video");
  const posterRule = cssRuleBody(css, ".journey-stage img");

  assert.match(videoRule, /transform:\s*none\s*;/, "Journey videos must never be transformed");
  assert.match(videoRule, /object-fit:\s*cover\s*;/, "Journey videos must use cover crop");
  assert.match(
    videoRule,
    /object-position:\s*center\s*;/,
    "Journey videos must keep a centered crop",
  );
  assert.match(
    videoRule,
    /transition:\s*opacity\b/,
    "Journey video transitions must be limited to opacity",
  );
  assert.doesNotMatch(
    videoRule,
    /will-change:\s*transform/,
    "Journey videos must not reserve a transform compositing layer",
  );
  assert.match(
    posterRule,
    /translate3d\(/,
    "Pointer parallax must remain on the poster/static image",
  );
  assert.match(
    posterRule,
    /scale\(/,
    "Scroll scale must remain on the poster/static image",
  );
  assert.equal(
    component.match(/isInteractiveGestureTarget\(event\.target\)/g)?.length,
    2,
    "Pointer and touch priming must explicitly ignore interactive targets",
  );
  assert.match(
    component,
    /closest\("a,\s*button"\)/,
    "Interactive target detection must include links and buttons",
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*767px\)[\s\S]*?\.journey-marker\s*\{[^}]*display:\s*none\s*;/,
    "Phone journey hotspots must remain hidden",
  );
}

async function installTouchInstrumentation(page) {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play;
    let interactiveGestureTarget = "";
    const interactivePlayCalls = [];
    const controlClicks = [];
    const controlGestures = [];

    const markInteractiveGesture = (event) => {
      const control = event.target instanceof Element
        ? event.target.closest("a, button")
        : null;
      if (!control) return;
      const trackedControl = control.closest(
        '[data-testid="scene-primary-action"], [data-testid="menu-popup-trigger"], [data-soul-link]',
      );
      interactiveGestureTarget =
        control.getAttribute("data-testid") ||
        control.getAttribute("href") ||
        control.getAttribute("aria-label") ||
        control.tagName.toLowerCase();
      if (event.type === "touchstart" && trackedControl) {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        controlGestures.push({
          control:
            trackedControl.getAttribute("data-testid") ||
            trackedControl.getAttribute("href") ||
            trackedControl.tagName.toLowerCase(),
          direction: stage?.dataset.videoDirection,
          state: stage?.dataset.mediaState,
          targetTime: stage?.dataset.targetTime,
        });
      }
      queueMicrotask(() => {
        interactiveGestureTarget = "";
      });
    };

    window.addEventListener("pointerdown", markInteractiveGesture, { capture: true });
    window.addEventListener("touchstart", markInteractiveGesture, { capture: true });

    HTMLMediaElement.prototype.play = function instrumentedPlay() {
      if (interactiveGestureTarget) {
        interactivePlayCalls.push(interactiveGestureTarget);
      }
      return nativePlay.call(this);
    };

    document.addEventListener(
      "click",
      (event) => {
        const control = event.target instanceof Element
          ? event.target.closest(
              '[data-testid="scene-primary-action"], [data-testid="menu-popup-trigger"], [data-soul-link]',
            )
          : null;
        if (!control) return;
        controlClicks.push(
          control.getAttribute("data-testid") ||
            control.getAttribute("href") ||
            control.tagName.toLowerCase(),
        );
        if (control.matches('[data-testid="scene-primary-action"]')) {
          event.preventDefault();
        }
      },
      { capture: true },
    );

    window.__tabletInterfaceTest = {
      controlClicks,
      controlGestures,
      interactivePlayCalls,
    };
  });
}

async function waitForJourney(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const consent = page.getByRole("button", { name: "Accetta", exact: true });
  await consent.waitFor({ state: "visible", timeout: 4_000 });
  await consent.click();
  await page.waitForFunction(
    () => {
      const video = document.querySelector('[data-testid="journey-video"]');
      const stage = document.querySelector('[data-testid="hero-stage"]');
      return (
        stage?.dataset.motionPreferenceResolved === "true" &&
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0
      );
    },
    undefined,
    { timeout: 12_000 },
  );
}

async function setJourneyProgress(page, progress) {
  const previousTarget = await page
    .locator('[data-testid="hero-stage"]')
    .getAttribute("data-target-time");
  await page.evaluate(async (nextProgress) => {
    const journey = document.querySelector('[data-testid="hero-stage"]');
    const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
    const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    try {
      window.scrollTo({
        top: journeyTop + scrollable * nextProgress,
        behavior: "auto",
      });
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    } finally {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    }
  }, progress);

  await page.waitForFunction(
    ({ oldTarget, nextProgress }) => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      return (
        stage?.dataset.targetTime !== oldTarget &&
        Math.abs(Number(stage?.dataset.scrollProgress) - nextProgress) < 0.002
      );
    },
    { oldTarget: previousTarget, nextProgress: progress },
    { timeout: 4_000 },
  );
  return page.locator('[data-testid="hero-stage"]').getAttribute("data-target-time");
}

async function waitForSettled(page, targetTime) {
  try {
    await page.waitForFunction(
      (expectedTarget) => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return (
          stage?.dataset.targetTime === expectedTarget &&
          stage.dataset.mediaState === "settled"
        );
      },
      targetTime,
      { timeout: 20_000 },
    );
  } catch (error) {
    const state = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      const forward = document.querySelector('[data-testid="journey-video"]');
      const reverse = document.querySelector('[data-testid="journey-video-reverse"]');
      return {
        stage: stage ? { ...stage.dataset } : null,
        forwardTime:
          forward instanceof HTMLVideoElement ? forward.currentTime : null,
        reverseTime:
          reverse instanceof HTMLVideoElement ? reverse.currentTime : null,
        reverseState:
          reverse instanceof HTMLVideoElement
            ? {
                currentSrc: reverse.currentSrc,
                error: reverse.error
                  ? { code: reverse.error.code, message: reverse.error.message }
                  : null,
                duration: reverse.duration,
                networkState: reverse.networkState,
                readyState: reverse.readyState,
                seekable:
                  reverse.seekable.length > 0
                    ? {
                        end: reverse.seekable.end(reverse.seekable.length - 1),
                        start: reverse.seekable.start(0),
                      }
                    : null,
              }
            : null,
      };
    });
    throw new Error(
      `Timed out waiting for settled target ${targetTime}: ${JSON.stringify(state)}`,
      { cause: error },
    );
  }
}

async function recoverPlaybackGestureIfNeeded(page) {
  const mediaState = await page.waitForFunction(
    () => {
      const state = document.querySelector('[data-testid="hero-stage"]')?.dataset.mediaState;
      return state === "settled" || state === "waiting-for-gesture" ? state : false;
    },
    undefined,
    { timeout: 4_000 },
  );
  if ((await mediaState.jsonValue()) !== "waiting-for-gesture") return;

  const point = await page.locator('[data-testid="scroll-video-stage"]').evaluate((stage) => {
    const rect = stage.getBoundingClientRect();
    const candidates = [
      [0.95, 0.5],
      [0.05, 0.5],
      [0.5, 0.25],
    ];
    for (const [xRatio, yRatio] of candidates) {
      const x = rect.left + rect.width * xRatio;
      const y = rect.top + rect.height * yRatio;
      const target = document.elementFromPoint(x, y);
      if (target instanceof Element && stage.contains(target) && !target.closest("a, button")) {
        return { x, y };
      }
    }
    return null;
  });
  assert.ok(point, "Gesture recovery requires a non-interactive point inside the journey");
  await page.touchscreen.tap(point.x, point.y);
}

async function prepareMovement(
  page,
  progress,
  direction,
  { recoverGesture = false } = {},
) {
  const targetTime = await setJourneyProgress(page, progress);
  try {
    if (recoverGesture) {
      const mediaState = await page.waitForFunction(
        ({ expectedDirection, expectedTarget }) => {
          const stage = document.querySelector('[data-testid="hero-stage"]');
          if (
            stage?.dataset.targetTime !== expectedTarget ||
            stage.dataset.videoDirection !== expectedDirection
          ) {
            return false;
          }
          const state = stage.dataset.mediaState;
          return state === "moving" || state === "waiting-for-gesture" ? state : false;
        },
        { expectedDirection: direction, expectedTarget: targetTime },
        { timeout: 12_000 },
      );
      if ((await mediaState.jsonValue()) === "waiting-for-gesture") {
        await recoverPlaybackGestureIfNeeded(page);
      }
    }

    await page.waitForFunction(
      ({ expectedDirection, expectedTarget }) => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return (
          stage?.dataset.targetTime === expectedTarget &&
          stage.dataset.mediaState === "moving" &&
          stage.dataset.videoDirection === expectedDirection
        );
      },
      { expectedDirection: direction, expectedTarget: targetTime },
      { timeout: 12_000 },
    );
  } catch (error) {
    const state = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      const forward = document.querySelector('[data-testid="journey-video"]');
      const reverse = document.querySelector('[data-testid="journey-video-reverse"]');
      return {
        stage: stage ? { ...stage.dataset } : null,
        forwardTime:
          forward instanceof HTMLVideoElement ? forward.currentTime : null,
        reverseTime:
          reverse instanceof HTMLVideoElement ? reverse.currentTime : null,
        reverseState:
          reverse instanceof HTMLVideoElement
            ? {
                currentSrc: reverse.currentSrc,
                error: reverse.error
                  ? { code: reverse.error.code, message: reverse.error.message }
                  : null,
                duration: reverse.duration,
                networkState: reverse.networkState,
                readyState: reverse.readyState,
                seekable:
                  reverse.seekable.length > 0
                    ? {
                        end: reverse.seekable.end(reverse.seekable.length - 1),
                        start: reverse.seekable.start(0),
                      }
                    : null,
              }
            : null,
      };
    });
    throw new Error(
      `Timed out preparing ${direction} movement to ${targetTime}: ${JSON.stringify(state)}`,
      { cause: error },
    );
  }
}

async function assertJourneyFooterRoundTrip(page, label) {
  const expectedProgress = 0.62;
  const footer = page.locator("footer").first();
  if ((await footer.count()) === 0) {
    throw new Error(`${label}: journey footer is missing`);
  }

  await footer.evaluate((element) => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    try {
      element.scrollIntoView({ behavior: "auto", block: "start" });
    } finally {
      root.style.scrollBehavior = previousScrollBehavior;
    }
  });
  try {
    await page.waitForFunction(
      () => {
        const footerElement = document.querySelector("footer");
        const wrapper = document.querySelector('[data-testid="hero-stage"]');
        if (!footerElement || !wrapper) return false;
        const footerRect = footerElement.getBoundingClientRect();
        return (
          footerRect.bottom > 0 &&
          footerRect.top < window.innerHeight &&
          Number(wrapper.dataset.scrollProgress) >= 0.998 &&
          Number.isFinite(Number(wrapper.dataset.targetTime)) &&
          wrapper.dataset.videoDirection === "forward"
        );
      },
      undefined,
      { timeout: 4_000 },
    );
  } catch (error) {
    throw new Error(`${label}: footer did not reach the completed journey state`, {
      cause: error,
    });
  }

  const footerTargetValue = await page
    .locator('[data-testid="hero-stage"]')
    .getAttribute("data-target-time");
  assert.notEqual(
    footerTargetValue,
    null,
    `${label}: footer targetTime dataset value must exist`,
  );
  const footerTargetTime = Number(footerTargetValue);
  assert.ok(
    Number.isFinite(footerTargetTime),
    `${label}: footer targetTime must be finite, received ${footerTargetTime}`,
  );

  try {
    // Test-only seek avoids replaying the long forward sequence before checking reverse anchoring.
    const footerSeekTime = await page.evaluate(async (targetTime) => {
      const video = document.querySelector('[data-testid="journey-video"]');
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error("Forward journey video is missing");
      }

      video.pause();
      if (Math.abs(video.currentTime - targetTime) > 0.04) {
        await new Promise((resolve, reject) => {
          let timeoutId;
          const cleanup = () => {
            video.removeEventListener("seeked", handleSeeked);
            window.clearTimeout(timeoutId);
          };
          const handleSeeked = () => {
            cleanup();
            resolve();
          };
          timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error(`Forward journey video seek timed out at ${targetTime}`));
          }, 4_000);
          video.addEventListener("seeked", handleSeeked);
          try {
            video.currentTime = targetTime;
          } catch (error) {
            cleanup();
            reject(error);
          }
        });
      }

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      return video.currentTime;
    }, footerTargetTime);
    assert.ok(
      Number.isFinite(footerSeekTime),
      `${label}: forward footer seek time must be finite, received ${footerSeekTime}`,
    );
    assert.ok(
      Math.abs(footerSeekTime - footerTargetTime) <= 0.05,
      `${label}: forward footer seek time ${footerSeekTime} must match target ${footerTargetTime}`,
    );
  } catch (error) {
    throw new Error(`${label}: footer media did not align at target ${footerTargetTime}`, {
      cause: error,
    });
  }

  try {
    // Returning from the footer makes the journey tappable again, matching a real reverse swipe.
    await prepareMovement(page, expectedProgress, "reverse", { recoverGesture: true });
  } catch (error) {
    throw new Error(`${label}: footer round-trip reverse movement failed`, {
      cause: error,
    });
  }
  const state = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="scroll-video-stage"]');
    const wrapper = document.querySelector('[data-testid="hero-stage"]');
    const forward = document.querySelector('[data-testid="journey-video"]');
    const reverse = document.querySelector('[data-testid="journey-video-reverse"]');
    if (
      !stage ||
      !wrapper ||
      !(forward instanceof HTMLVideoElement) ||
      !(reverse instanceof HTMLVideoElement)
    ) {
      return null;
    }
    const stageRect = stage.getBoundingClientRect();
    return {
      forwardDuration: forward.duration,
      height: stageRect.height,
      innerHeight: window.innerHeight,
      progress: Number(wrapper.dataset.scrollProgress),
      reverseCurrentTime: reverse.currentTime,
      targetTime: Number(wrapper.dataset.targetTime),
      top: stageRect.top,
      videoDirection: wrapper.dataset.videoDirection,
    };
  });
  assert.ok(
    state,
    `${label}: journey stage, wrapper, and videos must exist after the footer round-trip`,
  );

  for (const [name, value] of Object.entries(state).filter(
    ([name]) => name !== "videoDirection",
  )) {
    assert.ok(Number.isFinite(value), `${label}: ${name} must be finite, received ${value}`);
  }
  const lastFrameTime = Math.max(state.forwardDuration - 1 / 25, 0);
  const reverseCanonicalTime = Math.max(lastFrameTime - state.reverseCurrentTime, 0);
  assert.ok(
    Number.isFinite(lastFrameTime),
    `${label}: lastFrameTime must be finite, received ${lastFrameTime}`,
  );
  assert.ok(
    Number.isFinite(reverseCanonicalTime),
    `${label}: reverseCanonicalTime must be finite, received ${reverseCanonicalTime}`,
  );
  assert.ok(
    Math.abs(reverseCanonicalTime - footerTargetTime) <= 0.75,
    `${label}: reverse canonical time ${reverseCanonicalTime} must remain anchored to footer target ${footerTargetTime}`,
  );
  assert.ok(
    Math.abs(state.height - state.innerHeight) <= 2,
    `${label}: journey stage height ${state.height} must match innerHeight ${state.innerHeight}`,
  );
  assert.ok(
    Math.abs(state.top) <= 2,
    `${label}: journey stage top must be within 2px of the viewport, received ${state.top}`,
  );
  assert.ok(
    Math.abs(state.progress - expectedProgress) <= 0.002,
    `${label}: journey progress must return to ${expectedProgress}, received ${state.progress}`,
  );
  assert.ok(
    state.targetTime < footerTargetTime,
    `${label}: round-trip targetTime ${state.targetTime} must precede footer targetTime ${footerTargetTime}`,
  );
  assert.equal(
    state.videoDirection,
    "reverse",
    `${label}: round-trip videoDirection must be reverse`,
  );
}

async function assertJourneyViewportResize(page, label, viewport) {
  const expectedProgress = 0.58;
  const restoredProgress = 0.56;
  const resizedHeight = Math.max(viewport.height - 96, 560);
  // This characterizes layout reflow only; setViewportSize does not emulate iPadOS toolbars.
  const waitForLayout = async (progress, phase) => {
    try {
      await page.waitForFunction(
        (expected) => {
          const stage = document.querySelector('[data-testid="scroll-video-stage"]');
          const wrapper = document.querySelector('[data-testid="hero-stage"]');
          if (!stage || !wrapper) return false;
          const rect = stage.getBoundingClientRect();
          return (
            Math.abs(Number(wrapper.dataset.scrollProgress) - expected) <= 0.002 &&
            Math.abs(rect.height - window.innerHeight) <= 2 &&
            Math.abs(rect.top) <= 2
          );
        },
        progress,
        { timeout: 4_000 },
      );
    } catch (error) {
      throw new Error(
        `${label}: ${phase} viewport layout did not settle at progress ${progress}`,
        { cause: error },
      );
    }

    const state = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="scroll-video-stage"]');
      const wrapper = document.querySelector('[data-testid="hero-stage"]');
      if (!stage || !wrapper) return null;
      const rect = stage.getBoundingClientRect();
      return {
        height: rect.height,
        innerHeight: window.innerHeight,
        progress: Number(wrapper.dataset.scrollProgress),
        top: rect.top,
      };
    });
    assert.ok(state, `${label}: ${phase} journey stage and wrapper must exist`);
    for (const [name, value] of Object.entries(state)) {
      assert.ok(
        Number.isFinite(value),
        `${label}: ${phase} ${name} must be finite, received ${value}`,
      );
    }
    assert.ok(
      Math.abs(state.progress - progress) <= 0.002,
      `${label}: ${phase} progress must be ${progress}, received ${state.progress}`,
    );
    assert.ok(
      Math.abs(state.height - state.innerHeight) <= 2,
      `${label}: ${phase} stage height ${state.height} must match innerHeight ${state.innerHeight}`,
    );
    assert.ok(
      Math.abs(state.top) <= 2,
      `${label}: ${phase} stage top must be within 2px, received ${state.top}`,
    );
  };

  try {
    await page.setViewportSize({ width: viewport.width, height: resizedHeight });
    await setJourneyProgress(page, expectedProgress);
    await waitForLayout(expectedProgress, "resized");
  } finally {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await setJourneyProgress(page, restoredProgress);
    await waitForLayout(restoredProgress, "restored");
  }
}

async function assertVideoLayers(page, label) {
  const layers = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="scroll-video-stage"]');
    const copy = document.querySelector('[data-testid="journey-persistent-copy"]');
    const hotspotLayer = document.querySelector("[data-hotspot-layout]");
    const primaryAction = document.querySelector('[data-testid="scene-primary-action"]');
    const popupTrigger = document.querySelector('[data-testid="menu-popup-trigger"]');
    const soulLink = document.querySelector("[data-soul-link]");
    const stageRect = stage.getBoundingClientRect();
    const layerState = (selector) => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        right: rect.right,
        top: rect.top,
        transform: style.transform,
        transitionProperty: style.transitionProperty,
        width: rect.width,
        zIndex: style.zIndex,
      };
    };

    return {
      copy: {
        pointerEvents: getComputedStyle(copy).pointerEvents,
        touchAction: getComputedStyle(copy).touchAction,
        zIndex: getComputedStyle(copy).zIndex,
      },
      forward: layerState('[data-testid="journey-video"]'),
      hotspotZIndex: getComputedStyle(hotspotLayer).zIndex,
      popupTouchAction: getComputedStyle(popupTrigger).touchAction,
      primaryTouchAction: getComputedStyle(primaryAction).touchAction,
      reverse: layerState('[data-testid="journey-video-reverse"]'),
      soulTouchAction: getComputedStyle(soulLink).touchAction,
      stage: {
        bottom: stageRect.bottom,
        height: stageRect.height,
        left: stageRect.left,
        right: stageRect.right,
        top: stageRect.top,
        width: stageRect.width,
      },
    };
  });

  for (const [direction, video] of [
    ["forward", layers.forward],
    ["reverse", layers.reverse],
  ]) {
    assert.equal(video.transform, "none", `${label}: ${direction} video transform`);
    assert.equal(video.objectFit, "cover", `${label}: ${direction} video object-fit`);
    assert.ok(
      video.objectPosition === "center" || video.objectPosition === "50% 50%",
      `${label}: ${direction} video object-position was ${video.objectPosition}`,
    );
    assert.deepEqual(
      {
        bottom: video.bottom,
        height: video.height,
        left: video.left,
        right: video.right,
        top: video.top,
        width: video.width,
      },
      layers.stage,
      `${label}: ${direction} video bounds must match the stage`,
    );
    assert.ok(
      video.transitionProperty.split(",").map((value) => value.trim()).every(
        (value) => value === "opacity",
      ),
      `${label}: ${direction} transition must only target opacity: ${video.transitionProperty}`,
    );
  }

  assert.equal(layers.copy.pointerEvents, "auto", `${label}: copy must receive pointer events`);
  assert.equal(layers.copy.touchAction, "pan-y", `${label}: copy touch-action`);
  assert.equal(layers.primaryTouchAction, "pan-y", `${label}: CTA touch-action`);
  assert.equal(layers.popupTouchAction, "pan-y", `${label}: popup trigger touch-action`);
  assert.equal(layers.soulTouchAction, "pan-y", `${label}: Soul Rail touch-action`);
  assert.ok(
    Number(layers.copy.zIndex) > Number(layers.hotspotZIndex),
    `${label}: copy must stack above hotspots: ${JSON.stringify(layers)}`,
  );
  assert.ok(
    Number(layers.hotspotZIndex) > Number(layers.forward.zIndex),
    `${label}: hotspots must stack above videos: ${JSON.stringify(layers)}`,
  );
}

async function tapAtCenter(page, locator, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label}: control must have a tappable bounding box`);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const hit = await locator.evaluate((control, tapPoint) => {
    const target = document.elementFromPoint(tapPoint.x, tapPoint.y);
    return {
      isControl: target === control || control.contains(target),
      target:
        target instanceof Element
          ? target.getAttribute("data-testid") ||
            target.getAttribute("href") ||
            target.className ||
            target.tagName
          : null,
    };
  }, point);
  assert.equal(
    hit.isControl,
    true,
    `${label}: tap center is intercepted by ${String(hit.target)}`,
  );
  await page.touchscreen.tap(point.x, point.y);
}

async function tapControls(
  page,
  label,
  railIndex,
  { direction, prepareControl, state } = {},
) {
  const before = await page.evaluate(() => ({
    clicks: window.__tabletInterfaceTest.controlClicks.length,
    gestures: window.__tabletInterfaceTest.controlGestures.length,
    plays: window.__tabletInterfaceTest.interactivePlayCalls.length,
  }));

  await prepareControl?.();
  await tapAtCenter(
    page,
    page.locator('[data-testid="scene-primary-action"]'),
    `${label} primary action`,
  );
  await prepareControl?.();
  await tapAtCenter(
    page,
    page.locator('[data-testid="menu-popup-trigger"]'),
    `${label} popup trigger`,
  );
  const popup = page.locator('[data-testid="menu-popup"]');
  await popup.waitFor({ state: "visible", timeout: 4_000 });
  await tapAtCenter(
    page,
    page.locator('[data-testid="menu-popup-close"]'),
    `${label} popup close`,
  );
  await popup.waitFor({ state: "detached", timeout: 4_000 });

  const railLink = page.locator("[data-soul-link]").nth(railIndex);
  const railHref = await railLink.getAttribute("href");
  assert.ok(railHref?.startsWith("#"), `${label}: Soul Rail target must be an anchor`);
  await prepareControl?.();
  await tapAtCenter(page, railLink, `${label} Soul Rail`);
  await page.waitForFunction(
    (expectedHash) => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      return location.hash === expectedHash && stage?.dataset.navSource === "rail";
    },
    railHref,
    { timeout: 4_000 },
  );
  await page.evaluate(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: window.scrollY, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
  });
  await page.waitForTimeout(300);

  const after = await page.evaluate(() => ({
    clicks: window.__tabletInterfaceTest.controlClicks.slice(),
    gestures: window.__tabletInterfaceTest.controlGestures.slice(),
    plays: window.__tabletInterfaceTest.interactivePlayCalls.slice(),
  }));
  assert.ok(
    after.clicks.length >= before.clicks + 3,
    `${label}: CTA, popup and Soul Rail must all receive clicks: ${JSON.stringify(after.clicks)}`,
  );
  assert.equal(
    after.plays.length,
    before.plays,
    `${label}: tapping links/buttons must not prime video playback: ${JSON.stringify(after.plays)}`,
  );
  const gestures = after.gestures.slice(before.gestures);
  assert.equal(
    gestures.length,
    3,
    `${label}: each control must receive one tracked touch gesture: ${JSON.stringify(gestures)}`,
  );
  if (state) {
    assert.ok(
      gestures.every((gesture) => gesture.state === state),
      `${label}: every control tap must occur while ${state}: ${JSON.stringify(gestures)}`,
    );
  }
  if (direction) {
    assert.ok(
      gestures.every((gesture) => gesture.direction === direction),
      `${label}: every control tap must occur while ${direction}: ${JSON.stringify(gestures)}`,
    );
  }
}

async function exerciseTablet(browserType, browserName, viewport) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    viewport,
  });
  const page = await context.newPage();
  const label = `${browserName} ${viewport.width}x${viewport.height}`;

  try {
    await installTouchInstrumentation(page);
    await waitForJourney(page);

    const initialTarget = await page
      .locator('[data-testid="hero-stage"]')
      .getAttribute("data-target-time");
    await waitForSettled(page, initialTarget);
    await assertVideoLayers(page, `${label} initial`);
    await tapControls(page, `${label} initial`, 0);

    const movingProgresses = [0.24, 0.36, 0.48];
    let movingIndex = 0;
    const prepareForwardControl = () =>
      prepareMovement(page, movingProgresses[movingIndex++], "forward");
    await prepareMovement(page, 0.18, "forward");
    await assertVideoLayers(page, `${label} moving`);
    await tapControls(page, `${label} moving`, 4, {
      direction: "forward",
      prepareControl: prepareForwardControl,
      state: "moving",
    });

    const settledTarget = await setJourneyProgress(page, 0.02);
    await waitForSettled(page, settledTarget);
    await assertVideoLayers(page, `${label} settled`);
    await tapControls(page, `${label} settled`, 6);

    const reverseStartTarget = await setJourneyProgress(page, 0.08);
    await waitForSettled(page, reverseStartTarget);
    const prepareReverseControl = async () => {
      const startTarget = await setJourneyProgress(page, 0.08);
      await recoverPlaybackGestureIfNeeded(page);
      await waitForSettled(page, startTarget);
      await prepareMovement(page, 0.03, "reverse");
    };
    await prepareMovement(page, 0.03, "reverse");
    await assertVideoLayers(page, `${label} reverse`);
    await tapControls(page, `${label} reverse`, 4, {
      direction: "reverse",
      prepareControl: prepareReverseControl,
      state: "moving",
    });

    await assertJourneyFooterRoundTrip(page, label);
    await assertJourneyViewportResize(page, label, viewport);
    console.log(`tablet interface checks passed: ${label}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function assertMobileHotspotsHidden(browserType, browserName) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="hero-stage"]').waitFor({ state: "visible" });
    const visibleMarkers = await page.locator(".journey-marker").evaluateAll((markers) =>
      markers.filter((marker) => getComputedStyle(marker).display !== "none").length,
    );
    assert.equal(visibleMarkers, 0, `${browserName}: phone hotspots must remain hidden`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function assertReverseLoadRecovery() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 768, height: 1024 },
  });
  const page = await context.newPage();
  let releaseReverseRequest;
  const reverseRequestBlocked = new Promise((resolve) => {
    releaseReverseRequest = resolve;
  });
  await page.route("**/*reverse.mp4*", async (route) => {
    await reverseRequestBlocked;
    await route.continue();
  });

  try {
    await waitForJourney(page);
    const forwardTarget = await setJourneyProgress(page, 0.08);
    await waitForSettled(page, forwardTarget);
    const reverseTarget = await setJourneyProgress(page, 0.03);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="hero-stage"]')?.dataset
          .reverseSourceAttached === "true",
      undefined,
      { timeout: 4_000 },
    );
    await page.waitForFunction(
      () => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return (
          stage?.dataset.reverseSourceAttached === "false" &&
          stage.dataset.videoDirection === "forward" &&
          stage.dataset.mediaMode === "video"
        );
      },
      undefined,
      { timeout: 7_000 },
    );
    await waitForSettled(page, reverseTarget);
    assert.equal(
      await page.locator('[data-testid="hero-stage"]').getAttribute("data-fallback-reason"),
      "",
      "A stalled reverse asset must not disable the healthy forward journey video",
    );
    console.log("reverse video load timeout recovery passed");
  } finally {
    releaseReverseRequest?.();
    await context.close();
    await browser.close();
  }
}

async function main() {
  if (process.env.TABLET_SKIP_STATIC !== "1") {
    assertStaticContracts();
  }
  if (process.env.TABLET_STATIC_ONLY === "1") {
    console.log("tablet interface static checks passed");
    return;
  }

  for (const [browserName, browserType] of [
    ["Chromium", chromium],
    ["WebKit", webkit],
  ]) {
    for (const viewport of viewports) {
      await exerciseTablet(browserType, browserName, viewport);
    }
    await assertMobileHotspotsHidden(browserType, browserName);
  }
  await assertReverseLoadRecovery();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
