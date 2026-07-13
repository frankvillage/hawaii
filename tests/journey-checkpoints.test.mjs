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

for (const start of [-0.1, Number.NaN]) {
  assert.throws(
    () =>
      createJourneyCheckpointManifest(
        [{ ...validScenes[0], start }],
        10,
        24,
      ),
    /start.*finite.*between 0 and 1/i,
    "Scene starts must be finite normalized values",
  );
}

for (const end of [1.1, Number.POSITIVE_INFINITY]) {
  assert.throws(
    () =>
      createJourneyCheckpointManifest(
        [{ ...validScenes[0], end }],
        10,
        24,
      ),
    /end.*finite.*between 0 and 1/i,
    "Scene ends must be finite normalized values",
  );
}

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [{ ...validScenes[0], start: 0.8, end: 0.2 }],
      10,
      24,
    ),
  /start.*less than or equal to.*end/i,
  "Scene ranges cannot be inverted",
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

assert.throws(
  () =>
    createJourneyCheckpointManifest(
      [{ ...validScenes[0], start: 1, end: 1 }],
      Number.MAX_SAFE_INTEGER,
      2,
    ),
  /fallback frame.*safe integer/i,
  "Fallback frames must remain exactly representable",
);

console.log("journey checkpoint manifest checks passed");
