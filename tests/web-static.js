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

const layout = fs.readFileSync(layoutPath, "utf8");
const stage = fs.readFileSync(stagePath, "utf8");
const theFork = fs.existsSync(theForkPath) ? fs.readFileSync(theForkPath, "utf8") : "";
const bookingHub = fs.readFileSync(bookingHubPath, "utf8");
const bookingForm = fs.readFileSync(bookingFormPath, "utf8");
const nextConfig = fs.readFileSync(nextConfigPath, "utf8");

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

console.log("web static regression checks passed");
