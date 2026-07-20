# Hawaii Continuous Journey Scrub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace checkpoint-driven homepage playback with a continuous, bounded scroll-to-video scrub.

**Architecture:** A small pure scrub module maps normalized scroll progress to media time and advances displayed time with bounded interpolation. `ScrollVideoStage` owns one lightweight animation loop, derives copy from progress, and keeps the Soul Rail coupled only to document scroll.

**Tech Stack:** Next.js 16, React 19, TypeScript, native HTML video, CSS, Node test runner, Playwright.

---

### Task 1: Continuous scrub mathematics

**Files:**
- Create: `web/src/lib/journey-scroll-scrub.ts`
- Create: `tests/journey-scroll-scrub.test.mjs`
- Modify: `package.json`

- [ ] Write failing tests for proportional target mapping, bounded forward/backward steps, convergence and no overshoot.
- [ ] Run the focused test and confirm it fails because the scrub module is absent.
- [ ] Implement the smallest pure helper API needed by the tests.
- [ ] Run the focused and existing journey suites.

### Task 2: Homepage integration

**Files:**
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/components/home/soul-rail.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `tests/webkit-mobile-playback.js`
- Modify: `tests/web-smoke.js`

- [ ] Add failing static/browser assertions proving snap classes, checkpoint commands and cover images are absent from the homepage flow.
- [ ] Replace `useJourneyClipPlayer` integration with one continuous scrub loop driven by wrapper progress.
- [ ] Derive active scene and interface state from continuous progress.
- [ ] Change Soul Rail navigation to smooth document scrolling only.
- [ ] Increase the invisible track to eighteen viewport heights distributed by the real scene ranges.
- [ ] Preserve reduced-motion stills, media fallback and mobile hotspot rules.

### Task 3: Verification and release

**Files:**
- Modify only if a verified regression requires it.

- [ ] Run journey, booking and static tests.
- [ ] Run TypeScript and lint with zero warnings.
- [ ] Build the static Pages artifact with the existing 2 GB memory ceiling.
- [ ] Run one WebKit mobile and one Chromium desktop browser context against the exact artifact.
- [ ] Review the diff and confirm no media or content assets were deleted.
- [ ] Commit the complete reversible change.
- [ ] Push to `claude/codex-handoff-assets-se8fjq`.
- [ ] Monitor GitHub Pages and verify the deployed SHA plus cache-busted public URL.
