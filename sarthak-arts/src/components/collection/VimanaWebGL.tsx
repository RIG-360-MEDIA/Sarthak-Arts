"use client";

/**
 * VimanaWebGL — the Collection page's living background.
 *
 * An ornate sacred-ceiling mandala (vimāna) you gaze up into: a single
 * commanding radial centrepiece on a living deep-violet cosmos.
 *
 * Depth-layered dome (back → front), all tilting together with the cursor
 * so the layers parallax against each other:
 *   - drifting nebula clouds (violet / magenta / gold)
 *   - an outer ring of authentic Devanāgarī bīja mantras (slow turn)
 *   - a counter-rotating ornament ring of gold points
 *   - concentric circles + 16- and 8-petal lotus rings
 *   - rotating kiraṇa spokes of light from the heart
 *   - the Śrī Yantra triangles (crimson Śakti / gold Śiva)
 *   - the luminous Bindu (drives real GodRays) + pranava pulse-rings
 *   - the eight direction jewels, alive to hover / filter / wishlist
 *
 * Sibling of the homepage by engineering quality (real Bloom / GodRays,
 * GPU particles, reduced-motion + mobile budgets), its own composition.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, GodRays, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { InvocationScene } from "./InvocationScene";
import { atmosphereFor, NEUTRAL_ATMOSPHERE } from "./atmospheres";
import { directionSceneFor, NEUTRAL_SCENE } from "./direction-scenes";
import { DawnStreaks } from "./scene-controllers/DawnStreaks";
import type { PanchangFlags } from "./panchang-flags";

export type MandalaZone = "NW" | "N" | "NE" | "W" | "C" | "E" | "SW" | "S" | "SE";

const ZONE_ANGLE: Record<Exclude<MandalaZone, "C">, number> = {
  N: 90, NE: 45, E: 0, SE: -45, S: -90, SW: -135, W: 180, NW: 135,
};
const ZONE_INFO: Record<Exclude<MandalaZone, "C">, { color: [number, number, number] }> = {
  NE: { color: [0.35, 0.62, 1.0] }, SE: { color: [1.0, 0.5, 0.18] },
  SW: { color: [0.5, 0.82, 0.45] }, NW: { color: [0.82, 0.86, 0.95] },
  N: { color: [1.0, 0.82, 0.35] }, E: { color: [0.55, 0.85, 0.72] },
  W: { color: [0.62, 0.55, 0.9] }, S: { color: [1.0, 0.5, 0.42] },
};

export interface MandalaGemZone { zone: MandalaZone; color: [number, number, number]; }
export const REAL_GEM_ZONES: MandalaGemZone[] = [
  { zone: "NE", color: [0.32, 0.6, 1.0] },
  { zone: "N", color: [1.0, 0.18, 0.26] },
  { zone: "E", color: [0.18, 0.92, 0.82] },
  { zone: "NW", color: [0.64, 0.36, 0.94] },
  { zone: "C", color: [1.0, 0.95, 0.82] },
];

const GOLD = new THREE.Color(1.55, 1.15, 0.42);
const CRIMSON = new THREE.Color(1.7, 0.5, 0.6);

const interaction = {
  hoveredZone: null as MandalaZone | null,
  wishedZones: new Set<MandalaZone>(),
  filterZone: null as MandalaZone | null,
  filterPulse: 0, // bumped on filter change, decays — drives the burst
  elementTint: new THREE.Color(0.45, 0.38, 0.7), // eased whole-scene grade
  elementAmt: 0, // 0 = neutral (All), 1 = a direction's element in full
  // Atmospheric parameters — lerped by AtmosphereController each frame,
  // read by Starfield / any other atmosphere-reactive component. Fog is
  // written directly to scene.fog in the controller (not stored here).
  starOpacity: NEUTRAL_ATMOSPHERE.starOpacity,
  // -- Direction scene target values ------------------------------------
  // SceneDirector writes to these each frame based on filterZone + panchang.
  // Individual consumers (CosmicBreath, GemFader, MantraRing, etc.) read
  // them and lerp their own local state toward them. Splitting target vs
  // eased value keeps the transitions smooth without every consumer
  // needing to know about panchang or the config file.
  breathAmplitudeTarget: 0,
  breathPeriodSec: NEUTRAL_SCENE.breathPeriodSec,
  breathShapePause: NEUTRAL_SCENE.breathShapePause,
  sceneTempoTarget: 1,
  weatherType: NEUTRAL_SCENE.weatherType,
  weatherIntensityTarget: 0,
  gemFadeTarget: 1,
  vignetteDarknessTarget: 0.35,      // matches the existing base Vignette
  cameraOrbitRadiusTarget: 0,
  cameraOrbitDegPerSec: 0,
  // Eased values — CosmicBreath / SceneTempoController fill these in.
  sceneTempo: 1,
  gemFade: 1,
  cameraOrbitRadius: 0,
  cameraOrbitAngle: 0,
  vignetteDarkness: 0.35,
};
let _lastFilter: MandalaZone | null = null;

// Each direction's governing element colour — the whole cosmos grades to
// this when that direction is chosen. Rich and deep, not pastel. Rooted in
// the Pañcabhūta mapping.
const ELEMENT_TINT: Record<MandalaZone, [number, number, number]> = {
  NE: [0.18, 0.5, 1.0],   // Water
  SE: [1.0, 0.36, 0.1],   // Fire
  SW: [0.4, 0.82, 0.3],   // Earth
  NW: [0.72, 0.82, 0.98], // Air
  C: [0.6, 0.34, 1.0],    // Space
  N: [1.0, 0.78, 0.26],   // Wealth
  // E → dawn. Dialled back to ~60% strength once dawn streaks + breath
  // + panchang layers came in — the tint is now a whisper, not the main
  // event. Prevents the "same colour filter again" failure mode.
  E: [0.60, 0.42, 0.28],
  W: [0.52, 0.42, 0.98],  // Varuna
  S: [1.0, 0.4, 0.28],    // Yama
};
// Brighter, glow-hot versions for grading the gold line geometry.
const ELEMENT_VIVID: Record<MandalaZone, [number, number, number]> = {
  NE: [0.35, 0.85, 1.75], SE: [1.75, 0.7, 0.28], SW: [0.65, 1.5, 0.55],
  NW: [1.35, 1.5, 1.7], C: [1.2, 0.7, 1.75], N: [1.75, 1.35, 0.5],
  E: [1.75, 1.15, 0.55], W: [1.0, 0.82, 1.7], S: [1.75, 0.72, 0.5],
};
const NEUTRAL_TINT = new THREE.Color(0.45, 0.38, 0.7);

// What each direction DOES — its element's nature expressed as motion, not
// colour. This is the real effect of choosing a direction: the whole cosmos
// starts behaving like that element.
//   0 neutral · 1 water (flows, ripples down) · 2 fire (rises, flickers)
//   3 earth (settles heavy) · 4 air (swirls) · 5 space (expands outward)
//   6 wealth (gathers inward — Kubera draws it in)
const ZONE_ELEMENT_MOTION: Record<MandalaZone, number> = {
  NE: 1, SE: 2, S: 2, SW: 3, NW: 4, E: 4, C: 5, W: 5, N: 6,
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
function makeBlobTexture(rgb: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.4, `rgba(${rgb},0.32)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Drifting nebula clouds — the cosmic ground, alive.
// ---------------------------------------------------------------------------
function Nebula() {
  const blobs = useMemo(() => ([
    { tex: makeBlobTexture("120,70,200"), x: -2.4, y: 1.4, z: -3.5, s: 7, sp: 0.05, ph: 0 },
    { tex: makeBlobTexture("200,80,150"), x: 2.6, y: -1.2, z: -4, s: 6.5, sp: 0.04, ph: 2 },
    { tex: makeBlobTexture("230,170,80"), x: 0.6, y: 2.2, z: -3, s: 5, sp: 0.06, ph: 4 },
    { tex: makeBlobTexture("70,60,160"), x: -1.2, y: -2, z: -4.5, s: 6, sp: 0.045, ph: 1 },
  ]), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const t = performance.now() * 0.001;
    const fade = Math.max(0.1, scrollFade(0.5));
    refs.current.forEach((m, i) => {
      if (!m) return;
      const b = blobs[i];
      m.position.x = b.x + Math.sin(t * b.sp + b.ph) * 0.6;
      m.position.y = b.y + Math.cos(t * b.sp * 0.8 + b.ph) * 0.5;
      (m.material as THREE.MeshBasicMaterial).opacity = (0.16 + Math.sin(t * 0.3 + b.ph) * 0.05) * fade;
    });
  });
  return (
    <group>
      {blobs.map((b, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[b.x, b.y, b.z]}>
          <planeGeometry args={[b.s, b.s]} />
          <meshBasicMaterial map={b.tex} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mantra ring + counter-rotating ornament ring.
// ---------------------------------------------------------------------------
let _mantraTex: THREE.CanvasTexture | null = null;
function mantraTexture(): THREE.CanvasTexture {
  if (_mantraTex) return _mantraTex;
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const cx = size / 2, cy = size / 2;
  g.strokeStyle = "rgba(232,184,73,0.3)"; g.lineWidth = 1.5;
  g.beginPath(); g.arc(cx, cy, size * 0.46, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, size * 0.38, 0, Math.PI * 2); g.stroke();
  const bijas = ["ॐ", "ऐं", "ह्रीं", "क्लीं", "श्रीं", "गं", "दुं", "वं", "रं", "लं", "यं", "हं"];
  const N = 24;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 40px 'Nirmala UI','Noto Serif Devanagari',Georgia,serif";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = size * 0.42;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
    g.fillStyle = "rgba(250,220,150,0.85)";
    g.fillText(bijas[i % bijas.length], 0, 0); g.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _mantraTex = tex;
  return tex;
}
function MantraRing() {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useMemo(() => mantraTexture(), []);
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    // Rotation gets multiplied by the SceneDirector's tempo — E slows to
    // 75%, C slows to 50%, neutral stays at 100%. The world's tempo shifts
    // per direction, not the ring's colour.
    ref.current.rotation.z += 0.0004 * interaction.sceneTempo;
    matRef.current.opacity = Math.max(0.06, scrollFade(0.8)) * 0.95;
  });
  return (
    <mesh ref={ref} position={[0, 0, -0.6]}>
      <planeGeometry args={[6.4, 6.4]} />
      <meshBasicMaterial ref={matRef} map={tex} transparent opacity={0.9} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}
function OrnamentRing() {
  const ref = useRef<THREE.Points>(null!);
  const { positions } = useMemo(() => {
    const n = 48;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 2.32;
      positions[i * 3] = Math.cos(a) * r; positions[i * 3 + 1] = Math.sin(a) * r; positions[i * 3 + 2] = 0;
    }
    return { positions };
  }, []);
  const matRef = useRef<THREE.PointsMaterial>(null!);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z -= 0.0007 * interaction.sceneTempo; // counter to the mantra ring
    if (matRef.current) matRef.current.opacity = Math.max(0.05, scrollFade(0.8)) * 0.7;
  });
  return (
    <points ref={ref} position={[0, 0, -0.35]}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial ref={matRef} color={new THREE.Color(1.4, 1.05, 0.5)} size={0.05} sizeAttenuation transparent opacity={0.7} depthWrite={false} toneMapped={false} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// The mandala line geometry — depth-banded so the cursor tilt parallaxes it.
// ---------------------------------------------------------------------------
function MandalaLines() {
  const groupRef = useRef<THREE.Group>(null!);
  const spin = useRef(0);
  const vividTmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    if (!groupRef.current) return;
    const base = performance.now() * 0.00003;
    let target = base;
    if (interaction.filterZone && interaction.filterZone !== "C") {
      // Halved from full-orient to half-orient so the mandala hints toward
      // the invoked direction without spinning 90°+ and disorienting the
      // viewer. Restraint favours the product-forward hierarchy.
      target = -((ZONE_ANGLE[interaction.filterZone] - 90) * Math.PI) / 360 + base;
    }
    spin.current = THREE.MathUtils.lerp(spin.current, target, 0.05);
    groupRef.current.rotation.z = spin.current;
    const fade = scrollFade(0.85);
    // Grade the gold linework toward the chosen direction's vivid element —
    // the sacred geometry itself resonates with the direction (rich, not faded).
    const fz = interaction.filterZone;
    if (fz && ELEMENT_VIVID[fz]) vividTmp.setRGB(...ELEMENT_VIVID[fz]); else vividTmp.copy(GOLD);
    for (const child of groupRef.current.children) {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      if (mat?.userData?.baseOpacity !== undefined) mat.opacity = mat.userData.baseOpacity * fade;
      if (mat?.userData?.gradeable) {
        mat.color.lerp(vividTmp, 0.06 * (0.4 + interaction.elementAmt));
        // ease back toward gold when neutral
        if (!fz) mat.color.lerp(GOLD, 0.06);
      }
    }
  });

  const lines = useMemo(() => {
    const outs: { points: THREE.Vector3[]; opacity: number; crimson?: boolean; z: number }[] = [];
    const circle = (r: number, z: number, seg = 120) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z)); }
      return pts;
    };
    // back band
    for (let i = 0; i < 2; i++) outs.push({ points: circle(2.15 - i * 0.05, -0.25), opacity: 0.4 - i * 0.1, z: -0.25 });
    // petals
    const petals = (radius: number, count: number, depth: number, z: number) => {
      const groups: THREE.Vector3[][] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rootA = a - Math.PI / count, rootB = a + Math.PI / count;
        const rx1 = Math.cos(rootA) * radius * 0.9, ry1 = Math.sin(rootA) * radius * 0.9;
        const rx2 = Math.cos(rootB) * radius * 0.9, ry2 = Math.sin(rootB) * radius * 0.9;
        const tx = Math.cos(a) * (radius + depth), ty = Math.sin(a) * (radius + depth);
        const pts: THREE.Vector3[] = [new THREE.Vector3(rx1, ry1, z)];
        for (let t = 0; t <= 1; t += 0.1) { const bow = Math.sin(Math.PI * t) * depth * 0.35; pts.push(new THREE.Vector3(rx1 * (1 - t) + tx * t + Math.cos(a) * bow, ry1 * (1 - t) + ty * t + Math.sin(a) * bow, z)); }
        for (let t = 0; t <= 1; t += 0.1) { const bow = Math.sin(Math.PI * t) * depth * 0.35; pts.push(new THREE.Vector3(tx * (1 - t) + rx2 * t - Math.cos(a) * bow, ty * (1 - t) + ry2 * t - Math.sin(a) * bow, z)); }
        pts.push(new THREE.Vector3(rx2, ry2, z));
        groups.push(pts);
      }
      return groups;
    };
    petals(1.95, 16, 0.18, -0.18).forEach((p) => outs.push({ points: p, opacity: 0.42, z: -0.18 }));
    // mid band
    outs.push({ points: circle(1.5, -0.08), opacity: 0.3, z: -0.08 });
    petals(1.5, 8, 0.34, -0.05).forEach((p) => outs.push({ points: p, opacity: 0.6, z: -0.05 }));
    // front band — triangles
    const triangle = (size: number, up: boolean, z: number) => {
      const h = size * 0.87;
      const apexY = up ? size : -size;
      const baseY = up ? -size * 0.5 : size * 0.5;
      return [new THREE.Vector3(0, apexY, z), new THREE.Vector3(-h, baseY, z), new THREE.Vector3(h, baseY, z), new THREE.Vector3(0, apexY, z)];
    };
    for (let i = 0; i < 4; i++) outs.push({ points: triangle(0.95 - i * 0.16, true, 0.02), opacity: 0.9 - i * 0.05, z: 0.02 });
    for (let i = 0; i < 5; i++) outs.push({ points: triangle(1.05 - i * 0.16, false, 0.02), opacity: 0.9 - i * 0.05, crimson: true, z: 0.02 });

    return outs.map((l) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(l.points);
      const material = new THREE.LineBasicMaterial({ color: l.crimson ? CRIMSON.clone() : GOLD.clone(), transparent: true, opacity: l.opacity * 0.85 });
      material.toneMapped = false;
      material.userData.baseOpacity = l.opacity * 0.85;
      material.userData.gradeable = !l.crimson; // gold lines grade; crimson Śakti stays
      return new THREE.Line(geometry, material);
    });
  }, []);

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => <primitive object={line} key={i} />)}
      {(Object.keys(ZONE_ANGLE) as Exclude<MandalaZone, "C">[]).map((z) => <DirectionJewel key={z} zone={z} />)}
      <KiranaSpokes />
    </group>
  );
}

// Rotating rays of light from the heart.
function KiranaSpokes() {
  const ref = useRef<THREE.LineSegments>(null!);
  const matRef = useRef<THREE.LineBasicMaterial>(null!);
  const geo = useMemo(() => {
    const N = 36;
    const pts: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const inner = i % 3 === 0 ? 0.25 : 0.4;
      const outer = i % 3 === 0 ? 2.2 : 1.4;
      pts.push(Math.cos(a) * inner, Math.sin(a) * inner, -0.12, Math.cos(a) * outer, Math.sin(a) * outer, -0.12);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    ref.current.rotation.z += 0.0009;
    const t = performance.now() * 0.001;
    matRef.current.opacity = (0.1 + Math.sin(t * 0.8) * 0.05) * Math.max(0.05, scrollFade(0.85));
  });
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial ref={matRef} color={new THREE.Color(1.6, 1.25, 0.6)} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </lineSegments>
  );
}

// Normalize a hue to a fixed perceived luminance so every jewel — whatever
// its colour — crosses the bloom threshold by the same amount and therefore
// glows to the SAME size and vibrancy. Hue preserved, brightness equalized.
function normalizeLuminance(c: [number, number, number], targetLum: number): [number, number, number] {
  const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const f = targetLum / Math.max(lum, 0.04);
  return [c[0] * f, c[1] * f, c[2] * f];
}

const JEWEL_RADIUS = 0.048;   // every jewel identical physical size
const JEWEL_REF_DIST = 5.6;   // nominal camera distance for size compensation

function DirectionJewel({ zone }: { zone: Exclude<MandalaZone, "C"> }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const { camera } = useThree();
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const a = (ZONE_ANGLE[zone] * Math.PI) / 180;
  const R = 1.85;
  const gem = REAL_GEM_ZONES.find((g) => g.zone === zone);
  const isProduct = !!gem;
  // Every jewel equalized to the SAME luminance so all bloom to the same
  // size and vibrancy — hue preserved, brightness matched.
  const color = useMemo(
    () => normalizeLuminance(gem ? gem.color : ZONE_INFO[zone].color, 0.6),
    [gem, zone],
  );
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, scrollFade(0.85));
    // Synchronized breath (no per-jewel phase) → all identical at any instant.
    const breath = 1 + Math.sin(t * 1.1) * 0.05;

    const isHovered = interaction.hoveredZone === zone;
    const isWished = interaction.wishedZones.has(zone);
    const isFiltered = interaction.filterZone === zone;
    const anyFilter = interaction.filterZone !== null;
    // Resting brightness is identical for all; interaction is the ONLY
    // differentiator (a product without hover looks the same as a marker).
    let target = 1.4;
    if (anyFilter && !isFiltered) target = 0.55;
    if (isFiltered) target = 2.6;
    if (isWished) target = 2.3;
    if (isHovered) target = 3.6;
    // The direction scene can fade the OUTER jewels down further — C's
    // vocabulary pulls them to ~28% brightness so only the central bindu
    // holds attention. Applies to non-filtered gems only, so the picked
    // direction's gem still stands out.
    if (!isFiltered) target *= interaction.gemFade;
    target *= fade;
    const cur = matRef.current.userData.intensity ?? target;
    const next = THREE.MathUtils.lerp(cur, target, 0.09);
    matRef.current.userData.intensity = next;
    matRef.current.color.setRGB(color[0] * next, color[1] * next, color[2] * next);

    // Compensate for perspective: scale by real distance to camera so the
    // on-screen size stays constant however the dome tilts.
    ref.current.getWorldPosition(worldPos);
    const perspComp = camera.position.distanceTo(worldPos) / JEWEL_REF_DIST;
    const interactScale = isHovered ? 1.45 : isWished ? 1.2 : 1;
    const scaleTarget = interactScale * breath * perspComp;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x || 1, scaleTarget, 0.14));
  });
  return (
    <mesh ref={ref} position={[Math.cos(a) * R, Math.sin(a) * R, 0.05]}>
      <sphereGeometry args={[JEWEL_RADIUS, 20, 20]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(...color)} toneMapped={false} />
    </mesh>
  );
}

// Pranava pulse-rings breathing out from the bindu; burst on filter change.
function PulseRings() {
  const RINGS = 4;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    // detect filter change → burst
    if (interaction.filterZone !== _lastFilter) { _lastFilter = interaction.filterZone; interaction.filterPulse = 1; }
    interaction.filterPulse = Math.max(0, interaction.filterPulse - 0.012);
    const t = performance.now() * 0.001;
    const fade = Math.max(0.05, scrollFade(0.85));
    refs.current.forEach((m, i) => {
      if (!m) return;
      const cyc = ((t * 0.28 + i / RINGS) % 1);
      const r = 0.15 + cyc * 2.1;
      m.scale.setScalar(r);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cyc) * (0.14 + interaction.filterPulse * 0.4) * fade;
    });
  });
  return (
    <group position={[0, 0, 0.01]}>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <ringGeometry args={[0.94, 1, 80]} />
          <meshBasicMaterial color={new THREE.Color(1.7, 1.35, 0.7)} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Bindu({ onReady }: { onReady: (mesh: THREE.Mesh) => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  useEffect(() => { if (ref.current) onReady(ref.current); }, [onReady]);
  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = performance.now() * 0.001;
    const fade = Math.max(0.04, scrollFade(0.99));
    const flare = 1 + interaction.filterPulse * 0.6;
    matRef.current.color.setRGB(6 * fade * flare, 4.4 * fade * flare, 1.8 * fade * flare);
    ref.current.scale.setScalar((1 + Math.sin(t * 1.3) * 0.13) * (0.55 + 0.45 * fade) * flare);
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.12]}>
      <sphereGeometry args={[0.075, 32, 32]} />
      <meshBasicMaterial ref={matRef} color={new THREE.Color(6, 4.4, 1.8)} toneMapped={false} />
    </mesh>
  );
}

// Eases the whole-scene element grade toward the chosen direction, and
// grades the fog to a deep version of it. Everything else reads
// interaction.elementTint / elementAmt.
function TintController() {
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);
  const fogTmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const fz = interaction.filterZone;
    if (fz && ELEMENT_TINT[fz]) tmp.setRGB(...ELEMENT_TINT[fz]); else tmp.copy(NEUTRAL_TINT);
    interaction.elementTint.lerp(tmp, 0.035);
    interaction.elementAmt = THREE.MathUtils.lerp(interaction.elementAmt, fz ? 1 : 0, 0.04);
    if (scene.fog) {
      fogTmp.setRGB(interaction.elementTint.r * 0.22, interaction.elementTint.g * 0.16, interaction.elementTint.b * 0.3);
      (scene.fog as THREE.Fog).color.lerp(fogTmp, 0.035);
    }
  });
  return null;
}

// A vast soft aura that bathes the cosmos in the chosen element's light.
let _auraTex: THREE.CanvasTexture | null = null;
function auraTexture(): THREE.CanvasTexture {
  if (_auraTex) return _auraTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.28)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _auraTex = tex;
  return tex;
}
function ElementAura() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useMemo(() => auraTexture(), []);
  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.color.copy(interaction.elementTint);
    const fade = Math.max(0.1, scrollFade(0.55));
    // Deliberately restrained — the direction's effect is its MOTION, not a
    // colour wash. Hue is a quiet accent only.
    matRef.current.opacity = (0.04 + interaction.elementAmt * 0.1) * fade;
  });
  return (
    <mesh position={[0, 0, -4.6]}>
      <planeGeometry args={[26, 20]} />
      <meshBasicMaterial ref={matRef} map={tex} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// Ambient light that grades toward the element.
function ElementAmbient() {
  const ref = useRef<THREE.AmbientLight>(null!);
  const tmp = useMemo(() => new THREE.Color("#3A2C7E"), []);
  useFrame(() => {
    if (!ref.current) return;
    tmp.copy(NEUTRAL_TINT).lerp(interaction.elementTint, interaction.elementAmt * 0.6).multiplyScalar(0.55);
    ref.current.color.lerp(tmp, 0.04);
  });
  return <ambientLight ref={ref} intensity={0.35} color="#3A2C7E" />;
}

// The whole dome tilts with the cursor — the depth bands parallax — AND
// breathes on the direction-scene's cosmic-breath rhythm (E: 8s @ 6%,
// C: 12s @ 10% with a 2s hold at each extremum). The breath amplitude
// eases toward the current target so switching directions transitions
// smoothly. The waveform is a shaped curve, not a pure sine, so C's
// 2s pause at each extremum reads as a real hold, not a slow sine.
function TiltDome({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const cursor = useCursor();
  const breathAmp = useRef(0);
  const breathPhase = useRef(0);
  useFrame((_, dtRaw) => {
    if (!ref.current) return;
    const dt = Math.min(dtRaw, 0.05);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, cursor.current.y * 0.16, 0.04);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, cursor.current.x * 0.16, 0.04);
    // Ease the amplitude toward the SceneDirector's target so amplitude
    // changes (E → C) transition smoothly.
    breathAmp.current = THREE.MathUtils.lerp(
      breathAmp.current, interaction.breathAmplitudeTarget, Math.min(1, dt * 1.4)
    );
    // Advance phase based on wall-clock, gated by the current period.
    breathPhase.current += (dt / interaction.breathPeriodSec) * Math.PI * 2;
    if (breathPhase.current > Math.PI * 2) breathPhase.current -= Math.PI * 2;
    // Shaped breath waveform. Pure sine when pause=0. When pause>0, the
    // curve holds at ±1 for a portion of the cycle proportional to
    // pause/period, then eases through the mid-portion. Implemented by
    // remapping the phase through a clip-and-scale in the sine domain.
    const period = interaction.breathPeriodSec;
    const pauseFrac = Math.min(0.4, interaction.breathShapePause / period);
    let raw = Math.sin(breathPhase.current);
    if (pauseFrac > 0.01) {
      // Squash the sine so the top and bottom clip: values above/below
      // (1 - pauseFrac) get flattened to ±1 for the hold, remap the rest.
      const clip = 1 - pauseFrac * 1.6;
      raw = THREE.MathUtils.clamp(raw / clip, -1, 1);
    }
    const s = 1 + raw * breathAmp.current;
    ref.current.scale.set(s, s, s);
  });
  return <group ref={ref}>{children}</group>;
}

// ---------------------------------------------------------------------------
// SceneDirector — reads the picked direction's scene config plus the panchang
// flags each frame, applies any cosmic-hour boosts, and writes the resulting
// TARGETS + EASED VALUES to the shared interaction module. Every consumer
// (TiltDome, DirectionJewel, MantraRing, CameraDolly, Vignette, DawnStreaks)
// reads from interaction — this component is the ONE place scene config is
// interpreted, keeping the consumers dumb and cohesive.
// ---------------------------------------------------------------------------
function SceneDirector({ panchang }: { panchang: PanchangFlags }) {
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const scene = directionSceneFor(interaction.filterZone);
    let breathAmp = scene.breathAmplitude;
    let weatherI = scene.weatherIntensity;
    // Defensive optional chain in case HMR delivers a partially-updated
    // tree with panchang temporarily undefined; the visuals then just
    // skip the acknowledgment layer for that frame.
    if (panchang?.ok) {
      // Panchang day match (e.g. Wednesday deepens Indra's E).
      if (scene.panchangDay && panchang.weekday === scene.panchangDay) {
        breathAmp += scene.panchangDayBoosts.breathAmplitudeBump;
        weatherI += scene.panchangDayBoosts.weatherIntensityBump;
      }
      // Panchang hour match (near real sunrise, Brahma-muhūrta, etc.).
      if (scene.panchangHour === "sunrise") {
        const diff = Math.abs(Date.now() - panchang.sunriseTs);
        if (diff < 60 * 60 * 1000) {
          breathAmp += scene.panchangHourBoosts.breathAmplitudeBump;
          weatherI += scene.panchangHourBoosts.weatherIntensityBump;
        }
      } else if (scene.panchangHour === "brahma-muhurta") {
        const preSunrise = panchang.sunriseTs - Date.now();
        // Roughly 1.5h before sunrise ± 30min = the Brahma-muhūrta window.
        if (preSunrise > 60 * 60 * 1000 && preSunrise < 2 * 60 * 60 * 1000) {
          breathAmp += scene.panchangHourBoosts.breathAmplitudeBump;
          weatherI += scene.panchangHourBoosts.weatherIntensityBump;
        }
      } else if (scene.panchangHour === "sunset") {
        const diff = Math.abs(Date.now() - panchang.sunsetTs);
        if (diff < 60 * 60 * 1000) {
          breathAmp += scene.panchangHourBoosts.breathAmplitudeBump;
          weatherI += scene.panchangHourBoosts.weatherIntensityBump;
        }
      }
    }
    // Write targets
    interaction.breathAmplitudeTarget = breathAmp;
    interaction.breathPeriodSec = scene.breathPeriodSec;
    interaction.breathShapePause = scene.breathShapePause;
    interaction.sceneTempoTarget = scene.sceneTempo;
    interaction.weatherType = scene.weatherType;
    interaction.weatherIntensityTarget = weatherI;
    interaction.gemFadeTarget = scene.fadeOuterGemsTo;
    interaction.vignetteDarknessTarget = scene.vignetteDarkness ?? 0.35;
    interaction.cameraOrbitRadiusTarget = scene.cameraOrbit?.radius ?? 0;
    interaction.cameraOrbitDegPerSec = scene.cameraOrbit?.degPerSec ?? 0;
    // Ease eased values toward targets
    const k = Math.min(1, dt * 1.4);
    interaction.sceneTempo = THREE.MathUtils.lerp(interaction.sceneTempo, interaction.sceneTempoTarget, k);
    interaction.gemFade = THREE.MathUtils.lerp(interaction.gemFade, interaction.gemFadeTarget, k);
    interaction.cameraOrbitRadius = THREE.MathUtils.lerp(interaction.cameraOrbitRadius, interaction.cameraOrbitRadiusTarget, k);
    interaction.vignetteDarkness = THREE.MathUtils.lerp(interaction.vignetteDarkness, interaction.vignetteDarknessTarget, k);
    // Advance orbit angle regardless of whether orbit is active — when
    // radius=0 the angle has no visible effect, but keeping it advancing
    // means switching to a direction with orbit doesn't snap.
    interaction.cameraOrbitAngle += (interaction.cameraOrbitDegPerSec * Math.PI / 180) * dt;
  });
  return null;
}

function Starfield() {
  const ref = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.PointsMaterial>(null!);
  const { positions } = useMemo(() => {
    const n = 260;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 5 + Math.random() * 8, a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r; positions[i * 3 + 1] = Math.sin(a) * r * 0.7; positions[i * 3 + 2] = -3 - Math.random() * 6;
    }
    return { positions };
  }, []);
  useFrame(() => {
    // Starfield rotation also honours the scene tempo — near-freeze on
    // directions like C or NE where the sky itself should feel held.
    if (ref.current) ref.current.rotation.z += 0.00006 * interaction.sceneTempo;
    // Stars fade with the atmosphere — dawn (E) pulls opacity down to ~0.3,
    // neutral holds full brightness.
    if (matRef.current) matRef.current.opacity = 0.5 * interaction.starOpacity;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial ref={matRef} color="#C9C0FF" size={0.04} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

function ParticleField({ count = 1200 }: { count?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const cursor = useCursor();
  const cursorWorld = useRef(new THREE.Vector2());
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = Math.random() < 0.25 ? Math.random() * 1.3 : -Math.random() * 6;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);
  // Stable uniforms object — must not be recreated on each render or R3F
  // will re-apply, and useFrame can catch it mid-swap with .uTime undefined.
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCursor: { value: new THREE.Vector2() },
    uFade: { value: 1 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uTintAmt: { value: 0 },
    uElement: { value: 0 },
    uElementAmt: { value: 0 },
  }), []);
  useFrame(() => {
    if (!materialRef.current) return;
    cursorWorld.current.set(cursor.current.x * 4, cursor.current.y * 3);
    const u = materialRef.current.uniforms;
    if (!u.uTime) return; // material not yet initialised
    u.uTime.value = performance.now() * 0.001;
    (u.uCursor.value as THREE.Vector2).lerp(cursorWorld.current, 0.08);
    u.uFade.value = scrollFade(0.82);
    (u.uTint.value as THREE.Color).copy(interaction.elementTint);
    u.uTintAmt.value = interaction.elementAmt;
    // The real effect: the cosmos takes on the element's NATURE (motion).
    const fz = interaction.filterZone;
    u.uElement.value = fz ? ZONE_ELEMENT_MOTION[fz] : 0;
    u.uElementAmt.value = interaction.elementAmt;
  });
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-seed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float seed;
          uniform float uTime; uniform vec2 uCursor;
          uniform float uElement; uniform float uElementAmt;
          varying float vSeed;

          void main(){
            vSeed = seed;
            vec3 p = position;

            // Neutral: gentle ambient drift.
            vec3 neutral = p;
            neutral.x += sin(uTime*0.3 + seed*12.0)*0.4;
            neutral.y += cos(uTime*0.25 + seed*18.0)*0.5;
            neutral.z += sin(uTime*0.15 + seed*5.0)*0.3;

            // Each element moves according to its own nature.
            vec3 e = p;
            float rad = length(p.xy);
            vec2 dir = rad > 0.001 ? normalize(p.xy) : vec2(1.0, 0.0);

            if (uElement < 0.5) {
              e = neutral;
            } else if (uElement < 1.5) {
              // WATER — flows downward, ripples sideways
              e.x = p.x + sin(uTime*0.6 + p.y*0.9 + seed*6.0)*0.75;
              e.y = mod(p.y - uTime*0.4 - seed*3.0 + 4.0, 8.0) - 4.0;
              e.z = p.z + sin(uTime*0.3 + seed*4.0)*0.2;
            } else if (uElement < 2.5) {
              // FIRE — rises fast, flickers
              e.y = mod(p.y + uTime*1.15 + seed*4.0 + 4.0, 8.0) - 4.0;
              e.x = p.x + sin(uTime*5.0 + seed*20.0)*0.2;
              e.z = p.z + cos(uTime*3.5 + seed*11.0)*0.12;
            } else if (uElement < 3.5) {
              // EARTH — settles heavy and slow
              e.y = mod(p.y - uTime*0.16 - seed*2.0 + 4.0, 8.0) - 4.0;
              e.x = p.x + sin(uTime*0.1 + seed*3.0)*0.08;
            } else if (uElement < 4.5) {
              // AIR — swirls around the centre
              float ang = atan(p.y, p.x) + uTime*(0.45 + seed*0.5);
              e.x = cos(ang)*rad;
              e.y = sin(ang)*rad;
              e.z = p.z + sin(uTime*0.6 + seed*7.0)*0.3;
            } else if (uElement < 5.5) {
              // SPACE — expands outward, unhurried
              float grow = mod(rad + uTime*0.3 + seed*2.5, 7.0);
              e.xy = dir * grow;
            } else {
              // WEALTH — gathers inward toward the heart (Kubera draws it in)
              float pull = mod(rad - uTime*0.45 - seed*2.5 + 7.0, 7.0);
              e.xy = dir * pull;
            }

            vec3 pos = mix(neutral, e, uElementAmt);

            vec2 tc = uCursor - pos.xy;
            float d2 = dot(tc, tc);
            float cpull = min(0.6/(d2 + 0.3), 0.4);
            pos.xy += tc * cpull * 0.5;

            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (30.0 + seed*20.0) * (1.0 / -mv.z);
          }
        `}
        fragmentShader={`
          varying float vSeed; uniform float uFade; uniform vec3 uTint; uniform float uTintAmt;
          void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard;
            float a=pow(1.0-d*2.0,2.5); vec3 col=mix(vec3(1.5,1.1,0.42),vec3(1.85,1.5,0.7),vSeed);
            col=mix(col, uTint*1.6, uTintAmt*0.22);
            gl_FragColor=vec4(col, a*(0.15+vSeed*0.2)*uFade); }
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
  return <pointLight ref={lightRef} color="#FCD46F" intensity={5} distance={8} decay={1.8} position={[0, 0, 3]} />;
}

function CameraDolly() {
  const { camera } = useThree();
  const frac = useRef(0);
  useEffect(() => {
    const onScroll = () => { frac.current = Math.min(1, document.documentElement.scrollTop / (window.innerHeight * 2)); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useFrame(() => {
    const t = performance.now() * 0.001;
    // When a direction is invoked, the camera dollies FORWARD toward the
    // mandala (5.6 → 4.85) and lateral drift dampens by ~60%. The user
    // physically feels being drawn IN toward the invocation — a spatial
    // gesture of arrival, not a colour shift.
    const invoked = !!interaction.filterZone;
    const baseZ = invoked ? 4.85 : 5.6;
    const driftAmt = invoked ? 0.4 : 1.0;
    // Cosmic orbit — C · Brahmasthāna adds a slow horizontal orbit around
    // the origin so the viewer contemplates the still centre from many
    // small angles. Radius eases in/out via the SceneDirector so switching
    // to another direction doesn't snap the camera.
    const orbitR = interaction.cameraOrbitRadius;
    const orbitAng = interaction.cameraOrbitAngle;
    const orbitX = Math.cos(orbitAng) * orbitR;
    const orbitY = Math.sin(orbitAng) * orbitR * 0.4; // gentler vertical
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ - frac.current * 2.6, 0.05);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(t * 0.15) * 0.18 * driftAmt + orbitX, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.cos(t * 0.12) * 0.12 * driftAmt + orbitY, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ---------------------------------------------------------------------------
// AtmosphereController — lerps the scene fog and the star-fade toward the
// currently active direction's atmosphere every frame. Sky-gradient
// (page-behind CSS) is handled at the top-level VimanaWebGL export via
// crossfade; this component owns the WebGL-side atmosphere.
// ---------------------------------------------------------------------------
function AtmosphereController() {
  const { scene } = useThree();
  const targetFogColor = useMemo(() => new THREE.Color(), []);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const atm = atmosphereFor(interaction.filterZone);
    const k = Math.min(1, dt * 1.4);
    // Fog — colour and range shift together
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      targetFogColor.setRGB(atm.fogColor[0], atm.fogColor[1], atm.fogColor[2]);
      scene.fog.color.lerp(targetFogColor, k);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, atm.fogNear, k);
      scene.fog.far  = THREE.MathUtils.lerp(scene.fog.far,  atm.fogFar,  k);
    }
    // Stars fade toward the atmosphere's target opacity
    interaction.starOpacity = THREE.MathUtils.lerp(
      interaction.starOpacity, atm.starOpacity, k
    );
  });
  return null;
}

// LiveVignette — reflects `interaction.vignetteDarkness` (eased by
// SceneDirector) into the Vignette effect prop. Uses a throttled state
// update instead of ref-mutation: the ref approach tripped Fast Refresh's
// serialiser on three.js effect objects (circular structures). The
// throttled setState re-renders the Vignette node only when the target
// changes materially, which is a handful of times per direction switch —
// negligible cost.
function LiveVignette() {
  const [darkness, setDarkness] = useState(0.35);
  useEffect(() => {
    const id = window.setInterval(() => {
      const target = interaction.vignetteDarkness;
      setDarkness((prev) => (Math.abs(prev - target) > 0.008 ? target : prev));
    }, 80);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Vignette
      offset={0.22}
      darkness={darkness}
      eskil={false}
      blendFunction={BlendFunction.NORMAL}
    />
  );
}

function VimanaScene({ particleCount, panchang }: { particleCount: number; panchang: PanchangFlags }) {
  const [sun, setSun] = useState<THREE.Mesh | null>(null);
  return (
    <>
      <fog attach="fog" args={["#120833", 8, 18]} />
      <SceneDirector panchang={panchang} />
      <AtmosphereController />
      <ElementAmbient />
      <TintController />
      <CursorLight />
      <Starfield />
      <ElementAura />
      <Nebula />
      {/* Weather layer sits between the deep background and the mandala.
          DawnStreaks fades to zero opacity when its intensity is 0, so it
          costs a few shader instructions per frame when inactive — cheap
          enough to keep always-mounted. */}
      <DawnStreaks intensityTarget={() => interaction.weatherType === "dawn-streaks" ? interaction.weatherIntensityTarget : 0} />
      <TiltDome>
        <MantraRing />
        <OrnamentRing />
        <MandalaLines />
        <PulseRings />
        <InvocationScene activeZone={interaction.filterZone} />
        <Bindu onReady={setSun} />
      </TiltDome>
      <ParticleField count={particleCount} />
      <CameraDolly />
      {sun && (
        <EffectComposer multisampling={0}>
          <GodRays sun={sun} blendFunction={BlendFunction.SCREEN} samples={40} density={0.92} decay={0.92} weight={0.28} exposure={0.3} clampMax={1} blur />
          <Bloom intensity={1.05} luminanceThreshold={1.0} luminanceSmoothing={0.4} mipmapBlur radius={0.8} />
          <LiveVignette />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.1} />
        </EffectComposer>
      )}
    </>
  );
}

export interface VimanaWebGLProps {
  hoveredZone: MandalaZone | null;
  wishedZones: Set<MandalaZone>;
  filterZone: MandalaZone | null;
  /** Real cosmic-time flags — subtly deepens the direction scene when
   *  the current weekday / hour matches. Pass `PANCHANG_UNAVAILABLE`
   *  when the server couldn't compute it; the visuals gracefully drop
   *  the acknowledgment layer with no fabrication. */
  panchang: PanchangFlags;
}

export function VimanaWebGL({ hoveredZone, wishedZones, filterZone, panchang }: VimanaWebGLProps) {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1200);
  const [inView, setInView] = useState(true);

  interaction.hoveredZone = hoveredZone;
  interaction.wishedZones = wishedZones;
  interaction.filterZone = filterZone;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (window.innerWidth < 720) setParticleCount(650);
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0; let last = true;
    const check = () => { raf = 0; const next = window.scrollY < window.innerHeight * 1.8; if (next !== last) { last = next; setInView(next); } };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Sky is a two-layer crossfade — the neutral night sky lives on the base
  // div, and each direction's atmosphere sky lives on an overlay div that
  // fades in over 1.4s when that direction is picked. Radial-gradient
  // strings can't smoothly interpolate between different shapes, so opacity
  // is the honest way to transition.
  const atmosphere = atmosphereFor(filterZone);
  const neutralSky = NEUTRAL_ATMOSPHERE.skyGradient;
  const directionSky = atmosphere.skyGradient;
  const directionOverlayVisible = !!filterZone && directionSky !== neutralSky;

  if (reducedMotion) {
    return <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: neutralSky }} />;
  }

  return (
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      opacity: ready ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      background: neutralSky,
    }}>
      {/* Direction sky — crossfades in over the neutral base */}
      <div style={{
        position: "absolute", inset: 0,
        background: directionSky,
        opacity: directionOverlayVisible ? 1 : 0,
        transition: "opacity 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "none",
      }} />
      <Canvas camera={{ position: [0, 0, 5.6], fov: 45 }} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }} dpr={[1, 1.5]} frameloop={inView ? "always" : "never"}>
        <VimanaScene particleCount={particleCount} panchang={panchang} />
      </Canvas>
    </div>
  );
}
