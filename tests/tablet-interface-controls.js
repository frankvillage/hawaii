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
  await page.evaluate(() => {
    const consent = [...document.querySelectorAll("button")].find((node) =>
      /accetta/i.test(node.textContent || ""),
    );
    consent?.click();
  });
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
}

async function prepareMovement(page, progress, direction) {
  const targetTime = await setJourneyProgress(page, progress);
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
  await page.locator('[data-testid="scene-primary-action"]').tap();
  await prepareControl?.();
  await page.locator('[data-testid="menu-popup-trigger"]').tap();
  const popup = page.locator('[data-testid="menu-popup"]');
  await popup.waitFor({ state: "visible", timeout: 4_000 });
  await page.locator('[data-testid="menu-popup-close"]').tap();
  await popup.waitFor({ state: "detached", timeout: 4_000 });

  const railLink = page.locator("[data-soul-link]").nth(railIndex);
  const railHref = await railLink.getAttribute("href");
  assert.ok(railHref?.startsWith("#"), `${label}: Soul Rail target must be an anchor`);
  await prepareControl?.();
  await railLink.tap();
  await page.waitForFunction(
    (expectedHash) => {
      const stage = document.querySelector('[data-testid="hero-stage"]');
      return location.hash === expectedHash && stage?.dataset.navSource === "rail";
    },
    railHref,
    { timeout: 4_000 },
  );

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

    const settledTarget = await setJourneyProgress(page, 0.52);
    await waitForSettled(page, settledTarget);
    await assertVideoLayers(page, `${label} settled`);
    await tapControls(page, `${label} settled`, 4);

    const reverseStartTarget = await setJourneyProgress(page, 0.62);
    await waitForSettled(page, reverseStartTarget);
    const reverseProgresses = [0.48, 0.36, 0.24];
    let reverseIndex = 0;
    const prepareReverseControl = () =>
      prepareMovement(page, reverseProgresses[reverseIndex++], "reverse");
    await prepareMovement(page, 0.56, "reverse");
    await assertVideoLayers(page, `${label} reverse`);
    await tapControls(page, `${label} reverse`, 6, {
      direction: "reverse",
      prepareControl: prepareReverseControl,
      state: "moving",
    });

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
