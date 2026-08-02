"use client";

/**
 * DirectionEffects — one signature symbolic event per Vastu direction.
 *
 * When a direction is picked, its guardian deity's own iconography enacts
 * across the cosmos. Not a colour filter — a specific event drawn from
 * real Sanātana tradition:
 *
 *   NE Ishanya · Śiva     → Trishul rises; three rivulets (Ganga) descend
 *   N Uttara · Kubera     → Nava Nidhi — nine treasures gather inward
 *   NW Vayavya · Vāyu     → Dhvaja (banner) sweeps; wind pushes particles
 *   E Purva · Indra       → Vajra lightning bolt strikes along the axis
 *   SE Agneya · Agni      → Flame-spears (śakti) rise from the base
 *   S Dakshina · Yama     → Daṇḍa (staff) descends vertically; pāśa loops
 *   SW Nairritya · Nirṛti → Dissolution — motion decays and pools low
 *   W Paschima · Varuṇa   → Makara-wave undulates; pāśa loops
 *   C Brahmasthāna · Brahmā → Haṃsa swan lifts; all zones breathe as one
 *
 * Each effect is code-drawn line + point geometry — same visual family as
 * the mandala it lives inside, so nothing feels foreign. Non-active
 * directions don't render at all; there is exactly one signature event
 * on screen at a time (or none, when All is selected).
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { MandalaZone } from "./VimanaWebGL";

const GOLD_HOT = new THREE.Color(1.8, 1.35, 0.55);
const WATER_HOT = new THREE.Color(0.45, 1.15, 2.0);
const FIRE_HOT = new THREE.Color(2.0, 0.85, 0.28);
const EARTH_HOT = new THREE.Color(0.9, 1.6, 0.6);
const AIR_HOT = new THREE.Color(1.4, 1.55, 1.75);
const SPACE_HOT = new THREE.Color(1.4, 0.8, 1.9);
const SWAN_HOT = new THREE.Color(1.9, 1.75, 1.5);

interface EffectProps {
  activeZone: MandalaZone | null;
  /** Eased 0..1 from parent — the whole event fades in/out with this. */
  amt: number;
}

// ---------------------------------------------------------------------------
// NE · Śiva · Trishul + three rivulets (Ganga descending)
// The trishul appears at the top of the mandala. Three vertical rivulets
// of light descend from its central prong — the Ganga through Śiva's hair.
// ---------------------------------------------------------------------------
function TrishulScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const rivuletRefs = useRef<(THREE.Mesh | null)[]>([]);
  const trishulRef = useRef<THREE.LineSegments>(null!);

  // The Trishul silhouette — central prong plus two flanking side-prongs.
  const trishulGeo = useMemo(() => {
    const s = 0.7; // scale
    const p: number[] = [];
    const push = (a: [number, number], b: [number, number]) => { p.push(a[0], a[1], 0, b[0], b[1], 0); };
    // central prong
    push([0, s], [0, -s * 1.3]);
    // side prongs curved inward
    push([-s * 0.6, s * 0.9], [-s * 0.15, -s * 0.15]);
    push([s * 0.6, s * 0.9], [s * 0.15, -s * 0.15]);
    // shaft joint (crescent-ish)
    push([-s * 0.28, -s * 0.15], [s * 0.28, -s * 0.15]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!groupRef.current || !trishulRef.current) return;
    const t = performance.now() * 0.001;
    groupRef.current.visible = visible;
    if (!visible) return;
    // Trishul lifts from center to the top; fades in with amt.
    groupRef.current.position.y = 0.8 + amt * 0.9;
    const mat = trishulRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = amt * (0.75 + Math.sin(t * 1.3) * 0.15);
    // Rivulets — three descending pulses. Their y offset moves down over time
    // (looping); their brightness comes from amt.
    rivuletRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.55 + i * 0.33) % 1;
      m.position.y = 0.6 - phase * 2.6;
      m.scale.y = 0.4 + phase * 0.3;
      (m.material as THREE.MeshBasicMaterial).opacity = amt * (1 - phase) * 0.75;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments ref={trishulRef} geometry={trishulGeo}>
        <lineBasicMaterial color={GOLD_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={i} ref={(el) => { rivuletRefs.current[i] = el; }} position={[x, 0, -0.02]}>
          <planeGeometry args={[0.06, 0.9]} />
          <meshBasicMaterial color={WATER_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// N · Kubera · Nava Nidhi (nine treasures gathering inward)
// Nine points of light orbit inward toward the bindu, spiralling to a
// growing pool of wealth at the heart.
// ---------------------------------------------------------------------------
function NavaNidhiScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const treasureRefs = useRef<(THREE.Mesh | null)[]>([]);
  const poolRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;

    treasureRefs.current.forEach((m, i) => {
      if (!m) return;
      // Each treasure orbits with its own phase, radius spirals inward on a
      // loop. Nine of them, staggered so they visibly gather one by one.
      const orbitT = (t * 0.28 + i * 0.11) % 1;
      const r = 2.05 * (1 - orbitT) + 0.05;
      const angle = (i / 9) * Math.PI * 2 + t * 0.5 + orbitT * Math.PI * 2 * 0.4;
      m.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.05);
      const near = 1 - Math.min(1, orbitT * 1.2); // brightest when close to center
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = amt * (0.5 + near * 0.5);
      const s = 0.5 + near * 0.8;
      m.scale.setScalar(s);
    });

    if (poolRef.current) {
      // Pool grows with amt, gently pulses.
      const p = poolRef.current;
      const pulse = 1 + Math.sin(t * 1.5) * 0.06;
      p.scale.setScalar(amt * pulse);
      (p.material as THREE.MeshBasicMaterial).opacity = amt * 0.6;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} ref={(el) => { treasureRefs.current[i] = el; }} position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={GOLD_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={poolRef} position={[0, 0, 0.03]}>
        <ringGeometry args={[0.08, 0.28, 40]} />
        <meshBasicMaterial color={GOLD_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// NW · Vāyu · Dhvaja (banner) sweeping — wind visualisation
// A long undulating banner-line sweeps horizontally across the mandala,
// its wave amplitude driven by amt.
// ---------------------------------------------------------------------------
function DhvajaScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const bannerRef = useRef<THREE.Line>(null!);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const N = 60;

  useEffect(() => {
    const positions = new Float32Array(N * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [geo]);

  useFrame(() => {
    if (!groupRef.current || !bannerRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    const positions = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = (u - 0.5) * 4.8;
      const wave = Math.sin(u * Math.PI * 4 - t * 3.5) * 0.35 * amt;
      const y = 0.9 + wave + Math.sin(t * 0.7) * 0.4; // banner drifts up/down
      positions.setXYZ(i, x, y, 0.02);
    }
    positions.needsUpdate = true;
    const mat = bannerRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = amt * 0.8;
  });

  return (
    <group ref={groupRef} visible={false}>
      <line ref={bannerRef} geometry={geo}>
        <lineBasicMaterial color={AIR_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} linewidth={2} />
      </line>
    </group>
  );
}

// ---------------------------------------------------------------------------
// E · Indra · Vajra (lightning bolt)
// A jagged bolt strikes from the bindu outward along the East axis on a
// recurring beat; between strikes, a soft glow pulses on the East.
// ---------------------------------------------------------------------------
function VajraScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const boltRef = useRef<THREE.Line>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);

  useEffect(() => {
    const N = 20;
    const positions = new Float32Array(N * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [geo]);

  useFrame(() => {
    if (!groupRef.current || !boltRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    // Strike beat — bright for a moment every ~2.3s.
    const beat = (t * 0.42) % 1;
    const strike = beat < 0.15 ? (1 - beat / 0.15) : 0;

    // Regenerate jagged bolt path each strike, deterministically per beat.
    const positions = geo.attributes.position as THREE.BufferAttribute;
    const N = 20;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = u * 2.3;
      // jitter locked to current beat integer so bolt is stable during strike
      const beatIdx = Math.floor(t * 0.42);
      const jitter = Math.sin(beatIdx * 17.13 + i * 5.7) * 0.14;
      positions.setXYZ(i, x, jitter, 0.04);
    }
    positions.needsUpdate = true;
    const bmat = boltRef.current.material as THREE.LineBasicMaterial;
    bmat.opacity = amt * strike;

    if (glowRef.current) {
      const gmat = glowRef.current.material as THREE.MeshBasicMaterial;
      gmat.opacity = amt * (0.15 + strike * 0.5);
      const s = 1 + strike * 0.6;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <line ref={boltRef} geometry={geo}>
        <lineBasicMaterial color={new THREE.Color(1.95, 1.55, 0.75)} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </line>
      <mesh ref={glowRef} position={[2.0, 0, -0.02]}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color={GOLD_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SE · Agni · Flame-spears rising from the base
// Six upward-rising flame-spears along the SE axis, staggered.
// ---------------------------------------------------------------------------
function AgniScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const flameRefs = useRef<(THREE.Mesh | null)[]>([]);
  const N = 7;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    flameRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.9 + i * 0.28) % 1;
      // Fires rise up along SE diagonal (45° down-right in canvas is +x, -y)
      const dx = 0.6 + phase * 1.4;
      const dy = -0.6 - phase * 1.4;
      m.position.set(dx + (i - N / 2) * 0.16, dy - (i - N / 2) * 0.16, 0.03);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = amt * (1 - phase) * 0.85;
      const flick = 1 + Math.sin(t * 12 + i) * 0.15;
      m.scale.set(flick * 0.4, (0.6 + phase * 0.4) * flick, 1);
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {Array.from({ length: N }).map((_, i) => (
        <mesh key={i} ref={(el) => { flameRefs.current[i] = el; }} position={[0, 0, 0.03]}>
          <planeGeometry args={[0.14, 0.42]} />
          <meshBasicMaterial color={FIRE_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// S · Yama · Daṇḍa (staff) + pāśa (noose)
// A vertical staff of dark light along the South axis, framed by a slow
// noose-circle. Grave and measured.
// ---------------------------------------------------------------------------
function YamaScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const staffRef = useRef<THREE.Mesh>(null!);
  const nooseRef = useRef<THREE.LineLoop>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    if (staffRef.current) {
      const mat = staffRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = amt * 0.7;
    }
    if (nooseRef.current) {
      nooseRef.current.rotation.z = t * 0.35;
      const mat = nooseRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = amt * 0.55;
    }
  });

  const nooseGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.5, -1.6 + Math.sin(a) * 0.5, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={staffRef} position={[0, -1.3, 0.02]}>
        <planeGeometry args={[0.08, 1.6]} />
        <meshBasicMaterial color={new THREE.Color(1.4, 0.5, 0.55)} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <lineLoop ref={nooseRef} geometry={nooseGeo}>
        <lineBasicMaterial color={new THREE.Color(1.4, 0.5, 0.55)} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SW · Nirṛti · Dissolution
// Descending dust: particles fall gently in the SW quadrant then vanish
// low. The whole world visibly quietens.
// ---------------------------------------------------------------------------
function NirritiScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const dustRef = useRef<THREE.Points>(null!);
  const N = 80;

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = -Math.random() * 2.4;
      positions[i * 3 + 1] = -0.4 - Math.random() * 1.8;
      positions[i * 3 + 2] = 0.01;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    if (dustRef.current) {
      dustRef.current.rotation.z = 0; // no spin — grave stillness
      const attr = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < N; i++) {
        const s = seeds[i];
        const yStart = -0.2 - s * 1.4;
        const phase = (t * (0.18 + s * 0.1) + s) % 1;
        attr.setY(i, yStart - phase * 2.0);
      }
      attr.needsUpdate = true;
      const mat = dustRef.current.material as THREE.PointsMaterial;
      mat.opacity = amt * 0.55;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <points ref={dustRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
        <pointsMaterial color={EARTH_HOT} size={0.06} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------------
// W · Varuṇa · Makara-wave (undulation) + pāśa loop
// A sine-wave line undulates across the West side of the frame; a small
// looping pāśa (noose) circles at the West axis point.
// ---------------------------------------------------------------------------
function VarunaScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const waveRef = useRef<THREE.Line>(null!);
  const pashaRef = useRef<THREE.LineLoop>(null!);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const N = 60;

  useEffect(() => {
    const positions = new Float32Array(N * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [geo]);

  useFrame(() => {
    if (!groupRef.current || !waveRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    const attr = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const y = (u - 0.5) * 3.5;
      const x = -2.0 + Math.sin(u * Math.PI * 3 + t * 2) * 0.35 * amt;
      attr.setXYZ(i, x, y, 0.02);
    }
    attr.needsUpdate = true;
    (waveRef.current.material as THREE.LineBasicMaterial).opacity = amt * 0.75;
    if (pashaRef.current) {
      pashaRef.current.rotation.z = t * 0.6;
      (pashaRef.current.material as THREE.LineBasicMaterial).opacity = amt * 0.55;
    }
  });

  const pashaGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group ref={groupRef} visible={false}>
      <line ref={waveRef} geometry={geo}>
        <lineBasicMaterial color={WATER_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </line>
      <lineLoop ref={pashaRef} geometry={pashaGeo} position={[-2, 0, 0.03]}>
        <lineBasicMaterial color={WATER_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
    </group>
  );
}

// ---------------------------------------------------------------------------
// C · Brahmasthāna · Haṃsa (swan) rising, all rings breathe as one
// A soft ascending glow at the center + a slow scale-breath applied by the
// parent mandala group in unison. Here we render the swan-form suggestion.
// ---------------------------------------------------------------------------
function BrahmaScene({ visible, amt }: { visible: boolean; amt: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const swanRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = performance.now() * 0.001;
    if (swanRef.current) {
      swanRef.current.position.y = 0.15 + Math.sin(t * 0.9) * 0.12;
      const s = 1 + Math.sin(t * 1.3) * 0.08;
      swanRef.current.scale.setScalar(s);
      (swanRef.current.material as THREE.MeshBasicMaterial).opacity = amt * 0.75;
    }
    if (ringRef.current) {
      const breath = 1 + Math.sin(t * 0.8) * 0.18;
      ringRef.current.scale.setScalar(breath);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = amt * 0.5;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={swanRef} position={[0, 0.15, 0.08]}>
        <circleGeometry args={[0.28, 40]} />
        <meshBasicMaterial color={SWAN_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <ringGeometry args={[0.6, 0.72, 60]} />
        <meshBasicMaterial color={SPACE_HOT} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Root — mounts every effect group once and swaps visibility. Each effect
 * eases in/out with its own opacity, driven by amt.
 */
export function DirectionEffects({ activeZone, amt }: EffectProps) {
  return (
    <group renderOrder={2}>
      <TrishulScene visible={activeZone === "NE"} amt={activeZone === "NE" ? amt : 0} />
      <NavaNidhiScene visible={activeZone === "N"} amt={activeZone === "N" ? amt : 0} />
      <DhvajaScene visible={activeZone === "NW"} amt={activeZone === "NW" ? amt : 0} />
      <VajraScene visible={activeZone === "E"} amt={activeZone === "E" ? amt : 0} />
      <AgniScene visible={activeZone === "SE"} amt={activeZone === "SE" ? amt : 0} />
      <YamaScene visible={activeZone === "S"} amt={activeZone === "S" ? amt : 0} />
      <NirritiScene visible={activeZone === "SW"} amt={activeZone === "SW" ? amt : 0} />
      <VarunaScene visible={activeZone === "W"} amt={activeZone === "W" ? amt : 0} />
      <BrahmaScene visible={activeZone === "C"} amt={activeZone === "C" ? amt : 0} />
    </group>
  );
}
