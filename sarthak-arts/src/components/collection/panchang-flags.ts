/**
 * Panchang flags — the minimal, serialisable slice of the panchang the
 * Collection page needs to run its direction-scene acknowledgment logic.
 *
 * The full `Panchang` type from `src/lib/panchang/index.ts` contains
 * `Date` objects and can't cross a server → client component boundary
 * without serialisation loss. This shape captures only the flags a
 * direction scene actually consumes:
 *
 *   - `weekday`   — matched against `DirectionScene.panchangDay`
 *                   (e.g. Wednesday = Indra's day, deepens E's breath).
 *   - `sunriseTs` / `sunsetTs` — epoch ms for "near sunrise" and
 *                   "near sunset" windows.
 *
 * `ok:false` MUST be honoured — if computePanchang failed on the server,
 * the client renders the neutral direction scene with no cosmic-time
 * acknowledgment. The design NEVER shows a fabricated cosmic value
 * (see `src/lib/panchang/index.ts` header).
 */

export type PanchangFlags =
  | {
      ok: true;
      weekday: string;    // "Sunday" .. "Saturday"
      sunriseTs: number;  // epoch ms in local time
      sunsetTs: number;   // epoch ms in local time
    }
  | { ok: false };

export const PANCHANG_UNAVAILABLE: PanchangFlags = { ok: false };
