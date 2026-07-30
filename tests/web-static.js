"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();

function sourceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing source range ${start} -> ${end}`);
  return source.slice(startIndex, endIndex);
}

function cssRuleBody(css, selector) {
  const uncommentedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = uncommentedCss.match(
    new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`),
  );
  assert.ok(match, `Missing standalone CSS rule for ${selector}`);
  return match[1];
}

function cssBlock(css, headerPattern, description) {
  const uncommentedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const match = headerPattern.exec(uncommentedCss);
  assert.ok(match, `Missing ${description}`);
  const start = match.index;
  const openingBrace = uncommentedCss.indexOf("{", start + match[0].length);
  assert.ok(openingBrace >= 0, `Missing opening brace for ${description}`);

  let depth = 1;
  for (let index = openingBrace + 1; index < uncommentedCss.length; index += 1) {
    if (uncommentedCss[index] === "{") depth += 1;
    if (uncommentedCss[index] === "}") depth -= 1;
    if (depth === 0) {
      return {
        body: uncommentedCss.slice(openingBrace + 1, index),
        start,
      };
    }
  }

  assert.fail(`Missing closing brace for ${description}`);
}

function compactCssDeclarations(body) {
  return body.replace(/\s+/g, "");
}

function writeExecutable(filePath, contents) {
  fs.writeFileSync(filePath, contents);
  fs.chmodSync(filePath, 0o755);
}

function createPagesBuildFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hawaii-pages-build-test-"));
  const webDir = path.join(fixtureRoot, "web");
  const outputDir = path.join(fixtureRoot, "pages-preview", "hawaii");
  const fakeNpmPath = path.join(fixtureRoot, "fake-npm");
  const apiPath = path.join(webDir, "src", "app", "api", "test", "route.ts");
  const tempDir = path.join(fixtureRoot, "tmp");

  fs.mkdirSync(path.join(webDir, "node_modules", ".bin"), { recursive: true });
  fs.mkdirSync(path.dirname(apiPath), { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(tempDir);
  writeExecutable(path.join(webDir, "node_modules", ".bin", "next"), "#!/bin/sh\nexit 0\n");
  fs.writeFileSync(apiPath, "source-api-marker\n");
  fs.writeFileSync(path.join(webDir, "page.txt"), "fixture-source\n");
  fs.writeFileSync(path.join(outputDir, "previous.txt"), "previous-artifact\n");
  writeExecutable(
    fakeNpmPath,
    [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "if [[ -e src/app/api ]]; then",
      '  echo "Source API routes leaked into the static build copy" >&2',
      "  exit 91",
      "fi",
      'case "${FAKE_BUILD_MODE:-success}" in',
      "  success)",
      "    mkdir -p out",
      "    cat > out/index.html <<'EOF'",
      '"/media/one.jpg"',
      "'/media/two.jpg'",
      "(/media/three.jpg)",
      "EOF",
      "    printf '%s\\n' 'fresh-artifact' > out/fresh.txt",
      "    ;;",
      "  fail)",
      "    exit 23",
      "    ;;",
      "  memory)",
      "    node -e 'const block = Buffer.alloc(48 * 1024 * 1024, 1); setTimeout(() => block.length, 10000)'",
      "    ;;",
      "  *)",
      "    exit 92",
      "    ;;",
      "esac",
      "",
    ].join("\n"),
  );

  return { apiPath, fakeNpmPath, fixtureRoot, outputDir, tempDir, webDir };
}

function runPagesBuildFixture(fixture, mode, options = {}) {
  const {
    extraEnv = {},
    rssHeadroomMb = "16",
    rssLimitMb = "512",
    rssPollSeconds = "0.05",
  } = options;
  return spawnSync("bash", [pagesPreviewBuildPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_BUILD_MODE: mode,
      PAGES_BUILD_NPM: fixture.fakeNpmPath,
      PAGES_BUILD_OUTPUT_DIR: fixture.outputDir,
      PAGES_BUILD_RSS_HEADROOM_MB: rssHeadroomMb,
      PAGES_BUILD_RSS_LIMIT_MB: rssLimitMb,
      PAGES_BUILD_RSS_POLL_SECONDS: rssPollSeconds,
      PAGES_BUILD_WEB_DIR: fixture.webDir,
      TMPDIR: fixture.tempDir,
      ...extraEnv,
    },
    timeout: 8_000,
  });
}

function pagesBuildSiblingTemps(outputDir) {
  const parent = path.dirname(outputDir);
  const prefix = `.${path.basename(outputDir)}.`;
  return fs.readdirSync(parent).filter((entry) => entry.startsWith(prefix));
}

function assertPagesBuildSuccessBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "success");
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = fs.readFileSync(path.join(fixture.outputDir, "index.html"), "utf8");
    assert.match(html, /"\/hawaii\/media\/one\.jpg/);
    assert.match(html, /'\/hawaii\/media\/two\.jpg/);
    assert.match(html, /\(\/hawaii\/media\/three\.jpg/);
    assert.equal(fs.existsSync(path.join(fixture.outputDir, "previous.txt")), false);
    assert.equal(fs.readFileSync(fixture.apiPath, "utf8"), "source-api-marker\n");
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildFailureBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "fail");
    assert.equal(result.status, 23, result.stderr || result.stdout);
    assert.equal(
      fs.readFileSync(path.join(fixture.outputDir, "previous.txt"), "utf8"),
      "previous-artifact\n",
    );
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildMemoryBehavior() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "memory", {
      rssHeadroomMb: "200",
      rssLimitMb: "256",
    });
    assert.equal(result.status, 137, result.stderr || result.stdout);
    const breach = result.stderr.match(
      /RSS safety threshold exceeded: (\d+)KB > 57344KB \(256MB hard ceiling, 200MB headroom\)/,
    );
    assert.ok(breach, result.stderr);
    assert.ok(Number(breach[1]) < 256 * 1024, "The fixture must breach headroom before its hard limit");
    assert.equal(
      fs.readFileSync(path.join(fixture.outputDir, "previous.txt"), "utf8"),
      "previous-artifact\n",
    );
    assert.deepEqual(pagesBuildSiblingTemps(fixture.outputDir), []);
    assert.deepEqual(fs.readdirSync(fixture.tempDir), []);
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

function assertPagesBuildInvalidConfigCleanup() {
  const fixture = createPagesBuildFixture();
  try {
    const result = runPagesBuildFixture(fixture, "success", {
      rssLimitMb: "invalid",
    });
    assert.equal(result.status, 2, result.stderr || result.stdout);
    assert.match(result.stderr, /PAGES_BUILD_RSS_LIMIT_MB must be a positive integer/);
    assert.deepEqual(
      fs.readdirSync(fixture.tempDir),
      [],
      "Invalid RSS config must not leak a temp build",
    );
  } finally {
    fs.rmSync(fixture.fixtureRoot, { force: true, recursive: true });
  }
}

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
const cookieBannerPath = path.join(
  root,
  "web",
  "src",
  "components",
  "legal",
  "cookie-banner.tsx",
);
const consentPath = path.join(root, "web", "src", "lib", "consent.ts");
const bookingHubPath = path.join(root, "web", "src", "app", "prenotazioni", "page.tsx");
const cookiePagePath = path.join(root, "web", "src", "app", "cookie", "page.tsx");
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
const eventPagePath = path.join(root, "web", "src", "app", "eventi", "page.tsx");
const hawaiiWineListPath = path.join(
  root,
  "docs",
  "content",
  "hawaii-wine-list-2026-07-23.md",
);

const layout = fs.readFileSync(layoutPath, "utf8");
const stage = fs.readFileSync(stagePath, "utf8");
const globalStyles = fs.readFileSync(globalStylesPath, "utf8");
const soulRail = fs.readFileSync(soulRailPath, "utf8");
const siteHeader = fs.readFileSync(siteHeaderPath, "utf8");
const theFork = fs.existsSync(theForkPath) ? fs.readFileSync(theForkPath, "utf8") : "";
const cookieBanner = fs.readFileSync(cookieBannerPath, "utf8");
const consent = fs.existsSync(consentPath) ? fs.readFileSync(consentPath, "utf8") : "";
const consentSources = [theFork, cookieBanner, consent].join("\n");
const bookingHub = fs.readFileSync(bookingHubPath, "utf8");
const cookiePage = fs.readFileSync(cookiePagePath, "utf8");
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
const eventPage = fs.readFileSync(eventPagePath, "utf8");
const hawaiiWineList = fs.readFileSync(hawaiiWineListPath, "utf8");
const propagatedBookingSources = [
  bookingConfig,
  siteContent,
  whatsappButton,
  footer,
  contactPage,
  menuPage,
  villagePage,
].join("\n");
const aperitivoScene = sourceBetween(
  siteContent,
  'id: "aperitivo"',
  'id: "muulab"',
);
const eventiScene = sourceBetween(
  siteContent,
  'id: "eventi"',
  "] satisfies JourneyScene[]",
);
const aperitivoHotspots = sourceBetween(
  aperitivoScene,
  "hotspots: [",
  "],\n      menu:",
);
const eventiHotspots = sourceBetween(
  eventiScene,
  "hotspots: [",
  "],\n      action:",
);
const aperitivoCocktailHotspot = (aperitivoHotspots.match(/\{[^{}]*\}/g) || []).find(
  (object) => /label:\s*"Cocktail & bollicine"/.test(object),
);
const eventiPoshHotspot = (eventiHotspots.match(/\{[^{}]*\}/g) || []).find((object) =>
  /label:\s*"Giovedì Posh"/.test(object),
);

assert.doesNotMatch(
  aperitivoScene,
  /Giovedì Posh/,
  "The aperitivo scene must not mention Giovedì Posh",
);
assert.ok(
  aperitivoCocktailHotspot,
  "The aperitivo scene must include a Cocktail & bollicine hotspot object",
);
assert.match(
  aperitivoCocktailHotspot,
  /label:\s*"Cocktail & bollicine"/,
  "The aperitivo cocktail hotspot must keep the Cocktail & bollicine label",
);
assert.match(
  aperitivoCocktailHotspot,
  /href:\s*"\/menu#cocktail"/,
  "The aperitivo cocktail hotspot must link to /menu#cocktail",
);
assert.ok(
  eventiPoshHotspot,
  "The eventi scene must include a Giovedì Posh hotspot object",
);
assert.match(
  eventiPoshHotspot,
  /label:\s*"Giovedì Posh"/,
  "The eventi hotspot must keep the Giovedì Posh label",
);
assert.match(
  eventiPoshHotspot,
  /href:\s*"\/eventi"/,
  "The Giovedì Posh hotspot must link to /eventi",
);
assert.doesNotMatch(
  eventiHotspots,
  /label:\s*"Le serate"/,
  "The eventi hotspots must not retain the generic Le serate label",
);

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
  /preload=\{mediaMode === "video" \? "auto" : "none"\}/,
  "The journey should buffer only after video playback is eligible",
);
assert.match(
  stage,
  /onError=\{\(event\) => \{[\s\S]{0,260}HTMLMediaElement\.NETWORK_NO_SOURCE[\s\S]{0,180}!isVideoError && !hasNoPlayableSource[\s\S]{0,100}activateFallback\("media-error"\)/,
  "Only a real media error or exhausted sources may activate video fallback",
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
const journeyViewportSupports = cssBlock(
  globalStyles,
  /@supports \(height: 100dvh\)/,
  "@supports (height: 100dvh) journey viewport block",
);
const journeyViewportBaseStyles = globalStyles.slice(0, journeyViewportSupports.start);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-stage")),
  "height:100svh;",
  "The base journey stage rule must contain only the 100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-track")),
  "margin-top:-100svh;",
  "The base journey track rule must contain only the -100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-tail")),
  "height:100svh;",
  "The base journey tail rule must contain only the 100svh fallback",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-stage")),
  "height:100dvh;",
  "The supported journey stage override must contain only height: 100dvh",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-track")),
  "margin-top:-100dvh;",
  "The supported journey track override must contain only margin-top: -100dvh",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportSupports.body, ".journey-viewport-tail")),
  "height:100dvh;",
  "The supported journey tail override must contain only height: 100dvh",
);
assert.match(
  stage,
  /<div(?=[^>]*\bdata-testid="scroll-video-stage")(?=[^>]*\bclassName="journey-stage journey-viewport-stage sticky top-0 overflow-hidden")[^>]*>/,
  "The scroll video stage element must use the exact viewport-aware sticky class list",
);
assert.match(
  stage,
  /<div\s+aria-hidden="true"\s+className="pointer-events-none relative z-0 journey-viewport-track"\s*>/,
  "The aria-hidden journey track div must use the exact viewport-track class list",
);
assert.match(
  stage,
  /<div\s+data-journey-tail\s+aria-hidden="true"\s+className="journey-viewport-tail"\s*\/>/,
  "The data-journey-tail div must use only the journey-viewport-tail class",
);
assert.doesNotMatch(
  stage,
  /h-\[100svh\]|-mt-\[100svh\]/,
  "The journey component must not retain legacy 100svh Tailwind utilities",
);
assert.match(
  stage,
  /style=\{\{ height: `\$\{\(scene\.end - scene\.start\) \* 1800\}svh` \}\}/,
  "Journey scene duration must remain proportional to 1800svh",
);
assert.match(stage, /journeyFrameRef/, "Scroll measurement and media scrub should share one RAF");
assert.doesNotMatch(
  stage,
  /scrollFrameRef|scrubFrameRef|JOURNEY_FRAME_SECONDS \* 0\.7/,
  "The journey must not run competing RAF loops or seek below one full video frame",
);
assert.match(
  globalStyles,
  /\.journey-stage video\s*{[\s\S]*?object-position:\s*center;[\s\S]*?transform:\s*none;[\s\S]*?transition:\s*opacity[^;]*;[\s\S]*?@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.journey-stage video\s*{[\s\S]*?transition-duration:\s*0s;[\s\S]*?will-change:\s*auto;/,
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
assert.doesNotMatch(stage, /inert=\{!.*Interactive\}/);
assert.match(stage, /data-testid="journey-persistent-copy"/);
assert.match(stage, /journey-video-reverse/);
assert.match(stage, /reverseSourceAttachedRef\.current = true/);
assert.match(stage, /!railScrollingRef\.current/);

for (const variant of ["mobile", "desktop"]) {
  const forwardPath = path.join(root, "web", "public", "media", "hawaii", `journey-${variant}.mp4`);
  const reversePath = path.join(
    root,
    "web",
    "public",
    "media",
    "hawaii",
    `journey-${variant}-reverse.mp4`,
  );
  assert.ok(fs.existsSync(reversePath), `Missing ${variant} reverse journey asset`);
  assert.ok(
    fs.statSync(reversePath).size <= fs.statSync(forwardPath).size,
    `${variant} reverse journey asset must not exceed its forward counterpart`,
  );
  const header = fs.readFileSync(reversePath).subarray(0, 128).toString("latin1");
  assert.ok(header.includes("ftyp"), `${variant} reverse journey asset must be an MP4`);
  const probe = fs.readFileSync(reversePath).subarray(0, 1024 * 1024).toString("latin1");
  assert.ok(probe.indexOf("moov") > -1, `${variant} reverse journey asset must use faststart`);
}
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
assert.match(
  pagesPreviewBuild,
  /NODE_OPTIONS="\$\{NODE_OPTIONS:\+\$NODE_OPTIONS \}--max-old-space-size=2048"/,
  "The Pages build must append the 2GB cap after any caller-provided Node options",
);
assertPagesBuildInvalidConfigCleanup();
assert.match(
  pagesPreviewBuild,
  /RSS_LIMIT_MB="\$\{PAGES_BUILD_RSS_LIMIT_MB:-2048\}"/,
  "The complete Pages build process tree must default to a 2GB RSS ceiling",
);
assert.match(
  pagesPreviewBuild,
  /RSS_HEADROOM_MB="\$\{PAGES_BUILD_RSS_HEADROOM_MB:-256\}"/,
  "The Pages build must reserve 256MB below its hard RSS ceiling",
);
assert.match(
  pagesPreviewBuild,
  /RSS_POLL_SECONDS="\$\{PAGES_BUILD_RSS_POLL_SECONDS:-0\.1\}"/,
  "The Pages build must sample process-tree RSS every 0.1 seconds by default",
);
assert.match(pagesPreviewBuild, /RSS_TERMINATION_MB=\$\(\(RSS_LIMIT_MB - RSS_HEADROOM_MB\)\)/);
assert.match(pagesPreviewBuild, /ps -axo pid=,ppid=,rss=/);
assert.match(pagesPreviewBuild, /terminate_process_tree/);
assert.match(pagesPreviewBuild, /"\$NPM_BIN" run build -- --webpack/);
assert.ok(pagesPreviewBuild.includes(`-e 's|"/media/|"/hawaii/media/|g'`));
assert.ok(pagesPreviewBuild.includes(`-e "s|'/media/|'/hawaii/media/|g"`));
assert.ok(pagesPreviewBuild.includes(`-e 's|(/media/|(/hawaii/media/|g'`));
assert.match(
  pagesPreviewBuild,
  /WEB_DIR="\$\{PAGES_BUILD_WEB_DIR:-\$ROOT_DIR\/web\}"/,
);
assert.match(
  pagesPreviewBuild,
  /OUTPUT_DIR="\$\{PAGES_BUILD_OUTPUT_DIR:-\$ROOT_DIR\/pages-preview\/hawaii\}"/,
);
assert.match(pagesPreviewBuild, /NPM_BIN="\$\{PAGES_BUILD_NPM:-npm\}"/);
assert.match(pagesPreviewBuild, /STAGE_DIR="\$\(mktemp -d /);
assert.match(
  pagesPreviewBuild,
  /rsync -a --delete "\$TMP_ROOT\/web\/out\/" "\$STAGE_DIR\/"/,
);
assert.match(pagesPreviewBuild, /mv "\$OUTPUT_DIR" "\$BACKUP_DIR"/);
assert.match(pagesPreviewBuild, /mv "\$STAGE_DIR" "\$OUTPUT_DIR"/);
assert.match(pagesPreviewBuild, /trap cleanup EXIT/);
assert.match(pagesPreviewBuild, /trap 'exit 129' HUP/);
assert.match(pagesPreviewBuild, /trap 'exit 130' INT/);
assert.match(pagesPreviewBuild, /trap 'exit 143' TERM/);
assert.ok(
  pagesPreviewBuild.indexOf("trap cleanup EXIT") <
    pagesPreviewBuild.indexOf('TMP_ROOT="$(mktemp -d '),
  "Cleanup must be registered before the temporary build directory is created",
);
assert.doesNotMatch(
  pagesPreviewBuild,
  /(?:rm|mv)[^\n]*src\/app\/api/,
  "The Pages preview builder must never remove or move the source API routes",
);
assertPagesBuildSuccessBehavior();
assertPagesBuildFailureBehavior();
assertPagesBuildMemoryBehavior();
assert.match(arubaBuild, /--exclude src\/app\/api/);
assert.match(arubaBuild, /NEXT_PUBLIC_BASE_PATH=""/);
assert.match(arubaBuild, /OUTPUT_PARENT="\$ROOT_DIR\/output"/);
assert.match(arubaBuild, /OUTPUT_DIR="\$OUTPUT_PARENT\/aruba-static"/);
assert.match(arubaBuild, /aruba-static-readiness\.js/);
assert.match(arubaHeaders, /Accept-Ranges/);
assert.match(arubaHeaders, /Content-Security-Policy/);
assert.match(arubaHeaders, /X-Content-Type-Options/);
assert.match(arubaReadiness, /journey-desktop\.mp4/);
assert.match(arubaReadiness, /\/hawaii\//);
assert.match(arubaGuide, /form/i);
assert.match(arubaGuide, /non inviano|non consegnano/i);
assert.doesNotMatch(
  theFork,
  /hawaii-thefork-consent-v1|Carica il modulo TheFork/,
  "TheFork must not require or persist a second dedicated consent",
);
assert.match(
  consentSources,
  /hawaii-consent-v1/,
  "TheFork must follow the global consent decision",
);
assert.match(
  cookieBanner,
  /subscribeToConsent/,
  "The cookie banner must stay synchronized with the shared consent store",
);
assert.match(
  cookiePage,
  /ConsentPreferencesButton/,
  "The cookie page must let visitors revise their stored consent",
);
assert.match(
  consentSources,
  /hawaii-consent-change/,
  "TheFork must react immediately when global consent changes",
);
assert.match(theFork, /allow="payment \*"/, "TheFork iframe should only allow payments");
assert.match(
  theFork,
  /referrerPolicy="strict-origin-when-cross-origin"/,
  "TheFork iframe should use a restrictive referrer policy",
);
assert.match(theFork, /loading="eager"/, "TheFork iframe should load immediately after consent");
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
assert.doesNotMatch(
  productionSources,
  /attiva (?:il )?modulo TheFork|Carica il modulo TheFork/i,
  "Booking copy must not ask visitors to activate TheFork manually",
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

const retiredContentPatterns = [
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
];
for (const pattern of retiredContentPatterns) {
  assert.doesNotMatch(
    productionSources,
    pattern,
    `Retired content must not remain in production sources: ${pattern}`,
  );
}

const villageSouls = [
  ...villagePage.matchAll(/^\s{4}label: "(Beach|Restaurant|Sport|MUULab|Nightlife)",$/gm),
].map((match) => match[1]);
assert.deepEqual(
  villageSouls,
  ["Beach", "Restaurant", "Sport", "MUULab", "Nightlife"],
  "Village souls must expose MUULab before Nightlife",
);
assert.match(
  villagePage,
  /label: "MUULab"[\s\S]{0,260}href: "\/terrazza"/,
  "The MUULab village soul must lead to /terrazza",
);
assert.match(villagePage, /Le cinque anime/);
assert.match(villagePage, /cinque modi di viverlo/);
assert.match(villagePage, /pesce a pranzo e a cena/i);
assert.match(
  villagePage,
  /item\.label === "Nightlife"\s*\?\s*"sm:col-span-2"/,
  "Only the Nightlife card should span the full village grid",
);

const menuHighlightBlock =
  siteContent.match(/export const menuHighlights = \[([\s\S]*?)\n\];/)?.[1] || "";
for (const [title, href] of [
  ["Ristorante Mare", "#ristorante-mare"],
  ["MUULab Riviera", "#muulab"],
  ["Cocktail", "#cocktail"],
  ["Carta vini", "#carta-vini"],
]) {
  assert.match(
    menuHighlightBlock,
    new RegExp(`title: "${title}"[\\s\\S]{0,180}href: "${href}"`),
    `${title} must map to ${href}`,
  );
}
assert.match(
  menuPage,
  /<Link[\s\S]{0,180}data-testid="menu-highlight-link"[\s\S]{0,180}href=\{item\.href\}/,
  "Every menu highlight must be a native anchor link",
);
assert.match(menuPage, /menu-highlight-link[\s\S]{0,360}focus-visible:outline/);
assert.match(siteContent, /title: "Cocktail e aperitivo"[\s\S]{0,100}anchor: "cocktail"/);
assert.match(
  menuPage,
  /id=\{category\.anchor\}[\s\S]{0,200}scroll-mt-/,
  "Menu category anchors must reserve room below the sticky header",
);
assert.match(menuPage, /id="carta-vini"[\s\S]{0,120}scroll-mt-/);
assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior: auto/);
assert.match(
  siteContent,
  /title: "Bevande, birre e cantina"[\s\S]{0,320}action: \{ label: "Carta dei vini", href: "#carta-vini" \}/,
);
assert.match(
  menuPage,
  /data-testid="wine-list-link"[\s\S]{0,180}href=\{category\.action\.href\}/,
);
assert.match(
  siteContent,
  /label: "Menu MUULab completo"[\s\S]{0,180}href: "https:\/\/www\.muulab\.it\/wp-content\/uploads\/easy-pdf-restaurant-menu\/menu-files\/muulab\.-menu-general\.pdf"/,
);
assert.match(
  menuPage,
  /menu\.documentAction[\s\S]{0,520}target="_blank"[\s\S]{0,120}rel="noopener noreferrer"/,
  "The official MUULab PDF must open in an isolated tab",
);

const approvedHawaiiWines = hawaiiWineList
  .split("\n")
  .filter((line) => line.startsWith("- "))
  .map((line) => {
    const match = line.match(/^- (.+) - EUR (\d+)$/);
    assert.ok(match, `Invalid deterministic Hawaii wine row: ${line}`);
    return { name: match[1], price: match[2] };
  });
const publishedWineBlock =
  siteContent.match(
    /export const hawaiiWineSections[\s\S]*?\n\];\n\nexport const venueMenus/,
  )?.[0] || "";
const publishedHawaiiWines = [
  ...publishedWineBlock.matchAll(/\{ name: "([^"]+)", price: "€ (\d+)" \}/g),
].map((match) => ({ name: match[1], price: match[2] }));
assert.deepEqual(
  publishedHawaiiWines,
  approvedHawaiiWines,
  "The Hawaii wine section must exactly match the deterministic editorial source",
);

assert.match(siteContent, /title: "Giovedì Posh"/);
assert.match(
  siteContent,
  /title: "Giovedì Posh"[\s\S]{0,160}timing: "Giovedì"(?![\s\S]{0,80}\d{1,2}:\d{2})/,
  "Giovedì Posh must not publish a time",
);
assert.match(
  siteContent,
  /La serata del giovedì negli spazi esterni di Hawaii, con dj set e tavoli sotto le stelle\. In caso di pioggia, Posh si sposta in veranda\./,
);
assert.match(
  siteContent,
  /title: "Giovedì Posh"[\s\S]{0,620}href: bookingVenues\.hawaii\.whatsappUrl/,
  "Giovedì Posh must use the configured Hawaii WhatsApp CTA",
);
assert.match(eventPage, /eventFormats/);

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
  assert.doesNotMatch(
    disclosure,
    /consenso specifico/i,
    `${policy} must not claim that TheFork has a separate consent control`,
  );
  assert.match(
    disclosure,
    /consenso generale|scelta generale/i,
    `${policy} must explain that TheFork follows the global consent choice`,
  );
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
