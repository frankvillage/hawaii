export const JOURNEY_NAVIGATE_EVENT = "hawaii:journey-navigate";

export type NavigationSource = "intro" | "scroll" | "rail";

type SceneRange = {
  start: number;
  end: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function checkpointProgress(scene: SceneRange) {
  const start = Number.isFinite(scene.start) ? scene.start : 0;
  const end = Number.isFinite(scene.end) ? scene.end : start;

  return clamp((start + end) / 2, 0, 1);
}

export function checkpointTime(scene: SceneRange, duration: number) {
  const safeDuration = Number.isFinite(duration) ? Math.max(duration, 0) : 0;

  return checkpointProgress(scene) * safeDuration;
}

export function sceneIndexFromProgress(progress: number, count: number) {
  if (!Number.isFinite(count) || count <= 1) {
    return 0;
  }

  const safeProgress = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;

  return clamp(Math.round(safeProgress * (count - 1)), 0, count - 1);
}

export function sceneProgressForIndex(index: number, count: number) {
  if (!Number.isFinite(count) || count <= 1) {
    return 0;
  }

  const safeIndex = Number.isFinite(index) ? clamp(index, 0, count - 1) : 0;

  return safeIndex / (count - 1);
}

export function transitionKind(
  fromIndex: number,
  toIndex: number,
  source: NavigationSource,
) {
  if (source === "intro") {
    return "intro" as const;
  }

  if (source === "rail" || Math.abs(toIndex - fromIndex) > 1) {
    return "jump" as const;
  }

  return "step" as const;
}
