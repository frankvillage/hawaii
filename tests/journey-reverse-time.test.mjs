import assert from "node:assert/strict";

import {
  forwardFrameToReverseFrame,
  forwardTimeToReverseTime,
  reverseFrameToForwardFrame,
  reverseTimeToForwardTime,
  timeToFrame,
} from "../web/src/lib/journey-reverse-time.ts";

const options = { fps: 25, frameCount: 1430 };

assert.equal(forwardFrameToReverseFrame(0, options.frameCount), 1429);
assert.equal(forwardFrameToReverseFrame(1429, options.frameCount), 0);
assert.equal(reverseFrameToForwardFrame(0, options.frameCount), 1429);
assert.equal(reverseFrameToForwardFrame(1429, options.frameCount), 0);

for (const frame of [0, 1, 714, 715, 1428, 1429]) {
  const reverse = forwardFrameToReverseFrame(frame, options.frameCount);
  assert.equal(reverseFrameToForwardFrame(reverse, options.frameCount), frame);
}

assert.equal(timeToFrame(Number.NaN, options), 0);
assert.equal(timeToFrame(-10, options), 0);
assert.equal(timeToFrame(999, options), 1429);
assert.ok(forwardTimeToReverseTime(0, options) <= 1429 / 25);
assert.ok(reverseTimeToForwardTime(0, options) <= 1429 / 25);
assert.equal(
  reverseTimeToForwardTime(forwardTimeToReverseTime(714 / 25, options), options),
  714 / 25,
);

console.log("journey reverse time checks passed");
