"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import { computeLogoLayout } from "./logoLayout";
import type { HeroParams } from "./randomParams";

interface GlitchHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}
const GLITCH_COLORS = ["#ff0040", "#00ff90", "#2d4a8a", "#ffffff"];

export default function GlitchHero({ onNoteTriggered, params }: GlitchHeroProps) {
  const COLOR = params?.palette.fg ?? "#2d4a8a";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  const glitchRef = useRef({
    active: false,
    timer: 0,
    slices: [] as { y: number; h: number; dx: number; color: string }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const doResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const { scale, ox, oy } = computeLogoLayout(cw, ch);
      scaleRef.current = scale;
      offsetRef.current = { x: ox, y: oy };
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };

    doResize();
    window.addEventListener("resize", doResize);

    const toLogoSpace = (cx: number, cy: number) => {
      const { x: ox, y: oy } = offsetRef.current;
      const s = scaleRef.current;
      return { x: (cx - ox) / s, y: (cy - oy) / s };
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = toLogoSpace(e.clientX, e.clientY);
      // Trigger glitch near logo
      const mx = mouseRef.current.x ?? -999;
      const my = mouseRef.current.y ?? -999;
      if (mx >= -20 && mx <= LOGO_WIDTH + 20 && my >= -20 && my <= LOGO_HEIGHT + 20) {
        const g = glitchRef.current;
        if (!g.active) {
          g.active = true;
          g.timer = 12;
          g.slices = [];
          const numSlices = 3 + Math.floor(Math.random() * 5);
          for (let i = 0; i < numSlices; i++) {
            g.slices.push({
              y: Math.random() * LOGO_HEIGHT,
              h: 3 + Math.random() * 15,
              dx: (Math.random() - 0.5) * 15,
              color: GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)],
            });
          }
          // Find closest wire
          let minDist = Infinity;
          let closestIdx = 0;
          allSegments.forEach((seg, idx) => {
            const cx = (seg.x1 + seg.x2) / 2;
            const cy = (seg.y1 + seg.y2) / 2;
            const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
            if (d < minDist) { minDist = d; closestIdx = idx; }
          });
          if (minDist < 80) onNoteRef.current?.(closestIdx);
        }
      }
    };
    const onMouseLeave = () => { mouseRef.current = { x: null, y: null }; };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let raf = 0;
    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const scale = scaleRef.current;
      const { x: ox, y: oy } = offsetRef.current;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Draw base logo
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (const seg of allSegments) {
        ctx.beginPath();
        ctx.moveTo(seg.x1 * scale + ox, seg.y1 * scale + oy);
        ctx.lineTo(seg.x2 * scale + ox, seg.y2 * scale + oy);
        ctx.stroke();
      }

      // Draw glitch slices
      const g = glitchRef.current;
      if (g.active && g.timer > 0) {
        g.timer--;
        for (const slice of g.slices) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, slice.y * scale + oy, canvas.width / dpr, slice.h * scale);
          ctx.clip();

          ctx.strokeStyle = slice.color;
          ctx.lineWidth = 1.5;
          for (const seg of allSegments) {
            ctx.beginPath();
            ctx.moveTo(seg.x1 * scale + ox + slice.dx * scale, seg.y1 * scale + oy);
            ctx.lineTo(seg.x2 * scale + ox + slice.dx * scale, seg.y2 * scale + oy);
            ctx.stroke();
          }
          ctx.restore();
        }
        if (g.timer <= 0) g.active = false;
      }

      // Random micro-glitch
      if (Math.random() < 0.02) {
        const y = Math.random() * (LOGO_HEIGHT * scale);
        const h = 1 + Math.random() * 3;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y + oy, canvas.width / dpr, h);
        ctx.clip();
        ctx.strokeStyle = GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)];
        ctx.lineWidth = 1.5;
        const shift = (Math.random() - 0.5) * 10 * scale;
        for (const seg of allSegments) {
          ctx.beginPath();
          ctx.moveTo(seg.x1 * scale + ox + shift, seg.y1 * scale + oy);
          ctx.lineTo(seg.x2 * scale + ox + shift, seg.y2 * scale + oy);
          ctx.stroke();
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", doResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <section className="relative h-screen overflow-hidden" style={{ background: params?.palette.bg ?? "#ffffff" }}>
      <canvas ref={canvasRef} role="img" aria-label="FLEXLAB" className="absolute inset-0 cursor-crosshair" />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
