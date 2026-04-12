"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import FlexlabLogo from "../FlexlabLogo/FlexlabLogo";

interface InvertedHeroProps {
  onNoteTriggered?: (index: number) => void;
}

// Floating dust particles on dark background
function useDustCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;

    interface Dust {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }

    const particles: Dust[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.2 - 0.1,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }
    };

    resize();
    initParticles();

    const ro = new ResizeObserver(() => {
      resize();
      initParticles();
    });
    ro.observe(canvas);

    let raf = 0;
    const animate = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [canvasRef]);
}

export default function InvertedHero({ onNoteTriggered }: InvertedHeroProps) {
  const dustRef = useRef<HTMLCanvasElement>(null);
  useDustCanvas(dustRef);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Dust particles */}
      <canvas
        ref={dustRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
        <FlexlabLogo
          color="rgba(255,255,255,0.85)"
          lineWidth={3.5}
          onWirePlucked={onNoteTriggered}
        />
      </div>

      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-white/20" />
      </div>
    </section>
  );
}
