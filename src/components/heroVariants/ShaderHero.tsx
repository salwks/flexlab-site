"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import type { HeroParams } from "./randomParams";

interface ShaderHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

// Vertex shader
const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader — noise distortion around logo lines
const FRAG = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_seed;

  // Simplex-ish noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1 + u_seed, 311.7 + u_seed))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      val += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  // Logo SDF — distance to nearest line segment
  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * t);
  }

  // Logo line segments (injected as constants)
  ${(() => {
    const lines = allSegments.map(
      (s, i) =>
        `const vec4 L${i} = vec4(${(s.x1 / LOGO_WIDTH).toFixed(4)}, ${(s.y1 / LOGO_HEIGHT).toFixed(4)}, ${(s.x2 / LOGO_WIDTH).toFixed(4)}, ${(s.y2 / LOGO_HEIGHT).toFixed(4)});`,
    );
    return lines.join("\n  ");
  })()}

  float logoDist(vec2 uv) {
    float d = 999.0;
    ${allSegments.map((_, i) => `d = min(d, segDist(uv, L${i}.xy, L${i}.zw));`).join("\n    ")}
    return d;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Map to logo space (centered, aspect corrected)
    float logoAspect = ${(LOGO_WIDTH / LOGO_HEIGHT).toFixed(4)};
    float scale = 0.7;
    vec2 logoUv;
    logoUv.x = (uv.x - 0.5) * aspect / (logoAspect * scale) + 0.5;
    logoUv.y = (1.0 - uv.y - 0.5) / scale + 0.5;

    float dist = logoDist(logoUv);

    // Noise distortion
    float n = fbm(uv * 3.0 + u_time * 0.15);
    float n2 = fbm(uv * 8.0 - u_time * 0.1 + 100.0);

    // Mouse influence
    vec2 mouseUv = u_mouse / u_resolution;
    float mouseDist = length(uv - mouseUv);
    float mouseInfluence = smoothstep(0.2, 0.0, mouseDist);

    // Logo edge glow
    float edge = smoothstep(0.02 + n * 0.01, 0.005, dist);

    // Flowing color based on noise + time
    vec3 col1 = vec3(0.176, 0.290, 0.541); // #2d4a8a
    vec3 col2 = vec3(0.145, 0.388, 0.922); // #2563eb
    vec3 col3 = vec3(0.024, 0.714, 0.831); // #06b6d4

    vec3 logoColor = mix(col1, col2, n);
    logoColor = mix(logoColor, col3, n2 * 0.5 + mouseInfluence * 0.5);

    // Background — subtle noise texture
    vec3 bgColor = vec3(1.0 - n * 0.03);

    // Outer glow
    float glow = smoothstep(0.08, 0.01, dist) * 0.15;
    vec3 glowColor = mix(col2, col3, n) * glow;

    // Noise distortion ring around mouse
    float mouseRing = smoothstep(0.15, 0.12, mouseDist) * smoothstep(0.08, 0.12, mouseDist);
    float distortedEdge = smoothstep(0.025 + mouseInfluence * 0.015, 0.003, dist + (n - 0.5) * mouseInfluence * 0.03);

    vec3 finalColor = bgColor + glowColor;
    finalColor = mix(finalColor, logoColor, max(edge, distortedEdge));

    // Scanline effect
    float scanline = sin(gl_FragCoord.y * 1.5 + u_time * 2.0) * 0.02;
    finalColor += scanline;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function ShaderHero({ onNoteTriggered, params }: ShaderHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAG);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uSeed = gl.getUniformLocation(program, "u_seed");

    const seed = Math.random() * 1000;
    gl.uniform1f(uSeed, seed);

    let mouseX = -999;
    let mouseY = -999;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const doResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    doResize();
    window.addEventListener("resize", doResize);

    const startTime = performance.now();
    let raf = 0;
    const pluckedCooldown = new Set<number>();

    const animate = () => {
      const t = (performance.now() - startTime) / 1000;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Sound trigger on mouse near logo center
      if (onNoteRef.current && mouseX > 0) {
        const logoScale = 0.7;
        const logoAspect = LOGO_WIDTH / LOGO_HEIGHT;
        const logoCenterX = w / 2;
        const logoCenterY = h / 2;
        const logoW = h * logoScale * logoAspect;

        allSegments.forEach((seg, idx) => {
          if (pluckedCooldown.has(idx)) return;
          const sx = logoCenterX + ((seg.x1 + seg.x2) / 2 / LOGO_WIDTH - 0.5) * logoW;
          const sy = logoCenterY + ((seg.y1 + seg.y2) / 2 / LOGO_HEIGHT - 0.5) * h * logoScale;
          const dist = Math.sqrt((mouseX - sx) ** 2 + (mouseY - sy) ** 2);
          if (dist < 40) {
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
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        role="img"
        aria-label="FLEXLAB"
      />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
