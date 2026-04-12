"use client";

import { useRef, useCallback, useEffect } from "react";
import type { SoundEngine, Mood } from "./SoundEngine";

export function useSoundEngine() {
  const engineRef = useRef<SoundEngine | null>(null);

  const init = useCallback(async () => {
    if (engineRef.current?.isStarted()) return;
    const { SoundEngine } = await import("./SoundEngine");
    engineRef.current = new SoundEngine();
    await engineRef.current.start();
  }, []);

  const triggerNote = useCallback((index: number) => {
    engineRef.current?.triggerNote(index);
  }, []);

  const setMood = useCallback((mood: Mood) => {
    engineRef.current?.setMood(mood);
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  return { init, triggerNote, setMood };
}
