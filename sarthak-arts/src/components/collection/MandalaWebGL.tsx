"use client";

/**
 * MandalaWebGL — the Collection page's living background.
 *
 * A deliberate SIBLING of the homepage's HeroWebGL, sharing its exact
 * visual DNA so the two pages feel like one world:
 *   - The same deep indigo-violet cosmic ground ("blue is the ground,
 *     gold is only the jewelry")
 *   - The same glowing-gold line geometry richness — bhūpura squares,
 *     concentric circles, 16- and 8-petal lotuses
 *   - The same emissive gold Bindu driving real GodRays
 *   - The same GPU gold-dust field with cursor gravity
 *   - The same real Bloom (luminance-threshold) + vignette + grain
 *
 * What makes it its OWN page rather than a copy: at the heart, instead
 * of the homepage's nine Śrī Yantra triangles, sits the Vastu Purusha
 * Mandala — the 3x3 diagram this page is actually about, every product
 * placed by direction. The five real seeded products are set into their
 * real directions as small jewels of gemstone color (sapphire, ruby,
 * turquoise, amethyst, clear quartz) — colour set into gold, exactly as
 * the real pieces are made. Hover / wishlist / filter make those jewels
 * respond, layered over the gold-on-indigo foundation, never replacing it.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, GodRays, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

export type MandalaZone = "NW" | "N" | "NE" | "W" | "C" | "E" | "SW" | "S" | "SE";

const CELL = 0.62;
const ZONE_POS: Record<MandalaZone, [number, number]> = {
  NW: [-CELL, CELL], N: [0, CELL], NE: [CELL, CELL],
  W: [-CELL, 0], C: [0, 0], E: [CELL, 0],
  SW: [-CELL, -CELL], S: [0, -CELL], SE: [CELL, -CELL],
};

export interface MandalaGemZone {
  zone: MandalaZone;
  color: [number, number, number];
}
// The five real seeded products, real gemstones (RGB), real zones.
export const REAL_GEM_ZONES: MandalaGemZone[] = [
  { zone: "NE", color: [0.28, 0.55, 1.0] },  // Copper Kalash — blue sapphire
  { zone: "N", color: [1.0, 0.16, 0.24] },   // Silver Sri Yantra — ruby
  { zone: "E", color: [0.16, 0.9, 0.8] },    // Gold Om Panel — turquoise
  { zone: "NW", color: [0.62, 0.34, 0.92] }, // Copper-Brass Chime — amethyst
  { zone: "C", color: [1.0, 0.94, 0.8] },    // Brahmasthan — clear quartz / brand gold
];
const UNLIT_ZONES: MandalaZone[] = ["W", "SW", "S", "SE"];

const GOLD = new THREE.Color(1.75, 1.28, 0.42);

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

function heroScrollFade(strength: number): number {
  const h = document.documentElement;
  const frac = Math.min(1, h.scrollTop / (window.innerHeight * 1.6));
  return 1 - frac * strength;
}

// ---------------------------------------------------------------------------
// The mandala — rich gold line geometry (same fidelity as the homepage's
// Śrī Yantra), with a Vastu Purusha 3x3 grid at its heart.
// ---------------------------------------------------------------------------
function VastuMandala() {
  const groupRef = useRef<THREE.Group>(null!);
  const cursor = useCursor();

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (dt * Math.PI * 2) / 120; // slow, like the homepage
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, 0.24 + cursor.current.y * 0.08, 0.03,
    );
    const fade = heroScrollFade(0.9);
    for (const child of groupRef.current.children) {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      if (mat?.userData?.baseOpacity !== undefined) mat.opacity = mat.userData.baseOpacity * fade;
    }
  });

  const layers = useMemo(() => {
    const outs: { points: THREE.Vector3[]; opacity: number }[] = [];

    // Bhūpura — three concentric squares (the earth boundary)
    for (let i = 0; i < 3; i++) {
      const s = 2.5 - i * 0.06;
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
    for (let i = 0; i < 3; i++) outs.push({ points: circle(1.98 - i * 0.06), opacity: 0.5 - i * 0.13 });

    // Lotus petal rings — 16 then 8 (Ṣoḍaśadala, Aṣṭadala)
    const petals = (radius: number, count: number, depth: number) => {
      const groups: THREE.Vector3[][] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rootA = a - Math.PI / count, rootB = a + Math.PI / count;
        const rx1 = Math.cos(rootA) * radius * 0.85, ry1 = Math.sin(rootA) * radius * 0.85;
        const rx2 = Math.cos(rootB) * radius * 0.85, ry2 = Math.sin(rootB) * radius * 0.85;
        const tx = Math.cos(a) * (radius + depth), ty = Math.sin(a) * (radius + depth);
        const pts: THREE.Vector3[] = [new THREE.Vector3(rx1, ry1, 0)];
        for (let t = 0; t <= 1; t += 0.1) {
          const bow = Math.sin(Math.PI * t) * depth * 0.3;
          pts.push(new THREE.Vector3(rx1 * (1 - t) + tx * t + Math.cos(a) * bow, ry1 * (1 - t) + ty * t + Math.sin(a) * bow, 0));
        }
        for (let t = 0; t <= 1; t += 0.1) {
          const bow = Math.sin(Math.PI * t) * depth * 0.3;
          pts.push(new THREE.Vector3(tx * (1 - t) + rx2 * t - Math.cos(a) * bow, ty * (1 - t) + ry2 * t - Math.sin(a) * bow, 0));
        }
        pts.push(new THREE.Vector3(rx2, ry2, 0));
        groups.push(pts);
      }
      return groups;
    };
    petals(1.6, 16, 0.3).forEach((p) => outs.push({ points: p, opacity: 0.5 }));
    petals(1.2, 8, 0.3).forEach((p) => outs.push({ points: p, opacity: 0.62 }));

    // The heart: Vastu Purusha 3x3 grid (this is what makes it THIS page)
    const half = CELL * 1.5;
    const div = CELL * 0.5;
    for (const x of [-half, -div, div, half]) outs.push({ points: [new THREE.Vector3(x, -half, 0), new THREE.Vector3(x, half, 0)], opacity: 0.7 });
    for (const y of [-half, -div, div, half]) outs.push({ points: [new THREE.Vector3(-half, y, 0), new THREE.Vector3(half, y, 0)], opacity: 0.7 });

    return outs.map((l) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(l.points);
      const material = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: l.opacity * 0.85 });
      material.toneMapped = false;
      material.userData.baseOpacity = l.opacity * 0.85;
      return new THREE.Line(geometry, material);
    });
  }, []);

  return (
    <group ref={groupRef} rotation={[0.24, 0, 0]}>
      {layers.map((line, i) => <primitive object={line} key={i} />)}
      {REAL_GEM_ZONES.map((g) => <GemZone key={g.zone} zone={g.zone} color={g.color} active />)}
      {UNLIT_ZONES.map((zone) => <GemZone key={zone} zone={zone} color={[1.4, 1.05, 0.4]} active={false} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// A gemstone set into the mandala at its real direction. Reads hover /
// wishlist / filter state from the shared interaction store (module-level
// refs updated by the scene props each frame) so it can live inside the
// rotating group without prop threading.
// ---------------------------------------------------------------------------
const interaction = {
  hoveredZone: null as MandalaZone | null,
  wishedZones: new Set<MandalaZone>(),
  filterZone: null as MandalaZone | null,
};

function GemZone({ zone, color, active }: { zone: MandalaZone; color: [number, number, number]; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [x, y] = ZONE_POS[zone];
  const isCenter = zone === "C";

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, heroScrollFade(0.9));
    const breath = 1 + Math.sin(t * 1.1 + x + y) * 0.1;

    const isHovered = interaction.hoveredZone === zone;
    const isWished = interaction.wishedZones.has(zone);
    const isFiltered = interaction.filterZone === zone;
    const anyFilter = interaction.filterZone !== null;

    // Resting brightness sits ABOVE the bloom threshold so the jewels glow at
    // rest (unlike the earlier build where they were dim until hovered).
    let target = active ? 1.5 : 0.4;
    if (anyFilter && active && !isFiltered) target = 0.5; // recede non-matching
    if (isFiltered) target = 2.4;
    if (isWished) target = 2.2;
    if (isHovered) target = 3.6;
    target *= fade;

    const cur = matRef.current.userData.intensity ?? target;
    const next = THREE.MathUtils.lerp(cur, target, 0.09);
    matRef.current.userData.intensity = next;
    matRef.current.color.setRGB(color[0] * next, color[1] * next, color[2] * next);

    const scaleTarget = (isCenter ? 1.5 : 1) * (isHovered ? 1.4 : isWished ? 1.18 : 1) * breath;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x || 1, scaleTarget, 0.1));
  });

  return (
    <mesh ref={ref} position={[x, y, 0.04]}>
      <sphereGeometry args={[isCenter ? 0.08 : 0.055, 24, 24]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(...color)} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// The Bindu — emissive gold sphere; also the god-rays occlusion light source.
// (Same as the homepage.)
// ---------------------------------------------------------------------------
function Bindu({ onReady }: { onReady: (mesh: THREE.Mesh) => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  useEffect(() => { if (ref.current) onReady(ref.current); }, [onReady]);
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.04, heroScrollFade(0.99));
    matRef.current.color.setRGB(6 * fade, 4.2 * fade, 1.6 * fade);
    const breath = 1 + Math.sin(t * 1.2) * 0.12;
    ref.current.scale.setScalar(breath * (0.5 + 0.5 * fade));
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.02]}>
      <sphereGeometry args={[0.06, 32, 32]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(6, 4.2, 1.6)} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Gold dust — GPU-driven particle field (same as the homepage).
// ---------------------------------------------------------------------------
function ParticleField({ count = 1400 }: { count?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const cursor = useCursor();
  const cursorWorld = useRef(new THREE.Vector2());

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = Math.random() < 0.2 ? Math.random() * 1.5 : -Math.random() * 6.5;
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
        uniforms={{ uTime: { value: 0 }, uCursor: { value: new THREE.Vector2(0, 0) }, uFade: { value: 1 } }}
        vertexShader={`
          attribute float seed; uniform float uTime; uniform vec2 uCursor; varying float vSeed;
          void main() {
            vSeed = seed; vec3 pos = position;
            pos.x += sin(uTime * 0.3 + seed * 12.0) * 0.4;
            pos.y += cos(uTime * 0.25 + seed * 18.0) * 0.5;
            pos.z += sin(uTime * 0.15 + seed * 5.0) * 0.3;
            vec2 toCursor = uCursor - pos.xy; float d2 = dot(toCursor, toCursor);
            float pull = min(0.6 / (d2 + 0.3), 0.4); pos.xy += toCursor * pull * 0.5;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPos;
            gl_PointSize = (32.0 + seed * 22.0) * (1.0 / -mvPos.z) * (1.0 + seed * 0.6);
          }
        `}
        fragmentShader={`
          varying float vSeed; uniform float uFade;
          void main() {
            vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
            float alpha = pow(1.0 - d * 2.0, 2.5);
            vec3 color = mix(vec3(1.45, 1.05, 0.38), vec3(1.85, 1.5, 0.7), vSeed);
            gl_FragColor = vec4(color, alpha * (0.16 + vSeed * 0.22) * uFade);
          }
        `}
      />
    </points>
  );
}

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

function CameraController() {
  const { camera } = useThree();
  const scrollFrac = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
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

function MandalaScene({ particleCount }: { particleCount: number }) {
  const [sun, setSun] = useState<THREE.Mesh | null>(null);
  return (
    <>
      <fog attach="fog" args={["#100833", 6, 16]} />
      <ambientLight intensity={0.4} color="#3A2C7E" />
      <directionalLight position={[3, 4, 2]} intensity={0.45} color="#E8B849" />
      <CursorLight />
      <Environment preset="studio" background={false} />

      <VastuMandala />
      <Bindu onReady={setSun} />
      <ParticleField count={particleCount} />
      <CameraController />

      {sun && (
        <EffectComposer multisampling={0}>
          <GodRays sun={sun} blendFunction={BlendFunction.SCREEN} samples={32} density={0.9} decay={0.9} weight={0.22} exposure={0.26} clampMax={1} blur />
          <Bloom intensity={0.95} luminanceThreshold={1.0} luminanceSmoothing={0.4} mipmapBlur radius={0.75} />
          <Vignette offset={0.25} darkness={0.55} eskil={false} blendFunction={BlendFunction.NORMAL} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.1} />
        </EffectComposer>
      )}
    </>
  );
}

export interface MandalaWebGLProps {
  hoveredZone: MandalaZone | null;
  wishedZones: Set<MandalaZone>;
  filterZone: MandalaZone | null;
}

export function MandalaWebGL({ hoveredZone, wishedZones, filterZone }: MandalaWebGLProps) {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1400);
  const [inView, setInView] = useState(true);

  // Push interaction state into the module store the gem zones read from.
  interaction.hoveredZone = hoveredZone;
  interaction.wishedZones = wishedZones;
  interaction.filterZone = filterZone;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (window.innerWidth < 720) setParticleCount(700);
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = true;
    const check = () => {
      raf = 0;
      const threshold = window.innerHeight * 1.8;
      const next = window.scrollY < threshold;
      if (next !== last) { last = next; setInView(next); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Same deep indigo-violet ground as the homepage — the shared "sky".
  const groundGradient =
    "radial-gradient(ellipse 85% 65% at 50% 34%, #221060 0%, #140A38 42%, #0A0420 68%, #05020F 100%)";

  if (reducedMotion) {
    return <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: groundGradient }} />;
  }

  return (
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      opacity: ready ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      background: groundGradient,
    }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
      >
        <MandalaScene particleCount={particleCount} />
      </Canvas>
    </div>
  );
}
