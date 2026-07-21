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

const venues = [
  {
    path: "/prenotazioni/ristorante",
    entityPath: "/ristorante-mare",
    name: "Hawaii",
    phoneDisplay: "085 9396664",
    phoneHref: "tel:+390859396664",
    whatsappUrl: "https://wa.me/393516900701",
    theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  },
  {
    path: "/prenotazioni/muulab",
    entityPath: "/terrazza",
    name: "MUULab Riviera",
    phoneDisplay: "085 9396485",
    phoneHref: "tel:+390859396485",
    whatsappUrl: "https://wa.me/393333440051",
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
    assert.equal(await globalWhatsapp.getAttribute("href"), "https://wa.me/393516900701");

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
    assert.equal(await assistanceCta.getAttribute("href"), "https://wa.me/393513200049");
  });

  await expectPageLinks(browser, "/eventi", async (page) => {
    const eventsCta = page
      .getByRole("link", { name: "Info eventi su WhatsApp", exact: true })
      .first();
    assert.equal(await eventsCta.getAttribute("href"), "https://wa.me/393516900701");
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
    assert.equal(groups[0].images.length, 2);
    assert.match(groups[0].images[0].src || "", /food-gnocchi-mare\.jpg/);
    assert.match(groups[0].images[1].src || "", /muulab-carpaccio-nero\.jpg/);
    assert.match(groups[0].images[0].alt || "", /Hawaii/);
    assert.match(groups[0].images[1].alt || "", /MUULab/);

    const hawaii = page.getByRole("link", { name: "Prenota Hawaii", exact: true });
    const muulab = page.getByRole("link", { name: "Prenota MUULab", exact: true });
    assert.equal(
      normalizePath(await hawaii.getAttribute("href")),
      internalPath("/prenotazioni/ristorante"),
    );
    assert.equal(
      normalizePath(await muulab.getAttribute("href")),
      internalPath("/prenotazioni/muulab"),
    );
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const venue of venues) {
      await expectSecureBooking(browser, venue);
    }
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
