"use client";

import { useState, useEffect, useCallback } from "react";
import { heroVariants } from "./heroVariants/registry";
import { generateParams } from "./heroVariants/randomParams";
import type { HeroVariantProps } from "./heroVariants/registry";
import type { HeroParams } from "./heroVariants/randomParams";
import type { ComponentType } from "react";

interface HeroRandomizerProps {
  onNoteTriggered?: (index: number) => void;
  onMoodSelected?: (mood: "bright" | "dark" | "ethereal") => void;
}

export default function HeroRandomizer({
  onNoteTriggered,
  onMoodSelected,
}: HeroRandomizerProps) {
  const [HeroComponent, setHeroComponent] =
    useState<ComponentType<HeroVariantProps> | null>(null);
  const [params, setParams] = useState<HeroParams | null>(null);

  useEffect(() => {
    // All randomization happens client-side only to avoid hydration mismatch
    const idx = Math.floor(Math.random() * heroVariants.length);
    const chosen = heroVariants[idx];
    const p = generateParams();
    setParams(p);

    chosen.load().then((mod) => {
      setHeroComponent(() => mod.default);
    });
    onMoodSelected?.(chosen.mood);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNote = useCallback(
    (index: number) => {
      onNoteTriggered?.(index);
    },
    [onNoteTriggered],
  );

  if (!HeroComponent || !params) {
    return <div className="h-screen bg-white" suppressHydrationWarning />;
  }

  return (
    <div suppressHydrationWarning>
      <HeroComponent onNoteTriggered={handleNote} params={params} />
    </div>
  );
}
