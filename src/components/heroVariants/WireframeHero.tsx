"use client";

import { ArrowDown } from "lucide-react";
import FlexlabLogo from "../FlexlabLogo/FlexlabLogo";
import type { HeroParams } from "./randomParams";

interface WireframeHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

export default function WireframeHero({ onNoteTriggered, params }: WireframeHeroProps) {
  const bg = params?.palette.bg ?? "#ffffff";
  const fg = params?.palette.fg ?? "#2d4a8a";
  const lw = params?.lineWidth ?? 4;

  return (
    <section
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{ background: bg }}
    >
      <div className="absolute inset-0 z-10">
        <FlexlabLogo
          color={fg}
          lineWidth={lw}
          onWirePlucked={onNoteTriggered}
        />
      </div>
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} style={{ color: fg }} className="opacity-30" />
      </div>
    </section>
  );
}
