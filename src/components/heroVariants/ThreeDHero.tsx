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
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");

      if (disposed) return;

      const scene = new THREE.Scene();
      const bgColor = params?.palette.bg ?? "#f0f0f0";
      scene.background = new THREE.Color(bgColor);

      const width = container.clientWidth;
      const height = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 6);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = "crosshair";

      // --- Environment map for realistic reflections/refractions ---
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();

      // --- Glass material (the real deal) ---
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        thickness: 1.5,
        ior: 1.5,
        envMapIntensity: 1.5,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
        transparent: true,
      });

      // --- Background objects for the glass to refract ---
      // Colored spheres behind the logo
      const sphereGeo = new THREE.SphereGeometry(0.15, 32, 32);
      const colors = [0x2563eb, 0x06b6d4, 0x8b5cf6, 0xf472b6, 0x22c55e];
      for (let i = 0; i < 12; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          metalness: 0.3,
          roughness: 0.4,
        });
        const sphere = new THREE.Mesh(sphereGeo, mat);
        sphere.position.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 2,
          -2 - Math.random() * 3,
        );
        sphere.scale.setScalar(0.5 + Math.random() * 1.5);
        scene.add(sphere);
      }

      // Subtle grid plane behind
      const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xe5e5e5);
      gridHelper.position.z = -4;
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);

      // --- Build 3D glass logo ---
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

        // Rounded bar shape — cylinder-like cross section
        const thickness = 0.055;
        // capSegments=2 (less rounded ends), radialSegments=6
        const geometry = new THREE.CapsuleGeometry(thickness, len - thickness * 2, 2, 6);
        // Capsule is vertical by default, rotate to horizontal
        geometry.rotateZ(Math.PI / 2);

        const mesh = new THREE.Mesh(geometry, glassMaterial);
        mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);

        const angle = Math.atan2(dy, dx);
        mesh.rotation.z = angle;

        logoGroup.add(mesh);
      });

      scene.add(logoGroup);

      // --- Lights ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
      keyLight.position.set(3, 5, 5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xaaddff, 0.5);
      rimLight.position.set(-3, -1, -3);
      scene.add(rimLight);

      // --- Mouse tracking ---
      const mouse = { x: 0, y: 0 };

      const onMouseMove = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      renderer.domElement.addEventListener("mousemove", onMouseMove);

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

      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);

      // --- Animation ---
      let raf = 0;
      const animate = () => {
        if (disposed) return;

        // Mouse follow
        logoGroup.rotation.y += (mouse.x * 0.3 - logoGroup.rotation.y) * 0.04;
        logoGroup.rotation.x += (-mouse.y * 0.15 - logoGroup.rotation.x) * 0.04;

        // Idle rotation
        logoGroup.rotation.y += 0.001;

        // Float
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ background: params?.palette.bg ?? "#f0f0f0" }}>
      <div ref={containerRef} className="absolute inset-0" />
      <h1 className="sr-only">FLEXLAB - Genoray Software Laboratory</h1>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ArrowDown size={20} style={{ color: params?.palette.fg ?? "#2d4a8a" }} className="opacity-30" />
      </div>
    </section>
  );
}
