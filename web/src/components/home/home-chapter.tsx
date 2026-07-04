import Image from "next/image";
import Link from "next/link";

import type { Chapter } from "@/lib/site-content";

type HomeChapterProps = {
  chapter: Chapter;
  index: number;
};

export function HomeChapter({ chapter, index }: HomeChapterProps) {
  const metaLabel =
    chapter.soul === "Transition" ? chapter.daypart : `${chapter.daypart} • ${chapter.soul}`;

  return (
    <section
      id={chapter.slug}
      data-chapter
      data-soul={chapter.soul}
      className="relative min-h-[118svh] border-t border-white/10"
      aria-label={chapter.title}
    >
      <div className="sticky top-[4.6rem]">
        <div
          className={`min-h-[calc(100svh-4.6rem)] bg-gradient-to-br ${chapter.gradient}`}
        >
          <div className="mx-auto grid min-h-[calc(100svh-4.6rem)] max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.16fr_0.84fr] lg:gap-8 lg:px-8 lg:py-10">
            <div className="relative order-1 overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(4,10,15,0.08),rgba(4,10,15,0.46))] shadow-[0_40px_80px_rgba(0,0,0,0.2)] min-h-[26rem] sm:min-h-[32rem] lg:min-h-[calc(100svh-7.6rem)]">
              {chapter.media ? (
                <Image
                  data-testid="chapter-media"
                  src={chapter.media.src}
                  alt={chapter.media.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="absolute inset-0 object-cover"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_28%,rgba(5,10,14,0.54))]" />
              <div className="pointer-events-none absolute -left-10 top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-14 bottom-8 h-56 w-56 rounded-full bg-[#f0c889]/20 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.2em] text-white/82">
                    {chapter.daypart}
                  </span>
                  <span className="text-[0.72rem] uppercase tracking-[0.22em] text-white/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="max-w-2xl">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#f0c889]">
                    {chapter.eyebrow}
                  </p>
                  <h2 className="mt-4 max-w-[12ch] font-serif text-4xl leading-[0.95] text-[#f4ede4] sm:text-5xl lg:text-6xl">
                    {chapter.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#eeeee9] sm:text-lg">
                    {chapter.summary}
                  </p>

                  <ul
                    data-testid="chapter-atmosphere"
                    className="mt-6 flex max-w-2xl flex-wrap gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-[#f4ede4]"
                  >
                    {chapter.atmosphere.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-white/12 bg-[rgba(18,19,20,0.26)] px-3 py-1.5 backdrop-blur-sm"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="order-2 flex min-h-[20rem] flex-col justify-between gap-8 py-2 lg:py-8">
              <div className="max-w-md">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#f0c889]">
                  {metaLabel}
                </p>
                <p className="mt-5 text-base leading-8 text-white/82 sm:text-lg">
                  {chapter.detail}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={chapter.primaryAction.href}
                  className="rounded-full bg-white/95 px-5 py-3 text-center text-sm font-semibold text-[#1c1d1e] transition hover:-translate-y-0.5"
                >
                  {chapter.primaryAction.label}
                </Link>
                {chapter.secondaryAction ? (
                  <Link
                    href={chapter.secondaryAction.href}
                    className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-[#f4ede4] transition hover:border-white/40"
                  >
                    {chapter.secondaryAction.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
