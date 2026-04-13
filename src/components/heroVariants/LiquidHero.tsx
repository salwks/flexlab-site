"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import type { HeroParams } from "./randomParams";

interface LiquidHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

// Simple 2D noise (value noise)
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

const POINTS_PER_SEG = 30;

export default function LiquidHero({ onNoteTriggered, params }: LiquidHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;

    const doResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      const maxW = cw * 0.75;
      const maxH = ch * 0.3;
      scale = Math.min(maxW / LOGO_WIDTH, maxH / LOGO_HEIGHT);
      const logoW = LOGO_WIDTH * scale;
      const logoH = LOGO_HEIGHT * scale;
      ox = (cw - logoW) / 2;
      oy = (ch - logoH) / 2;
    };

    doResize();
    window.addEventListener("resize", doResize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: (t.clientX - ox) / scale, y: (t.clientY - oy) / scale };
    }, { passive: true });
    canvas.addEventListener("touchend", onMouseLeave);

    const startTime = performance.now();
    const pluckedCooldown = new Set<number>();
    let raf = 0;

    const fg = params?.palette.fg ?? "#2d4a8a";
    const accent = params?.palette.accent ?? "#2563eb";
    const lw = params?.lineWidth ?? 3.5;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      const t = (performance.now() - startTime) / 1000;
      const currentDpr = window.devicePixelRatio || 1;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      allSegments.forEach((seg, segIdx) => {
        const sdx = seg.x2 - seg.x1;
        const sdy = seg.y2 - seg.y1;
        const len = Math.sqrt(sdx * sdx + sdy * sdy);
        // Perpendicular
        const nx = -sdy / len;
        const ny = sdx / len;

        ctx.beginPath();

        for (let i = 0; i <= POINTS_PER_SEG; i++) {
          const frac = i / POINTS_PER_SEG;
          const baseX = seg.x1 + sdx * frac;
          const baseY = seg.y1 + sdy * frac;

          // Noise displacement — organic wave
          const noiseVal = fbm(baseX * 0.015 + t * 0.4, baseY * 0.015 + t * 0.3, 3);
          const wave = (noiseVal - 0.5) * 12;
          // Envelope: zero at endpoints, max at center
          const envelope = Math.sin(frac * Math.PI);

          // Mouse influence: extra displacement near cursor
          let mouseWave = 0;
          const dx = baseX - mx;
          const dy = baseY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const strength = (1 - dist / 60) * 20;
            const dot = dx * nx + dy * ny;
            mouseWave = (dot >= 0 ? 1 : -1) * strength * envelope;
          }

          const dispX = baseX + nx * (wave * envelope + mouseWave);
          const dispY = baseY + ny * (wave * envelope + mouseWave);

          const px = dispX * scale + ox;
          const py = dispY * scale + oy;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        // Color shifts based on noise
        const colorNoise = fbm(segIdx * 3.7 + t * 0.2, t * 0.1, 2);
        ctx.strokeStyle = colorNoise > 0.55 ? accent : fg;
        ctx.lineWidth = lw + Math.sin(t * 0.5 + segIdx) * 0.8;
        ctx.stroke();

        // Sound trigger
        if (onNoteRef.current) {
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
          if (d < 40 && !pluckedCooldown.has(segIdx)) {
            onNoteRef.current(segIdx);
            pluckedCooldown.add(segIdx);
            setTimeout(() => pluckedCooldown.delete(segIdx), 500);
          }
        }
      });

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", doResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [params]);

  return (
    <section className="relative h-screen overflow-hidden" style={{ background: params?.palette.bg ?? "#ffffff" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        role="img"
        aria-label="FLEXLAB"
      />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} style={{ color: params?.palette.fg ?? "#2d4a8a" }} className="opacity-30" />
      </div>
    </section>
  );
}
