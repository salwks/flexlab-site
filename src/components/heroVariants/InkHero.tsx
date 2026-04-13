"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT, type LineSegment } from "../FlexlabLogo/letterPaths";
import type { HeroParams } from "./randomParams";

interface InkHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

interface InkStroke {
  seg: LineSegment;
  progress: number;
  speed: number;
  drawn: boolean;
  delay: number;
}

// Pre-generate dot offsets for brush texture (perpendicular scatter)
function generateBrushDots(count: number): { along: number; perp: number; size: number; alpha: number }[] {
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      along: Math.random(), // position along the stroke (0~1)
      perp: (Math.random() - 0.5) * 2, // perpendicular offset (-1~1)
      size: 0.3 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.6,
    });
  }
  // Sort by along so drawing looks directional
  dots.sort((a, b) => a.along - b.along);
  return dots;
}

const DOTS_PER_STROKE = 150;

export default function InkHero({ onNoteTriggered, params }: InkHeroProps) {
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
    const inkColor = params?.palette.fg ?? "#1a1a2e";
    const bgColor = params?.palette.bg ?? "#faf8f5";

    const strokes: (InkStroke & { brushDots: ReturnType<typeof generateBrushDots> })[] =
      allSegments.map((seg, i) => ({
        seg,
        progress: 0,
        speed: 0.035 + Math.random() * 0.025,
        drawn: false,
        delay: i * 3,
        brushDots: generateBrushDots(DOTS_PER_STROKE),
      }));

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
      oy = (ch - logoH) / 2 - ch * 0.05;
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

    // Mouse splatter pool
    interface Splatter { x: number; y: number; r: number; opacity: number; }
    const mouseSplatters: Splatter[] = [];

    const pluckedCooldown = new Set<number>();
    let raf = 0;
    let frame = 0;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Paper
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      frame++;

      // Draw strokes as dense dot clouds
      for (let i = 0; i < strokes.length; i++) {
        const stroke = strokes[i];
        if (frame < stroke.delay) continue;

        if (stroke.progress < 1) {
          stroke.progress = Math.min(1, stroke.progress + stroke.speed);
          if (stroke.progress >= 1 && !stroke.drawn) {
            stroke.drawn = true;
            onNoteRef.current?.(i % allSegments.length);
          }
        }

        if (stroke.progress <= 0) continue;

        const seg = stroke.seg;
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.1) continue;
        const nx = -dy / len;
        const ny = dx / len;

        // Brush width varies: thick in middle, thin at edges
        const brushWidth = 3.5;

        ctx.fillStyle = inkColor;

        for (const dot of stroke.brushDots) {
          // Only draw dots up to current progress
          if (dot.along > stroke.progress) break;

          const t = dot.along;
          const baseX = seg.x1 + dx * t;
          const baseY = seg.y1 + dy * t;

          // Pressure: thicker in middle of stroke
          const pressure = Math.sin(t * Math.PI);
          const spread = brushWidth * (0.4 + pressure * 0.6);

          // Perpendicular scatter for brush width
          const perpOffset = dot.perp * spread;
          const px = (baseX + nx * perpOffset) * scale + ox;
          const py = (baseY + ny * perpOffset) * scale + oy;

          ctx.globalAlpha = dot.alpha * (0.5 + pressure * 0.5);
          ctx.beginPath();
          ctx.arc(px, py, dot.size * scale * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Thin core line for sharpness
        ctx.beginPath();
        ctx.moveTo(seg.x1 * scale + ox, seg.y1 * scale + oy);
        const endX = seg.x1 + dx * stroke.progress;
        const endY = seg.y1 + dy * stroke.progress;
        ctx.lineTo(endX * scale + ox, endY * scale + oy);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Mouse splatters
      if (mx !== null && my !== null) {
        allSegments.forEach((seg, idx) => {
          if (pluckedCooldown.has(idx)) return;
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 30) {
            for (let j = 0; j < 15; j++) {
              mouseSplatters.push({
                x: mx + (Math.random() - 0.5) * 20,
                y: my + (Math.random() - 0.5) * 20,
                r: 0.3 + Math.random() * 1.5,
                opacity: 0.3 + Math.random() * 0.4,
              });
            }
            onNoteRef.current?.(idx);
            pluckedCooldown.add(idx);
            setTimeout(() => pluckedCooldown.delete(idx), 400);
          }
        });
      }

      // Draw mouse splatters
      ctx.fillStyle = inkColor;
      for (let i = mouseSplatters.length - 1; i >= 0; i--) {
        const sp = mouseSplatters[i];
        ctx.globalAlpha = sp.opacity;
        ctx.beginPath();
        ctx.arc(sp.x * scale + ox, sp.y * scale + oy, sp.r * scale, 0, Math.PI * 2);
        ctx.fill();
        sp.opacity *= 0.993;
        if (sp.opacity < 0.01) mouseSplatters.splice(i, 1);
      }
      ctx.globalAlpha = 1;

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
    <section className="relative h-screen overflow-hidden" style={{ background: params?.palette.bg ?? "#faf8f5" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        role="img"
        aria-label="FLEXLAB"
      />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} style={{ color: params?.palette.fg ?? "#1a1a2e" }} className="opacity-30" />
      </div>
    </section>
  );
}
