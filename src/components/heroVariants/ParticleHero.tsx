"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import { computeLogoLayout } from "./logoLayout";
import type { HeroParams } from "./randomParams";

interface ParticleHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

const MOUSE_RADIUS = 60;
const RETURN_SPEED = 0.03;
const SCATTER_FORCE = 8;

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  wireIndex: number;
}

function generateParticles(particleCount = 2500): Particle[] {
  const particles: Particle[] = [];
  const totalLen = allSegments.reduce((sum, seg) => {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  allSegments.forEach((seg, segIdx) => {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const count = Math.round((len / totalLen) * particleCount);

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const targetX = seg.x1 + dx * t;
      const targetY = seg.y1 + dy * t;
      particles.push({
        x: Math.random() * LOGO_WIDTH,
        y: Math.random() * LOGO_HEIGHT,
        targetX,
        targetY,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.8 + 0.8,
        wireIndex: segIdx,
      });
    }
  });

  return particles;
}

export default function ParticleHero({ onNoteTriggered, params }: ParticleHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>(generateParticles(params?.particleCount ?? 2500));
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const pluckedRef = useRef(new Set<number>());
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const doResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      const { scale, ox, oy } = computeLogoLayout(cw, ch);
      scaleRef.current = scale;
      offsetRef.current = { x: ox, y: oy };
    };

    doResize();
    window.addEventListener("resize", doResize);

    const toLogoSpace = (clientX: number, clientY: number) => {
      const { x: ox, y: oy } = offsetRef.current;
      const s = scaleRef.current;
      return {
        x: (clientX - ox) / s,
        y: (clientY - oy) / s,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = toLogoSpace(e.clientX, e.clientY);
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseRef.current = toLogoSpace(t.clientX, t.clientY);
    };
    const onTouchEnd = () => {
      mouseRef.current = { x: null, y: null };
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentDpr = window.devicePixelRatio || 1;
      const scale = scaleRef.current;
      const { x: ox, y: oy } = offsetRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      const scattered = new Set<number>();

      for (const p of particlesRef.current) {
        if (mx !== null && my !== null) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0.1) {
            const force = SCATTER_FORCE * Math.pow(1 - dist / MOUSE_RADIUS, 2);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            scattered.add(p.wireIndex);
          }
        }

        p.vx += (p.targetX - p.x) * RETURN_SPEED;
        p.vy += (p.targetY - p.y) * RETURN_SPEED;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x * scale + ox, p.y * scale + oy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = params?.palette.fg ?? "#2d4a8a";
        ctx.fill();
      }

      if (onNoteRef.current) {
        for (const idx of scattered) {
          if (!pluckedRef.current.has(idx)) {
            onNoteRef.current(idx);
            pluckedRef.current.add(idx);
            setTimeout(() => pluckedRef.current.delete(idx), 400);
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", doResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
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
