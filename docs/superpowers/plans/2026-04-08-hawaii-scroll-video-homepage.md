# Hawaii Scroll Video Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's panel-led narrative with a lightweight scroll-controlled hero video stage that carries the full day-to-night journey for Hawaii Urban Village.

**Architecture:** Keep the homepage HTML-first and image-led, but move the primary narrative into a single sticky stage with progressive enhancement. A small client component will control video scrubbing, hotspot visibility, scene state, and subtle desktop pointer depth using native browser APIs only.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Playwright smoke test

---

### Task 1: Update smoke expectations for the new stage

**Files:**
- Modify: `tests/web-smoke.js`

- [ ] **Step 1: Write the failing test**

Add assertions for:
- one `scroll-video-stage`
- one `journey-video`
- at least three `scene-hotspot`
- one `scene-marker`
- zero `nightlife-video`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web:smoke`
Expected: FAIL because the homepage still uses static story panels and a dedicated nightlife video panel.

### Task 2: Build the scroll-video stage

**Files:**
- Create: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/components/home/narrative-homepage.tsx`
- Modify: `web/src/lib/site-content.ts`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add scene data and video metadata**

Add a homepage scene map with:
- chapter ids
- progress ranges
- hotspot labels and links
- compact copy
- video source/poster

- [ ] **Step 2: Implement minimal client logic**

Build a client component that:
- measures local scroll progress
- sets `video.currentTime`
- updates active scene
- reveals hotspots and scene markers
- applies subtle desktop pointer depth with CSS variables
- disables motion-heavy behavior for `prefers-reduced-motion`

- [ ] **Step 3: Replace panel dominance**

Keep supporting sections minimal and secondary under the stage. Remove the dedicated nightlife-only video panel and avoid boxed side panels.

### Task 3: Verify and stabilize

**Files:**
- Modify only if verification exposes regressions

- [ ] **Step 1: Run smoke test**

Run: `npm run test:web:smoke`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm --prefix web run lint`
Expected: PASS

- [ ] **Step 3: Run build**

Run: `npm --prefix web run build`
Expected: PASS

- [ ] **Step 4: Close leftover preview processes**

Check for leftover `next start` or Playwright processes and stop them.
