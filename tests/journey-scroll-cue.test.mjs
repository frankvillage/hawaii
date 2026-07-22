import assert from "node:assert/strict";

import { journeyScrollCueState } from "../web/src/lib/journey-scroll-cue-state.ts";

const base = {
  idleMs: 1800,
  inViewport: true,
  progress: 0.5,
  reducedMotion: false,
  scrolling: false,
};

assert.equal(journeyScrollCueState({ ...base, scrolling: true }), "hidden");
assert.equal(journeyScrollCueState({ ...base, idleMs: 1799 }), "hidden");
assert.equal(journeyScrollCueState(base), "animated");
assert.equal(journeyScrollCueState({ ...base, progress: 0.985 }), "hidden");
assert.equal(journeyScrollCueState({ ...base, inViewport: false }), "hidden");
assert.equal(journeyScrollCueState({ ...base, reducedMotion: true }), "static");

console.log("journey scroll cue checks passed");
