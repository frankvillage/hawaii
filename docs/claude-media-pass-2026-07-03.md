# Claude Media Pass - 2026-07-03

Definitive media pass over the scroll-video homepage and entity pages, based on
the final promo edit `DefinitivoHawaii.mov` (4K, 57.2s, delivered via
SwissTransfer on 2026-07-01).

## Source material

- `DefinitivoHawaii.mov` — 3840x2160, 25 fps, H.264 + PCM, 57.2 s, 326 MB.
- NOT committed to the repository (size); kept by the project owner.
  All web-ready derivatives below were produced from it with ffmpeg.

## Final media inventory (`web/public/media/hawaii/`)

Video:

| File | Size | Notes |
| --- | --- | --- |
| `journey-desktop.mp4` | 17.4 MB | 1920x1080, H.264 main, 25 fps, GOP 25 (1 s) for smooth scrubbing, no audio, faststart |
| `journey-mobile.mp4` | 9.0 MB | 810x1440, 9:16 center crop of the same edit, same GOP/profile |
| `journey-poster.jpg` | 147 KB | first-paint poster, frame at 0.6 s (aerial with Hawaii sign) |

Stills extracted from the definitive edit (all 1920x1080 JPEG, 110–210 KB):

| File | Frame | Used by |
| --- | --- | --- |
| `village-aerial.jpg` | 0.8 s | homepage soul gallery (Beach) |
| `seafront-aerial.jpg` | 1.6 s | homepage booking banner |
| `facade-sign.jpg` | 5.6 s | chapters (hero-alba) |
| `morning-bar.jpg` | 8.5 s | chapters (morning-bar) |
| `padel-court.jpg` | 12.8 s | /sport hero, soul gallery (Sport), chapters (sport) |
| `beach-umbrellas.jpg` | 17.5 s | /beach hero, chapters (beach) |
| `lunch-service.jpg` | 20.5 s | chapters (lunch-fish) |
| `dinner-table.jpg` | 23.5 s | /ristorante-mare hero, soul gallery (Restaurant) |
| `kitchen-brace.jpg` | 28.5 s | chapters (dinner-brace) |
| `terrace-daybed.jpg` | 34.5 s | /feste-private hero, chapters (sunset-terrace) |
| `terrace-evening.jpg` | 39.5 s | /terrazza hero, chapters (transition) |
| `muulab-bar.jpg` | 44.0 s | available for terrazza/MUULab content |
| `night-event.jpg` | 55.5 s | /eventi hero, soul gallery (Nightlife), chapters (events-nightlife) |

Removed provisional media:

- `hero-facade-sunset.png` (10.2 MB PNG) — replaced by `journey-poster.jpg`.
- `urban-village-journey.mp4` (12.8 MB, 15 s prototype cut) — replaced by the
  desktop/mobile pair above.

## Code changes

- `web/src/lib/site-content.ts`
  - `homeJourney.media`: desktop + mobile sources, new poster, duration 57.2.
  - Scenes rebuilt on the real edit order and timing (9 scenes):
    arrivo (0–0.125), bar (0.125–0.2), padel (0.2–0.26), beach (0.26–0.335),
    pranzo (0.335–0.45), cucina a vista (0.45–0.55), terrazza/tramonto
    (0.55–0.74), MUULab Riviera (0.74–0.9), notte (0.9–1). Hotspots
    repositioned per real frames; copy and alt text updated.
  - `chapters` and `pages` media now point at real stills (no broken refs).
  - `/menu`: MUULab section reworded as "la braceria della terrazza"; new
    "Aperitivo in Terrazza" section (daybed, bollicine, sunset bites).
- `web/src/components/home/scroll-video-stage.tsx`
  - Mobile 9:16 source via `<source media="(min-aspect-ratio: 3/4)">` on the
    desktop file, mobile file as fallback source. Browsers that ignore the
    media attribute keep the desktop file (no regression).
  - Scene anchor sections are now absolutely positioned on the same scale as
    the scroll progress (total 800svh), so soul-rail highlighting and
    `#anchor` navigation land on the correct scene regardless of per-scene
    duration.
- `web/src/components/home/narrative-homepage.tsx`
  - Soul gallery and booking banner images swapped to definitive stills,
    alt text updated.

## Verification (all from repo root, 2026-07-03)

- `npm --prefix web run lint` — pass.
- `npm --prefix web run build` — pass, 22 routes.
- `npm run test:web:smoke` — pass (against `next start` production preview).
- Visual QA desktop 1440x900 + mobile 390x844 at 5 scroll points
  (arrivo/beach/terrazza/muulab/notte): scene copy, hotspots, scene marker
  and soul rail follow the footage.

## Brand & classic-view pass (2026-07-03, afternoon)

Owner delivered the brand/photo kit via Dropbox (folder "muulab
stradaparco" intentionally ignored — different winter venue).

- `web/public/media/hawaii/brand/`: white/color Hawaii logos and the
  fish-glass mark, trimmed from the delivered PNGs. Header and footer
  now use the white logo; `src/app/icon.png` + `apple-icon.png` provide
  the favicon (mark on dark teal); `src/app/opengraph-image.jpg` sets
  the default social image (aerial poster frame).
- `web/public/media/hawaii/photos/`: 16 curated photos (Hawaii food by
  the venue's photographer, MUULab Riviera dishes by Andrea Straccini,
  estate/beach dishes, brace fire and pizza graphics), resized to
  1920px JPEG. Used on /menu (photo strips per carte) and /villaggio.
- Scene-matched primary CTAs (owner's direction): every journey scene
  now carries its own action — beach → "Prenota ombrellone" straight
  into the widget.spiagge.it flow (external, new tab), pranzo/cucina →
  "Menu food" (/menu#ristorante-mare), MUULab → "La braceria"
  (/menu#muulab), tramonto → prenotazioni, sport → padel, notte →
  eventi, arrivo → /villaggio.
- `/villaggio`: new classic-view static homepage ("sito parallelo"),
  fully indexable and in the sitemap: hero with logo over the aerial,
  four-souls grid, three kitchen sections (mare / braceria / pizza)
  with the new photography, quick booking list and contacts. Linked
  from the main nav ("Villaggio") and from the journey's first scene;
  it links back to the immersive homepage ("Vivi il viaggio").
- Smoke test now also asserts the beach scene exposes the spiagge.it
  CTA and that /villaggio renders its editorial sections.
- Photo/label audit (owner request): every image was reviewed against
  its caption. Fixes: the flame shot ("brace-fuoco") is FISH on the
  grill from the Hawaii ristorante social series — moved from the
  MUULab strip to the Ristorante Mare strip; the MUULab braceria now
  uses only its own photography plus the video still of its cucina a
  vista; the pizza section shows only the pizza image (single
  full-width photo) instead of unrelated seafood dishes; the ambiguous
  "gnocchi" caption was made generic ("piatto di pesce con pomodoro").
  Spare curated photos not currently placed: estate-crudo,
  estate-spaghetti-mare, food-tonno-griglia, muulab-dolce.

## Overlay redesign pass (2026-07-04)

Implemented the Claude Design handoff (docs/overlay-redesign-handoff.md),
adapted from its 7 placeholder scenes to the real 9-scene edit:

- Anchored markers replace pill-only hotspots: gold dot + pulsing ring +
  hairline + small-caps pill, mirrored when x > 62%; hover/focus opens a
  216px mini-card (caption from routeCaptions + route); on touch the tap
  opens a bottom sheet with caption + "Apri". Max 2 hotspots per scene,
  re-anchored frame by frame on the hold frames (10% grid), captions and
  deep links per destination (pizza → /menu#ristorante-mare, feste →
  /feste-private#form).
- Soft hold: per-scene plateau remap of the video scrub (middle 40% nearly
  still) + settle envelope driving overlay opacity/rise and pointer-events;
  first scene arrives settled so first paint is complete. Reduced motion:
  settle = 1, no animations, poster fallback (unchanged).
- Scene marker top-right now carries an SVG progress ring (scene-local
  progress) + daypart + NN/09. Soul rail restyled: right-aligned, active
  item gold with glowing dot. Stage wordmark is the official white logo
  (h1 kept as sr-only text).
- Scrim, text-shadows, parallax factors (±14px; wordmark −0.26, marker
  +0.22, hotspots +0.4, title −0.18) per design tokens.
- Real booking inventory re-verified on hawaiipescara.it: beach →
  widget.spiagge.it, padel/crossfit → SportClubby app
  (sportclubby.app.link/tfuwbM6rbyb — now wired as the sport scene CTA,
  in the booking popup, on /sport and /villaggio), table/terrace → phone
  + internal inquiry form, private events → form. No dead booking
  promises remain.

## CTA rebrand (2026-07-04, owner feedback)

The rounded terracotta pill buttons were called out as generic AI-default
UI. Replaced across the whole site with a brand-grounded system defined
once in globals.css (.cta / .cta-ghost / .cta-sm):

- primary: squared sand block (#e8c89e) with the logo's teal for text
  (#0d3d43, sampled from LOGHI/logo hawaii.png = #094F55 family),
  small-caps Manrope, "viewfinder" corner brackets echoing the journey
  markers; hover inverts sand→teal (contrast ≥8:1 both states)
- secondary: squared hairline ghost, gold on hover
- swept 12 files (stage, header, footer CTAs, cookie banner, all three
  forms, entity pages, menu, eventi, contatti, villaggio, narrative
  homepage); no #bf7148 remains; hotspot pills/marker design unchanged
  (they were never orange and follow the overlay handoff)

## Brand lockup, WhatsApp and the WordPress fusion bridge (2026-07-05)

- The official stacked lockup (fish + Hawaii + C. N° 99) was rebuilt in
  white from LOGHI/logo hawaii.pdf (300dpi raster, white recolor,
  10 KB) and is now the brand everywhere: centered in the fixed
  transparent header exactly as on the old site (hamburger left,
  Prenota right), and in the footer. The journey stage no longer
  renders its own wordmark (sr-only h1 kept).
- Floating WhatsApp chat button (as on the WordPress site, the client
  relies on it) added globally: wa.me link on the beach mobile number
  (375 5175508 — CONFIRM this is the number behind the WP widget);
  sits above the soul rail on mobile.
- /menu now opens as the old site does ("Menù d'estate" + its
  subtitle) and remains the exploded full carte with prices at the
  same URL path as hawaiipescara.it/menu.
- WordPress fusion (owner's dilemma) — implemented the strangler
  bridge documented by Next.js: next.config `rewrites.fallback`
  proxies EVERY path this app doesn't serve to the WP origin
  (env WP_ORIGIN_URL, disabled when unset). Rollout plan: point the
  public domain at the Next deployment, move WordPress to
  wp.hawaiipescara.it, set WP_ORIGIN_URL accordingly; WP pages,
  wp-content and wp-admin keep working at their public URLs through
  the fallback, while /, /villaggio, /menu and the entity pages are
  served by the new app. Alternative (no WP move): route paths at the
  edge (e.g. Cloudflare rules) — same result, config at DNS level.
  Embedding the scroll app inside WP was rejected (double maintenance,
  loses the app's routing/optimizations).

## Pre-deploy execution pass (2026-07-07)

Owner's pre-deploy batch ("migliorare l'esecuzione prima di prepararci
per il deploy") plus the GitHub Pages preview pipeline.

- Legal pages aligned "in toto" with the old site: `legalSections` now
  carries the real informativa (titolare Kona S.R.L., Viale della
  Riviera 154; navigation data ≤1 month, cookies ≤12 months, form data
  12 months, contract data 10 years, GDPR rights via
  info@hawaiipescara.it). The old cookie-policy URL 404s; cookies are
  covered inside the privacy informativa and mirrored on /cookie.
- /eventi recycled from the old site's real formats: "Come di
  Domenica" (16:00–22:00, pranzo à la carte + dj set), "Il Giovedì in
  terrazza" (18:00–01:00, champagne e crudi, musica di Mirko Alfonso e
  Gianluca Fratti), "Special Date" (Aperol tour e serate annunciate
  sui social).
- Hotspot timing fixed (owner: markers appeared over the distant
  aerial): the hotspot layer now follows the RAW settle envelope — 0
  at scene entry, 1 only at the hold frame — while the copy block
  keeps its first-paint floor on scene 1. Verified numerically
  (opacity 0 at scene start / 0.24 just after entry / 1 at hold) and
  on real frames via the WebM pass.
- Video-failure backup screens: every scene carries a `still`
  (hold-frame JPG already in the media inventory). A listener set
  (video error, per-`<source>` error — the event fires on the last
  source, not the element —, a 0 ms probe for pre-hydration errors,
  an 8 s readyState stall timer) flips to a crossfading stills layer
  above the still-mounted video; `loadeddata` recovers. Reduced-motion
  keeps its existing poster path.
- Soul rail: 5 stops (Beach, Ristorante, Sport, MUULab, Notte) — the
  two restaurants are now distinct as requested; scene souls remapped
  accordingly; fits 390 px (380 px measured, no overflow); smoke
  assertion updated.
- Header hamburger: the heavy ≡ glyph replaced with three slim 1 px
  lines (old-site style) folding into an × when open; same
  aria-label/expanded/controls contract.
- favicon.ico regenerated from the brand mark (48/32/16 multi-size;
  it was still the create-next-app default). icon.png / apple-icon.png
  / opengraph-image.jpg unchanged.
- SEO: `metadataBase` added to the root layout (sitemap.ts, robots.ts
  and per-page canonicals already existed; both marked force-static
  for the export build).
- Collision fixes found during QA: mobile stage clearance raised to
  pb-36 so the CTA row clears the WhatsApp button; right-aligned
  scenes get md:pr-20 so "Menu & prenota" clears the FAB and the
  desktop soul rail; header nav-close-on-navigation moved from a
  setState-in-effect to the render-adjustment pattern (lint).
- GitHub Pages preview pipeline: `STATIC_EXPORT=1` builds an
  `output: "export"` variant (basePath from NEXT_PUBLIC_BASE_PATH,
  unoptimized images, trailing slashes; headers/rewrites skipped).
  `.github/workflows/deploy-pages.yml` builds it with the API routes
  dropped (static hosting can't serve POST), prefixes root-absolute
  "/media/…" strings in html/js/css/txt (basePath doesn't rewrite
  plain string srcs), and deploys via actions/deploy-pages. Verified
  locally by serving `out/` under `/hawaii`: zero failed requests on
  /, /menu, /villaggio. On Pages the inquiry forms show their error
  state (phones/WhatsApp remain); the WP fusion bridge is inactive.
  One-time setup: the Actions token cannot create the Pages site
  ("Resource not accessible by integration"), so the repo owner must
  enable it once in Settings → Pages → Source: "GitHub Actions",
  then re-run the workflow. First run's build stage passed on CI.

Post-preview feedback (same day, owner watching the live Pages build):

- Damped scrub: scroll no longer drives `video.currentTime` directly.
  The scroll handler only moves a target; a rAF follower eases the
  video toward it (`1 - exp(-dt * 4)` per frame), so take-off and stop
  are soft and fast flicks turn into a glide. Measured: a jump to the
  beach hold plays 0 → 16.7s of footage over ~1.4s with ease-out
  instead of snapping. Reduced-motion path unchanged (poster, no video).
- Soul rail re-synced to the footage: the IntersectionObserver on the
  scene anchors (which pre-lit "Ristorante" during the opening aerial)
  is gone. The rail now computes the active scene from the same scroll
  progress as the stage and lights a soul only while its sector is in
  frame; Transition scenes (arrival aerial) light nothing. Stops stay
  clickable anchors into the journey.
- Official MUULab Riviera wordmark (owner-delivered zip) added as
  transparent sand + white variants in `brand/`; shown on /terrazza
  (hero, eyebrow reworded to avoid duplication) and on the /menu
  MUULab carte.

## Total audit pass (2026-07-07, evening — owner feedback on the live preview)

- Nine souls, one per scene, rail = timeline (owner's taxonomy):
  Urban Village · Bar · Sport · Beach Club · Ristorante · Pizzeria ·
  Aperitivo · MUULab · Eventi. Scene anchors renamed to match
  (#villaggio…#eventi); every scene now talks only about its own
  service (the Bar scene is bar-only, the kitchen scene is the
  pizzeria della cena, etc.). The rail lights the stop exactly while
  that sector is in frame; on phones the nine stops render as dots
  with only the active label expanded (271 px at 390 px viewport).
- Hotspots re-synced and re-linked: every hotspot now points at an
  existing page/anchor verified by an automated crawl (24 internal
  links, all 200, all anchors present, zero failed resources) —
  e.g. the beach "Aperitivi→/eventi" mismatch is gone, the bar scene
  links the drink list, the sport scene links only /sport.
- Double "Prenota" fixed: on scenes without a menu the popup trigger
  reads "Tutte le prenotazioni", so it no longer clashes with the
  scene CTA ("Prenota il campo" on padel).
- Entity pages rebuilt: the hero is now the page photo full-bleed
  with feathered scrims and the copy on top — no more colored
  gradient with the photo trapped in a side box. External booking
  CTAs (spiagge.it, SportClubby) open in a new tab.
- Copy rewritten with the old site's voice (fetched from
  hawaiipescara.it: home, il progetto, la spiaggia, il ristorante,
  lo sport, MUULab Riviera): "tra le spiagge più ampie della costa",
  "il pescato del giorno arriva dal mare Adriatico", "una location
  esclusiva dalla vista mozzafiato", "vivi con noi i tuoi momenti
  più speciali"… Also fixed the robotic tells (missing accents:
  piu/attivita/puo/Si → più/attività/può/Sì).
- Right-aligned scene copy indented further (md:pr-44) so the longer
  nine-label rail never overlaps eyebrow or title.
- Smoke updated to assert the nine rail stops in scene order.

## Light theme + photo pass (2026-07-07, night — owner feedback round 3)

- CRITICAL Pages fix: hotspot pills were plain `<a href>` so they
  missed the basePath on GitHub Pages → 404 ("cucina a vista" etc.).
  Now Next `Link` (basePath-aware). All other plain `<a>`s audited:
  the remaining ones are external-only branches.
- Secondary pages went LIGHT like the old site (owner's call): cream
  `#f8f5ee`, dark-teal ink `#16292d`, darker gold accents `#96703d`,
  white cards with soft shadows. The homepage journey stays dark and
  immersive. `theme-light` / `theme-dark` scopes drive the ghost-CTA
  variants; photo heroes inside light pages keep the dark treatment.
- Header: lockup enlarged (4.35rem → 3.1rem condensed; bar 5.75rem);
  theme-aware — transparent with the white lockup on the homepage,
  frosted light bar with a new dark lockup (`logo-lockup-dark.png`)
  everywhere else; the open nav panel is now frosted LIGHT glass on
  every page (was "troppo dark").
- Typography: hero leads in italic Cormorant, numbered section
  eyebrows (01/02/03), hairline rules, two-column bullets with gold
  dashes — less "dozzinale", still fully readable.
- Hero photos: video stills were too soft for the light heroes, so
  the delivered photo kits are in: /ristorante-mare and /terrazza get
  3-photo slow-crossfade hero sliders (HeroSlider, reduced-motion
  safe) from the "Foto Food Hawaii Pesce definitive" and "MUULAB
  RIVIERA_ESTATE_2025" sets (portrait sources pre-cropped to
  landscape); /beach /terrazza /ristorante-mare get photo strips in
  the body. MUULab wordmark now has a dark variant for the light
  /menu page.
- Soul rail: frosted glass capsule behind the stops so they read on
  bright scenes (the owner's beach screenshot).
- Scene-true mini-card captions (the bar hotspot no longer says
  "Pesce, à la carte"); the mini-card footer shows "Apri →" instead
  of the raw route path.
- Pages without a photo hero (menu, prenotazioni, contatti, faq,
  legal) got fixed-header clearance (pt-32). Villaggio's "cucine"
  band converted to a warm light tone; feste-private's gradient hero
  replaced by a light editorial opening with the form beside.

- Mobile scrub unlock (owner: video frozen on the first frame on
  phones): iOS/Safari does not paint seeked frames until the video has
  been unlocked by a play. The stage now issues a muted programmatic
  play stopped on the first `playing` event (allowed thanks to
  muted+playsInline), with a first-touch fallback trigger; duration
  sync no longer pauses (it aborted the unlock play). Verified under
  iPhone emulation: currentTime 0 → 16.4s on a scroll jump.

- Scrub softened further (owner: jerky, too touch-sensitive): damping
  rate 4 → 2.4, chase speed capped at 5× realtime (a flick becomes a
  fast-forward that eases into the stop, never a jump cut), and a new
  seek is only issued once the previous one has landed (stacked seeks
  while the decoder is busy were the visible stutter).
- /eventi rebuilt on the shared photo-hero pattern: crossfade slider
  (night dj-set frame, terrace-ambience shot exported from the social
  kit, sunset daybed), light body, white format cards, 3-photo gallery;
  feste-private also gets a gallery. Note: the delivered folders
  contain no crowd/dj photography — the night frame from the video is
  the only true event image; flagged to the owner.
- Header bar now semi-transparent (0.62 alpha frosted, panel 0.78) and
  the lockup grew again (5rem → 3.5rem condensed).

- REAL-DEVICE mobile scrub fix (owner: still frozen after the unlock):
  iOS Safari does not paint seeked frames from a progressively-loading
  source — it needs the data buffered. The stage now fetches the
  chosen source (desktop/mobile by aspect ratio) into a fully-buffered
  blob and points the element at it; the <source> pipeline remains the
  fallback and the touch unlock re-arms on every touch (Low Power Mode
  rejects non-gesture plays). CSP gained `media-src 'self' blob:`.
- Mobile hotspot audit (owner: pills clipped/off screen): markers are
  now anchored ON the dot — the pill grows inward, mirrored past 50% —
  plus nowrap pills and one anchor nudge (aperitivo 58→62). Automated
  audit at 390px: 18/18 hotspots fully on screen across all 9 scenes
  (3 were clipped before).

- DEFINITIVE mobile scrub (owner's screenshot: scene 09/09 overlay on
  the frozen daytime poster; Low Power Mode active): touch devices now
  scrub a JPEG frame sequence on a <canvas> — the Apple-product-page
  technique — instead of seeking a <video> that iOS refuses to paint.
  172 frames per set at 3 fps (mobile 540px/4.1MB, desktop 960px/5.4MB
  in public/media/hawaii/frames/), preloaded in coarse-to-fine strides
  so the whole timeline is covered early; the damped 5×-capped clock
  drives the nearest loaded frame. Fine-pointer devices keep the
  buffered-blob <video>. Verified under iPhone emulation: canvas mode
  active, no video download, frames advance on scroll.
- Readability (owner's screenshot): firmer bottom veil on phones,
  hotspot pills darker (0.34 → 0.55 alpha), header glass 0.72, and on
  phones markers are clamped to the upper 48% of the stage so they can
  never sit on the scene copy.
- Spacing pass (owner: "tutto addossato", MUULab included): entity
  pages get a roomier mobile rhythm (larger section paddings/gaps),
  galleries and menu photo strips stack full-width on phones instead
  of three squeezed columns; /villaggio's duplicated in-hero logo
  (clipped under the fixed bar) removed and its hero given header
  clearance; menu venue sections spaced wider.

Verification 2026-07-07: `npm --prefix web run lint` ✓, server build ✓,
static export build ✓, `npm run test:web:smoke` ✓ (updated 5-soul
assertion), Playwright visual QA desktop 1440 + mobile 390 (mp4 build →
fallback stills exercised; WebM build → real frames) ✓.

## Known limitations / notes for the audit

- Playwright's bundled Chromium cannot decode H.264, so the smoke test's
  "video advances" assertion exercises the scrub logic via the fallback
  duration rather than decoded frames. Visual QA of real frames was done
  with a temporary VP9 WebM copy (not committed). Recommend a manual pass on
  retail Chrome/Safari, especially iOS.
- `<source media>` selection should be sanity-checked on a real phone
  (iOS Safari, Chrome Android). Worst case is the desktop file on mobile
  (17.4 MB), same behavior as a single-source setup.
- On-screen brands in the footage (GIN MARE on the terrace daybeds, GIMPADEL
  on the padel courts) stay visible in the video per the owner's explicit
  decision (2026-07-03): brand clearance is the agency's responsibility and
  the footage will be swapped only if a brand objects. In written copy,
  GIMPADEL is citable (named on the /sport page, owner confirmed); GIN MARE
  is not named anywhere.
- Real menus imported on 2026-07-03 from the live sites at the owner's
  request: hawaiipescara.it/menu (Ristorante Mare carte, fritti al cono,
  special panini, pizza a cena, dessert) and muulab.it/menu + the venue's
  PDF carte (crudi di carne, brace, tagli min. 1kg, contorni, dolci,
  cocktail). Prices are a snapshot of that date; keep in sync with the
  venue or move to Sanity. Long wine/beer lists are summarized as
  note-only categories, not transcribed. The §7 pizza question is now
  answered (pizza is real, served at dinner); yoga, "Aperol point" and
  "stellato" language remain open.
- Menu highlights surface inside the scroll journey (owner's direction):
  scenes beach/pranzo/cucina/tramonto/MUULab carry 3 real dishes each.
  After an overlap problem on mobile, inline rendering was replaced by a
  single compact trigger in the stage CTA row ("Menu & prenota") that
  opens a modal popup (bottom sheet on mobile) with the scene dishes, a
  link to /menu#ristorante-mare / /menu#muulab, and the real booking
  entries from the old site: beach via widget.spiagge.it (palma o
  ombrellone), table/terrace via /prenotazioni, sport, private events,
  plus restaurant and beach phone numbers. Popup closes on Escape and
  backdrop click and locks body scroll while open.
- `assets/` source folder and brand logos/social graphics are still pending
  delivery (Dropbox link announced by the owner).
- The 326 MB master source is not in git; consider Git LFS if it must be
  versioned.
