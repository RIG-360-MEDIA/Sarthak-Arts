"use client";

/**
 * BhoomiWebGL — the Collection page's living background.
 *
 * The earthly counterpart to the homepage's heavens. Where HeroWebGL
 * flies UP into an abstract Śrī Yantra floating in the cosmic void,
 * Bhoomi looks ACROSS the consecrated ground a home is built upon:
 *
 *   - A ground plane receding to a warm dusk horizon (not a medallion
 *     facing the camera) — the composition itself is inverted.
 *   - The Vastu Purusha Mandala inscribed FLAT into the earth, glowing
 *     gold, as a temple foundation is chalked onto the ground.
 *   - The five Mahābhūta pooling in their real directions — water blue
 *     in the NE, fire amber in the SE, earth green in the SW, air pale
 *     in the NW, space violet at the centre — genuine multi-colour drawn
 *     from real doctrine, not a single gold wash.
 *   - The five real seeded products risen from their directions as gems.
 *   - Light rising UP from the earth's centre (god-rays), dust lifting
 *     off the warm ground — the earth exhaling — inverse of the homepage
 *     where everything falls inward to the void.
 *
 * Shares the homepage's engineering (three.js + real Bloom/GodRays +
 * GPU particles + reduced-motion + mobile budget) but none of its
 * composition, palette, or camera. Sibling by quality, original by
 * design.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, GodRays, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

export type MandalaZone = "NW" | "N" | "NE" | "W" | "C" | "E" | "SW" | "S" | "SE";

const CELL = 0.72;
// On the ground (XZ plane): North recedes into the distance (-Z),
// South is near the camera (+Z), East is +X, West is -X.
const ZONE_XZ: Record<MandalaZone, [number, number]> = {
  NW: [-CELL, -CELL], N: [0, -CELL], NE: [CELL, -CELL],
  W: [-CELL, 0], C: [0, 0], E: [CELL, 0],
  SW: [-CELL, CELL], S: [0, CELL], SE: [CELL, CELL],
};

// Element colour per direction — the Pancha Mahābhūta, authentic mapping.
const ZONE_ELEMENT_COLOR: Record<MandalaZone, [number, number, number]> = {
  NE: [0.3, 0.62, 1.0],   // Water  · जल
  SE: [1.0, 0.5, 0.16],   // Fire   · अग्नि
  SW: [0.42, 0.85, 0.44], // Earth  · पृथ्वी
  NW: [0.82, 0.86, 0.92], // Air    · वायु
  C: [0.72, 0.5, 1.0],    // Space  · आकाश
  N: [1.0, 0.82, 0.35],   // Wealth (Kubera)
  E: [0.55, 0.85, 0.7],   // (Indra) air-leaning
  W: [0.6, 0.55, 0.85],   // (Varuna) space-leaning
  S: [1.0, 0.55, 0.4],    // (Yama) fire-leaning
};

// Each element behaves true to its nature — this is the intelligent layer.
type ElementKind = "water" | "fire" | "earth" | "air" | "space" | "still";
const ZONE_ELEMENT_KIND: Record<MandalaZone, ElementKind> = {
  NE: "water", SE: "fire", SW: "earth", NW: "air", C: "space",
  N: "still", E: "air", W: "space", S: "fire",
};

// Per-element resting animation character, evaluated on the pool's intensity
// so a pool of water shimmers slowly, a pool of fire flickers, etc.
function elementBreath(kind: ElementKind, t: number, phase: number): number {
  switch (kind) {
    case "water": return 0.9 + Math.sin(t * 0.7 + phase) * 0.12 + Math.sin(t * 1.3 + phase) * 0.05;
    case "fire": return 0.85 + Math.sin(t * 7 + phase) * 0.1 + Math.sin(t * 17 + phase * 2) * 0.08 + Math.sin(t * 3 + phase) * 0.06;
    case "earth": return 0.92 + Math.sin(t * 0.35 + phase) * 0.06;
    case "air": return 0.85 + Math.sin(t * 2.4 + phase) * 0.14;
    case "space": return 0.9 + Math.sin(t * 1.1 + phase) * 0.1;
    default: return 0.88 + Math.sin(t * 0.9 + phase) * 0.1;
  }
}

export interface MandalaGemZone { zone: MandalaZone; color: [number, number, number]; }
// The five real seeded products, real gemstones (RGB), real zones.
export const REAL_GEM_ZONES: MandalaGemZone[] = [
  { zone: "NE", color: [0.3, 0.6, 1.0] },   // Copper Kalash — blue sapphire
  { zone: "N", color: [1.0, 0.18, 0.26] },  // Silver Sri Yantra — ruby
  { zone: "E", color: [0.18, 0.92, 0.82] }, // Gold Om Panel — turquoise
  { zone: "NW", color: [0.64, 0.36, 0.94] },// Copper-Brass Chime — amethyst
  { zone: "C", color: [1.0, 0.95, 0.82] },  // Brahmasthan — clear quartz
];

const GOLD = new THREE.Color(1.6, 1.18, 0.42);

const interaction = {
  hoveredZone: null as MandalaZone | null,
  wishedZones: new Set<MandalaZone>(),
  filterZone: null as MandalaZone | null,
};

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

function scrollFade(strength: number): number {
  const h = document.documentElement;
  const frac = Math.min(1, h.scrollTop / (window.innerHeight * 1.6));
  return 1 - frac * strength;
}

// ---------------------------------------------------------------------------
// The mandala inscribed FLAT into the ground (XZ plane, y≈0).
// ---------------------------------------------------------------------------
function GroundMandala() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z += (dt * Math.PI * 2) / 240; // very slow turn of the ground plan
    const fade = scrollFade(0.85);
    for (const child of groupRef.current.children) {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      if (mat?.userData?.baseOpacity !== undefined) mat.opacity = mat.userData.baseOpacity * fade;
    }
  });

  const layers = useMemo(() => {
    const outs: { points: THREE.Vector3[]; opacity: number }[] = [];
    const flat = (x: number, z: number) => new THREE.Vector3(x, 0, z);

    // Bhūpura — concentric squares (earth boundary, laid flat)
    for (let i = 0; i < 3; i++) {
      const s = 2.6 - i * 0.06;
      outs.push({ points: [flat(-s, -s), flat(s, -s), flat(s, s), flat(-s, s), flat(-s, -s)], opacity: 0.42 - i * 0.1 });
    }
    // Concentric circles
    const circle = (r: number, seg = 96) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(flat(Math.cos(a) * r, Math.sin(a) * r)); }
      return pts;
    };
    for (let i = 0; i < 2; i++) outs.push({ points: circle(2.05 - i * 0.06), opacity: 0.42 - i * 0.1 });

    // Lotus petals — 16 then 8
    const petals = (radius: number, count: number, depth: number) => {
      const groups: THREE.Vector3[][] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rootA = a - Math.PI / count, rootB = a + Math.PI / count;
        const rx1 = Math.cos(rootA) * radius * 0.85, rz1 = Math.sin(rootA) * radius * 0.85;
        const rx2 = Math.cos(rootB) * radius * 0.85, rz2 = Math.sin(rootB) * radius * 0.85;
        const tx = Math.cos(a) * (radius + depth), tz = Math.sin(a) * (radius + depth);
        const pts: THREE.Vector3[] = [flat(rx1, rz1)];
        for (let t = 0; t <= 1; t += 0.12) { const bow = Math.sin(Math.PI * t) * depth * 0.3; pts.push(flat(rx1 * (1 - t) + tx * t + Math.cos(a) * bow, rz1 * (1 - t) + tz * t + Math.sin(a) * bow)); }
        for (let t = 0; t <= 1; t += 0.12) { const bow = Math.sin(Math.PI * t) * depth * 0.3; pts.push(flat(tx * (1 - t) + rx2 * t - Math.cos(a) * bow, tz * (1 - t) + rz2 * t - Math.sin(a) * bow)); }
        pts.push(flat(rx2, rz2));
        groups.push(pts);
      }
      return groups;
    };
    petals(1.65, 16, 0.3).forEach((p) => outs.push({ points: p, opacity: 0.42 }));
    petals(1.2, 8, 0.3).forEach((p) => outs.push({ points: p, opacity: 0.52 }));

    // Vastu 3x3 grid at the heart
    const half = CELL * 1.5, div = CELL * 0.5;
    for (const x of [-half, -div, div, half]) outs.push({ points: [flat(x, -half), flat(x, half)], opacity: 0.6 });
    for (const z of [-half, -div, div, half]) outs.push({ points: [flat(-half, z), flat(half, z)], opacity: 0.6 });

    return outs.map((l) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(l.points);
      const material = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: l.opacity });
      material.toneMapped = false;
      material.userData.baseOpacity = l.opacity;
      return new THREE.Line(geometry, material);
    });
  }, []);

  return <group ref={groupRef}>{layers.map((line, i) => <primitive object={line} key={i} />)}</group>;
}

// ---------------------------------------------------------------------------
// An element pooling on the ground — a soft emissive disc in the zone's
// element colour. All eight directions carry one; the five with real
// products glow brighter and rise as gems on top.
// ---------------------------------------------------------------------------
function ElementPool({ zone }: { zone: MandalaZone }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [x, z] = ZONE_XZ[zone];
  const color = ZONE_ELEMENT_COLOR[zone];
  const kind = ZONE_ELEMENT_KIND[zone];
  const phase = useMemo(() => (x + z) * 3.1, [x, z]);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, scrollFade(0.85));
    const breath = elementBreath(kind, t, phase);

    const isHovered = interaction.hoveredZone === zone;
    const isFiltered = interaction.filterZone === zone;
    const anyFilter = interaction.filterZone !== null;

    let target = 0.55;
    if (anyFilter && !isFiltered) target = 0.14;
    if (isFiltered) target = 1.5;
    if (isHovered) target = 1.7;
    target *= fade * breath;

    const cur = matRef.current.userData.intensity ?? target;
    const next = THREE.MathUtils.lerp(cur, target, 0.08);
    matRef.current.userData.intensity = next;
    matRef.current.opacity = Math.min(0.9, 0.32 * next);
    matRef.current.color.setRGB(color[0] * (0.7 + next * 0.5), color[1] * (0.7 + next * 0.5), color[2] * (0.7 + next * 0.5));

    // Air drifts its pool; earth sits heavy and still; others hold place.
    if (kind === "air") {
      ref.current.position.x = x + Math.sin(t * 0.9 + phase) * 0.08;
      ref.current.position.z = z + Math.cos(t * 0.7 + phase) * 0.08;
    }
    const sizePulse = kind === "earth" ? 1.05 : kind === "fire" ? 0.95 + breath * 0.12 : 1;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x || 1, sizePulse, 0.1));
  });

  return (
    <mesh ref={ref} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[kind === "earth" ? 0.5 : 0.42, 40]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(...color)} transparent opacity={0.3} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Water ripples — concentric rings expanding across the NE pool, true to
// the element's nature.
// ---------------------------------------------------------------------------
function WaterRipples({ zone }: { zone: MandalaZone }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [x, z] = ZONE_XZ[zone];
  const color = ZONE_ELEMENT_COLOR[zone];
  const RINGS = 3;

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, scrollFade(0.85));
    const isHovered = interaction.hoveredZone === zone;
    const isFiltered = interaction.filterZone === zone;
    const anyFilter = interaction.filterZone !== null;
    const emphasis = isHovered ? 1.6 : isFiltered ? 1.3 : anyFilter ? 0.2 : 0.7;

    groupRef.current.children.forEach((child, i) => {
      const ring = child as THREE.Mesh;
      const cyclePos = ((t * 0.35 + i / RINGS) % 1);
      const r = 0.08 + cyclePos * 0.42;
      ring.scale.setScalar(r);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cyclePos) * 0.5 * emphasis * fade;
    });
  });

  return (
    <group ref={groupRef} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.9, 1, 48]} />
          <meshBasicMaterial color={new THREE.Color(color[0] * 1.4, color[1] * 1.4, color[2] * 1.6)} transparent opacity={0.3} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The ground itself — dark consecrated earth that the cursor-lantern lights
// as it passes. This is what turns floating wireframe into a real place.
// ---------------------------------------------------------------------------
function GroundSurface() {
  return (
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[9, 64]} />
      <meshStandardMaterial color={"#241611"} roughness={1} metalness={0} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// A low band of dusk light at the horizon — the earth dissolves into it.
// ---------------------------------------------------------------------------
function HorizonGlow() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    if (!matRef.current) return;
    const fade = Math.max(0.1, scrollFade(0.6));
    matRef.current.opacity = 0.5 * fade;
  });
  return (
    <mesh position={[0, 0.6, -8.5]}>
      <planeGeometry args={[26, 3.4]} />
      <meshBasicMaterial ref={matRef} transparent opacity={0.5} toneMapped={false} depthWrite={false}>
        <canvasTexture attach="map" args={[makeHorizonCanvas()]} />
      </meshBasicMaterial>
    </mesh>
  );
}
// One-time gradient texture for the horizon band (warm dusk core → transparent).
let _horizonCanvas: HTMLCanvasElement | null = null;
function makeHorizonCanvas(): HTMLCanvasElement {
  if (_horizonCanvas) return _horizonCanvas;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 64, 0, 0);
  grad.addColorStop(0, "rgba(255, 150, 90, 0.75)");
  grad.addColorStop(0.5, "rgba(210, 90, 90, 0.28)");
  grad.addColorStop(1, "rgba(120, 60, 110, 0)");
  g.fillStyle = grad; g.fillRect(0, 0, 256, 64);
  _horizonCanvas = c;
  return c;
}

// ---------------------------------------------------------------------------
// A gemstone risen from its direction on the ground.
// ---------------------------------------------------------------------------
function GemPoint({ zone, color }: { zone: MandalaZone; color: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [x, z] = ZONE_XZ[zone];
  const isCenter = zone === "C";

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, scrollFade(0.85));
    const breath = 1 + Math.sin(t * 1.1 + x - z) * 0.1;

    const isHovered = interaction.hoveredZone === zone;
    const isWished = interaction.wishedZones.has(zone);
    const isFiltered = interaction.filterZone === zone;
    const anyFilter = interaction.filterZone !== null;

    let target = 1.6;
    if (anyFilter && !isFiltered) target = 0.55;
    if (isFiltered) target = 2.6;
    if (isWished) target = 2.4;
    if (isHovered) target = 3.8;
    target *= fade;

    const cur = matRef.current.userData.intensity ?? target;
    const next = THREE.MathUtils.lerp(cur, target, 0.09);
    matRef.current.userData.intensity = next;
    matRef.current.color.setRGB(color[0] * next, color[1] * next, color[2] * next);

    const rise = (isHovered ? 0.34 : isWished ? 0.22 : 0.12);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, rise, 0.1);
    const scaleTarget = (isCenter ? 1.4 : 1) * (isHovered ? 1.4 : 1) * breath;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x || 1, scaleTarget, 0.1));
  });

  return (
    <mesh ref={ref} position={[x, 0.12, z]}>
      <sphereGeometry args={[isCenter ? 0.075 : 0.052, 24, 24]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(...color)} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// The Bindu at the earth's centre — god-rays rise UP from it.
// ---------------------------------------------------------------------------
function Bindu({ onReady }: { onReady: (mesh: THREE.Mesh) => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  useEffect(() => { if (ref.current) onReady(ref.current); }, [onReady]);
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.04, scrollFade(0.99));
    matRef.current.color.setRGB(5.5 * fade, 4.2 * fade, 2.0 * fade);
    ref.current.scale.setScalar((1 + Math.sin(t * 1.2) * 0.12) * (0.5 + 0.5 * fade));
  });
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <sphereGeometry args={[0.07, 32, 32]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(5.5, 4.2, 2.0)} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Dust rising OFF the ground — the earth exhaling. GPU-driven.
// ---------------------------------------------------------------------------
function RisingDust({ count = 1000 }: { count?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const cursor = useCursor();
  const cursorWorld = useRef(new THREE.Vector3());

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);

  useFrame(() => {
    if (!materialRef.current) return;
    // cursor projected loosely onto the ground plane
    cursorWorld.current.set(cursor.current.x * 4, 0.4, -cursor.current.y * 3);
    const u = materialRef.current.uniforms;
    u.uTime.value = performance.now() * 0.001;
    (u.uCursor.value as THREE.Vector3).lerp(cursorWorld.current, 0.08);
    u.uFade.value = scrollFade(0.8);
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
        uniforms={{ uTime: { value: 0 }, uCursor: { value: new THREE.Vector3() }, uFade: { value: 1 } }}
        vertexShader={`
          attribute float seed; uniform float uTime; uniform vec3 uCursor; varying float vSeed;
          void main() {
            vSeed = seed;
            vec3 pos = position;
            // rise slowly, wrap back to the ground
            pos.y = mod(position.y + uTime * (0.12 + seed * 0.14), 2.8);
            pos.x += sin(uTime * 0.3 + seed * 12.0) * 0.25;
            pos.z += cos(uTime * 0.24 + seed * 15.0) * 0.25;
            // cursor lifts nearby motes
            vec3 toC = uCursor - pos; float d2 = dot(toC.xz, toC.xz);
            float pull = min(0.5 / (d2 + 0.4), 0.35);
            pos.xz += toC.xz * pull * 0.4; pos.y += pull * 0.5;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPos;
            gl_PointSize = (26.0 + seed * 20.0) * (1.0 / -mvPos.z);
          }
        `}
        fragmentShader={`
          varying float vSeed; uniform float uFade;
          void main() {
            vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
            float alpha = pow(1.0 - d * 2.0, 2.5);
            vec3 color = mix(vec3(1.5, 1.1, 0.5), vec3(1.85, 1.4, 0.8), vSeed);
            gl_FragColor = vec4(color, alpha * (0.12 + vSeed * 0.16) * uFade);
          }
        `}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Cursor lantern — a warm light gliding across the ground.
// ---------------------------------------------------------------------------
function CursorLantern() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const cursor = useCursor();
  const target = useMemo(() => new THREE.Vector3(0, 0.8, 0), []);
  useFrame(() => {
    if (!lightRef.current) return;
    target.set(cursor.current.x * 4, 0.8, -cursor.current.y * 3);
    lightRef.current.position.lerp(target, 0.15);
  });
  return <pointLight ref={lightRef} color="#FFD79A" intensity={5} distance={6} decay={1.6} position={[0, 0.8, 0]} />;
}

// ---------------------------------------------------------------------------
// Camera — low, looking ACROSS the ground to the horizon; scroll glides
// forward over the earth; cursor gives a gentle parallax tilt.
// ---------------------------------------------------------------------------
function CameraRig() {
  const { camera } = useThree();
  const cursor = useCursor();
  const scrollFrac = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      scrollFrac.current = Math.min(1, h.scrollTop / (window.innerHeight * 2));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useFrame(() => {
    const baseZ = 5.4 - scrollFrac.current * 2.4;
    const baseY = 2.3 - scrollFrac.current * 0.8;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cursor.current.x * 0.5, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseY + cursor.current.y * 0.25, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ, 0.04);
    camera.lookAt(0, 0.1, -0.6);
  });
  return null;
}

function BhoomiScene({ particleCount }: { particleCount: number }) {
  const [sun, setSun] = useState<THREE.Mesh | null>(null);
  const zones = Object.keys(ZONE_XZ) as MandalaZone[];
  const gemSet = new Set(REAL_GEM_ZONES.map((g) => g.zone));

  return (
    <>
      {/* Warm dusk haze — the ground dissolves into it at the horizon. */}
      <fog attach="fog" args={["#3A1E2A", 7, 16]} />
      <ambientLight intensity={0.18} color="#5A3830" />
      {/* Soft warm fill hovering over the mandala's heart, so the earth and
          its inscription read even before the cursor-lantern arrives. */}
      <pointLight position={[0, 1.6, 0]} intensity={3} distance={7} decay={1.7} color="#E8955A" />
      <CursorLantern />

      <GroundSurface />
      <HorizonGlow />
      <GroundMandala />
      {zones.map((z) => <ElementPool key={`pool-${z}`} zone={z} />)}
      <WaterRipples zone="NE" />
      {REAL_GEM_ZONES.map((g) => <GemPoint key={`gem-${g.zone}`} zone={g.zone} color={g.color} />)}
      {/* gems only on real zones; other zones read via their element pools */}
      {zones.filter((z) => !gemSet.has(z)).length > 0 && null}

      <Bindu onReady={setSun} />
      <RisingDust count={particleCount} />
      <CameraRig />

      {sun && (
        <EffectComposer multisampling={0}>
          <GodRays sun={sun} blendFunction={BlendFunction.SCREEN} samples={30} density={0.88} decay={0.9} weight={0.2} exposure={0.24} clampMax={1} blur />
          <Bloom intensity={1.0} luminanceThreshold={1.0} luminanceSmoothing={0.4} mipmapBlur radius={0.78} />
          <Vignette offset={0.22} darkness={0.6} eskil={false} blendFunction={BlendFunction.NORMAL} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.09} />
        </EffectComposer>
      )}
    </>
  );
}

export interface BhoomiWebGLProps {
  hoveredZone: MandalaZone | null;
  wishedZones: Set<MandalaZone>;
  filterZone: MandalaZone | null;
}

export function BhoomiWebGL({ hoveredZone, wishedZones, filterZone }: BhoomiWebGLProps) {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1000);
  const [inView, setInView] = useState(true);

  interaction.hoveredZone = hoveredZone;
  interaction.wishedZones = wishedZones;
  interaction.filterZone = filterZone;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (window.innerWidth < 720) setParticleCount(500);
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = true;
    const check = () => {
      raf = 0;
      const next = window.scrollY < window.innerHeight * 1.8;
      if (next !== last) { last = next; setInView(next); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Dusk sky over the earth — warm rose at the horizon, deep violet above.
  const sky =
    "radial-gradient(ellipse 150% 95% at 50% 60%, #7A4230 0%, #4A2334 30%, #201430 60%, #0A0618 100%)";

  if (reducedMotion) {
    return <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: sky }} />;
  }

  return (
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      opacity: ready ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      background: sky,
    }}>
      <Canvas
        camera={{ position: [0, 2.3, 5.4], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
      >
        <BhoomiScene particleCount={particleCount} />
      </Canvas>
    </div>
  );
}
