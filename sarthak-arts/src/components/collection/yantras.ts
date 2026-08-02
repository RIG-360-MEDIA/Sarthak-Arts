/**
 * Direction yantras — the sacred geometric device each Vāstu direction
 * carries in the tradition. When a direction is invoked, its yantra
 * fades in over the base mandala and stays visible until the invocation
 * ends. Each yantra is drawn as pure line-art in the same gold ink as
 * the base mandala so they read as members of the same visual family —
 * NOT decorative overlays glued on top.
 *
 * Only E · Pūrvā · aṣṭakoṇa is authored right now. This file is the
 * seat for the other eight; each is a specific yantra from real Vāstu
 * / Tantric doctrine, added one direction at a time so quality holds:
 *
 *   NE · Īśānya      — Rudra Yantra (triangular Śiva form, apex down)
 *   N  · Uttara      — Śrī Yantra inner triangles (Kubera's wealth-yantra)
 *   NW · Vāyavya     — Vāyu triangles (movement, air)
 *   W  · Paścima     — Varuṇa's undulating waves (ocean geometry)
 *   SW · Nairṛtya    — Bhūmi grid (earth square, weight)
 *   S  · Dakṣiṇa     — Yama's chakra (stern circular form)
 *   SE · Āgneya      — Śatakoṇa (6-pointed fire star, Agni's yantra)
 *   C  · Brahmasthāna — Bindu + concentric rings (the still centre)
 */

import type { MandalaZone } from "./VimanaWebGL";

export interface DirectionYantra {
  zone: MandalaZone;
  filled: boolean;
  /** Each entry is a flat Float32Array of `[x0,y0,z0, x1,y1,z1, ...]`,
   *  fed to a `lineSegments` — every consecutive pair of vertices is one
   *  drawn segment. Splitting into multiple entries lets each sub-shape
   *  have its own material (for future per-part styling if needed). */
  segments: Float32Array[];
}

// -------------------------------------------------------------------------
// E · Pūrvā · Aṣṭakoṇa (8-cornered star, Indra's yantra)
//
// Constructed as two overlapping squares — one axis-aligned, one rotated
// 45°. The overlap creates an 8-pointed star silhouette. Every corner
// sits on the same circle of radius `r`, so the 8 tips are equidistant
// from the bindu — the geometry-native reading of aṣṭa (8) diks.
// -------------------------------------------------------------------------
const asthakonaE = (): DirectionYantra => {
  const r = 1.65;   // fits between the mandala's mid band (1.5) and outer petals (1.95)
  const z = 0.055;  // in front of the base mandala triangles (z: 0.02) so it reads on top
  const c = r * Math.cos(Math.PI / 4); // = r * sin(45°) — the rotated square's corner offset

  // Square 1 — axis-aligned. Corners at cardinal points: (r,0), (0,r), (-r,0), (0,-r).
  // Drawn as 4 line segments closing the square, so 8 vertices total
  // (`lineSegments` treats consecutive pairs as separate segments).
  const square1 = new Float32Array([
     r,  0, z,   0,  r, z,
     0,  r, z,  -r,  0, z,
    -r,  0, z,   0, -r, z,
     0, -r, z,   r,  0, z,
  ]);

  // Square 2 — rotated 45°. Corners at (c,c), (-c,c), (-c,-c), (c,-c)
  // where c = r·cos(45°) so the corners land on the same circle of
  // radius r as Square 1's corners.
  const square2 = new Float32Array([
     c,  c, z,  -c,  c, z,
    -c,  c, z,  -c, -c, z,
    -c, -c, z,   c, -c, z,
     c, -c, z,   c,  c, z,
  ]);

  return {
    zone: "E",
    filled: true,
    segments: [square1, square2],
  };
};

const empty = (zone: MandalaZone): DirectionYantra => ({
  zone,
  filled: false,
  segments: [],
});

export const YANTRAS: Record<MandalaZone, DirectionYantra> = {
  E:  asthakonaE(),
  NE: empty("NE"),
  N:  empty("N"),
  NW: empty("NW"),
  W:  empty("W"),
  C:  empty("C"),
  SE: empty("SE"),
  S:  empty("S"),
  SW: empty("SW"),
};

export function yantraFor(zone: MandalaZone | null): DirectionYantra | null {
  if (!zone) return null;
  const y = YANTRAS[zone];
  return y.filled ? y : null;
}
