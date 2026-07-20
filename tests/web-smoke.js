"use strict";

const assert = require("node:assert/strict");
const { chromium, devices } = require("playwright");

const baseUrl = process.env.WEB_BASE_URL || "http://127.0.0.1:3000";

async function readTextContents(page, selector) {
  return page.$$eval(selector, (nodes) =>
    nodes.map((node) => node.textContent.trim()).filter(Boolean),
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let context = null;
  let page = null;

  const openPage = async (options = {}) => {
    assert.equal(context, null, "Smoke tests must use one browser context at a time");
    context = await browser.newContext(options);
    page = await context.newPage();
    return page;
  };

  const closePage = async () => {
    await context?.close();
    context = null;
    page = null;
  };

  try {
    page = await openPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    const soulRail = page.locator('[data-testid="soul-rail"]');
    await soulRail.waitFor({ state: "visible", timeout: 2500 });

    const soulLabels = await readTextContents(page, "[data-soul-link]");
    assert.deepEqual(
      soulLabels,
      [
        "Urban Village",
        "Bar",
        "Sport",
        "Beach Club",
        "Ristorante",
        "Pizzeria",
        "Aperitivo",
        "MUULab",
        "Eventi",
      ],
      "Homepage should expose one rail stop per journey scene, in scene order",
    );

    const storyLabels = await readTextContents(page, "[data-testid='scene-eyebrow']");
    assert.ok(
      storyLabels.length >= 1,
      "Homepage should expose a compact active-scene label inside the stage",
    );
    assert.equal(
      await page.locator('[data-testid="hero-stage"]').count(),
      1,
      "Homepage should expose a single full-bleed hero stage",
    );
    assert.ok(
      (await page.locator('[data-testid="scroll-video-stage"]').count()) === 1,
      "Homepage should expose a single scroll-driven video stage",
    );
    assert.ok(
      (await page.locator('[data-testid="journey-video"]').count()) === 1,
      "Homepage should expose one master journey video instead of isolated chapter videos",
    );
    assert.ok(
      (await page.locator('[data-testid="scene-hotspot"]').count()) >= 2,
      "Homepage should expose anchored hotspots tied to the visual scene (max 2 per scene)",
    );
    assert.equal(
      await page.locator('[data-testid="scene-marker"]').count(),
      1,
      "Homepage should expose a compact scene marker for the active moment",
    );
    assert.equal(
      await page.locator('[data-testid="nightlife-video"]').count(),
      0,
      "Homepage should not isolate the promo video inside a nightlife-only panel",
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

    const journeyVideo = page.locator('[data-testid="journey-video"]');
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-testid="journey-video"]');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });
    const initialVideoState = await journeyVideo.evaluate((video) => ({
      currentTime: Number(video.currentTime),
      duration: Number(video.duration),
    }));
    await page.evaluate(() => {
      const mediaStage = document.querySelector('[data-testid="scroll-video-stage"]');
      window.__journeyScrollSamples = [window.scrollY];
      window.__journeyLastScrollAt = performance.now();
      window.__journeyScrollListener = () => {
        window.__journeyScrollSamples.push(window.scrollY);
        window.__journeyLastScrollAt = performance.now();
      };
      window.addEventListener("scroll", window.__journeyScrollListener, { passive: true });

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

    await page.locator('[data-soul-link][href="#bar"]').click();
    await page.waitForFunction(
      () =>
        window.__journeyScrollSamples.length > 1 &&
        performance.now() - window.__journeyLastScrollAt > 140,
      undefined,
      { timeout: 4000 },
    );
    await page.waitForFunction(
      (initialTime) =>
        document.querySelector('[data-testid="journey-video"]')?.currentTime >
        initialTime + 0.02,
      initialVideoState.currentTime,
      { timeout: 2500 },
    );

    const railResult = await page.evaluate(() => {
      window.removeEventListener("scroll", window.__journeyScrollListener);
      window.__journeyCoverObserver?.disconnect();
      const stage = document.querySelector('[data-testid="hero-stage"]');
      const scrollable = Math.max(stage.offsetHeight - window.innerHeight, 1);
      const stageTop = window.scrollY + stage.getBoundingClientRect().top;
      return {
        coverImagesSeen: window.__journeyCoverImagesSeen,
        finalProgress: Math.min(Math.max((window.scrollY - stageTop) / scrollable, 0), 1),
        navSource: stage.dataset.navSource,
        sceneId: stage.dataset.sceneId,
        scrollPositions: window.__journeyScrollSamples,
        videoTime: Number(
          document.querySelector('[data-testid="journey-video"]')?.currentTime,
        ),
      };
    });
    const uniqueScrollPositions = [...new Set(railResult.scrollPositions.map(Math.round))];
    assert.ok(
      uniqueScrollPositions.length >= 4,
      `Soul Rail clicks must smoothly move the document through intermediate positions: ${uniqueScrollPositions.join(", ")}`,
    );
    assert.ok(
      uniqueScrollPositions.every(
        (position, index) => index === 0 || position >= uniqueScrollPositions[index - 1],
      ),
      `Soul Rail scrolling must progress toward the selected scene: ${uniqueScrollPositions.join(", ")}`,
    );
    assert.ok(
      railResult.finalProgress > 0,
      `Soul Rail scrolling must finish beyond the journey start: ${JSON.stringify(railResult)}`,
    );
    assert.ok(
      railResult.videoTime > initialVideoState.currentTime,
      "The journey video should follow the document movement",
    );
    assert.ok(
      railResult.videoTime < initialVideoState.duration * railResult.finalProgress - 0.25,
      "A rail click must not jump the video directly to the selected scene time",
    );
    assert.notEqual(
      railResult.sceneId,
      "bar",
      "Scene copy must follow the displayed video frame instead of jumping ahead with scroll position",
    );
    assert.equal(
      railResult.navSource,
      "rail",
      "Smooth document scroll started by the Soul Rail should retain its navigation source",
    );
    assert.equal(
      railResult.coverImagesSeen,
      0,
      "Healthy video mode must not add a destination cover still while scrolling",
    );
    await page.waitForFunction(
      () => document.querySelector('[data-testid="hero-stage"]')?.dataset.sceneId === "bar",
      undefined,
      { timeout: 6000 },
    );
    assert.equal(
      (await page.locator('[data-testid="scene-eyebrow"]').textContent())?.trim(),
      "Cocktail bar",
      "Scene copy should reach Bar as the displayed video catches the selected range",
    );

    const popupTrigger = page.locator('[data-testid="menu-popup-trigger"]');
    assert.equal(
      await popupTrigger.count(),
      1,
      "The journey should expose a single compact menu/booking trigger",
    );
    await page.evaluate(() => {
      const consent = [...document.querySelectorAll("button")].find((node) =>
        /accetta/i.test(node.textContent || ""),
      );
      if (consent) {
        consent.click();
      }
    });
    // The trigger lives inside a sticky, transformed stage. Playwright's locator
    // click can scroll that stage to the document end before dispatching the event.
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="menu-popup-trigger"]')?.closest("[inert]"),
      undefined,
      { timeout: 6000 },
    );
    await page.evaluate(() => {
      document.querySelector('[data-testid="menu-popup-trigger"]')?.click();
    });
    const menuPopup = page.locator('[data-testid="menu-popup"]');
    await menuPopup.waitFor({ state: "visible", timeout: 2500 });
    const popupText = (await menuPopup.textContent()) || "";
    assert.match(popupText, /€/, "The popup should show real scene dishes with prices");
    assert.match(
      popupText,
      /Prenota spiaggia/i,
      "The popup should expose the beach booking entry",
    );
    await page.keyboard.press("Escape");
    await menuPopup.waitFor({ state: "detached", timeout: 2500 });

    await closePage();
    const mobilePage = await openPage({ ...devices["iPhone 13"] });
    await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const mobileVideo = mobilePage.locator('[data-testid="journey-video"]');
    await mobileVideo.waitFor({ state: "visible", timeout: 2500 });
    assert.equal(
      await mobilePage.locator('[data-testid="journey-canvas"]').count(),
      0,
      "Healthy mobile playback should use the MP4 rather than the frame fallback",
    );
    assert.equal(
      await mobilePage.locator('[data-testid="hero-stage"]').getAttribute("data-media-mode"),
      "video",
      "Healthy mobile playback should report video mode",
    );
    assert.equal(
      await mobilePage.locator('[data-testid="scroll-video-stage"] img').count(),
      0,
      "Healthy mobile playback should not render a cover still over the MP4",
    );
    assert.equal(
      await mobilePage.locator(".journey-marker:visible").count(),
      0,
      "Mobile should hide every journey hotspot",
    );
    assert.equal(
      await mobilePage.evaluate(() =>
        document.documentElement.classList.contains("journey-snap-root"),
      ),
      false,
      "Mobile must not enable mandatory journey snapping",
    );

    const mobileMenuButton = mobilePage.getByRole("button", { name: "Menu", exact: true });
    await mobileMenuButton.waitFor({ state: "visible", timeout: 2500 });
    await mobileMenuButton.click();
    await mobilePage
      .locator('[data-testid="mobile-nav-panel"]')
      .waitFor({ state: "visible", timeout: 2500 });
    assert.ok(
      (await readTextContents(mobilePage, '[data-testid="mobile-nav-panel"] a')).includes("Beach"),
      "Mobile navigation should expose the primary sections inside a lightweight panel",
    );

    await closePage();
    const reducedMobilePage = await openPage({
      ...devices["iPhone 13"],
      reducedMotion: "reduce",
    });

    await reducedMobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await reducedMobilePage.waitForFunction(
      () =>
        document.querySelector('[data-testid="hero-stage"]')?.dataset.mediaMode === "stills",
      undefined,
      { timeout: 3500 },
    );
    assert.equal(
      await reducedMobilePage.locator('[data-testid="journey-canvas"]').count(),
      0,
      "Reduced-motion mode should not decode the frame fallback when media is healthy",
    );
    await reducedMobilePage.evaluate(() => {
      document.querySelector("#bar")?.scrollIntoView({ behavior: "auto" });
    });
    await reducedMobilePage.waitForFunction(
      () => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return (
          stage?.dataset.sceneId === "bar" && stage.dataset.mediaMode === "stills"
        );
      },
      undefined,
      { timeout: 3500 },
    );
    assert.equal(
      (await reducedMobilePage.locator('[data-testid="scene-eyebrow"]').textContent())?.trim(),
      "Cocktail bar",
      "Reduced-motion mobile should keep visuals synchronized with the active scene",
    );

    await closePage();
    const fallbackMobilePage = await openPage({ ...devices["iPhone 13"] });
    await fallbackMobilePage.route("**/journey-*.mp4", (route) => route.abort());
    await fallbackMobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await fallbackMobilePage.waitForFunction(
      () =>
        document.querySelector('[data-testid="hero-stage"]')?.dataset.mediaMode === "fallback",
      undefined,
      { timeout: 4500 },
    );
    assert.equal(
      await fallbackMobilePage.locator('[data-testid="journey-canvas"]').count(),
      0,
      "Fallback should use scene stills rather than the JPEG canvas runtime",
    );
    await fallbackMobilePage.evaluate(() => {
      document.querySelector("#bar")?.scrollIntoView({ behavior: "auto" });
    });
    await fallbackMobilePage.waitForFunction(
      () => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return stage?.dataset.sceneId === "bar" && stage.dataset.mediaMode === "fallback";
      },
      undefined,
      { timeout: 4500 },
    );

    await closePage();
    page = await openPage();
    await page.goto(`${baseUrl}/prenotazioni`, { waitUntil: "networkidle" });
    const bookingForm = page.locator('[data-testid="booking-inquiry-form"]');
    await bookingForm.waitFor({ state: "visible", timeout: 2500 });
    assert.equal(
      await page.locator('input[name="name"]').count(),
      1,
      "Booking page should collect a contact name",
    );
    assert.equal(
      await page.locator('select[name="requestType"]').count(),
      1,
      "Booking page should expose a request type selector",
    );

    await page.goto(`${baseUrl}/contatti`, { waitUntil: "networkidle" });
    const contactForm = page.locator('[data-testid="contact-form"]');
    await contactForm.waitFor({ state: "visible", timeout: 2500 });
    assert.equal(
      await page.locator('textarea[name="message"]').count(),
      1,
      "Contact page should expose a message field",
    );

    await page.goto(`${baseUrl}/sport`, { waitUntil: "networkidle" });
    const schemaText = await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent();
    assert.match(
      schemaText || "",
      /SportsActivityLocation/,
      "Entity pages should publish a structured data type aligned with their core offer",
    );
    assert.equal(
      await page.locator('[data-testid="entity-hero-media"]').count(),
      1,
      "Entity pages should expose a real hero media asset",
    );

    await page.goto(`${baseUrl}/menu`, { waitUntil: "networkidle" });
    assert.ok(
      (await page.locator('[data-testid="menu-section"]').count()) >= 3,
      "Menu page should expose multiple structured menu sections ready for real content",
    );
    assert.equal(
      await page.locator("#ristorante-mare").count(),
      1,
      "Menu page should expose the Ristorante Mare carte at a stable anchor",
    );
    assert.equal(
      await page.locator("#muulab").count(),
      1,
      "Menu page should expose the MUULab Riviera carte at a stable anchor",
    );
    assert.match(
      (await page.locator("#ristorante-mare").textContent()) || "",
      /Tonnarello alle vongole/,
      "Menu page should publish the real Hawaii dishes",
    );

    await page.goto(`${baseUrl}/villaggio`, { waitUntil: "networkidle" });
    assert.ok(
      (await page.locator('[data-testid="classic-section"]').count()) >= 4,
      "The classic view should expose the full village as editorial sections",
    );

    await page.goto(`${baseUrl}/eventi`, { waitUntil: "networkidle" });
    assert.ok(
      (await page.locator('[data-testid="event-format-card"]').count()) >= 3,
      "Events page should expose recurring formats as structured cards",
    );

    await page.goto(`${baseUrl}/faq`, { waitUntil: "networkidle" });
    const faqSchemaText = await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent();
    assert.match(
      faqSchemaText || "",
      /FAQPage/,
      "FAQ page should expose FAQ structured data",
    );

    console.log("web smoke test passed");
  } finally {
    await closePage();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
