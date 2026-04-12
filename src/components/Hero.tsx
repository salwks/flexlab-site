"use client";

import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import FlexlabLogo from "./FlexlabLogo/FlexlabLogo";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    el.addEventListener("mousemove", onMouse);
    return () => el.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Logo fills the screen */}
      <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
        <FlexlabLogo color="#2d4a8a" lineWidth={4} />
      </div>

      {/* SEO */}
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
