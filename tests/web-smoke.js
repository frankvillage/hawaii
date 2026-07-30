"use strict";

const assert = require("node:assert/strict");
const { chromium, devices } = require("playwright");

const baseUrl = process.env.WEB_BASE_URL || "http://127.0.0.1:3000";
const contentOnly = process.env.SMOKE_CONTENT_ONLY === "1";

async function readTextContents(page, selector) {
  return page.$$eval(selector, (nodes) =>
    nodes.map((node) => node.textContent.trim()).filter(Boolean),
  );
}

function assertRetiredContentAbsent(text, pageName) {
  for (const pattern of [
    /fritti al cono/i,
    /special panini/i,
    /sandwich/i,
    /hot dog/i,
    /\bbao\b/i,
    /il gioved[iì] in terrazza/i,
    /18:00\s*[—–-]\s*01:00/i,
    /prenota terrazza/i,
    /champagne e crudi/i,
    /musica dal vivo/i,
  ]) {
    assert.doesNotMatch(text, pattern, `${pageName} artifact still contains ${pattern}`);
  }
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
    await page.goto(`${baseUrl}/menu`, { waitUntil: "domcontentloaded" });
    assert.equal(
      await page.locator('[data-testid="menu-highlight-link"]').count(),
      4,
      "Menu should expose four clickable highlight cards",
    );
    if (!contentOnly) {
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
    await mobilePage.waitForFunction(
      () => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        const video = document.querySelector('[data-testid="journey-video"]');
        const poster = document.querySelector('[data-testid="scroll-video-stage"] img');
        return (
          stage?.dataset.motionPreferenceResolved === "true" &&
          stage.dataset.mediaMode === "video" &&
          video instanceof HTMLVideoElement &&
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          !poster
        );
      },
      undefined,
      { timeout: 8_000 },
    );
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
    await fallbackMobilePage.route("**/*.mp4*", (route) => route.abort("failed"));
    await fallbackMobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await fallbackMobilePage.waitForFunction(
      () => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return stage?.dataset.mediaMode === "fallback" &&
          stage.dataset.fallbackReason === "media-error";
      },
      undefined,
      { timeout: 8_000 },
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
    }

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
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "Menu");
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
    assert.equal(await page.locator("#cocktail").count(), 1);
    assert.equal(await page.locator("#carta-vini").count(), 1);
    assert.equal(await page.locator("#carta-vini-muulab").count(), 1);
    assert.deepEqual(
      await page.locator("section[id]").evaluateAll((sections) =>
        sections
          .map((section) => section.id)
          .filter((id) =>
            ["ristorante-mare", "carta-vini", "muulab", "carta-vini-muulab"].includes(id),
          ),
      ),
      ["ristorante-mare", "carta-vini", "muulab", "carta-vini-muulab"],
      "Each restaurant menu must be immediately followed by its own wine list",
    );
    assert.doesNotMatch(
      (await page.locator("#ristorante-mare").textContent()) || "",
      /Gli sfizi, prima della pizza|La pizza si accende la sera|Crocchetta speck e tartufo/,
      "Retired Hawaii pizza starters must not be visible",
    );
    assert.equal(
      await page.locator('[data-testid="hawaii-wine-item"]').count(),
      73,
      "The Hawaii wine section must publish every deterministic wine and sparkling wine",
    );
    assert.equal(
      await page.locator('[data-testid="muulab-wine-item"]').count(),
      156,
      "The MUULab wine section must publish the complete official cellar",
    );
    assert.equal(
      await page.locator('[data-testid="wine-list-link"][href="#carta-vini"]').count(),
      1,
      "The drinks card must link internally to the full Hawaii wine list",
    );

    const expectedMenuAnchors = [
      "#ristorante-mare",
      "#muulab",
      "#cocktail",
      "#carta-vini",
    ];
    const menuHighlightLinks = page.locator('[data-testid="menu-highlight-link"]');
    assert.equal(
      await menuHighlightLinks.count(),
      expectedMenuAnchors.length,
      "Menu should expose four clickable highlight cards",
    );
    assert.deepEqual(
      await menuHighlightLinks.evaluateAll((links) =>
        links.map((link) => ({
          href: link.getAttribute("href"),
          tagName: link.tagName,
        })),
      ),
      expectedMenuAnchors.map((href) => ({ href, tagName: "A" })),
      "Menu highlight cards must use native links with exact anchor mappings",
    );
    for (let index = 0; index < expectedMenuAnchors.length; index += 1) {
      const link = menuHighlightLinks.nth(index);
      const focusState = await link.evaluate((node) => {
        node.focus();
        const style = getComputedStyle(node);
        return {
          focusVisible: node.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      assert.equal(
        focusState.focusVisible,
        true,
        `Menu card ${expectedMenuAnchors[index]} must support keyboard focus`,
      );
      assert.notEqual(
        focusState.outlineStyle,
        "none",
        `Menu card ${expectedMenuAnchors[index]} must expose a visible focus outline`,
      );
      assert.notEqual(focusState.outlineWidth, "0px");

      await link.click();
      await page.waitForFunction(
        (expectedHash) => window.location.hash === expectedHash,
        expectedMenuAnchors[index],
        { timeout: 4_000 },
      );
      assert.equal(new URL(page.url()).hash, expectedMenuAnchors[index]);
      const targetScrollMargin = await page
        .locator(expectedMenuAnchors[index])
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).scrollMarginTop));
      assert.ok(
        targetScrollMargin > 0,
        `${expectedMenuAnchors[index]} must reserve space below the sticky header`,
      );
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
      "auto",
      "Anchor navigation must disable smooth scrolling for reduced-motion users",
    );

    const muulabPdf = page.getByRole("link", { name: "Menu MUULab completo" });
    assert.equal(
      await muulabPdf.getAttribute("href"),
      "https://www.muulab.it/wp-content/uploads/easy-pdf-restaurant-menu/menu-files/muulab.-menu-general.pdf",
    );
    assert.equal(await muulabPdf.getAttribute("target"), "_blank");
    assert.equal(await muulabPdf.getAttribute("rel"), "noopener noreferrer");

    await page.goto(`${baseUrl}/villaggio`, { waitUntil: "networkidle" });
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "Villaggio");
    assert.ok(
      (await page.locator('[data-testid="classic-section"]').count()) >= 4,
      "The classic view should expose the full village as editorial sections",
    );
    const villageSoulCards = page.locator('[data-testid="village-soul-card"]');
    assert.deepEqual(
      await villageSoulCards.evaluateAll((cards) =>
        cards.map((card) => card.getAttribute("data-soul")),
      ),
      ["Beach", "Restaurant", "Sport", "MUULab", "Nightlife"],
      "Village cards must place MUULab immediately before Nightlife",
    );
    assert.deepEqual(
      await villageSoulCards.evaluateAll((cards) =>
        cards
          .filter((card) => getComputedStyle(card).gridColumnEnd === "span 2")
          .map((card) => card.getAttribute("data-soul")),
      ),
      ["Nightlife"],
      "Only Nightlife should span the full village grid",
    );
    assert.ok(
      (await villageSoulCards
        .filter({ has: page.getByText("MUULab", { exact: true }) })
        .locator('a[href$="/terrazza"], a[href$="/terrazza/"]')
        .count()) >= 1,
      "The MUULab village card must link to /terrazza",
    );
    assert.match((await page.locator("body").textContent()) || "", /pesce a pranzo e a cena/i);

    await page.goto(`${baseUrl}/eventi`, { waitUntil: "networkidle" });
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "Eventi");
    assert.ok(
      (await page.locator('[data-testid="event-format-card"]').count()) >= 3,
      "Events page should expose recurring formats as structured cards",
    );
    const poshCard = page.locator('[data-testid="event-format-card"]', {
      has: page.getByRole("heading", { name: "Giovedì Posh", exact: true }),
    });
    assert.equal(await poshCard.count(), 1, "Events must expose the exact Giovedì Posh copy");
    const poshText = (await poshCard.textContent()) || "";
    assert.doesNotMatch(poshText, /\d{1,2}:\d{2}/, "Giovedì Posh must not publish a time");
    assert.match(
      poshText,
      /La serata del giovedì negli spazi esterni di Hawaii, con dj set e tavoli sotto le stelle\. In caso di pioggia, Posh si sposta in veranda\./,
    );
    const poshWhatsapp = poshCard.getByRole("link", { name: "Info eventi su WhatsApp" });
    const poshWhatsappUrl = new URL((await poshWhatsapp.getAttribute("href")) || "");
    assert.equal(poshWhatsappUrl.origin + poshWhatsappUrl.pathname, "https://wa.me/393516900701");
    assert.equal(
      poshWhatsappUrl.searchParams.get("text"),
      "Ciao, vorrei ricevere informazioni sugli eventi Hawaii.",
    );

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "Homepage");

    await page.goto(`${baseUrl}/terrazza`, { waitUntil: "domcontentloaded" });
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "Terrazza");

    await page.goto(`${baseUrl}/faq`, { waitUntil: "networkidle" });
    assertRetiredContentAbsent((await page.locator("body").textContent()) || "", "FAQ");
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
