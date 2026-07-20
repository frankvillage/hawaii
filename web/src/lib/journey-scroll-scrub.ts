const MAX_CATCHUP_RATE = 3;
const MAX_ELAPSED_MS = 50;

type TimelineRange = {
  start: number;
  end: number;
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function targetTimeForProgress(progress: number, duration: number) {
  const safeDuration = finiteNonNegative(duration);
  const safeProgress = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;

  return safeProgress * safeDuration;
}

export function advanceScrubTime(
  currentTime: number,
  targetTime: number,
  elapsedMs: number,
) {
  const current = finiteNonNegative(currentTime);
  const target = finiteNonNegative(targetTime);
  const safeElapsedMs = Number.isFinite(elapsedMs)
    ? clamp(elapsedMs, 0, MAX_ELAPSED_MS)
    : 0;
  const maximumStep = (safeElapsedMs / 1000) * MAX_CATCHUP_RATE;
  const difference = target - current;

  if (Math.abs(difference) <= maximumStep) return target;
  if (maximumStep === 0) return current;

  return current + Math.sign(difference) * maximumStep;
}

export function sceneIndexForTimelineProgress(
  progress: number,
  ranges: readonly TimelineRange[],
) {
  if (ranges.length === 0) return 0;
  const safeProgress = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
  const index = ranges.findIndex((range) => safeProgress < finiteNonNegative(range.end));

  return index === -1 ? ranges.length - 1 : index;
}

export function timelineProgressForSceneIndex(
  index: number,
  ranges: readonly TimelineRange[],
) {
  if (ranges.length === 0) return 0;
  const safeIndex = Number.isFinite(index)
    ? clamp(Math.trunc(index), 0, ranges.length - 1)
    : 0;
  const range = ranges[safeIndex];

  return clamp((finiteNonNegative(range.start) + finiteNonNegative(range.end)) / 2, 0, 1);
}
