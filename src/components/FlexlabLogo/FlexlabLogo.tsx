"use client";

import { useRef, useEffect, useCallback } from "react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "./letterPaths";

// --------------- Physics constants ---------------
const SPRING_K = 0.15;   // 팽팽한 줄 — 빠른 진동 주기
const DAMPING = 0.88;    // 낮은 감쇠 — 여러 번 진동 후 정지
const MOUSE_FORCE = 3.0;  // 튕김 강도
const INFLUENCE_RADIUS = 50; // 가까이 가야 반응 (정밀한 느낌)
const MAX_DISPLACEMENT = 25;
const POINTS_PER_UNIT = 1 / 7;

// --------------- Types ---------------
interface ControlPoint {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface WireData {
  points: ControlPoint[];
  // Unit normal perpendicular to the wire's rest direction
  nx: number;
  ny: number;
}

// --------------- Helpers ---------------
function buildWires(): WireData[] {
  return allSegments.map((seg) => {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const n = Math.max(10, Math.round(len * POINTS_PER_UNIT));

    // Perpendicular normal to the line direction
    const nx = -dy / len;
    const ny = dx / len;

    const points: ControlPoint[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const rx = seg.x1 + dx * t;
      const ry = seg.y1 + dy * t;
      points.push({ restX: rx, restY: ry, x: rx, y: ry, vx: 0, vy: 0 });
    }
    return { points, nx, ny };
  });
}

function updatePhysics(
  wires: WireData[],
  mouseX: number | null,
  mouseY: number | null,
) {
  for (const wire of wires) {
    const { nx, ny, points } = wire;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];

      // Endpoints stay pinned (like a real guitar string)
      if (i === 0 || i === points.length - 1) {
        p.x = p.restX;
        p.y = p.restY;
        p.vx = 0;
        p.vy = 0;
        continue;
      }

      if (mouseX !== null && mouseY !== null) {
        const dx = p.restX - mouseX;
        const dy = p.restY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INFLUENCE_RADIUS && dist > 0.1) {
          // Project mouse-to-point vector onto the wire's perpendicular
          const dot = dx * nx + dy * ny;
          const sign = dot >= 0 ? 1 : -1;

          // Strength: stronger when closer, and scale by how "middle" the point is
          const t = i / (points.length - 1);
          const envelopeFactor = Math.sin(t * Math.PI); // peaks at center, zero at ends
          const strength =
            MOUSE_FORCE * Math.pow(1 - dist / INFLUENCE_RADIUS, 2) * envelopeFactor;

          // Push only along perpendicular direction
          p.vx += nx * sign * strength;
          p.vy += ny * sign * strength;
        }
      }

      // Spring back to rest
      p.vx += (p.restX - p.x) * SPRING_K;
      p.vy += (p.restY - p.y) * SPRING_K;

      // Damping
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      // Integrate
      p.x += p.vx;
      p.y += p.vy;

      // Clamp displacement so lines can't fly off screen
      const dispX = p.x - p.restX;
      const dispY = p.y - p.restY;
      const dispDist = Math.sqrt(dispX * dispX + dispY * dispY);
      if (dispDist > MAX_DISPLACEMENT) {
        const clampRatio = MAX_DISPLACEMENT / dispDist;
        p.x = p.restX + dispX * clampRatio;
        p.y = p.restY + dispY * clampRatio;
        p.vx *= 0.5;
        p.vy *= 0.5;
      }
    }
  }
}

function drawWires(
  ctx: CanvasRenderingContext2D,
  wires: WireData[],
  scale: number,
  offsetX: number,
  offsetY: number,
  color: string,
  lineWidth: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const wire of wires) {
    const pts = wire.points;
    if (pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(
      pts[0].x * scale + offsetX,
      pts[0].y * scale + offsetY,
    );

    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(
        pts[i].x * scale + offsetX,
        pts[i].y * scale + offsetY,
        midX * scale + offsetX,
        midY * scale + offsetY,
      );
    }

    const last = pts[pts.length - 1];
    ctx.lineTo(last.x * scale + offsetX, last.y * scale + offsetY);
    ctx.stroke();
  }
}

// --------------- Component ---------------
interface FlexlabLogoProps {
  className?: string;
  color?: string;
  lineWidth?: number;
  onWirePlucked?: (wireIndex: number) => void;
  interactive?: boolean;
}

export default function FlexlabLogo({
  className = "",
  color = "#2d4a8a",
  lineWidth = 3.5,
  onWirePlucked,
  interactive = true,
}: FlexlabLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wiresRef = useRef<WireData[]>(buildWires());
  const mouseRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const onWirePluckedRef = useRef(onWirePlucked);
  onWirePluckedRef.current = onWirePlucked;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const colorRef = useRef(color);
  colorRef.current = color;
  const lineWidthRef = useRef(lineWidth);
  lineWidthRef.current = lineWidth;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const doResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cw = container.clientWidth;
      const ch = Math.max(container.clientHeight, window.innerHeight);
      const maxW = cw * 0.8;
      const maxH = ch * 0.3;
      const scale = Math.min(maxW / LOGO_WIDTH, maxH / LOGO_HEIGHT);
      scaleRef.current = scale;
      const logoPixelW = LOGO_WIDTH * scale;
      const logoPixelH = LOGO_HEIGHT * scale;
      const padX = (cw - logoPixelW) / 2;
      const padY = (ch - logoPixelH) / 2 - ch * 0.05;
      offsetRef.current = { x: padX, y: padY };
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };

    doResize();

    const ro = new ResizeObserver(doResize);
    ro.observe(container);

    // Mouse tracking — convert to logo-space
    const toLogoSpace = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const { x: ox, y: oy } = offsetRef.current;
      const s = scaleRef.current;
      return {
        x: (clientX - rect.left - ox) / s,
        y: (clientY - rect.top - oy) / s,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = toLogoSpace(e.clientX, e.clientY);
      mouseRef.current = pos;
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      mouseRef.current = toLogoSpace(t.clientX, t.clientY);
    };
    const onTouchEnd = () => {
      mouseRef.current = { x: null, y: null };
    };

    if (interactiveRef.current) {
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchend", onTouchEnd);
    }

    // Track which wires were recently plucked (debounce)
    const pluckedCooldown = new Set<number>();

    // Animation loop
    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale for DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Physics
      if (interactiveRef.current) {
        updatePhysics(wiresRef.current, mouseRef.current.x, mouseRef.current.y);

        // Detect plucked wires and trigger sound
        if (onWirePluckedRef.current) {
          wiresRef.current.forEach((wire, wireIdx) => {
            if (pluckedCooldown.has(wireIdx)) return;
            for (const p of wire.points) {
              const dx = p.x - p.restX;
              const dy = p.y - p.restY;
              if (dx * dx + dy * dy > 100) { // displacement > ~10 units
                onWirePluckedRef.current!(wireIdx);
                pluckedCooldown.add(wireIdx);
                setTimeout(() => pluckedCooldown.delete(wireIdx), 300);
                break;
              }
            }
          });
        }
      }

      // Draw
      drawWires(
        ctx,
        wiresRef.current,
        scaleRef.current,
        offsetRef.current.x,
        offsetRef.current.y,
        colorRef.current,
        lineWidthRef.current,
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (interactiveRef.current) {
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseleave", onMouseLeave);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="FLEXLAB"
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
}
