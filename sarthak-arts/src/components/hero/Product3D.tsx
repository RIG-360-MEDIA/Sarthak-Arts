"use client";

/**
 * Product3D — real 3D product previews with PBR metal materials.
 *
 * Three procedural pieces, each rendered in its own small Canvas under a
 * studio HDR environment so the metal reflects like actual metal:
 *   - kalash   → LatheGeometry vessel profile, polished copper
 *   - yantra   → thin cylinder plate + gold yantra line-work, solid silver
 *   - pyramid  → four-sided cone, brass
 *
 * Slow turntable rotation; ContactShadows ground the piece. Pauses under
 * prefers-reduced-motion (static pose, still lit correctly).
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

export type ProductKind = "kalash" | "yantra" | "pyramid";

// ---------------------------------------------------------------------------
// Materials — measured against real metal references
// ---------------------------------------------------------------------------
const METALS: Record<ProductKind, { color: string; roughness: number }> = {
  kalash: { color: "#B06A2E", roughness: 0.28 },   // polished copper
  yantra: { color: "#C9CBD1", roughness: 0.14 },   // solid silver
  pyramid: { color: "#C08A2E", roughness: 0.3 },   // brass
};

function Turntable({ children, spin }: { children: React.ReactNode; spin: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current && spin) ref.current.rotation.y += dt * 0.35; // one turn / ~18s
  });
  return <group ref={ref}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Kalash — vessel profile revolved around Y (base → belly → neck → rim)
// ---------------------------------------------------------------------------
function Kalash() {
  const geometry = useMemo(() => {
    const profile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.3, 0.04),
      new THREE.Vector2(0.46, 0.22),
      new THREE.Vector2(0.5, 0.42),   // belly
      new THREE.Vector2(0.42, 0.62),
      new THREE.Vector2(0.22, 0.76),  // neck
      new THREE.Vector2(0.2, 0.84),
      new THREE.Vector2(0.34, 0.9),   // rim flare
      new THREE.Vector2(0.32, 0.96),
      new THREE.Vector2(0.0, 0.96),
    ];
    return new THREE.LatheGeometry(profile, 64);
  }, []);
  const m = METALS.kalash;
  return (
    <group position={[0, -0.55, 0]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={m.color} metalness={1} roughness={m.roughness} envMapIntensity={1.3} />
      </mesh>
      {/* Coconut atop the rim — traditional crowning */}
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.16, 32, 24]} />
        <meshStandardMaterial color="#5C3A1E" metalness={0.1} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Yantra plate — thin silver disc with raised gold triangle line-work
// ---------------------------------------------------------------------------
function YantraPlate() {
  const m = METALS.yantra;

  const yantraLines = useMemo(() => {
    const tri = (size: number, up: boolean) => {
      const h = size * 0.87;
      const a = up ? size : -size;
      const b = up ? -size * 0.5 : size * 0.5;
      return new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.036, a),
        new THREE.Vector3(-h, 0.036, b),
        new THREE.Vector3(h, 0.036, b),
        new THREE.Vector3(0, 0.036, a),
      ]);
    };
    const circle = (r: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * r, 0.036, Math.sin(t) * r));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    };
    const geoms = [
      tri(0.42, true), tri(0.34, true), tri(0.26, true),
      tri(0.46, false), tri(0.38, false), tri(0.3, false),
      circle(0.55), circle(0.6),
    ];
    // Real THREE.Line objects — avoids the JSX <line>/SVG ambiguity
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 1.15, 0.4) });
    material.toneMapped = false;
    return geoms.map((g) => new THREE.Line(g, material));
  }, []);

  return (
    <group position={[0, -0.15, 0]} rotation={[0.5, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.68, 0.68, 0.05, 64]} />
        <meshStandardMaterial color={m.color} metalness={1} roughness={m.roughness} envMapIntensity={1.4} />
      </mesh>
      {yantraLines.map((line, i) => (
        <primitive object={line} key={i} />
      ))}
      {/* Bindu stud at plate center */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#E8B849" metalness={1} roughness={0.2} envMapIntensity={1.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Aṣṭadhātu pyramid — four-sided, brass
// ---------------------------------------------------------------------------
function Pyramid() {
  const m = METALS.pyramid;
  return (
    <group position={[0, -0.4, 0]}>
      <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.62, 0.92, 4]} />
        <meshStandardMaterial
          color={m.color} metalness={1} roughness={m.roughness}
          envMapIntensity={1.3} flatShading
        />
      </mesh>
      {/* Base plinth */}
      <mesh position={[0, -0.49, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.05, 0.06, 1.05]} />
        <meshStandardMaterial color="#8A6220" metalness={1} roughness={0.45} envMapIntensity={1} />
      </mesh>
    </group>
  );
}

const PIECES: Record<ProductKind, React.ComponentType> = {
  kalash: Kalash,
  yantra: YantraPlate,
  pyramid: Pyramid,
};

// ---------------------------------------------------------------------------
// Public component — one small canvas per product card.
// The Canvas mounts only while the card is near the viewport (IntersectionObserver),
// so offscreen products cost zero GPU/CPU. A quiet placeholder holds the space.
// ---------------------------------------------------------------------------
export function Product3D({ kind }: { kind: ProductKind }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [spin, setSpin] = useState(true);

  useEffect(() => {
    setSpin(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Piece = PIECES[kind];

  return (
    <div ref={holderRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      {inView && (
        <Canvas
          camera={{ position: [0, 0.35, 2.4], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} color="#F3E0BE" />
          <directionalLight position={[2, 4, 3]} intensity={1.1} color="#FFF4DC" castShadow />
          <Environment preset="studio" background={false} />
          <Turntable spin={spin}>
            <Piece />
          </Turntable>
          <ContactShadows position={[0, -0.72, 0]} opacity={0.45} scale={4} blur={2.6} far={2} color="#000000" />
        </Canvas>
      )}
    </div>
  );
}
