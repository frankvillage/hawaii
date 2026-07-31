# Menu Editor and Allergen Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable authorized Studio users to publish Hawaii and MUULab menu updates, including validated allergen codes, into the verified static website build.

**Architecture:** A dependency-free shared contract defines the permitted allergen values and price format. Sanity Studio and the web build consume that contract independently; the Next build retrieves and atomically validates the two fixed published menu documents with Zod before the existing menu page renders them. If CMS configuration or content is invalid, the established local menu stays active. GitHub Actions supports direct workflow dispatch from a restricted Sanity webhook and retains a menu snapshot manifest with each build.

**Tech Stack:** Sanity Studio 4, Next.js 16 static export, TypeScript, Zod, GitHub Actions, Node.js test runner.

---

## File Structure

- Create: `shared/menu-contract.ts` — source of truth for allergen definitions, allowed codes and price validation.
- Create: `web/src/lib/menu-cms.ts` — CMS query, Zod validation, transformation and local fallback.
- Create: `web/scripts/export-sanity-menu-seed.ts` — deterministic export of current local menu into two Studio import records.
- Modify: `studio/schemaTypes/menuType.ts` — ordered categories and dishes with controlled allergens and availability.
- Modify: `web/src/app/menu/page.tsx` — async static page using validated effective menu data.
- Modify: `web/.env.example`, `studio/.env.example` — placeholder-only configuration documentation.
- Modify: `.github/workflows/deploy-pages.yml` — manual/Sanity workflow dispatch inputs, secret-only CMS build configuration and snapshot artifact retention.
- Modify: `tests/web-static.js` — source-level contract, schema, fallback and workflow coverage.
- Modify: `package.json` — deterministic seed-export command and focused menu-content test command.
- Modify: `docs/admin-content-management-blueprint.md` — activation and immediate-publish operations.

## Task 1: Establish the shared menu contract

**Files:**
- Create: `shared/menu-contract.ts`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Write failing contract assertions**

Require a shared contract file to export the fourteen official codes, a price validator and a function that rejects values outside `1..14` or duplicates.

- [ ] **Step 2: Run the static test to verify it fails**

Run: `npm run test:web:static`

Expected: FAIL because `shared/menu-contract.ts` does not exist.

- [ ] **Step 3: Implement the minimal contract**

Export `allergenDefinitions`, `allergenCodes`, `isAllergenCode`, `areUniqueAllergenCodes` and `isMenuPrice`. Keep the file dependency-free so Sanity and Next can import exactly the same rules.

- [ ] **Step 4: Run the static test to verify it passes**

Run: `npm run test:web:static`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add shared/menu-contract.ts tests/web-static.js && git commit -m "feat: add shared menu content contract"`

## Task 2: Expand the Studio content model

**Files:**
- Modify: `studio/schemaTypes/menuType.ts`
- Modify: `studio/.env.example`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Write failing schema assertions**

Require exactly two fixed menu document IDs, ordered category/dish arrays, default-true availability, Studio allergy checkboxes backed by the shared contract, and publish-blocking validation for required fields and duplicate codes.

- [ ] **Step 2: Run the static test to verify it fails**

Run: `npm run test:web:static`

Expected: FAIL because the current Studio schema contains only top-level menu metadata.

- [ ] **Step 3: Implement the constrained Studio schema**

Use fixed venue options `hawaii` and `muulab`; category title/note; dish name, price, note, available and allergens. Do not expose technical anchors, booking links, arbitrary HTML or arbitrary image URLs.

- [ ] **Step 4: Document environment placeholders**

Add only project/dataset placeholders and Studio host guidance. Never add tokens, OAuth credentials or webhook values to `.env.example`.

- [ ] **Step 5: Run verification**

Run: `npm run test:web:static && npm --prefix studio run build`

Expected: PASS.

- [ ] **Step 6: Commit**

Run: `git add studio/schemaTypes/menuType.ts studio/.env.example tests/web-static.js && git commit -m "feat: model editable menu allergens in studio"`

## Task 3: Add safe CMS loading and local fallback

**Files:**
- Create: `web/src/lib/menu-cms.ts`
- Modify: `web/src/app/menu/page.tsx`
- Modify: `web/.env.example`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Write failing runtime-content assertions**

Require both fixed document IDs to parse together with Zod, invalid documents to be rejected before either is rendered, unavailable dishes to be filtered only after parsing, and fallback to `venueMenus`/wine content if required server variables are absent.

- [ ] **Step 2: Run the static test to verify it fails**

Run: `npm run test:web:static`

Expected: FAIL because no CMS adapter exists.

- [ ] **Step 3: Implement the build-only adapter**

Use `fetch` against Sanity's data API with a non-public bearer token only when all required configuration is present. Validate the full response with Zod using `shared/menu-contract.ts`, preserve fixed page layout/anchors and return the established local content on any error.

- [ ] **Step 4: Update the menu route**

Convert the server component to async and consume the effective content object without altering the visual menu layout, existing labels or compact allergen superscripts.

- [ ] **Step 5: Document server-only environment values**

Add `SANITY_API_TOKEN=` as a blank placeholder and explain that it is read-only and never uses a `NEXT_PUBLIC_` prefix.

- [ ] **Step 6: Run verification**

Run: `npm run test:web:static && npm --prefix web run lint -- --max-warnings=0 && ./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json`

Expected: PASS.

- [ ] **Step 7: Commit**

Run: `git add web/src/lib/menu-cms.ts web/src/app/menu/page.tsx web/.env.example tests/web-static.js && git commit -m "feat: load validated menu content from studio"`

## Task 4: Generate initial Studio menu records

**Files:**
- Create: `web/scripts/export-sanity-menu-seed.ts`
- Modify: `package.json`
- Modify: `tests/web-static.js`

- [ ] **Step 1: Write failing export assertions**

Require an export command that derives `menu-hawaii` and `menu-muulab` directly from approved local menu content and preserves each allergen array.

- [ ] **Step 2: Run the static test to verify it fails**

Run: `npm run test:web:static`

Expected: FAIL because no deterministic Studio seed exporter exists.

- [ ] **Step 3: Implement the exporter**

Emit newline-delimited Sanity import documents to stdout only. The script must not write credentials, call the network or alter the local content source.

- [ ] **Step 4: Add the package command and verify output**

Run: `npm run menu:seed:studio | node -e "process.stdin.on('data', () => {})"`

Expected: exit code `0`; the operator can redirect its output explicitly when performing the controlled Studio import.

- [ ] **Step 5: Commit**

Run: `git add web/scripts/export-sanity-menu-seed.ts package.json tests/web-static.js && git commit -m "feat: export initial studio menu records"`

## Task 5: Prepare immediate verified publishing

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/web-static.js`
- Modify: `docs/admin-content-management-blueprint.md`

- [ ] **Step 1: Write failing workflow assertions**

Require `workflow_dispatch` inputs for CMS revision and optional rollback run ID, explicit non-public Sanity environment mappings, a retained private menu snapshot artifact, and no hard-coded credential values. The rollback path must accept only a completed successful run from this workflow and branch and must verify its manifest IDs, source commit and SHA-256 checksum before deployment.

- [ ] **Step 2: Run the static test to verify it fails**

Run: `npm run test:web:static`

Expected: FAIL because the current workflow accepts no content revision or CMS configuration.

- [ ] **Step 3: Extend the workflow safely**

Keep push execution unchanged. Add dispatch inputs; map secrets only to the static build step; emit a content manifest/snapshot only after validation; retain it privately. When a rollback run ID is supplied, download only the matching verified artifact and refuse the build when workflow identity, branch, manifest IDs, source commit or SHA-256 checksum differ. Do not add live credentials or auto-configure an external webhook.

- [ ] **Step 4: Update the activation runbook**

Document exact Sanity webhook endpoint, restricted token permissions, rotation/revocation, named access and artifact-based rollback. Clearly state that an external configuration action is required before immediate publishing is active.

- [ ] **Step 5: Run workflow/source verification**

Run: `npm run test:web:static && npm run test:web:hardening`

Expected: PASS.

- [ ] **Step 6: Commit**

Run: `git add .github/workflows/deploy-pages.yml tests/web-static.js docs/admin-content-management-blueprint.md && git commit -m "feat: prepare verified studio menu publishing"`

## Task 6: Complete integration verification

**Files:**
- Modify: `tests/web-static.js` only if a missing acceptance assertion is discovered.

- [ ] **Step 1: Run focused checks**

Run: `npm run test:web:static && npm --prefix web run lint -- --max-warnings=0 && ./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json && npm --prefix studio run build`

Expected: all PASS.

- [ ] **Step 2: Build the Aruba static artifact with bounded memory**

Run: `ARUBA_REQUIRE_CLEAN=1 npm run build:web:aruba && npm run test:web:aruba`

Expected: PASS; the static artifact contains no server-side token.

- [ ] **Step 3: Run the exact Pages production suite**

Run: `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh && PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=1 npm run test:web:production`

Expected: PASS or a separately logged optional WebKit playback diagnostic only.

- [ ] **Step 4: Commit the final verified integration**

Run: `git add -A && git commit -m "feat: enable editable validated menus"`
