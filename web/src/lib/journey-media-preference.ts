const JOURNEY_VIDEO_OVERRIDE_KEY = "hawaii:journey-video-enabled";

type JourneyVideoPreference = {
  preferenceResolved: boolean;
  prefersReducedMotion: boolean;
  sessionOverride: boolean;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function shouldEnableJourneyVideo({
  preferenceResolved,
  prefersReducedMotion,
  sessionOverride,
}: JourneyVideoPreference) {
  return preferenceResolved && (!prefersReducedMotion || sessionOverride);
}

export function isRecoverablePlaybackError(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return false;
  }

  return error.name === "NotAllowedError" || error.name === "AbortError";
}

export function readJourneyVideoOverride(storage: StorageLike | null | undefined) {
  try {
    return storage?.getItem(JOURNEY_VIDEO_OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeJourneyVideoOverride(storage: StorageLike | null | undefined) {
  try {
    storage?.setItem(JOURNEY_VIDEO_OVERRIDE_KEY, "1");
    return Boolean(storage);
  } catch {
    return false;
  }
}
