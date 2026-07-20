import type { NavigationSource } from "./journey-playback.ts";

const PRE_ROLL_SECONDS = 2.25;
const PRE_ROLL_THRESHOLD_SECONDS = 3.25;
const MIN_PLAYBACK_RATE = 1;
const MAX_PLAYBACK_RATE = 1.25;

type JourneyClipPlanInput = {
  currentTime: number;
  targetTime: number;
  source: NavigationSource;
  isIntro: boolean;
};

export type JourneyClipPlan = {
  seekTime: number | null;
  targetTime: number;
  playbackRate: number;
};

function safeTime(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function planJourneyClip({
  currentTime,
  targetTime,
  source,
  isIntro,
}: JourneyClipPlanInput): JourneyClipPlan {
  const safeCurrentTime = safeTime(currentTime);
  const safeTargetTime = safeTime(targetTime);
  const forwardGap = safeTargetTime - safeCurrentTime;
  const startsIntro = isIntro === true || source === "intro";
  const needsPreRoll =
    !startsIntro &&
    (forwardGap < 0 || forwardGap > PRE_ROLL_THRESHOLD_SECONDS);
  const seekTime = startsIntro
    ? 0
    : needsPreRoll
      ? Math.max(0, safeTargetTime - PRE_ROLL_SECONDS)
      : null;
  const clipStartTime = seekTime ?? safeCurrentTime;
  const clipDuration = Math.max(0, safeTargetTime - clipStartTime);
  const playbackRate = clamp(
    clipDuration / PRE_ROLL_SECONDS,
    MIN_PLAYBACK_RATE,
    MAX_PLAYBACK_RATE,
  );

  return {
    seekTime,
    targetTime: safeTargetTime,
    playbackRate,
  };
}
