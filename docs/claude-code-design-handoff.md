# Hawaii Urban Village - Claude Code / Claude Design Handoff

Owner: the.o
Client: Comunica Group / Hawaii Pescara
Date: 2026-07-03

## 1. Project Intent

Hawaii is not just a beach club. It is an urban village on the Pescara seafront with four souls:

- Beach
- Restaurant
- Sport
- Nightlife

The site must feel premium, minimal, cinematic, and practical. The homepage should behave like a continuous day at Hawaii: dawn, beach, morning bar, sport, lunch, sunset terrace, dinner terrace, nightlife, and a return toward dawn.

The current implementation is a working structural preview. Claude's job is to make it feel final by replacing provisional media, improving motion polish, aligning visual rhythm, and refining the interface without changing the product strategy.

## 2. Strategic Position

Positioning:

Hawaii Pescara is an urban village on the sea: a single place that changes across the day, from beach and sport to seafood, terrace dining, sunset aperitivo, events, and private celebrations.

Payoff:

URBAN VILLAGE

Primary experience:

A scroll-controlled visual journey, supported by SEO-first landing pages for each commercial entity.

Primary business actions:

- Book beach
- Book table
- Discover menu
- Discover sport
- Discover events
- Request private event

## 3. Current Project State

The project is not yet a root Git repository. The user will create a GitHub repo after moving the project into Claude.

Important local structure:

- `web/`: Next.js app
- `studio/`: Sanity Studio scaffold
- `docs/`: strategy, handoff, planning documents
- `assets/`: source material and scraped/current site assets
- `assets/nuovi/`: provisional newer creative assets and the source promo video
- `web/public/media/hawaii/`: web-ready media used by the preview
- `tests/`: Playwright smoke tests
- `presentation/`: presentation deck source/output
- `prototype/`: earlier static prototype, now historical

Do not treat `prototype/` as the current source of truth. The current app is `web/`.

Some older planning documents in `docs/superpowers/plans/` reference `home-chapter.tsx` and earlier chapter-based homepage work. Treat those as historical context. For the current homepage, the authoritative files are `scroll-video-stage.tsx`, `narrative-homepage.tsx`, `soul-rail.tsx`, and `site-content.ts`.

## 4. Current Application Architecture

Framework:

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- TypeScript
- Playwright smoke tests
- Zod for form validation

Core app files:

- `web/src/app/page.tsx`: homepage route
- `web/src/components/home/narrative-homepage.tsx`: homepage composition
- `web/src/components/home/scroll-video-stage.tsx`: scroll-controlled video stage
- `web/src/components/home/soul-rail.tsx`: persistent four-soul rail
- `web/src/lib/site-content.ts`: central content and scene data
- `web/src/lib/seo.ts`: metadata and structured data helpers
- `web/src/app/globals.css`: global styling and motion variables

Entity landing files:

- `web/src/app/beach/page.tsx`
- `web/src/app/ristorante-mare/page.tsx`
- `web/src/app/terrazza/page.tsx`
- `web/src/app/sport/page.tsx`
- `web/src/app/eventi/page.tsx`
- `web/src/app/feste-private/page.tsx`
- `web/src/app/menu/page.tsx`
- `web/src/app/prenotazioni/page.tsx`
- `web/src/app/contatti/page.tsx`
- `web/src/app/faq/page.tsx`

Forms/API files:

- `web/src/components/forms/booking-inquiry-form.tsx`
- `web/src/components/forms/contact-form.tsx`
- `web/src/components/forms/private-event-form.tsx`
- `web/src/app/api/booking-inquiry/route.ts`
- `web/src/app/api/contact/route.ts`
- `web/src/app/api/private-events/route.ts`
- `web/src/lib/rate-limit.ts`
- `web/src/lib/forms.ts`

CMS scaffold:

- `studio/schemaTypes/homepageType.ts`
- `studio/schemaTypes/narrativeChapterType.ts`
- `studio/schemaTypes/pageType.ts`
- `studio/schemaTypes/menuType.ts`
- `studio/schemaTypes/eventType.ts`
- `studio/schemaTypes/sportOfferingType.ts`
- `studio/schemaTypes/faqItemType.ts`
- `studio/schemaTypes/mediaAssetType.ts`
- `studio/schemaTypes/siteSettingsType.ts`

## 5. Homepage Experience To Preserve

The homepage must be driven by one main visual stage, not by many explanatory panels.

Current implementation:

- `ScrollVideoStage` creates a sticky full-screen visual stage.
- `homeJourney.media` defines the master video and poster.
- `homeJourney.scenes` defines time ranges, labels, copy, and hotspots.
- Scroll progress updates `video.currentTime`.
- Hotspots update per active scene.
- Desktop pointer movement applies subtle depth via CSS variables.
- Reduced motion users receive a poster fallback.

The definitive direction:

- The master video should represent the whole Hawaii day, not just nightlife.
- Scene changes should feel natural and editorial.
- Hotspots should be ambient and sparse.
- Copy should be short and venue-specific.
- The soul rail should orient, not dominate.

Avoid:

- Large explanatory panels
- Technical copy about scroll, video, interface, or concept
- Too many CTA buttons on one viewport
- Heavy visual chrome
- Decorative UI that competes with the footage

## 6. Definitive Media Pass

Claude Design should replace the provisional media with final assets.

Expected final media:

- Desktop master journey video
- Mobile master journey video or mobile-safe crop
- Poster frame for first paint
- Optional per-scene poster frames
- Beach imagery
- Restaurant mare imagery
- Sport imagery with padel and outdoor training
- Terrazza MUULab imagery
- Nightlife/events imagery
- Logo/brand marks if approved

Recommended file destinations:

- `web/public/media/hawaii/journey-desktop.mp4`
- `web/public/media/hawaii/journey-mobile.mp4`
- `web/public/media/hawaii/journey-poster.jpg`
- `web/public/media/hawaii/scene-alba.jpg`
- `web/public/media/hawaii/scene-beach.jpg`
- `web/public/media/hawaii/scene-restaurant.jpg`
- `web/public/media/hawaii/scene-sport.jpg`
- `web/public/media/hawaii/scene-sunset.jpg`
- `web/public/media/hawaii/scene-nightlife.jpg`

Current provisional master video:

- `web/public/media/hawaii/urban-village-journey.mp4`

Current source video:

- `assets/nuovi/video promo.mp4`

Video requirements:

- MP4/H.264 baseline for broad compatibility
- 720p or 1080p depending on compression result
- Separate mobile crop if the desktop crop loses the subject
- Poster under 250 KB where possible
- Avoid huge autoplay downloads on mobile
- Keep the first visual frame meaningful before metadata loads

Target budget:

- Initial poster: under 250 KB
- Initial JS/CSS added by the experience: minimal
- Master video: ideally 5-10 MB for mobile, 8-18 MB for desktop preview
- One active video in the first viewport

## 7. Scene Map

The current scene data lives in `homeJourney.scenes` inside `web/src/lib/site-content.ts`.

Claude should adjust these after final video editing:

- `start`
- `end`
- `hotspots`
- `title`
- `summary`
- `daypart`
- `soul`

Current intended sequence:

- Alba / fronte mare
- Beach / mattina
- Bar and sala / morning
- Sport / padel and outdoor training
- Lunch / ristorante mare
- Sunset / terrazza
- Nightlife / events

Desired final sequence if the definitive video supports it:

- Visual struttura frontale
- Colazione
- Yoga or morning wellness if real
- Spiaggia
- Pranzo pesce
- Outdoor gym
- Padel / campi da gioco
- Aperitivo in terrazza
- Ristorante serale piano terra, if active in 2026
- MUULab Beach terrace dinner / brace
- Evento disco after dinner
- Loop to dawn

Important validation:

- Confirm whether yoga is an actual 2026 service or only a narrative idea.
- Confirm exact role of pizza in the food offer.
- Confirm the relationship between Hawaii, MUULab Riviera, and any "MUULab Beach" naming.
- Confirm whether "ristorante stellato" language is valid. Do not use it unless client confirms.
- Confirm if "Il primo punto Aperol d'Abruzzo" remains a claim for 2026.

## 8. Interaction System

Must-have:

- Scroll controls video progress forward and backward.
- The stage remains sticky through the journey.
- Scene labels and hotspots update by progress.
- Hotspots link to real landing pages or booking routes.
- Reduced motion mode avoids video scrub dependence.
- Mobile remains the primary experience.

Should-have:

- Desktop pointer depth remains subtle.
- Scene transition opacity/lighting follows time of day.
- Hotspots appear only where they make sense visually.
- Soul rail active state follows the active scene.
- Mobile CTA remains thumb-friendly and non-invasive.

Nice-to-have:

- Mobile-specific video source via `matchMedia` or `<source media>`.
- Small progress indicator integrated into the scene marker.
- Per-scene poster fallback if video metadata stalls.
- Video preloading strategy based on connection quality.

Avoid for now:

- Three.js
- Canvas frame rendering
- WebGL shaders
- Multiple simultaneous videos
- Scroll hijacking
- Full custom smooth-scroll libraries

## 9. Visual Direction

Mood:

Premium, coastal, social, warm, cinematic, but not over-decorated.

Typography:

- Current stack uses Manrope and Cormorant Garamond through `next/font`.
- Keep brand/place name large and clear.
- Keep section text compact.
- Do not use negative letter spacing.

Layout:

- Full-bleed visual stage first.
- No hero card.
- No heavy side panel.
- Secondary content can use image-led editorial blocks.
- The first viewport should show Hawaii immediately and hint that the page continues.

Color:

- Current implementation is dark coastal with warm accents.
- Claude may tune contrast and palette, but avoid a one-note brown/orange or dark-blue look.
- Text over video must remain readable at all scene points.

Graphic layer:

- Use minimal labels, hairline markers, hotspot dots, and restrained microcopy.
- If custom graphics are added, they must support place discovery, not explain the interface.

## 10. Content And Copy Rules

Use product/venue copy only.

Good direction:

- "Il villaggio si apre con il primo sole."
- "La mattina si distende tra sabbia e mare."
- "A pranzo il pesce arriva in tavola."
- "Il giorno sale in terrazza e cambia luce."

Avoid:

- "Lo scroll controlla il video"
- "Hotspot interattivi"
- "Experience"
- "Modalita immersiva"
- "Demo"
- "Concept"
- "Per il cliente"
- Interface explanations in visible copy

## 11. SEO And AI Discoverability

The homepage can be cinematic, but entity pages must remain semantic and crawlable.

Do not hide core service content only inside video or canvas.

Preserve:

- SSR pages
- JSON-LD structured data from `web/src/lib/seo.ts`
- `sitemap.ts`
- `robots.ts`
- FAQ page with `FAQPage` schema
- Dedicated landing pages for beach, ristorante mare, terrazza, sport, eventi, feste private
- Descriptive image alt text
- Internal links from homepage hotspots and navigation

When media changes:

- Update alt text.
- Add captions/summaries if a video becomes essential content.
- Keep meaningful text in HTML.

## 12. Forms, Security, And Privacy

Current API routes are placeholders for validated lead intake.

Do not add real credentials.

Before production:

- Connect form submissions to the selected CRM/email provider server-side only.
- Keep secrets in environment variables.
- Update `web/.env.example` when adding env vars.
- Keep honeypot fields.
- Keep rate limiting.
- Validate payloads with Zod.
- Keep cookie consent non-invasive and compliant.
- Do not add analytics before consent strategy is finalized.

Files to review if changing form behavior:

- `web/src/lib/forms.ts`
- `web/src/lib/rate-limit.ts`
- `web/src/app/api/booking-inquiry/route.ts`
- `web/src/app/api/contact/route.ts`
- `web/src/app/api/private-events/route.ts`
- `web/src/components/legal/cookie-banner.tsx`

## 13. Repository Hygiene Before GitHub

The future GitHub repo should include source files, docs, curated assets, and web-ready media. It should not include generated dependencies or build output.

Do not commit:

- `node_modules/`
- `web/node_modules/`
- `studio/node_modules/`
- `web/.next/`
- `studio/dist/`
- `.venv-pdf/`
- `tmp/`
- generated screenshots unless intentionally documenting visual QA
- `.env` files
- nested `.git` folders

Consider Git LFS for large videos and source media.

Current local size notes:

- `assets/` is large because it includes scraped site exports and source media.
- `web/` is large locally because it includes `.next` and `node_modules`.
- `studio/` is large locally because it includes `node_modules` and `dist`.

## 14. Verification Commands

From root:

```bash
npm install
npm --prefix web install
npm run test:web:smoke
npm --prefix web run lint
npm --prefix web run build
```

Preview:

```bash
npm --prefix web run start -- --hostname 127.0.0.1 --port 3000
```

Resource discipline:

- Stop preview servers after visual checks.
- Do not leave Playwright/browser sessions running.
- Prefer production preview over long-running dev server when showing the user.

## 15. What Claude Should Deliver

Must-have:

- Definitive master journey video integrated into the homepage.
- Poster and mobile fallback integrated.
- Scene timing updated to match final edit.
- Hotspot positions updated for real frames.
- Homepage visually reviewed on mobile and desktop.
- Smoke test updated if test IDs or behavior change.
- `npm --prefix web run lint` passes.
- `npm --prefix web run build` passes.
- `npm run test:web:smoke` passes.

Should-have:

- Refined mobile crop and video loading behavior.
- Improved scene marker and soul rail polish.
- More precise alt text for all final media.
- Updated content placeholders with client-approved language.
- Cleaned media folder with unused provisional files removed or moved.

Nice-to-have:

- Visual regression screenshots saved in a lightweight QA folder.
- Sanity content model connected to the homepage data.
- Dedicated video performance notes for production hosting.

## 16. Handoff Back To Codex

When Claude is done, provide:

- GitHub repo URL
- branch name
- PR URL if available
- commit range
- exact commands run
- screenshots or short recording
- media inventory with file sizes
- known compromises
- production-readiness concerns

Codex will audit:

- scroll video behavior
- mobile rendering
- accessibility
- performance
- SEO/entity structure
- structured data
- form security
- privacy layer
- repo hygiene
- build/test reliability
