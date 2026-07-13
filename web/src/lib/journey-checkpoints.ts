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
    if (ids.has(scene.id)) {
      throw new Error(`Duplicate checkpoint ID: ${scene.id}`);
    }
    ids.add(scene.id);

    const time = ((scene.start + scene.end) / 2) * duration;

    if (!Number.isFinite(time) || time < 0 || time > duration) {
      throw new RangeError(
        `Checkpoint time for "${scene.id}" must be within the media duration`,
      );
    }

    if (time <= previousTime) {
      throw new RangeError("Checkpoint times must be strictly increasing");
    }

    const fallbackFrame = Math.round(time * fps);
    if (!Number.isFinite(fallbackFrame) || fallbackFrame < 0) {
      throw new RangeError(
        `Fallback frame for "${scene.id}" must be finite and non-negative`,
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
