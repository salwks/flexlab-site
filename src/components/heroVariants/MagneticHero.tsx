"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import type { HeroParams } from "./randomParams";

interface MagneticHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

const POINTS_PER_UNIT = 1 / 7;
const ATTRACT_RADIUS = 80;
const ATTRACT_FORCE = 3;
const SPRING_K = 0.06;
const DAMPING = 0.88;
const MAX_DISP = 25;

interface Pt {
  restX: number; restY: number;
  x: number; y: number;
  vx: number; vy: number;
}

interface Wire {
  points: Pt[];
  nx: number; ny: number;
}

function buildWires(): Wire[] {
  return allSegments.map((seg) => {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const n = Math.max(10, Math.round(len * POINTS_PER_UNIT));
    const nx = -dy / len;
    const ny = dx / len;
    const points: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const rx = seg.x1 + dx * t;
      const ry = seg.y1 + dy * t;
      points.push({ restX: rx, restY: ry, x: rx, y: ry, vx: 0, vy: 0 });
    }
    return { points, nx, ny };
  });
}

export default function MagneticHero({ onNoteTriggered, params }: MagneticHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const wiresRef = useRef<Wire[]>(buildWires());
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
      ox = (cw - LOGO_WIDTH * scale) / 2;
      oy = (ch - LOGO_HEIGHT * scale) / 2;
    };

    doResize();
    window.addEventListener("resize", doResize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale };
    };
    const onMouseLeave = () => { mouseRef.current = { x: null, y: null }; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: (t.clientX - ox) / scale, y: (t.clientY - oy) / scale };
    }, { passive: true });
    canvas.addEventListener("touchend", onMouseLeave);

    const fg = params?.palette.fg ?? "#2d4a8a";
    const accent = params?.palette.accent ?? "#2563eb";
    const lw = params?.lineWidth ?? 3.5;
    const pluckedCooldown = new Set<number>();
    let raf = 0;

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      const currentDpr = window.devicePixelRatio || 1;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      let anyAttracted = false;

      wiresRef.current.forEach((wire, wireIdx) => {
        const { points, nx, ny } = wire;
        let wireAttracted = false;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];

          // Pin endpoints
          if (i === 0 || i === points.length - 1) {
            p.x = p.restX;
            p.y = p.restY;
            p.vx = 0;
            p.vy = 0;
            continue;
          }

          // ATTRACT toward mouse (opposite of wireframe's repel)
          if (mx !== null && my !== null) {
            const dx = mx - p.restX; // toward mouse
            const dy = my - p.restY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < ATTRACT_RADIUS && dist > 0.1) {
              const dot = dx * nx + dy * ny;
              const sign = dot >= 0 ? 1 : -1;
              const t = i / (points.length - 1);
              const envelope = Math.sin(t * Math.PI);
              const strength = ATTRACT_FORCE * Math.pow(1 - dist / ATTRACT_RADIUS, 2) * envelope;

              // Pull toward mouse along perpendicular
              p.vx += nx * sign * strength;
              p.vy += ny * sign * strength;
              wireAttracted = true;
            }
          }

          // Spring back
          p.vx += (p.restX - p.x) * SPRING_K;
          p.vy += (p.restY - p.y) * SPRING_K;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;

          // Clamp
          const dispX = p.x - p.restX;
          const dispY = p.y - p.restY;
          const dispDist = Math.sqrt(dispX * dispX + dispY * dispY);
          if (dispDist > MAX_DISP) {
            const r = MAX_DISP / dispDist;
            p.x = p.restX + dispX * r;
            p.y = p.restY + dispY * r;
            p.vx *= 0.5;
            p.vy *= 0.5;
          }
        }

        if (wireAttracted) anyAttracted = true;

        // Draw
        ctx.beginPath();
        ctx.moveTo(points[0].x * scale + ox, points[0].y * scale + oy);
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(
            points[i].x * scale + ox,
            points[i].y * scale + oy,
            midX * scale + ox,
            midY * scale + oy,
          );
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x * scale + ox, last.y * scale + oy);

        ctx.strokeStyle = wireAttracted ? accent : fg;
        ctx.lineWidth = wireAttracted ? lw + 1 : lw;
        ctx.stroke();

        // Sound
        if (wireAttracted && onNoteRef.current && !pluckedCooldown.has(wireIdx)) {
          onNoteRef.current(wireIdx);
          pluckedCooldown.add(wireIdx);
          setTimeout(() => pluckedCooldown.delete(wireIdx), 400);
        }
      });

      // Draw connection lines from mouse to attracted points
      if (mx !== null && my !== null && anyAttracted) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.15;
        const mxPx = mx * scale + ox;
        const myPx = my * scale + oy;
        for (const wire of wiresRef.current) {
          const mid = wire.points[Math.floor(wire.points.length / 2)];
          const dx = mid.x - mid.restX;
          const dy = mid.y - mid.restY;
          if (dx * dx + dy * dy > 4) {
            ctx.beginPath();
            ctx.moveTo(mxPx, myPx);
            ctx.lineTo(mid.x * scale + ox, mid.y * scale + oy);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
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
