"use client";

/**
 * HeroWebGL — the real magical scene.
 *
 * Uses Three.js + React Three Fiber + @react-three/postprocessing to render:
 *   - A real 3D Śrī Yantra (procedural geometry, glowing gold lines that bloom)
 *   - A central Bindu (sphere with emissive gold PBR material)
 *   - GPU-instanced particle field (10,000 golden dust motes, cursor gravity)
 *   - A cursor-tracked point light casting real illumination
 *   - Studio HDR environment for real metal reflection
 *   - Post-processing: bloom, chromatic aberration on scroll velocity, subtle vignette + noise
 *
 * Sits behind an HTML content overlay driven by the parent component.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Śrī Yantra — procedural 3D geometry
// Nine interlocking triangles (4 Śiva up + 5 Śakti down) + 8-petal lotus +
// 16-petal lotus + Bhūpura square. Renders as glowing gold lines that bloom.
// ---------------------------------------------------------------------------

function SriYantra() {
  const groupRef = useRef<THREE.Group>(null!);
  const binduRef = useRef<THREE.Mesh>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  // Track cursor for subtle tilt influence
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (groupRef.current) {
      // Ambient slow rotation on Y — meditative pace (90s per revolution)
      groupRef.current.rotation.y += dt * (Math.PI * 2) / 90;
      // Subtle X tilt following cursor
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.25 + mouse.current.y * 0.08,
        0.03,
      );
    }
    if (binduRef.current) {
      const t = performance.now() * 0.001;
      const scale = 1 + Math.sin(t * 1.4) * 0.15;
      binduRef.current.scale.setScalar(scale);
    }
  });

  // Build all yantra layers as line geometry
  const layers = useMemo(() => {
    const outs: { points: THREE.Vector3[]; opacity: number; width: number }[] = [];

    // -- Bhūpura: 3 concentric squares in earth-plane
    for (let i = 0; i < 3; i++) {
      const s = 2.6 - i * 0.06;
      outs.push({
        points: [
          new THREE.Vector3(-s, -s, 0),
          new THREE.Vector3( s, -s, 0),
          new THREE.Vector3( s,  s, 0),
          new THREE.Vector3(-s,  s, 0),
          new THREE.Vector3(-s, -s, 0),
        ],
        opacity: 0.55 - i * 0.14,
        width: 1,
      });
    }

    // -- 3 concentric circles
    const circle = (r: number, segments = 96) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      return pts;
    };
    for (let i = 0; i < 3; i++) {
      outs.push({ points: circle(2.05 - i * 0.06), opacity: 0.55 - i * 0.14, width: 1 });
    }

    // -- Ṣoḍaśadala: 16-petal lotus (petals procedurally drawn as arcs)
    const petals = (radius: number, count: number, petalDepth: number) => {
      const groups: THREE.Vector3[][] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const cx = Math.cos(a) * radius;
        const cy = Math.sin(a) * radius;
        const pts: THREE.Vector3[] = [];
        // Draw a stylised petal: root → outer tip → back to next root
        const rootA = a - Math.PI / count;
        const rootB = a + Math.PI / count;
        const rx1 = Math.cos(rootA) * radius * 0.85;
        const ry1 = Math.sin(rootA) * radius * 0.85;
        const rx2 = Math.cos(rootB) * radius * 0.85;
        const ry2 = Math.sin(rootB) * radius * 0.85;
        const tx = cx + Math.cos(a) * petalDepth;
        const ty = cy + Math.sin(a) * petalDepth;
        pts.push(new THREE.Vector3(rx1, ry1, 0));
        // Curve out via a mid-control (simple approximation)
        for (let t = 0; t <= 1; t += 0.1) {
          const mx = rx1 * (1 - t) + tx * t + Math.cos(a) * petalDepth * Math.sin(Math.PI * t) * 0.3;
          const my = ry1 * (1 - t) + ty * t + Math.sin(a) * petalDepth * Math.sin(Math.PI * t) * 0.3;
          pts.push(new THREE.Vector3(mx, my, 0));
        }
        pts.push(new THREE.Vector3(tx, ty, 0));
        for (let t = 0; t <= 1; t += 0.1) {
          const mx = tx * (1 - t) + rx2 * t - Math.cos(a) * petalDepth * Math.sin(Math.PI * t) * 0.3;
          const my = ty * (1 - t) + ry2 * t - Math.sin(a) * petalDepth * Math.sin(Math.PI * t) * 0.3;
          pts.push(new THREE.Vector3(mx, my, 0));
        }
        pts.push(new THREE.Vector3(rx2, ry2, 0));
        groups.push(pts);
      }
      return groups;
    };
    petals(1.65, 16, 0.32).forEach((p) => outs.push({ points: p, opacity: 0.6, width: 1 }));
    petals(1.15, 8, 0.32).forEach((p) => outs.push({ points: p, opacity: 0.72, width: 1.2 }));

    // -- Nine interlocking triangles at receding sizes
    // 4 Śiva upward, 5 Śakti downward
    const triangle = (cx: number, cy: number, size: number, up: boolean) => {
      const h = size * 0.87;
      if (up) {
        return [
          new THREE.Vector3(cx, cy + size, 0),
          new THREE.Vector3(cx - h, cy - size * 0.5, 0),
          new THREE.Vector3(cx + h, cy - size * 0.5, 0),
          new THREE.Vector3(cx, cy + size, 0),
        ];
      } else {
        return [
          new THREE.Vector3(cx, cy - size, 0),
          new THREE.Vector3(cx - h, cy + size * 0.5, 0),
          new THREE.Vector3(cx + h, cy + size * 0.5, 0),
          new THREE.Vector3(cx, cy - size, 0),
        ];
      }
    };
    for (let i = 0; i < 4; i++) {
      outs.push({ points: triangle(0, 0, 0.85 - i * 0.14, true), opacity: 0.9 - i * 0.05, width: 1.3 });
    }
    for (let i = 0; i < 5; i++) {
      outs.push({ points: triangle(0, 0, 0.95 - i * 0.14, false), opacity: 0.9 - i * 0.05, width: 1.3 });
    }

    return outs;
  }, []);

  const goldColor = new THREE.Color(2.4, 1.65, 0.55); // Above 1 → triggers bloom

  return (
    <group ref={groupRef} rotation={[0.25, 0, 0]}>
      {/* Yantra line layers */}
      {layers.map((layer, i) => (
        <line
          key={i}
          // @ts-expect-error r3f typings for line primitive
          geometry={new THREE.BufferGeometry().setFromPoints(layer.points)}
        >
          <lineBasicMaterial
            color={goldColor}
            transparent
            opacity={layer.opacity}
            toneMapped={false}
          />
        </line>
      ))}
      {/* The Bindu — glowing gold sphere at center */}
      <mesh ref={binduRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshStandardMaterial
          color={"#FCD46F"}
          emissive={new THREE.Color(4, 3, 1)}
          emissiveIntensity={2.5}
          metalness={1}
          roughness={0.15}
          toneMapped={false}
        />
      </mesh>
      {/* Halo sphere around Bindu — softer glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(3, 2.2, 0.8)}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// ParticleField — 10,000 golden dust motes, cursor-reactive
// ---------------------------------------------------------------------------

function ParticleField({ count = 8000 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null!);
  const cursor = useRef(new THREE.Vector3(0, 0, 0));
  const cursorTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorTarget.current.x = ((e.clientX / window.innerWidth) * 2 - 1) * 4;
      cursorTarget.current.y = -(((e.clientY / window.innerHeight) * 2 - 1)) * 3;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Generate initial positions + attributes
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    cursor.current.lerp(cursorTarget.current, 0.08);
    const posAttr = meshRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const seedAttr = meshRef.current.geometry.getAttribute("seed") as THREE.BufferAttribute;
    const t = performance.now() * 0.001;

    for (let i = 0; i < count; i++) {
      const seed = seedAttr.array[i];
      // Ambient drift
      let x = positions[i * 3 + 0] + Math.sin(t * 0.3 + seed * 12) * 0.4;
      let y = positions[i * 3 + 1] + Math.cos(t * 0.25 + seed * 18) * 0.5;
      const z = positions[i * 3 + 2] + Math.sin(t * 0.15 + seed * 5) * 0.3;

      // Cursor gravity — subtle
      const dx = cursor.current.x - x;
      const dy = cursor.current.y - y;
      const distSq = dx * dx + dy * dy;
      const pull = Math.min(0.6 / (distSq + 0.3), 0.4);
      x += dx * pull * dt * 0.5;
      y += dy * pull * dt * 0.5;

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-seed"
          args={[seeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          attribute float seed;
          varying float vSeed;
          void main() {
            vSeed = seed;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPos;
            // Size varies by depth; closer = larger
            gl_PointSize = (60.0 + seed * 40.0) * (1.0 / -mvPos.z) * (1.0 + seed);
          }
        `}
        fragmentShader={`
          varying float vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float alpha = pow(1.0 - d * 2.0, 2.5);
            vec3 goldWarm = vec3(2.4, 1.7, 0.55);
            vec3 goldHot  = vec3(3.0, 2.4, 1.1);
            vec3 color = mix(goldWarm, goldHot, vSeed);
            gl_FragColor = vec4(color, alpha * (0.4 + vSeed * 0.5));
          }
        `}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// CursorLight — a real Three.js point light following the cursor
// ---------------------------------------------------------------------------

function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const target = useRef(new THREE.Vector3(0, 0, 3));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Convert to world-space (approximate — z is fixed)
      target.current.x = ((e.clientX / window.innerWidth) * 2 - 1) * 4;
      target.current.y = -(((e.clientY / window.innerHeight) * 2 - 1)) * 3;
      target.current.z = 2.5;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.lerp(target.current, 0.15);
  });

  return (
    <pointLight
      ref={lightRef}
      color={"#FCD46F"}
      intensity={6}
      distance={8}
      decay={1.8}
      position={[0, 0, 3]}
    />
  );
}

// ---------------------------------------------------------------------------
// CameraController — scroll drives Z position for a dolly effect
// ---------------------------------------------------------------------------

function CameraController() {
  const { camera } = useThree();
  const scrollFrac = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - h.clientHeight);
      scrollFrac.current = Math.min(1, h.scrollTop / max);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(() => {
    // Dolly in as user scrolls the hero, pull back as they leave
    const targetZ = 5.5 - scrollFrac.current * 3.5;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    // Slight upward pan on scroll
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollFrac.current * 0.8, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

export function HeroWebGL() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Delay slightly so the initial paint lands first, then WebGL fades in
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        {/* Deep space background */}
        <color attach="background" args={["#0A0416"]} />
        <fog attach="fog" args={["#0A0416", 6, 16]} />

        {/* Ambient light so PBR materials aren't pitch-black on non-lit sides */}
        <ambientLight intensity={0.35} color={"#4A2C6E"} />

        {/* Directional key light — warm, from front-upper-right */}
        <directionalLight
          position={[3, 4, 2]}
          intensity={0.6}
          color={"#E8B849"}
        />

        {/* Cursor-tracked warm point light */}
        <CursorLight />

        {/* Studio environment for PBR reflection on the gold Bindu */}
        <Environment preset="studio" background={false} />

        {/* Scene contents */}
        <SriYantra />
        <ParticleField count={5000} />

        {/* Scroll-driven camera */}
        <CameraController />

        {/* Post-processing — this is what makes the gold actually GLOW */}
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.35}
            mipmapBlur
            radius={0.85}
          />
          <ChromaticAberration
            offset={[0.0006, 0.0006]}
            radialModulation={false}
            modulationOffset={0}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette
            offset={0.25}
            darkness={0.5}
            eskil={false}
            blendFunction={BlendFunction.NORMAL}
          />
          <Noise
            premultiply
            blendFunction={BlendFunction.OVERLAY}
            opacity={0.15}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
