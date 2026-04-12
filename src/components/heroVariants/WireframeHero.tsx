"use client";

import { ArrowDown } from "lucide-react";
import FlexlabLogo from "../FlexlabLogo/FlexlabLogo";

interface WireframeHeroProps {
  onNoteTriggered?: (index: number) => void;
}

export default function WireframeHero({ onNoteTriggered }: WireframeHeroProps) {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
        <FlexlabLogo
          color="#2d4a8a"
          lineWidth={4}
          onWirePlucked={onNoteTriggered}
        />
      </div>
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
