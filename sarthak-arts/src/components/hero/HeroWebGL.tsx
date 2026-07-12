"use client";

/**
 * HeroWebGL — the sanctum scene.
 *
 * Three.js + React Three Fiber + postprocessing:
 *   - Procedural 3D Śrī Yantra (Bhūpura, circles, 16+8-petal lotuses, 9 triangles)
 *     as glowing gold line geometry
 *   - The Bindu: an emissive gold sphere that doubles as the god-rays light source
 *   - God-rays radiating from the Bindu — consciousness radiating outward
 *   - ~5,000 golden dust motes with cursor gravity
 *   - Cursor-tracked warm point light
 *   - Scroll-driven camera dolly (flies into the yantra)
 *   - Post: god-rays, bloom (tuned 1.15), vignette, film grain
 *
 * Honors prefers-reduced-motion (renders a static gradient instead) and
 * reduces particle counts on small screens.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, GodRays, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Shared cursor tracker (normalized -1..1, +y up)
// ---------------------------------------------------------------------------
function useCursor() {
  const cursor = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursor.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      cursor.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return cursor;
}

// ---------------------------------------------------------------------------
// Scroll fade — one shared rule: the scene is the threshold, the content is
// the room. Everything ambient defers once the visitor scrolls inside.
// Returns 1 at the top of the page, (1 - strength) once past ~1.6 viewports.
// ---------------------------------------------------------------------------
function heroScrollFade(strength: number): number {
  const h = document.documentElement;
  const frac = Math.min(1, h.scrollTop / (window.innerHeight * 1.6));
  return 1 - frac * strength;
}

// ---------------------------------------------------------------------------
// Śrī Yantra line geometry — Bhūpura, circles, lotuses, nine triangles
// ---------------------------------------------------------------------------
function SriYantra() {
  const groupRef = useRef<THREE.Group>(null!);
  const cursor = useCursor();

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (dt * Math.PI * 2) / 90; // one revolution / 90s
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0.25 + cursor.current.y * 0.08,
      0.03,
    );
    // The yantra belongs to the hero — it bows out to ~8% behind the sections.
    const fade = heroScrollFade(0.92);
    for (const child of groupRef.current.children) {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      if (mat?.userData?.baseOpacity !== undefined) {
        mat.opacity = mat.userData.baseOpacity * fade;
      }
    }
  });

  const layers = useMemo(() => {
    const outs: { points: THREE.Vector3[]; opacity: number }[] = [];

    // Bhūpura — three concentric squares
    for (let i = 0; i < 3; i++) {
      const s = 2.6 - i * 0.06;
      outs.push({
        points: [
          new THREE.Vector3(-s, -s, 0), new THREE.Vector3(s, -s, 0),
          new THREE.Vector3(s, s, 0), new THREE.Vector3(-s, s, 0),
          new THREE.Vector3(-s, -s, 0),
        ],
        opacity: 0.5 - i * 0.13,
      });
    }

    // Three concentric circles
    const circle = (r: number, segments = 96) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      return pts;
    };
    for (let i = 0; i < 3; i++) outs.push({ points: circle(2.05 - i * 0.06), opacity: 0.5 - i * 0.13 });

    // Lotus petal rings (Ṣoḍaśadala 16, Aṣṭadala 8)
    const petals = (radius: number, count: number, depth: number) => {
      const groups: THREE.Vector3[][] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rootA = a - Math.PI / count;
        const rootB = a + Math.PI / count;
        const rx1 = Math.cos(rootA) * radius * 0.85, ry1 = Math.sin(rootA) * radius * 0.85;
        const rx2 = Math.cos(rootB) * radius * 0.85, ry2 = Math.sin(rootB) * radius * 0.85;
        const tx = Math.cos(a) * (radius + depth), ty = Math.sin(a) * (radius + depth);
        const pts: THREE.Vector3[] = [new THREE.Vector3(rx1, ry1, 0)];
        for (let t = 0; t <= 1; t += 0.1) {
          const bow = Math.sin(Math.PI * t) * depth * 0.3;
          pts.push(new THREE.Vector3(
            rx1 * (1 - t) + tx * t + Math.cos(a) * bow,
            ry1 * (1 - t) + ty * t + Math.sin(a) * bow, 0));
        }
        for (let t = 0; t <= 1; t += 0.1) {
          const bow = Math.sin(Math.PI * t) * depth * 0.3;
          pts.push(new THREE.Vector3(
            tx * (1 - t) + rx2 * t - Math.cos(a) * bow,
            ty * (1 - t) + ry2 * t - Math.sin(a) * bow, 0));
        }
        pts.push(new THREE.Vector3(rx2, ry2, 0));
        groups.push(pts);
      }
      return groups;
    };
    petals(1.65, 16, 0.32).forEach((p) => outs.push({ points: p, opacity: 0.55 }));
    petals(1.15, 8, 0.32).forEach((p) => outs.push({ points: p, opacity: 0.68 }));

    // Nine interlocking triangles — 4 Śiva up, 5 Śakti down
    const triangle = (size: number, up: boolean) => {
      const h = size * 0.87;
      const apexY = up ? size : -size;
      const baseY = up ? -size * 0.5 : size * 0.5;
      return [
        new THREE.Vector3(0, apexY, 0),
        new THREE.Vector3(-h, baseY, 0),
        new THREE.Vector3(h, baseY, 0),
        new THREE.Vector3(0, apexY, 0),
      ];
    };
    for (let i = 0; i < 4; i++) outs.push({ points: triangle(0.85 - i * 0.14, true), opacity: 0.88 - i * 0.05 });
    for (let i = 0; i < 5; i++) outs.push({ points: triangle(0.95 - i * 0.14, false), opacity: 0.88 - i * 0.05 });

    // Construct real THREE.Line objects — avoids the JSX <line>/SVG ambiguity.
    // Line gold sits below the bloom threshold: crisp gold thread, no haze.
    const gold = new THREE.Color(1.75, 1.28, 0.42);
    return outs.map((l) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(l.points);
      const material = new THREE.LineBasicMaterial({
        color: gold, transparent: true, opacity: l.opacity * 0.85,
      });
      material.toneMapped = false;
      material.userData.baseOpacity = l.opacity * 0.85; // for the scroll fade
      return new THREE.Line(geometry, material);
    });
  }, []);

  return (
    <group ref={groupRef} rotation={[0.25, 0, 0]}>
      {layers.map((line, i) => (
        <primitive object={line} key={i} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The Bindu — emissive gold sphere; also the god-rays occlusion light source
// ---------------------------------------------------------------------------
function Bindu({ onReady }: { onReady: (mesh: THREE.Mesh) => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  useEffect(() => {
    if (ref.current) onReady(ref.current);
  }, [onReady]);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    // The Bindu blazes at the threshold and settles to a dim ember behind the
    // content — the god-rays follow automatically, since they sample its
    // rendered brightness. Below bloom threshold it stops glowing entirely.
    const fade = Math.max(0.02, heroScrollFade(0.99));
    matRef.current.color.setRGB(6 * fade, 4.2 * fade, 1.6 * fade);
    const breath = 1 + Math.sin(t * 1.2) * 0.12;
    ref.current.scale.setScalar(breath * (0.4 + 0.6 * fade));
  });

  return (
    <mesh ref={ref} position={[0, 0, 0.02]}>
      <sphereGeometry args={[0.07, 32, 32]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(6, 4.2, 1.6)} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Golden dust — cursor-gravity particle field.
// All motion computed on the GPU in the vertex shader from static buffers —
// zero per-frame CPU work (only two uniform updates per frame).
// ---------------------------------------------------------------------------
function ParticleField({ count = 1800 }: { count?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const cursor = useCursor();
  const cursorWorld = useRef(new THREE.Vector2());

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      // Biased behind the yantra (z mostly negative) — background dust,
      // not foreground snow. Only ~20% drift in front of it.
      positions[i * 3 + 2] = Math.random() < 0.2
        ? Math.random() * 1.5
        : -Math.random() * 6.5;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);

  useFrame(() => {
    if (!materialRef.current) return;
    cursorWorld.current.set(cursor.current.x * 4, cursor.current.y * 3);
    const u = materialRef.current.uniforms;
    u.uTime.value = performance.now() * 0.001;
    (u.uCursor.value as THREE.Vector2).lerp(cursorWorld.current, 0.08);
    // Dust dims to ~35% behind the content sections — atmosphere without competition
    u.uFade.value = heroScrollFade(0.82);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-seed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uCursor: { value: new THREE.Vector2(0, 0) },
          uFade: { value: 1 },
        }}
        vertexShader={`
          attribute float seed;
          uniform float uTime;
          uniform vec2 uCursor;
          varying float vSeed;
          void main() {
            vSeed = seed;
            // Ambient drift — computed here, not on the CPU
            vec3 pos = position;
            pos.x += sin(uTime * 0.3 + seed * 12.0) * 0.4;
            pos.y += cos(uTime * 0.25 + seed * 18.0) * 0.5;
            pos.z += sin(uTime * 0.15 + seed * 5.0) * 0.3;
            // Cursor gravity — nearby motes lean toward the light
            vec2 toCursor = uCursor - pos.xy;
            float d2 = dot(toCursor, toCursor);
            float pull = min(0.6 / (d2 + 0.3), 0.4);
            pos.xy += toCursor * pull * 0.5;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPos;
            gl_PointSize = (32.0 + seed * 22.0) * (1.0 / -mvPos.z) * (1.0 + seed * 0.6);
          }
        `}
        fragmentShader={`
          varying float vSeed;
          uniform float uFade;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float alpha = pow(1.0 - d * 2.0, 2.5);
            // Below bloom threshold — dust glints, it does not glow
            vec3 color = mix(vec3(1.45, 1.05, 0.38), vec3(1.85, 1.5, 0.7), vSeed);
            gl_FragColor = vec4(color, alpha * (0.16 + vSeed * 0.22) * uFade);
          }
        `}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Cursor-tracked warm point light
// ---------------------------------------------------------------------------
function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const cursor = useCursor();
  const target = useMemo(() => new THREE.Vector3(0, 0, 2.5), []);

  useFrame(() => {
    if (!lightRef.current) return;
    target.set(cursor.current.x * 4, cursor.current.y * 3, 2.5);
    lightRef.current.position.lerp(target, 0.15);
  });

  return <pointLight ref={lightRef} color="#FCD46F" intensity={6} distance={8} decay={1.8} position={[0, 0, 3]} />;
}

// ---------------------------------------------------------------------------
// Scroll-driven camera dolly
// ---------------------------------------------------------------------------
function CameraController() {
  const { camera } = useThree();
  const scrollFrac = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      // Only the first two viewports of scroll drive the dolly — after that the
      // scene holds its final framing (content sections take over visually).
      const range = window.innerHeight * 2;
      scrollFrac.current = Math.min(1, h.scrollTop / range);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(() => {
    const targetZ = 5.5 - scrollFrac.current * 3.2;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollFrac.current * 0.7, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Scene root — assembles everything; god-rays wire up once the Bindu exists
// ---------------------------------------------------------------------------
function SanctumScene({ particleCount }: { particleCount: number }) {
  const [sun, setSun] = useState<THREE.Mesh | null>(null);

  return (
    <>
      {/* No opaque background — the canvas is transparent so the deep-indigo
          CSS gradient behind it becomes the world. Blue is the ground; gold
          is only the jewelry. Fog tints distant lines toward indigo. */}
      <fog attach="fog" args={["#100833", 6, 16]} />

      <ambientLight intensity={0.4} color="#3A2C7E" />
      <directionalLight position={[3, 4, 2]} intensity={0.45} color="#E8B849" />
      <CursorLight />
      <Environment preset="studio" background={false} />

      <SriYantra />
      <Bindu onReady={setSun} />
      <ParticleField count={particleCount} />
      <CameraController />

      {sun && (
        <EffectComposer multisampling={0}>
          {/* God-rays from the Bindu — felt, not blinding */}
          <GodRays
            sun={sun}
            blendFunction={BlendFunction.SCREEN}
            samples={32}
            density={0.9}
            decay={0.9}
            weight={0.22}
            exposure={0.26}
            clampMax={1}
            blur
          />
          {/* Threshold at 1.0: only truly hot elements (the Bindu, ray core)
              bloom — the rest of the scene stays quiet */}
          <Bloom intensity={0.9} luminanceThreshold={1.0} luminanceSmoothing={0.4} mipmapBlur radius={0.75} />
          <Vignette offset={0.25} darkness={0.55} eskil={false} blendFunction={BlendFunction.NORMAL} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.1} />
        </EffectComposer>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
export function HeroWebGL() {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1800);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (window.innerWidth < 720) setParticleCount(900); // mobile perf budget
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Reduced motion: a still, dignified gradient — no animation forced on anyone
  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 85% 65% at 50% 32%, #221060 0%, #140A38 42%, #0A0420 68%, #05020F 100%)",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        opacity: ready ? 1 : 0,
        transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        // The world is deep indigo — the transparent canvas draws gold over it
        background:
          "radial-gradient(ellipse 85% 65% at 50% 32%, #221060 0%, #140A38 42%, #0A0420 68%, #05020F 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <SanctumScene particleCount={particleCount} />
      </Canvas>
    </div>
  );
}
