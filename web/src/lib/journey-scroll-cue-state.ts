type JourneyScrollCueInput = {
  idleMs: number;
  inViewport: boolean;
  progress: number;
  reducedMotion: boolean;
  scrolling: boolean;
};

export type JourneyScrollCueMode = "hidden" | "static" | "animated";

export function journeyScrollCueState({
  idleMs,
  inViewport,
  progress,
  reducedMotion,
  scrolling,
}: JourneyScrollCueInput): JourneyScrollCueMode {
  if (!inViewport || progress >= 0.985 || scrolling || idleMs < 1800) {
    return "hidden";
  }

  return reducedMotion ? "static" : "animated";
}
