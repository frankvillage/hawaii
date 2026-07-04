# Journey Overlay System — Handoff for Claude Code

Source of truth: `Journey Overlays.dc.html` (interactive mock, in the design project).
Target: `web/src/components/home/scroll-video-stage.tsx` + `web/src/lib/site-content.ts`.
Date: 2026-07-04. Video not yet in repo — positions below are placeholder-frame based; re-anchor when footage lands.

---

## 1. What changes vs current implementation

1. Hotspots become **anchored markers**: gold dot + pulsing ring + hairline that draws out to a small-caps pill label. On hover/focus/tap they open a **mini-card** (caption + route). Current pill-only buttons are replaced.
2. **Soft hold**: scene progress is remapped so the middle 40% of each scene advances the video only slightly (plateau). Title + CTAs settle in during the hold, release as scroll continues. No hard scroll-jacking.
3. Scene marker top-right: **progress ring** (SVG circle, dasharray) + daypart label + `NN / 07`.
4. **Soul rail** on the RIGHT edge (Beach / Restaurant / Sport / Nightlife), right-aligned, active item gold with dot; click = smooth-scroll to that scene's hold point.
5. Max **2 hotspots per scene**, never duplicating the title-block CTA. Hotspots live in the upper/mid frame; lower-left is reserved for the title block.
6. Stronger legibility scrim + subtle parallax (pointer-driven, ±14px, desktop only).

## 2. Design tokens

- Fonts: display `Cormorant Garamond` 500 (titles, `line-height 0.95`, `clamp(36px, 4.4vw, 60px)`); UI `Manrope` (labels 11px / 600 / letter-spacing 0.16em / uppercase).
- Colors: ink `#f5efe6`, gold accent `#e8c89e`, terracotta CTA `#bf7148` (hover `#cc7d54`), deep sea bg `#040a0f`, card bg `rgba(6,14,22,0.78)` + `backdrop-blur 18px`, hairline borders `rgba(245,239,230,0.16–0.26)`.
- Scrim over video: `linear-gradient(180deg, rgba(3,8,12,0.14), rgba(3,8,12,0.22) 24%, rgba(3,8,12,0.58) 62%, rgba(3,8,12,0.88))`.
- Title/summary get soft text-shadows (`0 2px 30px rgba(3,8,12,0.6)` / `0 1px 18px rgba(3,8,12,0.55)`).

## 3. Hotspot marker spec (default "hairline" variant)

Structure (left-anchored; mirror with `row-reverse` when `x > 62%`):

```
[dot 10px, #e8c89e, glow 0 0 14px rgba(232,200,158,0.75)]
[pulse ring: inset -7px, 1px border rgba(232,200,158,0.5), scale 0.6→1.9 fade, 2.8s infinite, stagger i*0.9s]
[hairline 34×1px, gradient gold→transparent, scaleX 0→1]
[pill label: padding 9px 16px, radius 999px, border rgba(245,239,230,0.26), bg rgba(7,17,26,0.5), blur 12px]
```

Entry stagger per hotspot `i`: dot pops at `0.05 + i*0.12s` (scale 0.4→1, cubic-bezier(0.2,0.9,0.3,1), 0.5s), line draws at `+0.15s` (0.4s), label rises at `+0.29s` (6px rise, 0.4s).

Mini-card (opens on hover/focus/click, `preventDefault` on click in mock; in prod first tap opens, second tap navigates on touch): 216px wide, radius 16px, caption 12.5px `#dfe7ea`, divider, "Apri" small-caps gold + route in monospace. Position: below marker, aligned to anchored side; fade+6px rise, 0.24s.

Alternate variant "viewfinder" (kept as a flag, not default): 46px corner-bracket frame + center dot, label centered underneath.

## 4. Hold choreography

Scene-local fraction `f ∈ [0,1]` remapped:

```ts
plateau(f) =
  f < 0.3 ? (f / 0.3) * 0.46
: f < 0.7 ? 0.46 + ((f - 0.3) / 0.4) * 0.08   // the hold: video nearly still
:           0.54 + ((f - 0.7) / 0.3) * 0.46
```

Use `plateau(f)` for video `currentTime` mapping; use raw `f` for a settle envelope: `settle = clamp((0.5 - |f - 0.5|) / 0.28, 0, 1)` drives overlay opacity + 16px rise and gates `pointer-events` (`auto` when > 0.18). Overlays therefore fade in as the scene settles, fade out as it releases. If `prefers-reduced-motion`: settle = 1, no entry animations, `scroll-behavior: auto`.

## 5. Scene table (placeholder-frame positions, % of viewport)

| # | id | daypart | soul | hotspots (label → route @ x,y) | primary CTA |
|---|----|---------|------|-------------------------------|-------------|
| 01 | alba | Alba | — | Ristorante → /ristorante-mare @ 30,44 · Sport → /sport @ 77,24 | Scopri la beach → /beach |
| 02 | beach | Mattina | Beach | Beach club → /beach @ 33,40 · Aperitivi → /eventi @ 83,36 | Prenota spiaggia → /prenotazioni |
| 03 | restaurant | Mattino | Restaurant | Scopri menu → /menu @ 74,46 · Cocktail bar → /ristorante-mare @ 56,26 | Prenota tavolo → /prenotazioni |
| 04 | sport | Pieno giorno | Sport | Campi da gioco → /sport @ 66,48 · Outdoor gym → /sport @ 33,42 | Scopri sport → /sport |
| 05 | lunch | Pranzo | Restaurant | Menu pesce → /menu @ 74,44 · Ristorante → /ristorante-mare @ 18,34 | Prenota tavolo → /prenotazioni |
| 06 | sunset | Tramonto | Nightlife | Terrazza → /terrazza @ 72,40 · Aperitivo → /eventi @ 40,38 | Prenota in terrazza → /prenotazioni |
| 07 | nightlife | Notte | Nightlife | Eventi → /eventi @ 72,32 · Feste private → /feste-private @ 36,46 · Prenota → /prenotazioni @ 58,40 | Scopri gli eventi → /eventi |

Scene ranges (fraction of total scroll): alba 0–0.12, beach 0.12–0.27, restaurant 0.27–0.43, sport 0.43–0.58, lunch 0.58–0.70, sunset 0.70–0.84, nightlife 0.84–1. Wrapper height 900vh, stage `position: sticky`.

Mini-card captions per route: `/menu` "Crudi, primi, brace e carta vini" · `/prenotazioni` "Spiaggia, tavolo mare o terrazza" · `/beach` "Ombrelloni e palme fronte mare" · `/sport` "Padel e outdoor training" · `/eventi` "Sunset, dj set e special date" · `/terrazza` "MUULab Riviera · sunset e brace" · `/ristorante-mare` "Pesce, à la carte, cocktail bar" · `/feste-private` "Cene riservate ed eventi su misura".

## 6. Data model change (`site-content.ts`)

Extend hotspot type with normalized position and optional caption:

```ts
export type SceneHotspot = {
  label: string;
  href: string;
  x: number;        // 0–100, % of frame width
  y: number;        // 0–100, % of frame height
  caption?: string; // mini-card copy; falls back to route captions map
};
```

Keep positions in data, not in the component, so re-anchoring to real footage is a data-only edit.

## 7. Implementation notes

- Scroll handling: single `scroll` listener + rAF batching; ignore deltas < 0.0012 progress. No IntersectionObserver needed for the stage itself.
- Parallax: pointer-fine only; CSS vars `--px/--py` on the stage, consumed by layers at factors −0.26 (wordmark), +0.22 (scene marker), +0.14 (soul rail), +0.4 (hotspots), −0.18 (title block).
- Accessibility: markers are `<a>` with visible focus outline (`1px rgba(232,200,158,0.8)`, offset), ≥44px effective hit area (padding), labels always visible (not hover-only), reduced-motion path as §4.
- Mobile (<720px): keep anchored dots but move mini-card to a fixed bottom sheet; title block full-width bottom; parallax off. (Mock approximates this; treat bottom-sheet as the intended behavior.)
- Video: when footage lands, replace gradient layers with `<video playsInline muted preload="auto">` scrubbed via `currentTime = plateau(f) * sceneDuration` per scene (or one continuous timeline mapped across scene ranges). Keep the scrim layer above it.

## 8. Open items

- [ ] Re-anchor all hotspot x/y to real frames (use the mock's "placement guides" tweak: 10% grid + live coordinates).
- [ ] Confirm brand fonts/colors against Dropbox brand assets (not yet received — Cormorant Garamond + gold/terracotta are provisional).
- [ ] Decide touch behavior: first-tap opens card, second navigates (recommended) vs direct navigation.
- [ ] Nightlife scene has 3 hotspots — drop to 2 if it crowds real footage.
