type JourneyCheckpointScene = {
  id: string;
  start: number;
  end: number;
  still: string;
};

export type JourneyCheckpoint = {
  version: 1;
  id: string;
  index: number;
  time: number;
  still: string;
  fallbackFrame: number;
};

const MANIFEST_VERSION = 1;

export function createJourneyCheckpointManifest(
  scenes: readonly JourneyCheckpointScene[],
  duration: number,
  fps: number,
): JourneyCheckpoint[] {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError("duration must be finite and greater than 0");
  }

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new RangeError("fps must be finite and greater than 0");
  }

  const ids = new Set<string>();
  let previousTime = Number.NEGATIVE_INFINITY;

  return scenes.map((scene, index) => {
    if (!Number.isFinite(scene.start) || scene.start < 0 || scene.start > 1) {
      throw new RangeError(
        `Scene "${scene.id}" start must be finite and between 0 and 1`,
      );
    }

    if (!Number.isFinite(scene.end) || scene.end < 0 || scene.end > 1) {
      throw new RangeError(
        `Scene "${scene.id}" end must be finite and between 0 and 1`,
      );
    }

    if (scene.start > scene.end) {
      throw new RangeError(
        `Scene "${scene.id}" start must be less than or equal to end`,
      );
    }

    if (ids.has(scene.id)) {
      throw new Error(`Duplicate checkpoint ID: ${scene.id}`);
    }
    ids.add(scene.id);

    const midpoint = scene.start + (scene.end - scene.start) / 2;
    const time = midpoint * duration;

    if (!Number.isFinite(time) || time < 0 || time > duration) {
      throw new RangeError(
        `Checkpoint time for "${scene.id}" must be within the media duration`,
      );
    }

    if (time <= previousTime) {
      throw new RangeError("Checkpoint times must be strictly increasing");
    }

    const fallbackFrame = Math.round(time * fps);
    if (!Number.isSafeInteger(fallbackFrame) || fallbackFrame < 0) {
      throw new RangeError(
        `Fallback frame for "${scene.id}" must be a non-negative safe integer`,
      );
    }

    previousTime = time;

    return {
      version: MANIFEST_VERSION,
      id: scene.id,
      index,
      time,
      still: scene.still,
      fallbackFrame,
    };
  });
}
