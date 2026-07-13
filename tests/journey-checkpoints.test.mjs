import assert from "node:assert/strict";

import { createJourneyCheckpointManifest } from "../web/src/lib/journey-checkpoints.ts";

const validScenes = [
  {
    id: "arrivo",
    start: 0,
    end: 0.2,
    still: "/media/hawaii/journey-poster.jpg",
  },
  {
    id: "bar",
    start: 0.2,
    end: 0.8,
    still: "/media/hawaii/morning-bar.jpg",
  },
];

assert.deepEqual(createJourneyCheckpointManifest(validScenes, 10, 24), [
  {
    version: 1,
    id: "arrivo",
    index: 0,
    time: 1,
    still: "/media/hawaii/journey-poster.jpg",
    fallbackFrame: 24,
  },
  {
    version: 1,
    id: "bar",
    index: 1,
    time: 5,
    still: "/media/hawaii/morning-bar.jpg",
    fallbackFrame: 120,
  },
]);

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [validScenes[0], { ...validScenes[1], id: validScenes[0].id }],
      10,
      24,
    ),
  /duplicate.*id/i,
  "Checkpoint IDs must be unique",
);

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [validScenes[0], { ...validScenes[1], start: 0, end: 0.2 }],
      10,
      24,
    ),
  /strictly increasing/i,
  "Checkpoint times must increase strictly",
);

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [{ ...validScenes[0], start: -0.4, end: -0.2 }],
      10,
      24,
    ),
  /within.*duration/i,
  "Checkpoint times cannot be negative",
);

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [{ ...validScenes[0], start: 1.1, end: 1.3 }],
      10,
      24,
    ),
  /within.*duration/i,
  "Checkpoint times cannot exceed the media duration",
);

for (const duration of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.throws(
    () => createJourneyCheckpointManifest(validScenes, duration, 24),
    /duration.*finite.*greater than 0/i,
  );
}

for (const fps of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.throws(
    () => createJourneyCheckpointManifest(validScenes, 10, fps),
    /fps.*finite.*greater than 0/i,
  );
}

console.log("journey checkpoint manifest checks passed");
