"use client";

/**
 * InvocationScene — draws the picked direction's sacred yantra on top of
 * the base mandala. Yantras are pure line-art in the same gold ink as the
 * base mandala; they belong to the same visual family, not decorative
 * glue-on. Persistent while the direction is picked, ease out cleanly
 * when it isn't.
 *
 * Right now only E · aṣṭakoṇa is authored. As we build the other eight,
 * add them to `yantras.ts` and this component picks them up with no code
 * change — each direction becomes a config edit, not a rebuild.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MandalaZone } from "./VimanaWebGL";
import { YANTRAS, yantraFor, type DirectionYantra } from "./yantras";

const GOLD = new THREE.Color(1.55, 1.15, 0.42);

/** One rendered yantra with its own opacity envelope. When its zone is
 *  the currently invoked one, fade opacity toward 1; otherwise toward 0.
 *  We mount ONE of these per filled yantra so each can fade independently
 *  — no flicker when switching between directions. */
function YantraRenderer({
  yantra,
  activeZone,
}: {
  yantra: DirectionYantra;
  activeZone: MandalaZone | null;
}) {
  const materialsRef = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const opacityRef = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const target = activeZone === yantra.zone ? 1 : 0;
    // 1.2s ease — quick enough to feel responsive, slow enough to feel
    // devotional rather than snappy. Matches the atmosphere crossfade
    // tempo so the whole invocation eases in together.
    opacityRef.current = THREE.MathUtils.lerp(
      opacityRef.current,
      target,
      Math.min(1, dt * 1.4)
    );
    const alpha = opacityRef.current * 0.85;
    for (const m of materialsRef.current) {
      if (m) m.opacity = alpha;
    }
  });

  return (
    <group>
      {yantra.segments.map((seg, i) => (
        // eslint-disable-next-line react/no-unknown-property -- lineSegments is a valid R3F element
        <lineSegments key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[seg, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            ref={(el) => {
              materialsRef.current[i] = el;
            }}
            color={GOLD}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}

export function InvocationScene({ activeZone }: { activeZone: MandalaZone | null }) {
  // Mount every FILLED yantra once; each renders its own fade envelope
  // and only becomes visible when its own zone is active. As directions
  // get authored in yantras.ts, they appear here automatically.
  const filled = useMemo(
    () => Object.values(YANTRAS).filter((y) => y.filled),
    []
  );
  // `yantraFor` is exported but not consumed here — the per-yantra
  // renderer decides visibility from `activeZone` directly.
  void yantraFor;

  return (
    <group>
      {filled.map((y) => (
        <YantraRenderer key={y.zone} yantra={y} activeZone={activeZone} />
      ))}
    </group>
  );
}
