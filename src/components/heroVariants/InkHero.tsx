"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT, type LineSegment } from "../FlexlabLogo/letterPaths";

interface InkHeroProps {
  onNoteTriggered?: (index: number) => void;
}

const INK_COLOR = "#1a1a2e";

interface InkStroke {
  seg: LineSegment;
  progress: number; // 0 to 1
  speed: number;
  drawn: boolean;
}

export default function InkHero({ onNoteTriggered }: InkHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;

    // Initialize strokes with staggered timing
    const strokes: InkStroke[] = allSegments.map((seg, i) => ({
      seg,
      progress: 0,
      speed: 0.008 + Math.random() * 0.008,
      drawn: false,
    }));

    // Stagger start: each stroke waits for previous to reach ~30%
    let currentStrokeGroup = 0;
    const groupSize = 3;

    const doResize = () => {
      const cw = container.clientWidth;
      const maxW = cw * 0.8;
      scale = maxW / LOGO_WIDTH;
      const logoPixelW = LOGO_WIDTH * scale;
      const padX = (cw - logoPixelW) / 2;
      const ch = LOGO_HEIGHT * scale + 60;
      ox = padX; oy = 30;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };

    doResize();
    const ro = new ResizeObserver(doResize);
    ro.observe(container);

    const toLogoSpace = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (cx - rect.left - ox) / scale, y: (cy - rect.top - oy) / scale };
    };
    const onMouseMove = (e: MouseEvent) => { mouseRef.current = toLogoSpace(e.clientX, e.clientY); };
    const onMouseLeave = () => { mouseRef.current = { x: null, y: null }; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    // Ink splatter particles
    interface Splatter { x: number; y: number; r: number; opacity: number; }
    const splatters: Splatter[] = [];

    const pluckedCooldown = new Set<number>();
    let raf = 0;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background: subtle paper texture
      ctx.fillStyle = "#faf8f5";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Advance stroke drawing
      const activeStart = currentStrokeGroup * groupSize;
      const activeEnd = Math.min(strokes.length, activeStart + groupSize);

      let groupDone = true;
      for (let i = activeStart; i < activeEnd; i++) {
        const stroke = strokes[i];
        if (stroke.progress < 1) {
          stroke.progress = Math.min(1, stroke.progress + stroke.speed);
          groupDone = false;

          // Add splatter at drawing tip
          if (Math.random() < 0.3) {
            const t = stroke.progress;
            const seg = stroke.seg;
            const tipX = seg.x1 + (seg.x2 - seg.x1) * t;
            const tipY = seg.y1 + (seg.y2 - seg.y1) * t;
            splatters.push({
              x: tipX + (Math.random() - 0.5) * 8,
              y: tipY + (Math.random() - 0.5) * 8,
              r: 0.5 + Math.random() * 2,
              opacity: 0.3 + Math.random() * 0.3,
            });
          }

          if (stroke.progress >= 1 && !stroke.drawn) {
            stroke.drawn = true;
            onNoteRef.current?.(i % allSegments.length);
          }
        }
      }

      if (groupDone && currentStrokeGroup * groupSize < strokes.length) {
        currentStrokeGroup++;
      }

      // Also let completed strokes before current group draw
      for (let i = 0; i < Math.min(activeEnd, strokes.length); i++) {
        const stroke = strokes[i];
        if (stroke.progress <= 0) continue;

        const seg = stroke.seg;
        const endX = seg.x1 + (seg.x2 - seg.x1) * stroke.progress;
        const endY = seg.y1 + (seg.y2 - seg.y1) * stroke.progress;

        // Ink brush effect: varying width
        ctx.beginPath();
        ctx.moveTo(seg.x1 * scale + ox, seg.y1 * scale + oy);
        ctx.lineTo(endX * scale + ox, endY * scale + oy);
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 3 + Math.sin(stroke.progress * Math.PI) * 2;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw splatters
      for (const sp of splatters) {
        ctx.beginPath();
        ctx.arc(sp.x * scale + ox, sp.y * scale + oy, sp.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = INK_COLOR;
        ctx.globalAlpha = sp.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        sp.opacity *= 0.998;
      }

      // Mouse interaction: ink ripple
      if (mx !== null && my !== null) {
        allSegments.forEach((seg, idx) => {
          if (pluckedCooldown.has(idx)) return;
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 30) {
            // Add splatters near mouse
            for (let i = 0; i < 5; i++) {
              splatters.push({
                x: mx + (Math.random() - 0.5) * 20,
                y: my + (Math.random() - 0.5) * 20,
                r: 1 + Math.random() * 3,
                opacity: 0.5,
              });
            }
            onNoteRef.current?.(idx);
            pluckedCooldown.add(idx);
            setTimeout(() => pluckedCooldown.delete(idx), 400);
          }
        });
      }

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#faf8f5]">
      <div ref={containerRef} className="relative z-10 w-full px-8 md:px-16 lg:px-24">
        <canvas ref={canvasRef} role="img" aria-label="FLEXLAB" className="block w-full cursor-crosshair" />
      </div>
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-[#1a1a2e]/30" />
      </div>
    </section>
  );
}
