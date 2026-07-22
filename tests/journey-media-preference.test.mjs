import assert from "node:assert/strict";

import {
  isRecoverablePlaybackError,
  readJourneyVideoOverride,
  shouldEnableJourneyVideo,
  writeJourneyVideoOverride,
} from "../web/src/lib/journey-media-preference.ts";

assert.equal(
  shouldEnableJourneyVideo({ preferenceResolved: false, prefersReducedMotion: false, sessionOverride: false }),
  false,
);
assert.equal(
  shouldEnableJourneyVideo({ preferenceResolved: true, prefersReducedMotion: true, sessionOverride: false }),
  false,
);
assert.equal(
  shouldEnableJourneyVideo({ preferenceResolved: true, prefersReducedMotion: true, sessionOverride: true }),
  true,
);
assert.equal(
  shouldEnableJourneyVideo({ preferenceResolved: true, prefersReducedMotion: false, sessionOverride: false }),
  true,
);

assert.equal(isRecoverablePlaybackError({ name: "NotAllowedError" }), true);
assert.equal(isRecoverablePlaybackError({ name: "AbortError" }), true);
assert.equal(isRecoverablePlaybackError({ name: "NotSupportedError" }), false);
assert.equal(isRecoverablePlaybackError(null), false);

const storage = new Map();
const usableStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
};

assert.equal(readJourneyVideoOverride(usableStorage), false);
assert.equal(writeJourneyVideoOverride(usableStorage), true);
assert.equal(readJourneyVideoOverride(usableStorage), true);

const unavailableStorage = {
  getItem() {
    throw new Error("storage unavailable");
  },
  setItem() {
    throw new Error("storage unavailable");
  },
};

assert.equal(readJourneyVideoOverride(unavailableStorage), false);
assert.equal(writeJourneyVideoOverride(unavailableStorage), false);

console.log("journey media preference checks passed");
