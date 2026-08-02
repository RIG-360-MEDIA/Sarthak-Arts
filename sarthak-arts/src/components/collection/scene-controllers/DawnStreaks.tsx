"use client";

/**
 * DawnStreaks — E · Pūrvā's weather layer.
 *
 * Renders 7 thin, warm horizontal streaks of light drifting slowly from
 * right (East) to left (West) across a plane behind the mandala. Reads
 * intensity from `interaction.weatherIntensityTarget` (populated by
 * SceneDirector). When the intensity target is 0 the material's opacity
 * eases to 0 and the streaks disappear cleanly.
 *
 * Implemented as a single fragment shader on one plane — much cheaper
 * than a particle field for this kind of horizontal band effect.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DawnStreaksProps {
  intensityTarget: () => number;   // read-only accessor into the shared state
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Seven bands at different heights and speeds, mixed additively.
// Each band is a soft horizontal line whose brightness peaks in the
// middle horizontally and falls off at both ends (like a distant streak
// of dawn light lit only in the middle by the coming sun).
const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAlpha;

  float band(float y, float centerY, float thickness, float phase, float speed) {
    // Vertical Gaussian-ish falloff around centerY (in 0..1 uv space).
    float dy = (y - centerY) / thickness;
    float vertical = exp(-dy * dy);
    // Horizontal drift — a soft peak that slides from right to left.
    float x = fract(phase - uTime * speed);
    // Bell-shape horizontal envelope so the streak reads as a passing gleam
    // not a flat bar. Peak brightness around x = 0.5.
    float dx = (x - 0.5) * 2.4;
    float horizontal = exp(-dx * dx);
    return vertical * horizontal;
  }

  void main() {
    float y = vUv.y;
    float t = uTime;
    // Seven streaks at different heights, thicknesses, phases, speeds.
    // Warm gold at core, softer at edges.
    float sum = 0.0;
    sum += band(y, 0.28, 0.008, 0.10, 0.028);
    sum += band(y, 0.42, 0.010, 0.55, 0.033) * 0.9;
    sum += band(y, 0.50, 0.007, 0.20, 0.024) * 0.85;
    sum += band(y, 0.58, 0.009, 0.72, 0.031) * 0.95;
    sum += band(y, 0.66, 0.012, 0.35, 0.019) * 0.8;
    sum += band(y, 0.74, 0.008, 0.88, 0.026) * 0.75;
    sum += band(y, 0.82, 0.010, 0.05, 0.022) * 0.70;

    // Warm dawn gold — additive-blended so the streaks sit like light
    // on top of the mandala scene, not a paint over it.
    vec3 col = vec3(1.00, 0.82, 0.55);
    gl_FragColor = vec4(col * sum, sum * uAlpha);
  }
`;

export function DawnStreaks({ intensityTarget }: DawnStreaksProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const alphaRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAlpha: { value: 0 },
    }),
    []
  );

  useFrame((_, dtRaw) => {
    if (!matRef.current) return;
    const dt = Math.min(dtRaw, 0.05);
    // Ease the material's own alpha toward the target intensity.
    // Target 0 = fade out streaks (E not picked). Target 1+ = full dawn.
    const target = intensityTarget();
    alphaRef.current = THREE.MathUtils.lerp(
      alphaRef.current,
      target,
      Math.min(1, dt * 1.6)
    );
    const u = matRef.current.uniforms;
    if (!u.uTime || !u.uAlpha) return;
    u.uTime.value = performance.now() * 0.001;
    // The base opacity per band gets multiplied here — 0.55 base tuned so
    // even at full intensity the streaks are a whisper of light, not a wall.
    u.uAlpha.value = alphaRef.current * 0.55;
  });

  return (
    <mesh position={[0, 0.4, -0.4]} renderOrder={2}>
      <planeGeometry args={[10, 6]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
