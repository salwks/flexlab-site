"use client";

import { useState, useEffect, useCallback } from "react";
import { heroVariants } from "./heroVariants/registry";
import { generateParams } from "./heroVariants/randomParams";
import type { HeroVariantProps } from "./heroVariants/registry";
import type { ComponentType } from "react";

interface HeroRandomizerProps {
  onNoteTriggered?: (index: number) => void;
  onMoodSelected?: (mood: "bright" | "dark" | "ethereal") => void;
}

export default function HeroRandomizer({
  onNoteTriggered,
  onMoodSelected,
}: HeroRandomizerProps) {
  const [chosen] = useState(() => {
    const idx = Math.floor(Math.random() * heroVariants.length);
    return heroVariants[idx];
  });

  const [params] = useState(() => generateParams());

  const [HeroComponent, setHeroComponent] =
    useState<ComponentType<HeroVariantProps> | null>(null);

  useEffect(() => {
    chosen.load().then((mod) => {
      setHeroComponent(() => mod.default);
    });
    onMoodSelected?.(chosen.mood);
  }, [chosen, onMoodSelected]);

  const handleNote = useCallback(
    (index: number) => {
      onNoteTriggered?.(index);
    },
    [onNoteTriggered],
  );

  if (!HeroComponent) {
    return <div className="h-screen" style={{ background: params.palette.bg }} />;
  }

  return <HeroComponent onNoteTriggered={handleNote} params={params} />;
}
