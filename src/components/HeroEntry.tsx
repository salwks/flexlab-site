"use client";

import { useState, useCallback } from "react";
import FlexlabLogo from "./FlexlabLogo/FlexlabLogo";
import HeroRandomizer from "./HeroRandomizer";
import { useSoundEngine } from "./sound/useSoundEngine";

export default function HeroEntry() {
  const [entered, setEntered] = useState(false);
  const [fading, setFading] = useState(false);
  const { init, triggerNote, setMood } = useSoundEngine();

  const handleEnter = useCallback(async () => {
    setFading(true);
    await init();
    // Small delay for fade animation
    setTimeout(() => {
      setEntered(true);
    }, 600);
  }, [init]);

  if (entered) {
    return (
      <div className="animate-fade-in-up" style={{ animationDuration: "0.8s" }}>
        <HeroRandomizer
          onNoteTriggered={triggerNote}
          onMoodSelected={setMood}
        />
      </div>
    );
  }

  return (
    <section
      className={`relative h-screen flex flex-col items-center justify-center bg-white cursor-pointer transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleEnter}
    >
      {/* Static logo */}
      <div className="w-full max-w-4xl px-8 md:px-16 lg:px-24">
        <FlexlabLogo color="#2d4a8a" lineWidth={4} interactive={false} />
      </div>

      {/* Enter prompt */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <p className="text-sm text-[#2d4a8a]/40 tracking-widest uppercase animate-pulse">
          Click to enter
        </p>
      </div>

      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
    </section>
  );
}
