"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments } from "../FlexlabLogo/letterPaths";
import { computeLogoLayout } from "./logoLayout";
import type { HeroParams } from "./randomParams";

interface DotMatrixHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

// Responsive dot density
const getDotSpacing = () => (typeof window !== "undefined" && window.innerWidth < 600 ? 10 : 6);
const DOT_RADIUS = 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function distToSegment(x: number, y: number, seg: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 0.01) return Math.sqrt((x - seg.x1) ** 2 + (y - seg.y1) ** 2);
  const t = Math.max(0, Math.min(1, ((x - seg.x1) * dx + (y - seg.y1) * dy) / len2));
  const px = seg.x1 + t * dx;
  const py = seg.y1 + t * dy;
  return Math.sqrt((x - px) ** 2 + (y - py) ** 2);
}

export default function DotMatrixHero({ onNoteTriggered, params }: DotMatrixHeroProps) {
  const fgRgb = hexToRgb(params?.palette.fg ?? "#2d4a8a");
  const accentRgb = hexToRgb(params?.palette.accent ?? "#2563eb");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;

    interface Dot {
      lx: number; ly: number;
      onLogo: boolean;
      brightness: number;
      targetBrightness: number;
    }
    let dots: Dot[] = [];

    const doResize = () => {
      const dotSpacing = getDotSpacing();
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      const layout = computeLogoLayout(cw, ch);
      scale = layout.scale;
      ox = layout.ox;
      oy = layout.oy;

      dots = [];
      const cols = Math.ceil(cw / dotSpacing);
      const rows = Math.ceil(ch / dotSpacing);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * dotSpacing;
          const py = r * dotSpacing;
          const lx = (px - ox) / scale;
          const ly = (py - oy) / scale;
          let onLogo = false;
          for (const seg of allSegments) {
            if (distToSegment(lx, ly, seg) < 5) { onLogo = true; break; }
          }
          dots.push({ lx, ly, onLogo, brightness: 0, targetBrightness: onLogo ? 1 : 0 });
        }
      }
    };

    doResize();
    window.addEventListener("resize", doResize);

    const toLogoSpace = (cx: number, cy: number) => {
      return { x: (cx - ox) / scale, y: (cy - oy) / scale };
    };
    const onMouseMove = (e: MouseEvent) => { mouseRef.current = toLogoSpace(e.clientX, e.clientY); };
    const onMouseLeave = () => { mouseRef.current = { x: null, y: null }; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const pluckedCooldown = new Set<number>();
    let raf = 0;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const dot of dots) {
        let mouseInfluence = 0;
        if (mx !== null && my !== null) {
          const dist = Math.sqrt((dot.lx - mx) ** 2 + (dot.ly - my) ** 2);
          if (dist < 50) mouseInfluence = 1 - dist / 50;
        }

        dot.targetBrightness = dot.onLogo ? 1 : mouseInfluence * 0.4;
        dot.brightness += (dot.targetBrightness - dot.brightness) * 0.1;

        if (dot.brightness > 0.02) {
          const px = dot.lx * scale + ox;
          const py = dot.ly * scale + oy;
          const r = DOT_RADIUS * (0.5 + dot.brightness * 0.5);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          if (mouseInfluence > 0.5 && dot.onLogo) {
            ctx.fillStyle = `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${dot.brightness})`;
          } else {
            ctx.fillStyle = dot.onLogo
              ? `rgba(${fgRgb[0]}, ${fgRgb[1]}, ${fgRgb[2]}, ${dot.brightness})`
              : `rgba(${fgRgb[0]}, ${fgRgb[1]}, ${fgRgb[2]}, ${dot.brightness * 0.3})`;
          }
          ctx.fill();
        }
      }

      if (mx !== null && my !== null && onNoteRef.current) {
        allSegments.forEach((seg, idx) => {
          if (pluckedCooldown.has(idx)) return;
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 25) {
            onNoteRef.current?.(idx);
            pluckedCooldown.add(idx);
            setTimeout(() => pluckedCooldown.delete(idx), 500);
          }
        });
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
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="FLEXLAB"
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
