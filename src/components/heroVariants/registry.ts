import type { ComponentType } from "react";

export interface HeroVariantProps {
  onNoteTriggered?: (index: number) => void;
}

export interface HeroVariantEntry {
  id: string;
  mood: "bright" | "dark" | "ethereal";
  load: () => Promise<{ default: ComponentType<HeroVariantProps> }>;
}

export const heroVariants: HeroVariantEntry[] = [
  {
    id: "wireframe",
    mood: "bright",
    load: () => import("./WireframeHero"),
  },
  {
    id: "inverted",
    mood: "dark",
    load: () => import("./InvertedHero"),
  },
  {
    id: "particle",
    mood: "ethereal",
    load: () => import("./ParticleHero"),
  },
  {
    id: "glitch",
    mood: "dark",
    load: () => import("./GlitchHero"),
  },
  {
    id: "ascii",
    mood: "dark",
    load: () => import("./AsciiHero"),
  },
  {
    id: "dotmatrix",
    mood: "bright",
    load: () => import("./DotMatrixHero"),
  },
  {
    id: "ink",
    mood: "ethereal",
    load: () => import("./InkHero"),
  },
  {
    id: "typomotion",
    mood: "bright",
    load: () => import("./TypoMotionHero"),
  },
  {
    id: "3d",
    mood: "ethereal",
    load: () => import("./ThreeDHero"),
  },
];
