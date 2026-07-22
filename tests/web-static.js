"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
function readSourceTree(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readSourceTree(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fs.readFileSync(entryPath, "utf8")] : [];
  });
}

const productionSources = readSourceTree(path.join(root, "web", "src")).join("\n");
const pagesWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "deploy-pages.yml"),
  "utf8",
);
const productionRunner = fs.readFileSync(
  path.join(root, "tests", "run-web-production.js"),
  "utf8",
);
const pagesPreviewBuildPath = path.join(root, "scripts", "build-pages-preview.sh");
const arubaBuildPath = path.join(root, "scripts", "build-static-aruba.sh");
const arubaHeadersPath = path.join(root, "deploy", "aruba", ".htaccess.example");
const arubaReadinessPath = path.join(root, "tests", "aruba-static-readiness.js");
const arubaGuidePath = path.join(root, "docs", "deploy", "aruba-static-readiness.md");
const arubaBuild = fs.existsSync(arubaBuildPath) ? fs.readFileSync(arubaBuildPath, "utf8") : "";
const pagesPreviewBuild = fs.existsSync(pagesPreviewBuildPath)
  ? fs.readFileSync(pagesPreviewBuildPath, "utf8")
  : "";
const arubaHeaders = fs.existsSync(arubaHeadersPath)
  ? fs.readFileSync(arubaHeadersPath, "utf8")
  : "";
const arubaReadiness = fs.existsSync(arubaReadinessPath)
  ? fs.readFileSync(arubaReadinessPath, "utf8")
  : "";
const arubaGuide = fs.existsSync(arubaGuidePath) ? fs.readFileSync(arubaGuidePath, "utf8") : "";
const verifyJob = pagesWorkflow.match(/\n  verify:\n([\s\S]*?)\n  deploy:/)?.[1] || "";
const layoutPath = path.join(root, "web", "src", "app", "layout.tsx");
const stagePath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "scroll-video-stage.tsx",
);
const globalStylesPath = path.join(root, "web", "src", "app", "globals.css");
const soulRailPath = path.join(
  root,
  "web",
  "src",
  "components",
  "home",
  "soul-rail.tsx",
);
const siteHeaderPath = path.join(
  root,
  "web",
  "src",
  "components",
  "chrome",
  "site-header.tsx",
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
const globalStyles = fs.readFileSync(globalStylesPath, "utf8");
const soulRail = fs.readFileSync(soulRailPath, "utf8");
const siteHeader = fs.readFileSync(siteHeaderPath, "utf8");
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
  "The continuous journey should buffer ahead for responsive scroll scrubbing",
);
assert.match(stage, /advanceScrubTime/, "The homepage should use bounded continuous scrubbing");
assert.doesNotMatch(
  stage,
  /useJourneyClipPlayer|requestScene|coverStill/,
  "The homepage must not execute checkpoint clips or destination covers",
);
assert.doesNotMatch(
  stage,
  /journey-snap-root|scroll-snap-(?:align|stop)/,
  "The homepage must not force scene-by-scene scroll snapping",
);
assert.match(
  stage,
  /data-journey-tail[\s\S]*h-\[100svh\]/,
  "The journey should include the final viewport that aligns track ranges with scrollable progress",
);
assert.match(stage, /journeyFrameRef/, "Scroll measurement and media scrub should share one RAF");
assert.doesNotMatch(
  stage,
  /scrollFrameRef|scrubFrameRef|JOURNEY_FRAME_SECONDS \* 0\.7/,
  "The journey must not run competing RAF loops or seek below one full video frame",
);
assert.match(
  globalStyles,
  /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.journey-stage video,[\s\S]*?transform:\s*none;[\s\S]*?transition:\s*none;[\s\S]*?will-change:\s*auto;/,
  "Touch journey media must not allocate a continuously transformed compositor layer",
);
assert.doesNotMatch(
  soulRail,
  /px-2 py-1 backdrop-blur-md/,
  "The fixed mobile Soul Rail must not blur every video frame beneath it",
);
assert.match(
  soulRail,
  /soul-rail-surface/,
  "The Soul Rail surface must expose a touch-specific compositing hook",
);
assert.match(
  siteHeader,
  /coarsePointerQuery\.matches\s*\?\s*0\s*:/,
  "Touch scrolling must keep the header at one stable size",
);
assert.match(
  stage,
  /bufferingRef\.current = true;[\s\S]*?playAttemptIdRef\.current \+= 1;[\s\S]*?playAttemptRef\.current = false;/,
  "A buffering watchdog must invalidate any pending play lock before retrying",
);
assert.match(
  stage,
  /const primePlaybackFromGesture[\s\S]*?isTouchGesture[\s\S]*?void video\.play\(\)\.then/,
  "Touch playback must be primed synchronously from the pointer gesture handler",
);
assert.match(
  stage,
  /const overlaysInteractive = !isMoving;[\s\S]*const hotspotsInteractive = !isMoving;/,
  "Faded journey controls must become inert while the decoded frame catches up",
);
assert.doesNotMatch(
  productionSources,
  /(?:from|import\()\s*["'][^"']*journey-segment-(?:controller|machine)/,
  "Production must not import the superseded journey controller or reducer",
);
assert.match(verifyJob, /npm run test:web:journey/);
assert.match(verifyJob, /npm run test:web:static/);
assert.match(verifyJob, /tsc --noEmit/);
assert.match(verifyJob, /lint -- --max-warnings=0/);
assert.match(verifyJob, /playwright install --with-deps chromium webkit/);
assert.match(verifyJob, /STATIC_EXPORT:\s*["']1["']/);
assert.match(verifyJob, /NEXT_PUBLIC_BASE_PATH:\s*\/\$\{\{ github\.event\.repository\.name \}\}/);
assert.match(verifyJob, /NODE_OPTIONS:\s*--max-old-space-size=2048/);
assert.match(verifyJob, /npm run build -- --webpack/);
assert.match(verifyJob, /rm -rf pages-preview/);
assert.match(verifyJob, /cp -a web\/out\/\. pages-preview\/\$\{\{ github\.event\.repository\.name \}\}\//);
assert.match(verifyJob, /npm run test:web:production/);
assert.match(verifyJob, /actions\/upload-pages-artifact@v3[\s\S]*path:\s*web\/out/);
assert.match(pagesWorkflow, /needs:\s*verify/);
assert.match(productionRunner, /server\.listen\(0, "127\.0\.0\.1"/);
assert.match(productionRunner, /tests\/web-smoke\.js/);
assert.match(productionRunner, /tests\/webkit-mobile-playback\.js/);
assert.match(productionRunner, /tests\/desktop-video-playback\.js/);
assert.match(productionRunner, /tests\/webkit-iphone-touch-playback\.js/);
assert.match(productionRunner, /tests\/webkit-slow-mobile-video\.js/);
assert.match(pagesPreviewBuild, /TMP_ROOT="\$\(mktemp -d /);
assert.match(
  pagesPreviewBuild,
  /rsync -a[\s\S]*--exclude node_modules[\s\S]*--exclude \.next[\s\S]*--exclude out[\s\S]*--exclude src\/app\/api[\s\S]*"\$WEB_DIR\/" "\$TMP_ROOT\/web\/"/,
);
assert.match(pagesPreviewBuild, /ln -s "\$WEB_DIR\/node_modules" "\$TMP_ROOT\/web\/node_modules"/);
assert.match(pagesPreviewBuild, /STATIC_EXPORT=1/);
assert.match(pagesPreviewBuild, /NEXT_PUBLIC_BASE_PATH=\/hawaii/);
assert.match(pagesPreviewBuild, /NODE_OPTIONS="\$\{NODE_OPTIONS:---max-old-space-size=2048\}"/);
assert.match(pagesPreviewBuild, /npm run build -- --webpack/);
assert.ok(pagesPreviewBuild.includes(`-e 's|"/media/|"/hawaii/media/|g'`));
assert.ok(pagesPreviewBuild.includes(`-e "s|'/media/|'/hawaii/media/|g"`));
assert.ok(pagesPreviewBuild.includes(`-e 's|(/media/|(/hawaii/media/|g'`));
assert.match(pagesPreviewBuild, /OUTPUT_DIR="\$ROOT_DIR\/pages-preview\/hawaii"/);
assert.match(
  pagesPreviewBuild,
  /rsync -a --delete "\$TMP_ROOT\/web\/out\/" "\$OUTPUT_DIR\/"/,
);
assert.match(pagesPreviewBuild, /trap cleanup EXIT/);
assert.match(pagesPreviewBuild, /trap 'exit 129' HUP/);
assert.match(pagesPreviewBuild, /trap 'exit 130' INT/);
assert.match(pagesPreviewBuild, /trap 'exit 143' TERM/);
assert.doesNotMatch(
  pagesPreviewBuild,
  /(?:rm|mv)[^\n]*src\/app\/api/,
  "The Pages preview builder must never remove or move the source API routes",
);
assert.match(arubaBuild, /--exclude src\/app\/api/);
assert.match(arubaBuild, /NEXT_PUBLIC_BASE_PATH=""/);
assert.match(arubaBuild, /output\/aruba-static/);
assert.match(arubaBuild, /aruba-static-readiness\.js/);
assert.match(arubaHeaders, /Accept-Ranges/);
assert.match(arubaHeaders, /Content-Security-Policy/);
assert.match(arubaHeaders, /X-Content-Type-Options/);
assert.match(arubaReadiness, /journey-desktop\.mp4/);
assert.match(arubaReadiness, /\/hawaii\//);
assert.match(arubaGuide, /form/i);
assert.match(arubaGuide, /non inviano|non consegnano/i);
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
assert.match(bookingHub, /title: "Food"/);
assert.match(bookingHub, /title: "Beach & Sport"/);
assert.match(bookingHub, /title: "Eventi privati"/);
assert.match(bookingHub, /Prenota Hawaii/);
assert.match(bookingHub, /bookingVenues\.hawaii\.internalBookingPath/);
assert.match(bookingHub, /Prenota MUULab/);
assert.match(bookingHub, /bookingVenues\.muulab\.internalBookingPath/);
assert.match(bookingHub, /food-gnocchi-mare\.jpg/);
assert.match(bookingHub, /muulab-carpaccio-nero\.jpg/);
assert.match(bookingHub, /data-booking-image/);
assert.match(bookingHub, /beachBookingUrl/);
assert.match(bookingHub, /["']\/sport["']/);
assert.match(bookingHub, /["']\/feste-private["']/);
assert.doesNotMatch(bookingHub, /Prenota (?:Hawaii|MUULab) su TheFork/);
assert.doesNotMatch(siteContent, /(?:label|title): "Prenota (?:Hawaii|MUULab) su TheFork"/);
assert.doesNotMatch(productionSources, /Prenota (?:Hawaii|MUULab) su TheFork/);
assert.match(siteContent, /label: "Prenota Hawaii"/);
assert.match(siteContent, /label: "Prenota MUULab"/);
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
