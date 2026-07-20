"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const layoutPath = path.join(root, "web", "src", "app", "layout.tsx");
const stagePath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "scroll-video-stage.tsx",
);
const theForkPath = path.join(
  root,
  "web",
  "src",
  "components",
  "booking",
  "thefork-booking.tsx",
);
const bookingHubPath = path.join(root, "web", "src", "app", "prenotazioni", "page.tsx");
const bookingFormPath = path.join(
  root,
  "web",
  "src",
  "components",
  "forms",
  "booking-inquiry-form.tsx",
);
const nextConfigPath = path.join(root, "web", "next.config.ts");
const bookingConfigPath = path.join(root, "web", "src", "lib", "booking-config.ts");
const siteContentPath = path.join(root, "web", "src", "lib", "site-content.ts");
const seoPath = path.join(root, "web", "src", "lib", "seo.ts");
const sitemapPath = path.join(root, "web", "src", "app", "sitemap.ts");
const whatsappButtonPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "whatsapp-button.tsx",
);
const footerPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "site-footer.tsx",
);
const contactPagePath = path.join(root, "web", "src", "app", "contatti", "page.tsx");
const menuPagePath = path.join(root, "web", "src", "app", "menu", "page.tsx");
const villagePagePath = path.join(root, "web", "src", "app", "villaggio", "page.tsx");

const layout = fs.readFileSync(layoutPath, "utf8");
const stage = fs.readFileSync(stagePath, "utf8");
const theFork = fs.existsSync(theForkPath) ? fs.readFileSync(theForkPath, "utf8") : "";
const bookingHub = fs.readFileSync(bookingHubPath, "utf8");
const bookingForm = fs.readFileSync(bookingFormPath, "utf8");
const nextConfig = fs.readFileSync(nextConfigPath, "utf8");
const bookingConfig = fs.readFileSync(bookingConfigPath, "utf8");
const siteContent = fs.readFileSync(siteContentPath, "utf8");
const seo = fs.readFileSync(seoPath, "utf8");
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const whatsappButton = fs.readFileSync(whatsappButtonPath, "utf8");
const footer = fs.readFileSync(footerPath, "utf8");
const contactPage = fs.readFileSync(contactPagePath, "utf8");
const menuPage = fs.readFileSync(menuPagePath, "utf8");
const villagePage = fs.readFileSync(villagePagePath, "utf8");
const propagatedBookingSources = [
  bookingConfig,
  siteContent,
  whatsappButton,
  footer,
  contactPage,
  menuPage,
  villagePage,
].join("\n");

assert.doesNotMatch(
  layout,
  /next\/font\/google/,
  "The production layout should not depend on Google Fonts at build time",
);
assert.match(
  layout,
  /next\/font\/local/,
  "The production layout should self-host its font files with next/font/local",
);
assert.doesNotMatch(
  stage,
  /fetch\(src,\s*\{\s*cache:\s*"force-cache"/,
  "The scroll stage should not force-download the full journey video as a blob",
);
assert.match(
  stage,
  /preload="auto"/,
  "The segmented journey should buffer ahead so mobile playback does not stall between checkpoints",
);
assert.match(
  theFork,
  /hawaii-thefork-consent-v1/,
  "TheFork must use its dedicated consent key",
);
assert.match(theFork, /allow="payment \*"/, "TheFork iframe should only allow payments");
assert.match(
  theFork,
  /referrerPolicy="strict-origin-when-cross-origin"/,
  "TheFork iframe should use a restrictive referrer policy",
);
assert.match(theFork, /loading="lazy"/, "TheFork iframe should load lazily");
assert.match(
  theFork,
  /height: "max\(800px, calc\(100svh - 7rem\)\)"/,
  "TheFork iframe should retain the planned responsive minimum height",
);
assert.match(theFork, /target="_blank"/, "TheFork fallback should open separately");
assert.match(
  theFork,
  /rel="noopener noreferrer"/,
  "TheFork fallback should isolate the external page",
);
assert.match(
  nextConfig,
  /frame-src https:\/\/widget\.thefork\.com;/,
  "CSP should authorize only the TheFork widget frame origin",
);
assert.match(
  nextConfig,
  /frame-ancestors 'none';/,
  "CSP must continue to deny all framing of this site",
);
assert.match(bookingHub, /Prenota Hawaii su TheFork/);
assert.match(bookingHub, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(bookingHub, /Prenota MUULab su TheFork/);
assert.match(bookingHub, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(bookingHub, /beachBookingUrl/);
assert.match(bookingHub, /["']\/sport["']/);
assert.match(bookingHub, /["']\/feste-private["']/);
assert.match(bookingForm, /Informazioni generali/);
assert.match(bookingForm, /Serate ed eventi/);
assert.match(bookingForm, /Feste private/);
assert.doesNotMatch(bookingForm, /Prenota (spiaggia|tavolo mare|terrazza|sport)/);

assert.match(bookingConfig, /https:\/\/wa\.me\/393516900701/);
assert.match(bookingConfig, /https:\/\/wa\.me\/393333440051/);
assert.match(bookingConfig, /https:\/\/wa\.me\/393513200049/);
assert.match(
  bookingConfig,
  /https:\/\/new-widget\.spiagge\.it\/stabilimenti-balneari\/prenotazione\/it-pe-65123-lido-hawaii\/insertPeriod\?yb_booking_license=it-pe-65123-lido-hawaii/,
);
assert.match(bookingConfig, /portalUrl: "https:\/\/wansport\.com"/);
assert.doesNotMatch(bookingConfig, /portalUrl: "https:\/\/wansport\.com\//);

assert.match(siteContent, /from "@\/lib\/booking-config"/);
assert.match(siteContent, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(siteContent, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(siteContent, /beachBookingUrl/);
assert.match(siteContent, /sportBooking\.portalUrl/);
assert.match(siteContent, /sportBooking\.registrationNotice/);
assert.match(siteContent, /sportBooking\.whatsappUrl/);
assert.match(siteContent, /bookingVenues\.hawaii\.whatsappUrl/);
assert.match(whatsappButton, /bookingVenues\.hawaii\.whatsappUrl/);
assert.match(footer, /bookingVenues\.hawaii/);
assert.match(footer, /bookingVenues\.muulab/);
assert.match(contactPage, /bookingVenues\.hawaii/);
assert.match(contactPage, /bookingVenues\.muulab/);
assert.match(menuPage, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(menuPage, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(villagePage, /bookingVenues\.hawaii/);
assert.match(villagePage, /bookingVenues\.muulab/);
assert.doesNotMatch(propagatedBookingSources, /393755175508|375 5175508/);
assert.doesNotMatch(propagatedBookingSources, /https:\/\/widget\.spiagge\.it/i);
assert.doesNotMatch(propagatedBookingSources, /sportclubby/i);

assert.match(
  siteContent,
  /"ristorante-mare":\s*{[\s\S]*?bookingVenueId:\s*"hawaii"[\s\S]*?schemaType:\s*"Restaurant"/,
  "Ristorante Mare must declare Hawaii as its booking venue",
);
assert.match(
  siteContent,
  /"terrazza":\s*{[\s\S]*?bookingVenueId:\s*"muulab"[\s\S]*?schemaType:\s*"Restaurant"/,
  "The terrace must declare MUULab as its booking venue",
);
assert.match(seo, /bookingVenues\[page\.bookingVenueId\]/);
assert.doesNotMatch(
  seo,
  /page\.slug\s*===\s*["'](?:ristorante-mare|terrazza)["'][\s\S]{0,240}(?:telephone|potentialAction|ReserveAction)/,
  "Restaurant booking identity must not be inferred from the page slug",
);
assert.match(seo, /telephone:\s*bookingVenue\.phoneDisplay/);
assert.match(seo, /acceptsReservations:\s*true/);
assert.match(seo, /"@type":\s*"ReserveAction"/);
assert.match(seo, /target:\s*bookingVenue\.internalBookingPath/);

assert.match(sitemap, /route:\s*"\/prenotazioni\/ristorante"/);
assert.match(sitemap, /route:\s*"\/prenotazioni\/muulab"/);
assert.match(
  sitemap,
  /route:\s*"\/prenotazioni\/(?:ristorante|muulab)"[\s\S]{0,120}priority:\s*0\.[0-7]/,
  "Booking routes should have a lower priority than entity landing pages",
);

const privacyDisclosure = siteContent.match(
  /privacy:\s*\[([\s\S]*?)\n\s*\],\n\s*cookie:/,
)?.[1] || "";
const cookieDisclosure = siteContent.match(
  /cookie:\s*\[([\s\S]*?)\n\s*\],\n};/,
)?.[1] || "";

for (const [policy, disclosure] of [
  ["privacy", privacyDisclosure],
  ["cookie", cookieDisclosure],
]) {
  assert.match(disclosure, /TheFork/i, `${policy} must identify TheFork`);
  assert.match(disclosure, /consenso specifico/i, `${policy} must explain the consent gate`);
  assert.match(
    disclosure,
    /connessione di rete|trasferimento di rete/i,
    `${policy} must disclose the third-party network transfer`,
  );
  assert.match(
    disclosure,
    /prima (?:che|di) (?:l['’]utente )?inseri/i,
    `${policy} must disclose that transfer precedes booking data entry`,
  );
}

console.log("web static regression checks passed");
