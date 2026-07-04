import { SoulRail } from "@/components/home/soul-rail";
import { ScrollVideoStage } from "@/components/home/scroll-video-stage";

/* The homepage is the journey: fullscreen video with glass text layers.
   The editorial/classic reading of the village lives at /villaggio. */
export function NarrativeHomepage() {
  return (
    <main className="bg-[#080909] text-white">
      <SoulRail />
      <ScrollVideoStage />
    </main>
  );
}
