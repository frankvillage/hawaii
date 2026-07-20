"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const baseUrl = process.env.WEB_BASE_URL;

if (!baseUrl) {
  throw new Error("WEB_BASE_URL is required");
}

const venues = [
  {
    path: "/prenotazioni/ristorante",
    name: "Hawaii",
    phoneDisplay: "085 9396664",
    phoneHref: "tel:+390859396664",
    whatsappUrl: "https://wa.me/393516900701",
    theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  },
  {
    path: "/prenotazioni/muulab",
    name: "MUULab Riviera",
    phoneDisplay: "085 9396485",
    phoneHref: "tel:+390859396485",
    whatsappUrl: "https://wa.me/393333440051",
    theForkUrl: "https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1",
  },
];

async function expectSecureBooking(browser, venue) {
  const context = await browser.newContext();
  let page;
  let vendorRequests = 0;

  try {
    await context.route("**/*", async (route) => {
      const request = route.request();

      if (request.url() === venue.theForkUrl) {
        vendorRequests += 1;
        await route.abort();
        return;
      }

      if (["image", "media"].includes(request.resourceType())) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    page = await context.newPage();
    page.setDefaultTimeout(5_000);
    const response = await page.goto(`${baseUrl}${venue.path}`, {
      waitUntil: "domcontentloaded",
    });

    assert.equal(response?.status(), 200, `${venue.path} should be available`);
    await page.getByRole("heading", { level: 1, name: venue.name }).waitFor();
    await page
      .getByText("Prenotazioni telefoniche con assistente virtuale", { exact: true })
      .waitFor();

    const phone = page.getByRole("link", { name: venue.phoneDisplay, exact: true });
    assert.equal(await phone.getAttribute("href"), venue.phoneHref);

    const whatsapp = page.getByRole("link", {
      name: `WhatsApp ${venue.name}`,
      exact: true,
    });
    assert.equal(await whatsapp.getAttribute("href"), venue.whatsappUrl);

    const fallback = page.getByTestId("thefork-direct-link");
    await fallback.waitFor({ state: "visible" });
    assert.equal(await fallback.getAttribute("href"), venue.theForkUrl);
    assert.equal(await fallback.getAttribute("target"), "_blank");
    assert.match((await fallback.getAttribute("rel")) || "", /\bnoopener\b/);
    assert.match((await fallback.getAttribute("rel")) || "", /\bnoreferrer\b/);
    assert.equal(await page.locator(`iframe[src="${venue.theForkUrl}"]`).count(), 0);
    assert.equal(vendorRequests, 0, "TheFork must not be requested before activation");

    await page.getByRole("button", { name: "Rifiuta", exact: true }).click();
    assert.equal(vendorRequests, 0, "Global rejection must not load TheFork");

    await page
      .getByRole("button", { name: "Carica il modulo TheFork", exact: true })
      .click();
    await page.waitForFunction(() => document.querySelectorAll("iframe").length === 1);
    await page.waitForFunction(
      () => window.localStorage.getItem("hawaii-thefork-consent-v1") === "granted",
    );

    const iframe = page.locator(`iframe[src="${venue.theForkUrl}"]`);
    assert.equal(await iframe.count(), 1);
    assert.equal(
      await iframe.getAttribute("title"),
      `Prenotazione ${venue.name} con TheFork`,
    );
    assert.equal(await iframe.getAttribute("allow"), "payment *");
    assert.equal(await iframe.getAttribute("loading"), "lazy");
    assert.equal(
      await iframe.getAttribute("referrerpolicy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(
      await iframe.evaluate((node) => node.style.height),
      "max(800px, -7rem + 100svh)",
    );
    await page.waitForTimeout(100);
    assert.equal(vendorRequests, 1, "Activation should make exactly one TheFork request");

    await fallback.waitFor({ state: "visible" });
    assert.equal(await fallback.getAttribute("href"), venue.theForkUrl);
    assert.equal(await fallback.getAttribute("target"), "_blank");
    assert.match((await fallback.getAttribute("rel")) || "", /\bnoopener\b/);
    assert.match((await fallback.getAttribute("rel")) || "", /\bnoreferrer\b/);
  } finally {
    await page?.close();
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const venue of venues) {
      await expectSecureBooking(browser, venue);
    }
  } finally {
    await browser.close();
  }

  console.log("secure booking browser checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
