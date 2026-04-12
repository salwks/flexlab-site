"use client";

import { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { allSegments, LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";
import type { HeroParams } from "./randomParams";

interface ThreeDHeroProps {
  onNoteTriggered?: (index: number) => void;
  params?: HeroParams;
}

export default function ThreeDHero({ onNoteTriggered, params }: ThreeDHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onNoteRef = useRef(onNoteTriggered);
  onNoteRef.current = onNoteTriggered;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    (async () => {
      const THREE = await import("three");

      if (disposed) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(params?.palette.bg ?? "#ffffff");

      const width = container.clientWidth;
      const height = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = "crosshair";

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      const backLight = new THREE.DirectionalLight(0x6688cc, 0.4);
      backLight.position.set(-3, -2, -5);
      scene.add(backLight);

      // Build 3D logo from line segments
      const logoGroup = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(params?.palette.fg ?? "#2d4a8a"),
        metalness: 0.3,
        roughness: 0.6,
      });

      // Normalize logo to centered coordinates
      const centerX = LOGO_WIDTH / 2;
      const centerY = LOGO_HEIGHT / 2;
      const logoScale = 4 / LOGO_WIDTH; // fit in ~4 units wide

      allSegments.forEach((seg) => {
        const x1 = (seg.x1 - centerX) * logoScale;
        const y1 = -(seg.y1 - centerY) * logoScale; // flip Y
        const x2 = (seg.x2 - centerX) * logoScale;
        const y2 = -(seg.y2 - centerY) * logoScale;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) return;

        const thickness = 0.035;
        const depth = 0.08;
        const geometry = new THREE.BoxGeometry(len, thickness, depth);
        const mesh = new THREE.Mesh(geometry, material);

        // Position at midpoint
        mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);

        // Rotate to match line angle
        const angle = Math.atan2(dy, dx);
        mesh.rotation.z = angle;

        logoGroup.add(mesh);
      });

      scene.add(logoGroup);

      // Mouse tracking for rotation
      const mouse = { x: 0, y: 0 };
      const targetRotation = { x: 0, y: 0 };

      const onMouseMove = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };

      renderer.domElement.addEventListener("mousemove", onMouseMove);

      // Trigger sound on click
      const pluckedCooldown = new Set<number>();
      const onClick = () => {
        // Trigger random segment
        const idx = Math.floor(Math.random() * allSegments.length);
        if (!pluckedCooldown.has(idx)) {
          onNoteRef.current?.(idx);
          pluckedCooldown.add(idx);
          setTimeout(() => pluckedCooldown.delete(idx), 300);
        }
      };
      renderer.domElement.addEventListener("click", onClick);

      // Resize handler
      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);

      // Animation loop
      let raf = 0;
      const animate = () => {
        if (disposed) return;

        // Smooth rotation toward mouse
        targetRotation.y = mouse.x * 0.4;
        targetRotation.x = -mouse.y * 0.2;
        logoGroup.rotation.y += (targetRotation.y - logoGroup.rotation.y) * 0.05;
        logoGroup.rotation.x += (targetRotation.x - logoGroup.rotation.x) * 0.05;

        // Subtle auto-rotation
        logoGroup.rotation.y += 0.001;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      // Store cleanup
      const cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener("mousemove", onMouseMove);
        renderer.domElement.removeEventListener("click", onClick);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
      (container as unknown as { __cleanup: () => void }).__cleanup = cleanup;
    })();

    return () => {
      disposed = true;
      const cleanup = (container as unknown as { __cleanup?: () => void }).__cleanup;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ background: params?.palette.bg ?? "#ffffff" }}>
      <div ref={containerRef} className="absolute inset-0" />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} className="text-[#2d4a8a]/30" />
      </div>
    </section>
  );
}
