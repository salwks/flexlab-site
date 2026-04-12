"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";

interface AsciiHeroProps {
  onNoteTriggered?: (index: number) => void;
}

const CHARS = "FLEXLAB01{}[];:<>/\\|~!@#$%^&*()_+-=";
const CELL = 8;
const COLOR = "#2d4a8a";

function isOnLogo(x: number, y: number): boolean {
  for (const seg of allSegments) {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) continue;
    const t = Math.max(0, Math.min(1, ((x - seg.x1) * dx + (y - seg.y1) * dy) / (len * len)));
    const px = seg.x1 + t * dx;
    const py = seg.y1 + t * dy;
    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    if (dist < 4) return true;
  }
  return false;
}

export default function AsciiHero({ onNoteTriggered }: AsciiHeroProps) {
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
    let cols = 0;
    let rows = 0;
    let grid: { char: string; onLogo: boolean; flicker: number }[] = [];

    const doResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const scaleW = (cw * 0.75) / LOGO_WIDTH;
      const scaleH = (ch * 0.3) / LOGO_HEIGHT;
      scale = Math.min(scaleW, scaleH);
      const logoW = LOGO_WIDTH * scale;
      const logoH = LOGO_HEIGHT * scale;
      ox = (cw - logoW) / 2;
      oy = (ch - logoH) / 2;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      cols = Math.floor(cw / CELL);
      rows = Math.floor(ch / CELL);
      grid = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lx = (c * CELL - ox) / scale;
          const ly = (r * CELL - oy) / scale;
          const onLg = isOnLogo(lx, ly);
          grid.push({
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            onLogo: onLg,
            flicker: Math.random(),
          });
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

    let frame = 0;
    let raf = 0;
    const pluckedCooldown = new Set<number>();

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(animate); return; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.font = `${CELL - 1}px monospace`;
      ctx.textBaseline = "top";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      frame++;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const cell = grid[idx];
          const px = c * CELL;
          const py = r * CELL;
          const lx = (px - ox) / scale;
          const ly = (py - oy) / scale;

          // Mouse proximity effect
          let mouseNear = false;
          if (mx !== null && my !== null) {
            const dist = Math.sqrt((lx - mx) ** 2 + (ly - my) ** 2);
            if (dist < 40) mouseNear = true;
          }

          if (cell.onLogo) {
            // Logo chars: bright and clear
            if (mouseNear || (frame % 90 === 0 && Math.random() < 0.2)) {
              cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            ctx.fillStyle = mouseNear ? "#00ff90" : "#8cb4ff";
            ctx.globalAlpha = 1;
            ctx.fillText(cell.char, px, py);
          } else {
            // Background: very sparse, very dim
            if (Math.random() < 0.002 || (mouseNear && Math.random() < 0.05)) {
              cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
              cell.flicker = 1;
            }
            if (cell.flicker > 0) {
              ctx.fillStyle = "#2d4a8a";
              ctx.globalAlpha = cell.flicker * 0.06;
              ctx.fillText(cell.char, px, py);
              ctx.globalAlpha = 1;
              cell.flicker *= 0.92;
              if (cell.flicker < 0.01) cell.flicker = 0;
            }
          }
        }
      }

      // Sound trigger
      if (mx !== null && my !== null && onNoteRef.current) {
        allSegments.forEach((seg, segIdx) => {
          if (pluckedCooldown.has(segIdx)) return;
          const cx = (seg.x1 + seg.x2) / 2;
          const cy = (seg.y1 + seg.y2) / 2;
          if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 30) {
            onNoteRef.current?.(segIdx);
            pluckedCooldown.add(segIdx);
            setTimeout(() => pluckedCooldown.delete(segIdx), 500);
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
    <section className="relative h-screen overflow-hidden bg-[#0a0a0a]">
      <canvas ref={canvasRef} role="img" aria-label="FLEXLAB" className="absolute inset-0 cursor-crosshair" />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={20} className="text-white/20" />
      </div>
    </section>
  );
}
