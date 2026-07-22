import type { JourneyScrollCueMode } from "@/lib/journey-scroll-cue-state";

export function JourneyScrollCue({ mode }: { mode: JourneyScrollCueMode }) {
  return (
    <div
      aria-hidden="true"
      data-testid="journey-scroll-cue"
      data-mode={mode}
      className="journey-scroll-cue pointer-events-none absolute z-20 md:hidden"
    >
      <span className="journey-scroll-cue-label">Scorri</span>
      <span className="journey-scroll-cue-line">
        <span className="journey-scroll-cue-dot" />
      </span>
    </div>
  );
}
