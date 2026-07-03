"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const baseUrl = process.env.WEB_BASE_URL || "http://127.0.0.1:3000";

async function readTextContents(page, selector) {
  return page.$$eval(selector, (nodes) =>
    nodes.map((node) => node.textContent.trim()).filter(Boolean),
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    const soulRail = page.locator('[data-testid="soul-rail"]');
    await soulRail.waitFor({ state: "visible", timeout: 2500 });

    const soulLabels = await readTextContents(page, "[data-soul-link]");
    assert.deepEqual(
      soulLabels,
      ["Beach", "Restaurant", "Sport", "Nightlife"],
      "Homepage should expose the four souls as a minimal persistent rail",
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
      (await page.locator('[data-testid="scene-hotspot"]').count()) >= 3,
      "Homepage should expose multiple subtle hotspots tied to the visual scene",
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

    const initialVideoTime = await page.locator('[data-testid="journey-video"]').evaluate((node) => {
      const video = node;
      return Math.round(video.currentTime * 100) / 100;
    });
    const scrollToJourneyBeach = () =>
      page.evaluate(() => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        const scrollable = stage.offsetHeight - window.innerHeight;
        window.scrollTo({ top: scrollable * 0.3, behavior: "auto" });
      });
    await scrollToJourneyBeach();
    await page.waitForTimeout(350);
    // Late layout settling (fonts, hydration) can nudge the scroll position:
    // re-issue the same scroll so the journey lands on the intended scene.
    await scrollToJourneyBeach();
    await page.waitForTimeout(250);
    const progressedVideoTime = await page
      .locator('[data-testid="journey-video"]')
      .evaluate((node) => Math.round(node.currentTime * 100) / 100);
    assert.ok(
      progressedVideoTime > initialVideoTime,
      "Homepage journey video should advance when the page scrolls",
    );
    const beachCta = await page
      .locator('[data-testid="scene-primary-action"]')
      .getAttribute("href");
    assert.match(
      beachCta || "",
      /widget\.spiagge\.it/,
      "The beach scene should surface the real umbrella booking CTA",
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
    await popupTrigger.click();
    const menuPopup = page.locator('[data-testid="menu-popup"]');
    await menuPopup.waitFor({ state: "visible", timeout: 2500 });
    const popupText = (await menuPopup.textContent()) || "";
    assert.match(popupText, /€/, "The popup should show real scene dishes with prices");
    assert.match(popupText, /Spiaggia/, "The popup should expose the beach booking entry");
    await page.keyboard.press("Escape");
    await menuPopup.waitFor({ state: "detached", timeout: 2500 });

    await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const mobileMenuButton = mobilePage.getByRole("button", { name: /menu/i });
    await mobileMenuButton.waitFor({ state: "visible", timeout: 2500 });
    await mobileMenuButton.click();
    await mobilePage
      .locator('[data-testid="mobile-nav-panel"]')
      .waitFor({ state: "visible", timeout: 2500 });
    assert.ok(
      (await readTextContents(mobilePage, '[data-testid="mobile-nav-panel"] a')).includes("Beach"),
      "Mobile navigation should expose the primary sections inside a lightweight panel",
    );

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
    await mobilePage.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
