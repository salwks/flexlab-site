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
      const bgColor = params?.palette.bg ?? "#f8f8f8";
      scene.background = new THREE.Color(bgColor);

      // Fog for depth
      scene.fog = new THREE.FogExp2(bgColor, 0.15);

      const width = container.clientWidth;
      const height = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 6);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = "crosshair";

      // --- Lighting for glass realism ---

      // Soft ambient fill
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      // Key light — warm, strong
      const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
      keyLight.position.set(4, 6, 5);
      keyLight.castShadow = false;
      scene.add(keyLight);

      // Fill light — cool blue from opposite side
      const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6);
      fillLight.position.set(-4, 2, 3);
      scene.add(fillLight);

      // Rim light — strong backlight for glass edge glow
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
      rimLight.position.set(0, -2, -6);
      scene.add(rimLight);

      // Top light for specular highlights
      const topLight = new THREE.PointLight(0xffffff, 0.5, 20);
      topLight.position.set(0, 5, 3);
      scene.add(topLight);

      // Environment map for reflections (simple gradient)
      const cubeRT = new THREE.WebGLCubeRenderTarget(256);
      const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRT);
      // Create a simple gradient sphere for environment
      const envGeo = new THREE.SphereGeometry(50, 32, 32);
      const envMat = new THREE.MeshBasicMaterial({
        color: 0xddeeff,
        side: THREE.BackSide,
      });
      const envSphere = new THREE.Mesh(envGeo, envMat);
      scene.add(envSphere);
      cubeCamera.position.set(0, 0, 0);
      cubeCamera.update(renderer, scene);
      scene.remove(envSphere);

      // --- Glass material ---
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(params?.palette.fg ?? "#2d4a8a"),
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.85,       // glass transparency
        thickness: 0.5,           // refraction depth
        ior: 1.5,                 // index of refraction (glass)
        envMap: cubeRT.texture,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
        transparent: true,
        opacity: 0.95,
      });

      // --- Build 3D logo ---
      const logoGroup = new THREE.Group();
      const centerX = LOGO_WIDTH / 2;
      const centerY = LOGO_HEIGHT / 2;
      const logoScale = 4 / LOGO_WIDTH;

      allSegments.forEach((seg) => {
        const x1 = (seg.x1 - centerX) * logoScale;
        const y1 = -(seg.y1 - centerY) * logoScale;
        const x2 = (seg.x2 - centerX) * logoScale;
        const y2 = -(seg.y2 - centerY) * logoScale;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) return;

        // Rounded cross-section for glass bar
        const thickness = 0.04;
        const depth = 0.12;

        // Use rounded box via capsule-like approach: box + edge beveling
        const geometry = new THREE.BoxGeometry(len, thickness, depth, 1, 1, 1);

        // Slight bevel by scaling vertices at edges
        const posAttr = geometry.getAttribute("position");
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          // Soften corners
          const edgeFactor = 1 - Math.pow(Math.abs(x) / (len / 2), 8) * 0.1;
          posAttr.setY(i, y * edgeFactor);
          posAttr.setZ(i, z * edgeFactor);
        }
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, glassMaterial);
        mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);

        const angle = Math.atan2(dy, dx);
        mesh.rotation.z = angle;

        logoGroup.add(mesh);
      });

      scene.add(logoGroup);

      // --- Floor reflection plane (subtle) ---
      const floorGeo = new THREE.PlaneGeometry(20, 20);
      const floorMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(bgColor),
        metalness: 0.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.3,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(0, -1.2, 0);
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      // --- Mouse tracking ---
      const mouse = { x: 0, y: 0 };

      const onMouseMove = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      renderer.domElement.addEventListener("mousemove", onMouseMove);

      // Sound on click
      const pluckedCooldown = new Set<number>();
      const onClick = () => {
        const idx = Math.floor(Math.random() * allSegments.length);
        if (!pluckedCooldown.has(idx)) {
          onNoteRef.current?.(idx);
          pluckedCooldown.add(idx);
          setTimeout(() => pluckedCooldown.delete(idx), 300);
        }
      };
      renderer.domElement.addEventListener("click", onClick);

      // Resize
      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);

      // --- Animation loop ---
      let raf = 0;
      const animate = () => {
        if (disposed) return;

        // Smooth rotation following mouse
        const targetY = mouse.x * 0.3;
        const targetX = -mouse.y * 0.15;
        logoGroup.rotation.y += (targetY - logoGroup.rotation.y) * 0.04;
        logoGroup.rotation.x += (targetX - logoGroup.rotation.x) * 0.04;

        // Gentle idle rotation
        logoGroup.rotation.y += 0.0008;

        // Subtle floating
        logoGroup.position.y = Math.sin(Date.now() * 0.001) * 0.03;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

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
  }, [params]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ background: params?.palette.bg ?? "#f8f8f8" }}>
      <div ref={containerRef} className="absolute inset-0" />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} style={{ color: params?.palette.fg ?? "#2d4a8a" }} className="opacity-30" />
      </div>
    </section>
  );
}
