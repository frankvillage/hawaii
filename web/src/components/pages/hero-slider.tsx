"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { MediaAsset } from "@/lib/site-content";

/* Slow crossfading rotation of the page's hero photos. Respects
   prefers-reduced-motion by never advancing past the first frame. */
export function HeroSlider({ slides, testId }: { slides: MediaAsset[]; testId?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          data-testid={i === 0 ? testId : undefined}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-[1400ms]"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
    </>
  );
}
