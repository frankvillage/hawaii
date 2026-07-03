# Hawaii Urban Village Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire una piattaforma web premium per Hawaii Pescara che unisca homepage immersiva, landing SEO-first per i servizi, CMS headless, booking architecture, baseline security moderna e performance mobile-first.

**Architecture:** Il progetto viene implementato come applicazione Next.js SSR/ISR separata in `web/` e studio Sanity dedicato in `studio/`. La homepage usa capitoli scroll-driven e progressive enhancement; tutte le aree commerciali critiche vivono anche come pagine satellite HTML-first, indicizzabili e convertenti.

**Tech Stack:** Next.js App Router, TypeScript, React, Sanity, Tailwind o CSS tokens custom, Framer Motion o motion layer equivalente, Zod, Sentry, Cloudflare/CDN, Playwright, JSON-LD.

---

## Proposed file structure

### Application

- `web/package.json`
- `web/next.config.ts`
- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/app/beach/page.tsx`
- `web/src/app/ristorante-mare/page.tsx`
- `web/src/app/terrazza/page.tsx`
- `web/src/app/sport/page.tsx`
- `web/src/app/eventi/page.tsx`
- `web/src/app/feste-private/page.tsx`
- `web/src/app/prenotazioni/page.tsx`
- `web/src/app/menu/page.tsx`
- `web/src/app/faq/page.tsx`
- `web/src/app/contatti/page.tsx`
- `web/src/app/privacy/page.tsx`
- `web/src/app/cookie/page.tsx`
- `web/src/app/api/contact/route.ts`
- `web/src/app/api/private-events/route.ts`
- `web/src/app/api/consent/route.ts`
- `web/src/components/chrome/site-header.tsx`
- `web/src/components/chrome/site-footer.tsx`
- `web/src/components/home/narrative-homepage.tsx`
- `web/src/components/home/home-chapter.tsx`
- `web/src/components/home/chapter-hotspot.tsx`
- `web/src/components/sections/*`
- `web/src/components/booking/booking-hub.tsx`
- `web/src/components/legal/cookie-banner.tsx`
- `web/src/lib/cms/*`
- `web/src/lib/seo/*`
- `web/src/lib/security/*`
- `web/src/lib/analytics/*`
- `web/src/lib/forms/*`
- `web/src/styles/tokens.css`
- `web/src/styles/globals.css`
- `web/tests/smoke/*.spec.ts`
- `web/tests/a11y/*.spec.ts`

### CMS

- `studio/package.json`
- `studio/sanity.config.ts`
- `studio/schemaTypes/siteSettings.ts`
- `studio/schemaTypes/homepage.ts`
- `studio/schemaTypes/narrativeChapter.ts`
- `studio/schemaTypes/page.ts`
- `studio/schemaTypes/menu.ts`
- `studio/schemaTypes/event.ts`
- `studio/schemaTypes/sportOffering.ts`
- `studio/schemaTypes/faqItem.ts`
- `studio/schemaTypes/mediaAsset.ts`
- `studio/schemaTypes/index.ts`

### Documentation

- `docs/hawaii-urban-village-masterplan-2026.md`
- `docs/hawaii-urban-village-wireframe-content-model-2026.md`
- `docs/superpowers/plans/2026-04-07-hawaii-urban-village-platform.md`

## Delivery order

1. Platform foundation
2. Design system and shell
3. CMS schemas and content pipeline
4. Homepage narrative engine
5. Satellite pages
6. Booking, forms, consent, analytics
7. SEO/security/performance hardening
8. QA and launch readiness

## Backlog priority map

Must-have:
- app bootstrap
- CMS schemas core
- homepage immersive v1
- landing pages per entità
- menu hub
- bookings hub
- forms
- consent layer
- structured data
- security headers
- Playwright smoke suite

Should-have:
- hotspot ambientali
- event detail pages
- fine-tuned chapter motion
- analytics taxonomy completa
- image/video editorial automation

Nice-to-have:
- time-of-day personalization
- dynamic weather nuance
- advanced edge experiments

### Task 1: Bootstrap web app and studio

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/styles/globals.css`
- Create: `studio/package.json`
- Create: `studio/sanity.config.ts`
- Test: `web/tests/smoke/app-bootstrap.spec.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
import { test, expect } from "@playwright/test";

test("home responds with Hawaii Urban Village shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Urban Village");
  await expect(page.getByRole("link", { name: /prenota/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/app-bootstrap.spec.ts`
Expected: FAIL because app and test runner are not wired yet

- [ ] **Step 3: Scaffold the application and studio**

Commands:
- `npx create-next-app@latest web --ts --eslint --app --src-dir --import-alias "@/*"`
- `npm create sanity@latest studio -- --template clean --typescript`

Create minimal `layout.tsx`, `page.tsx`, and global CSS with a working shell.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/app-bootstrap.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web studio
git commit -m "feat: bootstrap hawaii urban village platform"
```

### Task 2: Establish design tokens, global shell, and navigation

**Files:**
- Create: `web/src/styles/tokens.css`
- Modify: `web/src/styles/globals.css`
- Create: `web/src/components/chrome/site-header.tsx`
- Create: `web/src/components/chrome/site-footer.tsx`
- Modify: `web/src/app/layout.tsx`
- Test: `web/tests/smoke/global-shell.spec.ts`

- [ ] **Step 1: Write the failing shell test**

```ts
test("global shell renders primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /beach/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /ristorante mare/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /terrazza/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/global-shell.spec.ts`
Expected: FAIL because navigation is not implemented

- [ ] **Step 3: Implement minimal shell**

Implement:
- brand lockup
- light navigation
- single primary CTA `Prenota`
- footer with contacts, legal, and booking hub link
- tokenized colors and typography

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/global-shell.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/styles web/src/components/chrome web/src/app/layout.tsx
git commit -m "feat: add global shell and design tokens"
```

### Task 3: Implement Sanity schemas for core entities

**Files:**
- Create: `studio/schemaTypes/siteSettings.ts`
- Create: `studio/schemaTypes/homepage.ts`
- Create: `studio/schemaTypes/narrativeChapter.ts`
- Create: `studio/schemaTypes/page.ts`
- Create: `studio/schemaTypes/menu.ts`
- Create: `studio/schemaTypes/event.ts`
- Create: `studio/schemaTypes/sportOffering.ts`
- Create: `studio/schemaTypes/faqItem.ts`
- Create: `studio/schemaTypes/mediaAsset.ts`
- Create: `studio/schemaTypes/index.ts`
- Test: `studio/schemaTypes/__tests__/schema-shape.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
import { schemaTypes } from "../index";

test("core schemas are registered", () => {
  const names = schemaTypes.map((item) => item.name);
  expect(names).toEqual(
    expect.arrayContaining([
      "siteSettings",
      "homepage",
      "narrativeChapter",
      "page",
      "menu",
      "event",
      "sportOffering",
      "faqItem",
      "mediaAsset",
    ]),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix studio test -- schema-shape`
Expected: FAIL because schemas are missing

- [ ] **Step 3: Implement schema set**

Implement fields aligned with:
- `docs/hawaii-urban-village-wireframe-content-model-2026.md`
- homepage sequence
- landing pages
- menus
- events
- sports
- FAQ

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix studio test -- schema-shape`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add studio/schemaTypes
git commit -m "feat: add core cms schemas for hawaii platform"
```

### Task 4: Build CMS data access layer and typed content queries

**Files:**
- Create: `web/src/lib/cms/client.ts`
- Create: `web/src/lib/cms/queries.ts`
- Create: `web/src/lib/cms/mappers.ts`
- Create: `web/src/lib/cms/get-homepage.ts`
- Create: `web/src/lib/cms/get-page.ts`
- Create: `web/src/lib/cms/get-global-settings.ts`
- Test: `web/tests/unit/cms-mappers.spec.ts`

- [ ] **Step 1: Write the failing data mapping test**

```ts
import { mapHomepage } from "@/lib/cms/mappers";

test("maps homepage chapters into UI-safe shape", () => {
  const result = mapHomepage({
    title: "Hawaii",
    chapters: [{ slug: "beach", title: "Beach", daypart: "morning" }],
  });

  expect(result.chapters[0]).toMatchObject({
    slug: "beach",
    title: "Beach",
    daypart: "morning",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/unit/cms-mappers.spec.ts`
Expected: FAIL because mapper does not exist

- [ ] **Step 3: Implement minimal data layer**

Requirements:
- no raw CMS payloads in components
- one mapper per core entity
- graceful null handling
- typed fallbacks for missing media

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/unit/cms-mappers.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/cms web/tests/unit/cms-mappers.spec.ts
git commit -m "feat: add typed cms data access layer"
```

### Task 5: Build homepage narrative shell

**Files:**
- Create: `web/src/components/home/narrative-homepage.tsx`
- Create: `web/src/components/home/home-chapter.tsx`
- Create: `web/src/components/home/chapter-hotspot.tsx`
- Modify: `web/src/app/page.tsx`
- Test: `web/tests/smoke/homepage-narrative.spec.ts`

- [ ] **Step 1: Write the failing homepage narrative test**

```ts
test("homepage renders the day-cycle chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/beach/i)).toBeVisible();
  await expect(page.getByText(/sport/i)).toBeVisible();
  await expect(page.getByText(/ristorante mare/i)).toBeVisible();
  await expect(page.getByText(/eventi/i)).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/homepage-narrative.spec.ts`
Expected: FAIL because homepage is still generic

- [ ] **Step 3: Implement homepage shell**

Requirements:
- hero alba
- narrative chapters in sequence
- chapter CTA discipline
- room for hotspot overlays
- HTML text content SSR-visible

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/homepage-narrative.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home web/src/app/page.tsx
git commit -m "feat: add homepage narrative shell"
```

### Task 6: Add scroll engine, motion gating, and loop connector

**Files:**
- Create: `web/src/components/home/use-chapter-scroll.ts`
- Create: `web/src/components/home/chapter-stage.tsx`
- Modify: `web/src/components/home/narrative-homepage.tsx`
- Modify: `web/src/components/home/home-chapter.tsx`
- Test: `web/tests/smoke/homepage-scroll.spec.ts`
- Test: `web/tests/a11y/reduced-motion.spec.ts`

- [ ] **Step 1: Write the failing interaction tests**

```ts
test("scroll advances active chapter state", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect(page.getByTestId("active-chapter")).toHaveAttribute("data-slug", "sport");
});

test("reduced motion disables cinematic transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-motion='disabled']")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/homepage-scroll.spec.ts web/tests/a11y/reduced-motion.spec.ts`
Expected: FAIL because scroll state and reduced-motion handling are not implemented

- [ ] **Step 3: Implement the interaction layer**

Requirements:
- sticky chapter progression
- progressive reveal
- reduced-motion branch
- no heavy GPU-only dependence
- loop connector chapter to dawn

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/homepage-scroll.spec.ts web/tests/a11y/reduced-motion.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home web/tests/smoke web/tests/a11y
git commit -m "feat: add scroll narrative interaction system"
```

### Task 7: Build satellite pages for core entities

**Files:**
- Create: `web/src/app/beach/page.tsx`
- Create: `web/src/app/ristorante-mare/page.tsx`
- Create: `web/src/app/terrazza/page.tsx`
- Create: `web/src/app/sport/page.tsx`
- Create: `web/src/app/eventi/page.tsx`
- Create: `web/src/app/feste-private/page.tsx`
- Create: `web/src/app/prenotazioni/page.tsx`
- Create: `web/src/app/menu/page.tsx`
- Create: `web/src/components/sections/entity-hero.tsx`
- Create: `web/src/components/sections/faq-block.tsx`
- Create: `web/src/components/booking/booking-hub.tsx`
- Test: `web/tests/smoke/entity-pages.spec.ts`

- [ ] **Step 1: Write the failing entity pages test**

```ts
for (const path of [
  "/beach",
  "/ristorante-mare",
  "/terrazza",
  "/sport",
  "/eventi",
  "/feste-private",
  "/prenotazioni",
  "/menu",
]) {
  test(`page ${path} renders H1 and CTA`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /prenota|scopri|richiedi/i })).toBeVisible();
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/entity-pages.spec.ts`
Expected: FAIL because routes do not exist

- [ ] **Step 3: Implement the page set**

Requirements:
- one clear H1 per route
- distinct identity for mare vs terrazza
- FAQ blocks
- page-specific CTAs
- internal links back into the ecosystem

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/entity-pages.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/app web/src/components/sections web/src/components/booking
git commit -m "feat: add entity landing pages and booking hub"
```

### Task 8: Implement menu, events, sport, and private-events content flows

**Files:**
- Create: `web/src/components/menu/menu-hub.tsx`
- Create: `web/src/components/events/event-list.tsx`
- Create: `web/src/components/sport/sport-grid.tsx`
- Create: `web/src/components/private-events/private-events-form.tsx`
- Modify: `web/src/app/menu/page.tsx`
- Modify: `web/src/app/eventi/page.tsx`
- Modify: `web/src/app/sport/page.tsx`
- Modify: `web/src/app/feste-private/page.tsx`
- Test: `web/tests/smoke/content-flows.spec.ts`

- [ ] **Step 1: Write the failing content flows test**

```ts
test("menu page exposes restaurant, terrace, cocktail, and wine routes", async ({ page }) => {
  await page.goto("/menu");
  await expect(page.getByText(/ristorante mare/i)).toBeVisible();
  await expect(page.getByText(/terrazza/i)).toBeVisible();
  await expect(page.getByText(/cocktail/i)).toBeVisible();
  await expect(page.getByText(/vini/i)).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/content-flows.spec.ts`
Expected: FAIL because structured content flows are missing

- [ ] **Step 3: Implement content-specific modules**

Requirements:
- menu hub by experience, not by file dump
- events as list with detail affordance
- sport page with clear booking path
- private events page with qualifying form

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/content-flows.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/menu web/src/components/events web/src/components/sport web/src/components/private-events
git commit -m "feat: add content flows for menu events sport and private events"
```

### Task 9: Add SEO metadata, internal linking, and structured data

**Files:**
- Create: `web/src/lib/seo/metadata.ts`
- Create: `web/src/lib/seo/schema.ts`
- Create: `web/src/lib/seo/breadcrumbs.ts`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/page.tsx`
- Modify: all entity routes in `web/src/app/*/page.tsx`
- Create: `web/src/app/sitemap.ts`
- Create: `web/src/app/robots.ts`
- Test: `web/tests/smoke/seo.spec.ts`

- [ ] **Step 1: Write the failing SEO test**

```ts
test("restaurant page exposes title, canonical, and structured data", async ({ page }) => {
  await page.goto("/ristorante-mare");
  await expect(page.locator("head title")).not.toBeEmpty();
  await expect(page.locator("head link[rel='canonical']")).toHaveCount(1);
  await expect(page.locator("script[type='application/ld+json']")).toHaveCount(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/seo.spec.ts`
Expected: FAIL because metadata and schema are not in place

- [ ] **Step 3: Implement SEO layer**

Requirements:
- metadata per route
- JSON-LD by entity type
- crawlable internal links
- sitemap and robots
- image-ready OG setup

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/seo.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/seo web/src/app/sitemap.ts web/src/app/robots.ts web/src/app
git commit -m "feat: add seo metadata and structured data layer"
```

### Task 10: Implement consent layer, analytics gating, and form endpoints

**Files:**
- Create: `web/src/components/legal/cookie-banner.tsx`
- Create: `web/src/lib/analytics/consent.ts`
- Create: `web/src/lib/analytics/events.ts`
- Create: `web/src/lib/forms/contact-schema.ts`
- Create: `web/src/lib/forms/private-events-schema.ts`
- Create: `web/src/app/api/contact/route.ts`
- Create: `web/src/app/api/private-events/route.ts`
- Create: `web/src/app/api/consent/route.ts`
- Test: `web/tests/smoke/consent.spec.ts`
- Test: `web/tests/unit/forms.spec.ts`

- [ ] **Step 1: Write the failing consent and forms tests**

```ts
test("analytics scripts stay blocked until consent", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /rifiuta/i })).toBeVisible();
  await expect(page.locator("[data-analytics='enabled']")).toHaveCount(0);
});

test("private event form rejects invalid payload", async () => {
  const result = privateEventSchema.safeParse({ email: "bad" });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/consent.spec.ts web/tests/unit/forms.spec.ts`
Expected: FAIL because consent and validation are not implemented

- [ ] **Step 3: Implement consent and form pipeline**

Requirements:
- reject as easy as accept
- no analytics before consent
- Zod validation server-side
- honeypot and rate limiting hooks
- consent logging endpoint

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/consent.spec.ts web/tests/unit/forms.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/legal web/src/lib/analytics web/src/lib/forms web/src/app/api
git commit -m "feat: add consent layer analytics gating and secure forms"
```

### Task 11: Apply security hardening and operational safeguards

**Files:**
- Create: `web/src/lib/security/headers.ts`
- Create: `web/src/middleware.ts`
- Modify: `web/next.config.ts`
- Create: `web/src/lib/security/rate-limit.ts`
- Create: `web/src/lib/security/csp.ts`
- Modify: `web/src/app/api/contact/route.ts`
- Modify: `web/src/app/api/private-events/route.ts`
- Test: `web/tests/smoke/security-headers.spec.ts`

- [ ] **Step 1: Write the failing security headers test**

```ts
test("responses include baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toBeTruthy();
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/smoke/security-headers.spec.ts`
Expected: FAIL because headers are not yet configured

- [ ] **Step 3: Implement hardening**

Requirements:
- CSP via header
- nosniff
- referrer policy
- permission policy
- form route throttling
- sanitized logging

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web run test -- web/tests/smoke/security-headers.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/security web/src/middleware.ts web/next.config.ts web/src/app/api
git commit -m "feat: add security hardening baseline"
```

### Task 12: Optimize performance, accessibility, and launch readiness

**Files:**
- Modify: `web/src/components/home/*`
- Modify: `web/src/components/sections/*`
- Create: `web/tests/a11y/keyboard-nav.spec.ts`
- Create: `web/tests/smoke/performance-budget.spec.ts`
- Create: `web/README.md`
- Create: `web/.env.example`

- [ ] **Step 1: Write the failing final readiness tests**

```ts
test("keyboard users can reach the primary booking CTA", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /prenota/i })).toBeFocused();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web run test -- web/tests/a11y/keyboard-nav.spec.ts`
Expected: FAIL if focus order and keyboard access are incomplete

- [ ] **Step 3: Finalize launch baseline**

Requirements:
- image sizes and lazy loading
- poster-first strategy
- reduced motion verified
- keyboard navigation
- `.env.example` aligned
- README with run/build/test/deploy notes

- [ ] **Step 4: Run full verification**

Run:
- `npm --prefix web run lint`
- `npm --prefix web run test`
- `npm --prefix web run build`
- `npm --prefix studio run build`

Expected:
- all commands PASS
- no blocking accessibility regressions
- no production build errors

- [ ] **Step 5: Commit**

```bash
git add web studio
git commit -m "chore: finalize launch baseline for hawaii platform"
```

## Execution notes

- Implement homepage and landing pages with real HTML content first, then add motion.
- Do not hide key content inside client-only effects.
- Keep MUULab terrace semantics distinct from the ground-floor restaurant.
- Treat booking orchestration as a product problem, not a footer link problem.
- Never ship tracking before consent.
- Never ship secrets to the browser.

## References for implementers

- `docs/hawaii-urban-village-masterplan-2026.md`
- `docs/hawaii-urban-village-wireframe-content-model-2026.md`
- `docs/superpowers/specs/2026-03-24-hawaii-immersive-homepage-design.md` only as historical context, not as the final source of truth
