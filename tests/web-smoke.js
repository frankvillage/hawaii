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
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.4, behavior: "auto" }));
    await page.waitForTimeout(250);
    const progressedVideoTime = await page
      .locator('[data-testid="journey-video"]')
      .evaluate((node) => Math.round(node.currentTime * 100) / 100);
    assert.ok(
      progressedVideoTime > initialVideoTime,
      "Homepage journey video should advance when the page scrolls",
    );

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
