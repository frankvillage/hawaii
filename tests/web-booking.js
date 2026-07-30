"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const baseUrl = process.env.WEB_BASE_URL;

if (!baseUrl) {
  throw new Error("WEB_BASE_URL is required");
}

const basePath = new URL(baseUrl).pathname.replace(/\/+$/, "");
const normalizePath = (value) => (value || "").replace(/\/+$/, "");
const internalPath = (value) => `${basePath}${value}`;
const whatsappUrl = (phone, message) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const venues = [
  {
    path: "/prenotazioni/ristorante",
    entityPath: "/ristorante-mare",
    name: "Hawaii",
    phoneDisplay: "085 9396664",
    phoneHref: "tel:+390859396664",
    whatsappUrl: whatsappUrl(
      "393516900701",
      "Ciao, vorrei prenotare un tavolo al ristorante Hawaii.",
    ),
    theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  },
  {
    path: "/prenotazioni/muulab",
    entityPath: "/terrazza",
    name: "MUULab Riviera",
    phoneDisplay: "085 9396485",
    phoneHref: "tel:+390859396485",
    whatsappUrl: whatsappUrl(
      "393333440051",
      "Ciao, vorrei prenotare un tavolo sulla terrazza MUULab Riviera.",
    ),
    theForkUrl: "https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1",
  },
];

async function expectVenueRestaurantSchema(browser, venue, otherVenue) {
  await expectPageLinks(browser, venue.entityPath, async (page) => {
    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent || "{}")));
    const restaurant = schemas.find(
      (schema) =>
        schema["@type"] === "Restaurant" &&
        schema.url === `https://www.hawaiipescara.it${venue.entityPath}`,
    );

    assert.ok(restaurant, `${venue.entityPath} should expose its Restaurant schema`);
    assert.equal(restaurant.telephone, venue.phoneDisplay);
    assert.equal(restaurant.acceptsReservations, true);
    assert.deepEqual(restaurant.potentialAction, {
      "@type": "ReserveAction",
      target: venue.path,
    });

    const serializedRestaurant = JSON.stringify(restaurant);
    assert.doesNotMatch(serializedRestaurant, new RegExp(otherVenue.phoneDisplay));
    assert.doesNotMatch(serializedRestaurant, new RegExp(otherVenue.path));
  });
}

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

    const phone = page
      .getByRole("main")
      .getByRole("link", { name: venue.phoneDisplay, exact: true });
    assert.equal(await phone.getAttribute("href"), venue.phoneHref);

    const whatsapp = page.getByRole("main").getByRole("link", {
      name: `WhatsApp ${venue.name}`,
      exact: true,
    });
    assert.equal(await whatsapp.getAttribute("href"), venue.whatsappUrl);

    assert.equal(
      await page.locator(`a[href="${venue.theForkUrl}"]`).count(),
      0,
      "The embedded booking page must not expose a link that leaves the site",
    );
    assert.equal(await page.locator(`iframe[src="${venue.theForkUrl}"]`).count(), 0);
    assert.equal(vendorRequests, 0, "TheFork must not be requested before global consent");
    assert.equal(
      await page
        .getByRole("button", { name: "Carica il modulo TheFork", exact: true })
        .count(),
      0,
      "The booking page must not require a second TheFork activation button",
    );

    await page.getByRole("button", { name: "Accetta", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll("iframe").length === 1);
    await page.waitForFunction(
      () => window.localStorage.getItem("hawaii-consent-v1") === "accept",
    );
    assert.equal(
      await page.evaluate(() => window.localStorage.getItem("hawaii-thefork-consent-v1")),
      null,
      "The obsolete dedicated TheFork consent must not be persisted",
    );

    const iframe = page.locator(`iframe[src="${venue.theForkUrl}"]`);
    assert.equal(await iframe.count(), 1);
    assert.equal(
      await iframe.getAttribute("title"),
      `Prenotazione ${venue.name} con TheFork`,
    );
    assert.equal(await iframe.getAttribute("allow"), "payment *");
    assert.equal(await iframe.getAttribute("loading"), "eager");
    assert.equal(
      await iframe.getAttribute("referrerpolicy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(
      await iframe.evaluate((node) => node.style.height),
      "max(800px, -7rem + 100svh)",
    );
    await page.waitForTimeout(100);
    assert.equal(vendorRequests, 1, "Global consent should make exactly one TheFork request");

    assert.equal(await page.locator(`a[href="${venue.theForkUrl}"]`).count(), 0);
  } finally {
    await page?.close();
    await context.close();
  }
}

async function expectGlobalRejectionBlocksTheFork(browser, venue) {
  const context = await browser.newContext();
  let page;
  const vendorRequests = [];

  try {
    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (
        requestUrl.hostname === "thefork.com" ||
        requestUrl.hostname.endsWith(".thefork.com")
      ) {
        vendorRequests.push(route.request().url());
        await route.abort();
        return;
      }
      if (["image", "media"].includes(route.request().resourceType())) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    page = await context.newPage();
    await page.goto(`${baseUrl}${venue.path}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Rifiuta", exact: true }).click();
    await page.waitForFunction(
      () => window.localStorage.getItem("hawaii-consent-v1") === "reject",
    );

    assert.equal(
      await page.locator(`iframe[src="${venue.theForkUrl}"]`).count(),
      0,
      "Global rejection must keep the TheFork iframe blocked",
    );
    assert.doesNotMatch(
      (await page.getByRole("main").textContent()) || "",
      /Apri direttamente TheFork|link diretto a TheFork/i,
      "Rejected consent must not introduce an external TheFork escape link",
    );
    await page.waitForTimeout(250);
    assert.deepEqual(vendorRequests, [], "Global rejection must not request any TheFork endpoint");
    assert.equal(
      await page
        .getByRole("button", { name: "Carica il modulo TheFork", exact: true })
        .count(),
      0,
      "Rejected consent must not restore a dedicated activation button",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator(`iframe[src="${venue.theForkUrl}"]`).count(),
      0,
      "Persisted rejection must keep the TheFork iframe blocked after reload",
    );
    assert.deepEqual(
      vendorRequests,
      [],
      "Persisted rejection must not request any TheFork endpoint after reload",
    );
  } finally {
    await page?.close();
    await context.close();
  }
}

async function expectConsentSyncsAcrossTabs(browser, venue) {
  const context = await browser.newContext();
  let firstPage;
  let secondPage;

  try {
    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (
        requestUrl.hostname === "thefork.com" ||
        requestUrl.hostname.endsWith(".thefork.com")
      ) {
        await route.abort();
        return;
      }
      if (["image", "media"].includes(route.request().resourceType())) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    firstPage = await context.newPage();
    secondPage = await context.newPage();
    await firstPage.goto(`${baseUrl}${venue.path}`, { waitUntil: "domcontentloaded" });
    await secondPage.goto(`${baseUrl}${venue.path}`, { waitUntil: "domcontentloaded" });

    await firstPage.getByRole("button", { name: "Accetta", exact: true }).click();
    await secondPage.waitForFunction(
      (theForkUrl) =>
        window.localStorage.getItem("hawaii-consent-v1") === "accept" &&
        document.querySelector(`iframe[src="${theForkUrl}"]`),
      venue.theForkUrl,
    );
    assert.equal(
      await secondPage.getByRole("button", { name: "Accetta", exact: true }).count(),
      0,
      "The second tab banner must close when consent is accepted elsewhere",
    );
  } finally {
    await firstPage?.close();
    await secondPage?.close();
    await context.close();
  }
}

async function expectConsentCanBeRevised(browser, venue) {
  const context = await browser.newContext();
  let page;
  const vendorRequests = [];

  try {
    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (
        requestUrl.hostname === "thefork.com" ||
        requestUrl.hostname.endsWith(".thefork.com")
      ) {
        vendorRequests.push(route.request().url());
        await route.abort();
        return;
      }
      if (["image", "media"].includes(route.request().resourceType())) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    page = await context.newPage();
    await page.goto(`${baseUrl}/cookie`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.localStorage.setItem("hawaii-consent-v1", "accept");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: "Modifica preferenze cookie", exact: true })
      .click();
    await page.getByRole("button", { name: "Rifiuta", exact: true }).click();
    await page.waitForFunction(
      () => window.localStorage.getItem("hawaii-consent-v1") === "reject",
    );

    vendorRequests.length = 0;
    await page.goto(`${baseUrl}${venue.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator(`iframe[src="${venue.theForkUrl}"]`).count(),
      0,
      "Revised rejection must block the TheFork iframe",
    );
    assert.deepEqual(vendorRequests, [], "Revised rejection must block TheFork requests");
  } finally {
    await page?.close();
    await context.close();
  }
}

async function expectPageLinks(browser, path, assertions) {
  const context = await browser.newContext();
  let page;

  try {
    await context.route("**/*", async (route) => {
      if (["image", "media"].includes(route.request().resourceType())) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    page = await context.newPage();
    page.setDefaultTimeout(5_000);
    const response = await page.goto(`${baseUrl}${path}`, {
      waitUntil: "domcontentloaded",
    });

    assert.equal(response?.status(), 200, `${path} should be available`);
    await assertions(page);
  } finally {
    await page?.close();
    await context.close();
  }
}

async function expectPropagatedBookingLinks(browser) {
  await expectPageLinks(browser, "/ristorante-mare", async (page) => {
    const globalWhatsapp = page.getByRole("link", {
      name: "WhatsApp Hawaii: 351 6900701",
      exact: true,
    });
    assert.equal(
      await globalWhatsapp.getAttribute("href"),
      whatsappUrl("393516900701", "Ciao, vorrei ricevere informazioni su Hawaii."),
    );

    const restaurantCta = page
      .getByRole("link", { name: "Prenota Hawaii", exact: true })
      .first();
    assert.equal(
      normalizePath(await restaurantCta.getAttribute("href")),
      internalPath("/prenotazioni/ristorante"),
    );
  });

  await expectPageLinks(browser, "/terrazza", async (page) => {
    const muulabCta = page
      .getByRole("link", { name: "Prenota MUULab", exact: true })
      .first();
    assert.equal(
      normalizePath(await muulabCta.getAttribute("href")),
      internalPath("/prenotazioni/muulab"),
    );
  });

  await expectPageLinks(browser, "/beach", async (page) => {
    const beachCta = page
      .getByRole("link", { name: "Prenota palma o ombrellone", exact: true })
      .first();
    assert.equal(
      await beachCta.getAttribute("href"),
      "https://new-widget.spiagge.it/stabilimenti-balneari/prenotazione/it-pe-65123-lido-hawaii/insertPeriod?yb_booking_license=it-pe-65123-lido-hawaii",
    );
  });

  await expectPageLinks(browser, "/sport", async (page) => {
    await page
      .getByText("Registrarsi o accedere a Wansport per prenotare.", { exact: true })
      .waitFor();
    const wansportCta = page
      .getByRole("link", { name: "Prenota padel su Wansport", exact: true })
      .first();
    assert.equal(await wansportCta.getAttribute("href"), "https://wansport.com");
    const assistanceCta = page
      .getByRole("link", { name: "Assistenza padel su WhatsApp", exact: true })
      .first();
    assert.equal(
      await assistanceCta.getAttribute("href"),
      whatsappUrl("393513200049", "Ciao, vorrei prenotare un campo da padel."),
    );
  });

  await expectPageLinks(browser, "/eventi", async (page) => {
    const eventsCta = page
      .getByRole("link", { name: "Info eventi su WhatsApp", exact: true })
      .first();
    assert.equal(
      await eventsCta.getAttribute("href"),
      whatsappUrl("393516900701", "Ciao, vorrei ricevere informazioni sugli eventi Hawaii."),
    );
  });

  await expectPageLinks(browser, "/feste-private", async (page) => {
    const privateEventsCta = page
      .getByRole("link", {
        name: "WhatsApp feste private",
        exact: true,
      })
      .first();
    assert.equal(
      await privateEventsCta.getAttribute("href"),
      whatsappUrl(
        "393516900701",
        "Ciao, vorrei organizzare una festa o un evento privato da Hawaii.",
      ),
    );
  });
}

async function expectBookingHubGroups(browser) {
  await expectPageLinks(browser, "/prenotazioni", async (page) => {
    const groups = await page.locator("[data-booking-group]").evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.getAttribute("data-booking-group"),
        heading: node.querySelector("h2")?.textContent?.trim(),
        links: [...node.querySelectorAll("[data-booking-label]")].map(
          (label) => label.textContent?.trim(),
        ),
        images: [...node.querySelectorAll("[data-booking-image]")].map((image) => ({
          alt: image.getAttribute("alt"),
          src: image.getAttribute("src"),
        })),
      })),
    );

    assert.deepEqual(groups.map(({ id }) => id), ["food", "beach-sport", "private-events"]);
    assert.deepEqual(groups.map(({ heading }) => heading), [
      "Food",
      "Beach & Sport",
      "Eventi privati",
    ]);
    assert.deepEqual(groups[0].links, ["Prenota Hawaii", "Prenota MUULab"]);
    assert.deepEqual(groups[1].links, ["Prenota spiaggia", "Prenota padel"]);
    assert.equal(groups[0].images.length, 2);
    assert.match(groups[0].images[0].src || "", /food-gnocchi-mare\.jpg/);
    assert.match(groups[0].images[1].src || "", /muulab-carpaccio-nero\.jpg/);
    assert.match(groups[0].images[0].alt || "", /Hawaii/);
    assert.match(groups[0].images[1].alt || "", /MUULab/);

    const hawaii = page.getByRole("link", { name: "Prenota Hawaii", exact: true });
    const muulab = page.getByRole("link", { name: "Prenota MUULab", exact: true });
    const padel = page
      .locator('[data-booking-group="beach-sport"] a')
      .filter({ hasText: "Prenota padel" });
    assert.equal(
      normalizePath(await hawaii.getAttribute("href")),
      internalPath("/prenotazioni/ristorante"),
    );
    assert.equal(
      normalizePath(await muulab.getAttribute("href")),
      internalPath("/prenotazioni/muulab"),
    );
    assert.equal(normalizePath(await padel.getAttribute("href")), internalPath("/sport"));
    assert.equal(await padel.getAttribute("target"), null);
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const venue of venues) {
      await expectSecureBooking(browser, venue);
      await expectGlobalRejectionBlocksTheFork(browser, venue);
    }
    await expectConsentSyncsAcrossTabs(browser, venues[0]);
    await expectConsentCanBeRevised(browser, venues[0]);
    await expectVenueRestaurantSchema(browser, venues[0], venues[1]);
    await expectVenueRestaurantSchema(browser, venues[1], venues[0]);
    await expectBookingHubGroups(browser);
    await expectPropagatedBookingLinks(browser);
  } finally {
    await browser.close();
  }

  console.log("secure booking browser checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
