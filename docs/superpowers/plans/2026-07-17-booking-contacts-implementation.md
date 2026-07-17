# Hawaii Booking and Contacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace provisional contact and booking paths with official, venue-separated Hawaii and MUULab channels, consent-gated TheFork pages, the new beach widget and registration-aware Wansport access.

**Architecture:** A focused `booking-config` module owns canonical venue/contact data and is consumed by content, pages and schema builders. A reusable client component mounts TheFork only after specific consent and always offers a direct fallback. Existing entity pages remain editorial and route booking intent to dedicated internal pages.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Schema.org JSON-LD, Node test runner, Playwright Chromium.

---

## File Structure

- Create `web/src/lib/booking-config.ts`: canonical, venue-keyed contacts and booking destinations.
- Create `web/src/components/booking/thefork-booking.tsx`: consent gate, iframe and external fallback.
- Create `web/src/app/prenotazioni/ristorante/page.tsx`: Hawaii booking route.
- Create `web/src/app/prenotazioni/muulab/page.tsx`: MUULab booking route.
- Create `tests/booking-config.test.mjs`: exact-data and separation regression tests.
- Create `tests/web-booking.js`: focused, media-blocked browser acceptance tests.
- Create `tests/run-web-booking.js`: self-contained dev-server lifecycle for focused browser TDD.
- Modify `web/src/app/prenotazioni/page.tsx`: booking hub, not a generic restaurant form.
- Modify `web/src/lib/site-content.ts`: official CTA destinations and visitor-facing copy.
- Modify `web/src/components/forms/booking-inquiry-form.tsx`: information/events-only request types.
- Modify `web/src/components/chrome/whatsapp-button.tsx`, `site-footer.tsx`, `web/src/app/contatti/page.tsx`: official contacts.
- Modify `web/src/lib/seo.ts`, `web/src/app/sitemap.ts`: venue-specific reservation schema and routes.
- Modify `web/next.config.ts`: narrowly authorize TheFork frames.
- Modify cookie/privacy content in `web/src/lib/site-content.ts`.
- Modify `tests/web-static.js`: source/config acceptance coverage; keep the existing full smoke suite unchanged unless a verified regression requires a scoped edit.

### Task 1: Canonical booking model

**Files:**
- Create: `web/src/lib/booking-config.ts`
- Create: `tests/booking-config.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write RED tests** importing the absent module and asserting exact values:

```js
assert.deepEqual(bookingVenues.hawaii, {
  id: "hawaii",
  name: "Hawaii",
  whatsappUrl: "https://wa.me/393516900701",
  phoneDisplay: "085 9396664",
  phoneHref: "tel:+390859396664",
  theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  internalBookingPath: "/prenotazioni/ristorante",
});
assert.deepEqual(bookingVenues.muulab, {
  id: "muulab",
  name: "MUULab Riviera",
  whatsappUrl: "https://wa.me/393333440051",
  phoneDisplay: "085 9396485",
  phoneHref: "tel:+390859396485",
  theForkUrl: "https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1",
  internalBookingPath: "/prenotazioni/muulab",
});
assert.equal(beachBookingUrl, "https://new-widget.spiagge.it/stabilimenti-balneari/prenotazione/it-pe-65123-lido-hawaii/insertPeriod?yb_booking_license=it-pe-65123-lido-hawaii");
assert.equal(sportBooking.portalUrl, "https://wansport.com");
assert.equal(sportBooking.whatsappUrl, "https://wa.me/393513200049");
assert.match(sportBooking.registrationNotice, /registrarsi/i);
assert.match(sportBooking.registrationNotice, /accedere/i);
assert.match(sportBooking.registrationNotice, /prenotare/i);
assert.doesNotMatch(sportBooking.portalUrl, /wansport\.com\/.+/);
```

- [ ] **Step 2: Run** `node --no-warnings --experimental-strip-types tests/booking-config.test.mjs` and confirm FAIL because the module does not exist.
- [ ] **Step 3: Before implementation, add RED rejection assertions** scanning the serialized model for the replaced Spiagge.it URL, SportClubby and old WhatsApp `393755175508`; Wansport must equal the generic origin with no path.
- [ ] **Step 4: Re-run the focused file** and confirm the expanded assertions still FAIL for the missing model.
- [ ] **Step 5: Implement** readonly `BookingVenue` records keyed by `hawaii` and `muulab`, plus beach and sport records. Include display phone, `tel`, WhatsApp, exact TheFork URL and internal booking path.
- [ ] **Step 6: Add mandatory root script** `"test:web:booking": "node --no-warnings --experimental-strip-types tests/booking-config.test.mjs"` and run `npm run test:web:booking` GREEN.
- [ ] **Step 7: Commit** `git commit -m "Add canonical booking contact model"`.

### Task 2: Secure TheFork component, routes and booking hub

**Files:**
- Create: `web/src/components/booking/thefork-booking.tsx`
- Create: `web/src/app/prenotazioni/ristorante/page.tsx`
- Create: `web/src/app/prenotazioni/muulab/page.tsx`
- Create: `tests/web-booking.js`
- Create: `tests/run-web-booking.js`
- Modify: `web/src/app/prenotazioni/page.tsx`
- Modify: `web/src/components/forms/booking-inquiry-form.tsx`
- Modify: `web/next.config.ts`
- Modify: `tests/web-static.js`
- Modify: `package.json`

- [ ] **Step 1: Implement only the test infrastructure.** Add `test:web:booking:browser` -> `tests/run-web-booking.js`. The runner obtains a free port from the OS, starts one Next dev child, applies a 15-second readiness deadline, rejects immediately if the child exits, propagates the browser test exit status, and terminates/waits for the child in `finally`.
- [ ] **Step 2: Write browser RED tests before any route/component code.** Each venue case uses a fresh context inside `try/finally`; the outer browser also closes in `finally`. Block all image/media requests. Assert correct venue name, `Prenotazioni telefoniche con assistente virtuale`, exact phone/WhatsApp and always-visible TheFork fallback while iframe and `widget.thefork.com` request counts remain zero.
- [ ] **Step 3: Add RED consent coverage in the same tests:** click global `Rifiuta`, assert zero TheFork requests, click `Carica il modulo TheFork`, intercept exactly one vendor request, then assert one iframe with exact `src`, title, `allow`, referrer policy and height. Re-assert the fallback remains visible with exact `href`, `target="_blank"` and `rel` containing `noopener noreferrer`.
- [ ] **Step 4: Add RED static assertions** requiring storage key `hawaii-thefork-consent-v1`, `allow="payment *"`, restrictive referrer policy, lazy loading, secure external-link attributes and `frame-src https://widget.thefork.com;` while retaining `frame-ancestors 'none'`.
- [ ] **Step 5: Run the browser/static suites.** The first browser run may report 404 because routes do not exist; record it, then add only minimal route shells with headings and no booking component. Re-run and confirm every intended test reaches its booking assertion and FAILS for missing contact/consent/iframe behavior; static checks must still fail for the absent component/CSP.
- [ ] **Step 6: Implement `TheForkBooking({ venue }: { venue: BookingVenue })`** using hydration-safe specific-consent state. Before consent render contact alternatives, activation control and direct fallback; after consent mount the exact iframe below while retaining the fallback.

```tsx
<iframe
  src={venue.theForkUrl}
  title={`Prenotazione ${venue.name} con TheFork`}
  allow="payment *"
  loading="lazy"
  referrerPolicy="strict-origin-when-cross-origin"
  className="w-full border-0"
  style={{ height: "max(800px, calc(100svh - 7rem))" }}
/>
```

- [ ] **Step 7: Complete both routes** with distinct metadata and the reusable component, then update CSP in the same reversible boundary. Do not loosen any unrelated directive.
- [ ] **Step 8: Rewrite `/prenotazioni`** to route Hawaii/MUULab internally, beach externally, sport through `/sport`, and events/private parties through request routes. Use exact labels `Prenota Hawaii su TheFork` and `Prenota MUULab su TheFork`.
- [ ] **Step 9: Restrict the generic form** to `Informazioni generali`, `Serate ed eventi`, and `Feste private`.
- [ ] **Step 10: Run** `npm run test:web:booking:browser`, `npm run test:web:static`, `npm --prefix web exec tsc -- --noEmit`, and `npm --prefix web run lint -- --max-warnings=0` GREEN.
- [ ] **Step 11: Commit** `git commit -m "Add secure Hawaii and MUULab booking pages"`.

### Task 3: Propagate official contacts and CTA destinations

**Files:**
- Modify: `web/src/lib/site-content.ts`
- Modify: `web/src/components/chrome/whatsapp-button.tsx`
- Modify: `web/src/components/chrome/site-footer.tsx`
- Modify: `web/src/app/contatti/page.tsx`
- Modify: `web/src/app/menu/page.tsx` if CTA values are not solely data-driven.
- Modify: `web/src/app/villaggio/page.tsx` if local CTA literals remain.
- Modify: `tests/web-static.js`
- Modify: `tests/web-booking.js`

- [ ] **Step 1: Add RED static tests** scanning source/content for all official contacts and rejecting old values: old WhatsApp, old Spiagge.it URL and SportClubby.
- [ ] **Step 2: Add RED focused browser tests** proving the global WhatsApp is Hawaii `351 6900701`, restaurant CTA is labelled `Prenota Hawaii su TheFork` and uses `/prenotazioni/ristorante`, MUULab is labelled `Prenota MUULab su TheFork` and uses `/prenotazioni/muulab`, beach uses the exact new widget, and Eventi uses Hawaii information WhatsApp.
- [ ] **Step 3: Run** `npm run test:web:booking`, `npm run test:web:booking:browser`, and `npm run test:web:static`; confirm the new assertions FAIL for current provisional content.
- [ ] **Step 4: Update `siteMeta` consumers** to import canonical booking records instead of reconstructing phone numbers.
- [ ] **Step 5: Update entity records:**
  - Ristorante Mare primary CTA -> `/prenotazioni/ristorante`.
  - MUULab primary CTA -> `/prenotazioni/muulab`.
  - Beach -> exact new Spiagge.it URL.
  - Sport -> Wansport with visible registration/login notice and WhatsApp assistance.
  - Eventi -> Hawaii information/events WhatsApp.
- [ ] **Step 6: Update quick booking, booking options, menu actions, homepage scene actions, footer and contact page without changing unrelated copy/layout.**
- [ ] **Step 7: Run** `npm run test:web:booking`, `npm run test:web:booking:browser`, and `npm run test:web:static` GREEN; do not run the full video smoke suite during this task.
- [ ] **Step 8: Commit** `git commit -m "Propagate official booking contacts and links"`.

### Task 4: Privacy, sitemap and entity SEO

**Files:**
- Modify: `web/src/lib/seo.ts`
- Modify: `web/src/app/sitemap.ts`
- Modify: `web/src/lib/site-content.ts`
- Modify: `tests/web-static.js`
- Modify: `tests/web-booking.js`

- [ ] **Step 1: Add RED tests** for both sitemap routes, unconditional TheFork privacy/cookie disclosure, explicit `bookingVenueId` on both Restaurant entity records, per-venue phone and cross-link-safe `ReserveAction` targets. Add browser assertions against each rendered Restaurant JSON-LD block so the Hawaii page cannot expose MUULab phone/target and vice versa.
- [ ] **Step 2: Run** `npm run test:web:booking` and `npm run test:web:static`; confirm the new schema/sitemap/privacy assertions FAIL.
- [ ] **Step 3: Extend `EntityPage` with `bookingVenueId?: BookingVenueId`;** set `hawaii` on `ristorante-mare` and `muulab` on `terrazza`. Do not infer booking identity from slug inside the schema builder.
- [ ] **Step 4: Update schema builder** to resolve `page.bookingVenueId` through the canonical model. Each Restaurant emits its venue phone, `acceptsReservations: true`, and `potentialAction: { "@type": "ReserveAction", target: internalBookingPath }`. Tests must reject Hawaii/MUULab target or phone cross-links.
- [ ] **Step 5: Add both booking routes to sitemap** with sensible `changeFrequency` and priority below entity landing pages.
- [ ] **Step 6: Update privacy/cookie sections** to identify TheFork, the consent gate and the third-party network transfer before booking data is entered.
- [ ] **Step 7: Run `npm run test:web:booking`, `npm run test:web:static`, `npm --prefix web exec tsc -- --noEmit`, and `npm --prefix web run lint -- --max-warnings=0` GREEN.**
- [ ] **Step 8: Commit** `git commit -m "Index and disclose external booking integrations"`.

### Task 5: Production verification and reversible handoff

**Files:**
- Modify only for scoped verification failures.

- [ ] **Step 1: From repository root run** `npm run test:web:booking`, `npm run test:web:booking:browser` (self-managed dev server), `npm run test:web:journey`, `npm run test:web:static`, `npm --prefix web run lint -- --max-warnings=0`, `npm --prefix web exec tsc -- --noEmit`, and `git diff --check`.
- [ ] **Step 2: Run memory-capped server build from root:** `NODE_OPTIONS=--max-old-space-size=2048 npm --prefix web run build`.
- [ ] **Step 3: Start the production server exactly once and guarantee cleanup:**

```bash
set -euo pipefail
if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null; then
  echo "Port 3000 is already in use; refusing to test against an unknown server." >&2
  exit 1
fi
(
  cd web
  exec ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3000
) >/tmp/hawaii-next.log 2>&1 &
server_pid=$!
cleanup_server() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup_server EXIT
for _ in {1..40}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    wait "$server_pid" || true
    cat /tmp/hawaii-next.log >&2
    exit 1
  fi
  if curl -fsS http://127.0.0.1:3000/ >/dev/null; then break; fi
  sleep 0.25
done
curl -fsS http://127.0.0.1:3000/ >/dev/null
WEB_BASE_URL=http://127.0.0.1:3000 node tests/web-booking.js
WEB_BASE_URL=http://127.0.0.1:3000 node tests/web-smoke.js
cleanup_server
trap - EXIT
! lsof -nP -iTCP:3000 -sTCP:LISTEN
```

- [ ] **Step 4: Verify static Pages export in an isolated temporary worktree** so production API routes are never altered in the main checkout:

```bash
set -euo pipefail
pages_parent=$(mktemp -d /tmp/hawaii-pages-check.XXXXXX)
pages_check="$pages_parent/worktree"
cleanup_pages() {
  git worktree remove --force "$pages_check" 2>/dev/null || true
  rmdir "$pages_parent" 2>/dev/null || true
}
trap cleanup_pages EXIT
git worktree add --detach "$pages_check" HEAD
mv "$pages_check/web/src/app/api" "$pages_check/.api-disabled"
ln -s "$PWD/web/node_modules" "$pages_check/web/node_modules"
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/hawaii NODE_OPTIONS=--max-old-space-size=2048 npm --prefix "$pages_check/web" run build
test -f "$pages_check/web/out/prenotazioni/ristorante/index.html"
test -f "$pages_check/web/out/prenotazioni/muulab/index.html"
cleanup_pages
trap - EXIT
```

- [ ] **Step 5: The focused browser suite is the evidence** that no TheFork request occurs before explicit activation, including after global rejection, and that each fresh venue context requests only its correct URL after activation.
- [ ] **Step 6: The production block in Step 3 is the single full existing smoke-suite execution** after focused tests pass; do not run it elsewhere.
- [ ] **Step 7: Check Git history** contains separate commits for spec, model, component/routes, propagation and security/SEO; record their SHAs for selective revert.
- [ ] **Step 8: Do not push or deploy.** Ask for explicit approval before updating GitHub or Pages.
