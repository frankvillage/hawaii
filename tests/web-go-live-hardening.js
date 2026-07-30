"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const webRoot = path.join(root, "web");
const staticRoot = path.join(root, "output", "aruba-static");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function collectStaticText(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectStaticText(entryPath);
    return /\.(?:css|html|js|txt)$/.test(entry.name)
      ? [fs.readFileSync(entryPath, "utf8")]
      : [];
  });
}

function versionAtLeast(actual, required) {
  const actualParts = actual.split(".").map(Number);
  const requiredParts = required.split(".").map(Number);

  return actualParts.every((part, index) => {
    if (actualParts.slice(0, index).join(".") !== requiredParts.slice(0, index).join(".")) {
      return true;
    }

    return part >= requiredParts[index];
  });
}

const webPackage = JSON.parse(read("web/package.json"));
assert.ok(
  versionAtLeast(webPackage.dependencies.next, "16.2.12"),
  `Next.js must be patched to 16.2.12 or later, received ${webPackage.dependencies.next}`,
);
assert.ok(
  versionAtLeast(webPackage.overrides.postcss, "8.5.25"),
  `PostCSS override must be patched to 8.5.25 or later, received ${webPackage.overrides.postcss}`,
);
assert.ok(
  versionAtLeast(webPackage.dependencies.sharp, "0.35.3"),
  `Sharp must be patched to 0.35.3 or later, received ${webPackage.dependencies.sharp}`,
);
assert.equal(
  typeof webPackage.overrides.sharp,
  "string",
  "Sharp must be pinned with an npm override for Next.js' nested dependency",
);
assert.ok(
  versionAtLeast(webPackage.overrides.sharp, "0.35.3"),
  `Sharp override must be patched to 0.35.3 or later, received ${webPackage.overrides.sharp}`,
);
assert.ok(
  webPackage.devDependencies.eslint.startsWith("9.") &&
    versionAtLeast(webPackage.devDependencies.eslint, "9.39.2"),
  `ESLint must use the patched Next-compatible 9.39.2 line, received ${webPackage.devDependencies.eslint}`,
);
assert.ok(
  versionAtLeast(webPackage.overrides["@babel/core"], "8.0.1"),
  `Babel must be patched to 8.0.1 or later, received ${webPackage.overrides["@babel/core"]}`,
);
assert.ok(
  versionAtLeast(webPackage.overrides.minimatch, "10.2.6"),
  `Minimatch must be patched to 10.2.6 or later, received ${webPackage.overrides.minimatch}`,
);
assert.ok(
  versionAtLeast(webPackage.overrides["brace-expansion"], "5.0.9"),
  `Brace expansion must be patched to 5.0.9 or later, received ${webPackage.overrides["brace-expansion"]}`,
);

const forms = [
  "web/src/components/forms/contact-form.tsx",
  "web/src/components/forms/booking-inquiry-form.tsx",
  "web/src/components/forms/private-event-form.tsx",
];

for (const form of forms) {
  assert.doesNotMatch(
    read(form),
    /fetch\(\"\/api\//,
    `${form} must not submit to an API missing from the Aruba static export`,
  );
}

const cookieBanner = read("web/src/components/legal/cookie-banner.tsx");
assert.match(cookieBanner, /\/privacy/, "Cookie banner must link to the privacy policy");
assert.match(cookieBanner, /\/cookie/, "Cookie banner must link to cookie information");
assert.match(cookieBanner, /Gestisci preferenze/, "Cookie banner must expose consent preferences");

const legalContent = read("web/src/lib/site-content.ts");
for (const policyUrl of [
  "https://www.thefork.it/legal",
  "https://www.whatsapp.com/legal/privacy-policy-eea",
  "https://www.spiagge.it/privacy-policy/?lang=it",
  "https://wansport.com/privacy-policy/",
]) {
  assert.match(
    legalContent,
    new RegExp(policyUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Legal pages must link to the current external service policy: ${policyUrl}`,
  );
}
assert.doesNotMatch(
  legalContent,
  /CookieLawInfo|cookielawinfo|Google Fonts/i,
  "Legal pages must not describe legacy WordPress-only services",
);

const contentRoutes = [
  "index.html",
  "beach/index.html",
  "ristorante-mare/index.html",
  "terrazza/index.html",
  "sport/index.html",
  "eventi/index.html",
  "feste-private/index.html",
  "menu/index.html",
  "prenotazioni/index.html",
  "contatti/index.html",
];

for (const route of contentRoutes) {
  const filePath = path.join(staticRoot, route);
  assert.ok(fs.existsSync(filePath), `Missing static route: ${route}`);
  assert.match(
    fs.readFileSync(filePath, "utf8"),
    /<meta property="og:image" content="[^"]+"/,
    `${route} must publish an Open Graph image`,
  );
  assert.match(
    fs.readFileSync(filePath, "utf8"),
    /<meta name="twitter:image" content="[^"]+"/,
    `${route} must publish a Twitter image`,
  );
  assert.doesNotMatch(
    fs.readFileSync(filePath, "utf8"),
    /<title>[^<]*Hawaii Pescara \| Hawaii Pescara<\/title>/,
    `${route} must not repeat the brand in its title`,
  );
}

const staticText = collectStaticText(staticRoot).join("\n");
assert.doesNotMatch(
  staticText,
  /\/api\/(?:contact|booking-inquiry|private-events|consent)/,
  "Aruba static output must not reference unavailable API routes",
);

const sitemap = fs.readFileSync(path.join(staticRoot, "sitemap.xml"), "utf8");
assert.doesNotMatch(sitemap, /<lastmod>/, "Sitemap must not fabricate a modified date for every build");

console.log("go-live hardening checks passed");
