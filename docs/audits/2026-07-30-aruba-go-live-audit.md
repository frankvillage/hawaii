# Aruba go-live audit - 30 July 2026

## Decision

**Do not deploy to Aruba yet.** The source-level blockers below have been
remediated, but the final Aruba staging proof and the data controller's privacy
approval are still required before the WordPress site is moved to `OLD` or any
public traffic is switched.

1. Verify headers, HTTPS redirects, byte-range video delivery and cache policy
   on Aruba staging.
2. Obtain the data controller's approval of the final cookie/privacy text and
   third-party inventory.
3. Configure the future administration service separately; it is intentionally
   not part of the public static deployment.

No public WordPress content, Aruba directory or deployment configuration was
changed during this audit.

## Verified scope

- Current source revision reviewed: `7e171a2`.
- Static package checked: `output/aruba-static`.
- Aruba static readiness test: passed.
- Internal static `href` and `src` resolution: no broken targets found.
- Sitemap: 16 unique URLs, including the root canonical URL.
- Public content pages: title, description, canonical URL and textual Open
  Graph metadata are present. The 404 documents are intentionally excluded
  from this statement.
- Images in the static HTML: 86 image elements, all with an `alt` attribute.
- No committed credential, environment file, source map or analytics script was
  found in the reviewed static output.
- TheFork remains blocked until the user chooses the consent option.

These checks are code and export checks. Headers, video byte ranges, HTTPS
redirects and caching must still be verified against the Aruba staging domain.

## Blockers before production

### SEC-01 - Next.js dependency advisory

**Status: remediated locally; final verification required on the committed release.**

- **Severity:** High
- **Location:** `web/package.json`, `web/package-lock.json`
- **Evidence:** The project pins `next@16.2.10`. The last successful dependency
  audit reported three high-severity findings and a non-major fix at
  `16.2.12`, including published Next.js server/proxy advisories.
- **Impact:** The Aruba output is static and does not execute Next.js server
  routes, but the build chain and any non-static future deployment retain known
  vulnerable dependencies.
- **Required change:** Upgrade Next.js and its lockfile to `16.2.12`, then run
  `npm audit --omit=dev`, lint, tests and an Aruba static build again.
- **Reference:** [GitHub Security Advisory GHSA-6gpp-xcg3-4w24](https://github.com/advisories/GHSA-6gpp-xcg3-4w24)

### DEPLOY-01 - Form API routes are not part of a static export

**Status: remediated locally.** The three rendered forms now offer direct,
verified contact actions and no longer reference unavailable API routes.

- **Severity:** High
- **Location:** `scripts/build-static-aruba.sh`; `web/src/components/forms/`
- **Evidence:** The export intentionally excludes `src/app/api`. The browser
  forms still submit to `/api/contact`, `/api/booking-inquiry` and
  `/api/private-events`.
- **Impact:** On the static Aruba site these paths will return 404, so personal
  data may appear to be submitted without reaching the business.
- **Required change:** Choose one safe delivery path before launch:
  - a small PHP endpoint on Aruba with server-side validation, honeypot, rate
    limiting, authenticated SMTP and a defined retention period;
  - a managed HTTPS form endpoint restricted to the Hawaii origin; or
  - temporary replacement of the forms with the existing phone and WhatsApp
    actions.
- **Acceptance check:** Submit each form on staging and confirm only the
  intended recipient receives it; verify validation, rate limiting and an
  error state without exposing personal data in browser logs.

### PRIV-01 - Consent cannot be demonstrated from the static site

**Status: technical layer remediated; legal approval remains required.** The
banner now links to both policies and exposes preferences without calling an
absent static API. A server-side consent register remains a separate decision
if the appointed privacy adviser requires retained proof.

- **Severity:** High
- **Location:** `web/src/components/legal/cookie-banner.tsx`,
  `web/src/lib/consent.ts`, `web/src/app/api/consent/route.ts`
- **Evidence:** The choice is stored in browser `localStorage`. The optional
  `/api/consent` request is absent in the static export, and its current route
  does not persist a consent record.
- **Impact:** There is no retained evidence of policy version, timestamp or
  choice when such evidence is required for the actual third-party services.
- **Required decision:** The data controller and privacy adviser must confirm
  whether demonstrable consent is required for the final cookie inventory. If
  it is, use a minimal server-side consent register or a compliant consent
  platform; do not send raw browsing history or unnecessary identifiers.

## Security hardening required for launch

### SEC-02 - Server headers need a staging proof

- **Severity:** Medium
- **Location:** `deploy/aruba/.htaccess.example`
- **Evidence:** CSP, `X-Frame-Options`, `X-Content-Type-Options`, referrer and
  permissions policies are conditional on Apache `mod_headers` and on Aruba
  allowing `.htaccess` overrides.
- **Impact:** If either condition is unavailable, the output is served without
  those protections.
- **Required check:** On the real staging hostname, assert the final response
  includes all configured headers. Also verify `video/mp4`, `Accept-Ranges:
  bytes`, a 206 response to a range request, HTTPS redirect and the canonical
  `www` host before traffic is switched.

### SEC-03 - CSP can be narrowed after compatibility testing

- **Severity:** Low
- **Location:** `deploy/aruba/.htaccess.example`
- **Evidence:** The current policy allows `script-src 'unsafe-inline'` and
  `connect-src https:`.
- **Impact:** These directives reduce CSP protection if a future XSS defect is
  introduced.
- **Recommended change:** First deploy a report-only policy on staging, then
  narrow `connect-src` to the known services and replace inline allowances with
  hashes where the static build permits it. Do not change this directly on the
  production domain without observing the actual browser and TheFork flow.

### SEC-04 - Proposed access model for the future administration area

The public Aruba website must remain static. The administration area should be
separate, at `admin.hawaiipescara.it`, with no shared public credentials and no
password stored in the repository.

- Use Google SSO behind an access gateway with mandatory MFA.
- Give the property an **Editor/Publisher** role for menus, prices and event
  copy; give the Hawaii agency an independent **Editor/Reviewer** account and
  the technical owner a separate **Administrator** account. Never share an
  account.
- Store menu data as structured records, not hand-edited page markup.
- Every publish action should create an audit log and trigger a GitHub Actions
  build plus an FTPS deployment to a versioned Aruba release directory.
- Store only deployment credentials in GitHub Actions secrets; use FTPS or
  SFTP, never a credential in source control.
- Retain the current public release until smoke tests pass, then switch the
  document root atomically. Keep WordPress in `OLD` untouched for rollback.

The recommended implementation is a small managed content studio with role
based access, rather than an in-page password form. It will need a separate
technical design and explicit approval because it introduces identity,
publishing and data-storage services.

## Privacy and cookie launch requirements

This is an implementation audit, not legal advice. The owner or appointed
privacy professional must approve the final documents before public launch.

- Link Privacy and Cookie pages from the first layer of the banner, alongside
  equal-weight accept/reject choices.
- Provide a persistent way to reopen or change the choice.
- Inventory every third party actually contacted after consent: TheFork,
  WhatsApp, Spiagge.it, Wansport/OneSport, map/social embeds and any future
  analytics.
- State purposes, legal bases, retention, recipients/roles, international
  transfers where applicable and links to each supplier's policy.
- Remove any declared analytics or profiling category that is not actually
  present, or configure it behind a granular consent category if it is added.
- Keep TheFork blocked until the relevant consent exists. Current code already
  follows this principle.
- If form delivery is introduced, update the privacy text with the real
  recipient, data processor, retention and contact process before enabling it.

The design should be validated against the Italian Garante's
[cookie guidance](https://www.garanteprivacy.it/temi/cookie) and the controller's
specific processing register.

## SEO and discoverability

### Current technical baseline

- `robots.txt` allows crawling and declares the canonical sitemap.
- The sitemap is valid in structure, contains 16 unique routes and uses the
  production domain.
- Public pages have unique page-level text metadata and canonical URLs.
- Restaurant, sport, event venue and FAQ structured data are present.
- All reviewed static image elements include alternative text.
- Internal links resolve in the static package.

### Required improvements before or immediately after launch

- Add a dedicated `og:image` and Twitter image for each public landing page.
  At present the generated site-wide image appears on the homepage and error
  pages only; section pages have no page-specific social preview.
- Replace `new Date()` in `web/src/app/sitemap.ts` with real content update
  dates when the content model is introduced. This prevents every URL from
  claiming a new modification on every build.
- Add `image`, `priceRange`, `geo`, accurate opening hours and verified
  `sameAs` profiles to the LocalBusiness/Restaurant data only after the owner
  confirms them.
- Keep all menu PDF links crawlable, label them clearly and provide concise
  HTML summaries so search and AI assistants can understand the offering.
- Verify production ownership in Google Search Console, submit the sitemap and
  inspect the first crawl results. This must happen on the final Aruba domain,
  not on GitHub Pages.

## Performance and media

- Static output size: approximately 72 MB.
- The four journey video files account for about 50 MB in total.
- The mobile forward video is approximately 9 MB; the mobile reverse video is
  approximately 7.8 MB.
- Self-hosted fonts use a swap strategy, avoiding an external font dependency.
- HTML is configured not to be cached; versioned CSS, JS and fonts have long
  cache lifetimes; video cache is currently one day.

### Release requirements

- Test the mobile journey on a real iPhone over 4G and Wi-Fi after Aruba CDN/
  cache headers are live. A local build cannot prove iOS media behaviour.
- Confirm byte-range streaming and `video/mp4` delivery from Aruba with a
  206-range request.
- Keep one initial poster frame and defer all non-journey imagery below the
  fold.
- Do not add more full-resolution videos until the existing sequence has a
  measured mobile loading budget. A CDN is recommended if Aruba delivery fails
  the real-device test.

## Staged deployment sequence

1. Apply and verify `SEC-01`, `DEPLOY-01` and `PRIV-01` in a review branch.
2. Build a clean Aruba artifact and upload it to an isolated staging directory.
3. Run browser, form, header, range-video, cookie and direct-route smoke tests
   on staging.
4. Back up the current WordPress document root into `OLD` without deleting it.
5. Publish the tested versioned release atomically, then retain the prior
   release for rollback.
6. Validate Search Console, sitemap fetch and conversion links on the live
   domain.

## Evidence commands

```bash
ARUBA_REQUIRE_CLEAN=1 npm run build:web:aruba
npm run test:web:aruba
node tests/aruba-static-readiness.js output/aruba-static
npm audit --omit=dev
```

The dependency audit requires registry access. If it fails due to a network
error, rerun it in the release environment before accepting the result.
