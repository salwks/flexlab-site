"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TypoMotionHeroProps {
  onNoteTriggered?: (index: number) => void;
}

const LETTERS = ["F", "L", "E", "X", "L", "A", "B"];
const COLOR = "#2d4a8a";

export default function TypoMotionHero({ onNoteTriggered }: TypoMotionHeroProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(new Array(7).fill(false));
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  // Staggered reveal animation
  useEffect(() => {
    LETTERS.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        onNoteRef.current?.(i * 3); // trigger sound per letter
      }, 200 + i * 150);
    });
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="relative z-10 flex items-center gap-2 md:gap-4 lg:gap-6 px-8">
        <AnimatePresence>
          {LETTERS.map((letter, i) => (
            <motion.div
              key={i}
              initial={{ y: 80, opacity: 0, rotateX: -90 }}
              animate={
                revealed[i]
                  ? { y: 0, opacity: 1, rotateX: 0 }
                  : { y: 80, opacity: 0, rotateX: -90 }
              }
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: i * 0.05,
              }}
              onMouseEnter={() => {
                setHoveredIndex(i);
                onNoteRef.current?.(i * 3);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer select-none"
              style={{ perspective: 800 }}
            >
              <motion.span
                animate={
                  hoveredIndex === i
                    ? {
                        scale: 1.2,
                        y: -10,
                        color: "#2563eb",
                        textShadow: "0 10px 30px rgba(37,99,235,0.3)",
                      }
                    : {
                        scale: 1,
                        y: 0,
                        color: COLOR,
                        textShadow: "0 0px 0px rgba(0,0,0,0)",
                      }
                }
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="inline-block font-light tracking-tight"
                style={{
                  fontSize: "clamp(4rem, 12vw, 10rem)",
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                {letter}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
