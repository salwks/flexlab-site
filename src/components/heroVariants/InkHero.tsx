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
  delay: number; // frames to wait before starting
}

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

    // Fast staggered strokes — all start within first 1 second
    const strokes: InkStroke[] = allSegments.map((seg, i) => ({
      seg,
      progress: 0,
      speed: 0.04 + Math.random() * 0.03, // 4~7% per frame = done in ~20 frames
      drawn: false,
      delay: i * 3, // 3 frames apart = ~50ms stagger
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

    // Ink splatter particles
    interface Splatter { x: number; y: number; r: number; opacity: number; }
    const splatters: Splatter[] = [];
    const pluckedCooldown = new Set<number>();
    let raf = 0;
    let frame = 0;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Paper background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      frame++;

      // Draw all strokes
      for (let i = 0; i < strokes.length; i++) {
        const stroke = strokes[i];

        // Wait for delay
        if (frame < stroke.delay) continue;

        // Advance
        if (stroke.progress < 1) {
          stroke.progress = Math.min(1, stroke.progress + stroke.speed);

          // Splatter at tip
          if (Math.random() < 0.4) {
            const t = stroke.progress;
            const seg = stroke.seg;
            const tipX = seg.x1 + (seg.x2 - seg.x1) * t;
            const tipY = seg.y1 + (seg.y2 - seg.y1) * t;
            splatters.push({
              x: tipX + (Math.random() - 0.5) * 12,
              y: tipY + (Math.random() - 0.5) * 12,
              r: 1 + Math.random() * 3,
              opacity: 0.2 + Math.random() * 0.3,
            });
          }

          if (stroke.progress >= 1 && !stroke.drawn) {
            stroke.drawn = true;
            onNoteRef.current?.(i % allSegments.length);
          }
        }

        if (stroke.progress <= 0) continue;

        const seg = stroke.seg;
        const endX = seg.x1 + (seg.x2 - seg.x1) * stroke.progress;
        const endY = seg.y1 + (seg.y2 - seg.y1) * stroke.progress;

        // Brush stroke — thick with pressure variation
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;

        // Draw thick brush path with multiple sub-strokes
        for (let layer = 0; layer < 3; layer++) {
          const offsetAmount = (layer - 1) * 1.5;
          ctx.beginPath();
          const steps = 20;
          for (let s = 0; s <= steps; s++) {
            const t = (s / steps) * stroke.progress;
            const px = (seg.x1 + dx * t) * scale + ox + nx * offsetAmount * scale;
            const py = (seg.y1 + dy * t) * scale + oy + ny * offsetAmount * scale;
            // Wobble for brush texture
            const wobble = Math.sin(t * 15 + layer * 2) * 0.8 * scale;
            if (s === 0) ctx.moveTo(px + nx * wobble, py + ny * wobble);
            else ctx.lineTo(px + nx * wobble, py + ny * wobble);
          }
          ctx.strokeStyle = inkColor;
          // Pressure: thick at start, thin at end
          const pressure = 1 + Math.sin(stroke.progress * Math.PI) * 0.5;
          ctx.lineWidth = (layer === 1 ? 4 : 2) * pressure;
          ctx.lineCap = "round";
          ctx.globalAlpha = layer === 1 ? 0.85 : 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // Draw splatters
      for (let i = splatters.length - 1; i >= 0; i--) {
        const sp = splatters[i];
        ctx.beginPath();
        ctx.arc(sp.x * scale + ox, sp.y * scale + oy, sp.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = inkColor;
        ctx.globalAlpha = sp.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        sp.opacity *= 0.995;
        if (sp.opacity < 0.01) splatters.splice(i, 1);
      }

      // Mouse interaction: ink splash
      if (mx !== null && my !== null) {
        allSegments.forEach((seg, idx) => {
          if (pluckedCooldown.has(idx)) return;
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 30) {
            for (let j = 0; j < 8; j++) {
              splatters.push({
                x: mx + (Math.random() - 0.5) * 25,
                y: my + (Math.random() - 0.5) * 25,
                r: 1.5 + Math.random() * 4,
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
