"use client";

import { useState, useCallback } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import HeroRandomizer from "./HeroRandomizer";
import { useSoundEngine } from "./sound/useSoundEngine";

export default function HeroEntry() {
  const [muted, setMuted] = useState(true);
  const { init, triggerNote, setMood } = useSoundEngine();

  const handleToggleMute = useCallback(async () => {
    if (muted) {
      await init();
      setMuted(false);
    } else {
      // Re-mute: we just stop triggering notes
      setMuted(true);
    }
  }, [muted, init]);

  const handleNote = useCallback(
    (index: number) => {
      if (!muted) {
        triggerNote(index);
      }
    },
    [muted, triggerNote],
  );

  return (
    <div className="relative">
      <HeroRandomizer
        onNoteTriggered={handleNote}
        onMoodSelected={setMood}
      />

      {/* Mute/unmute button */}
      <button
        onClick={handleToggleMute}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/80 backdrop-blur border border-border/50 text-muted hover:text-[#2d4a8a] hover:border-[#2d4a8a]/30 transition-all shadow-sm"
        aria-label={muted ? "사운드 켜기" : "사운드 끄기"}
      >
        {muted ? <VolumeOff size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
