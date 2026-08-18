/**
 * Piece — the metallic object render used on Collection cards until real
 * product photography exists. Ported from the approved Utsav prototype: filled,
 * shaded silhouettes that read as a real object (copper/brass/silver), not
 * line-art. Pure SVG, so this stays a Server Component.
 *
 * `PieceDefs` renders the metal gradients once per page; `PieceRender` draws one
 * object by (glyph, metalGrad, gemHex). Swap for <Image> when photos land.
 */

const HI = "rgba(255,255,255,.4)";
const ENGR = "rgba(60,32,12,.42)";

type ShapeFn = (g: string, gem: string) => string;

const SHAPE: Record<string, ShapeFn> = {
  kalash: (g) =>
    `<path d="M44 42 Q28 56 28 80 Q28 106 64 106 Q100 106 100 80 Q100 56 84 42 Z" fill="url(#${g})"/><rect x="46" y="35" width="36" height="10" rx="3.5" fill="url(#${g})"/><circle cx="64" cy="26" r="9.5" fill="url(#${g})"/><path d="M55 22 Q44 6 38 16 M73 22 Q84 6 90 16 M64 18 Q64 3 64 3" stroke="#3B6B2E" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M45 46 Q33 60 34 84 Q35 100 52 105" stroke="${HI}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  plate: (g, gem) =>
    `<circle cx="64" cy="66" r="47" fill="url(#${g})"/><circle cx="64" cy="66" r="47" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/><path d="M64 32 L92 84 H36 Z M64 100 L36 48 H92 Z" fill="none" stroke="${ENGR}" stroke-width="2.4"/><circle cx="64" cy="66" r="9" fill="${gem}"/><path d="M30 50 Q40 32 66 30" stroke="${HI}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  yantra: (g, gem) =>
    `<circle cx="64" cy="66" r="47" fill="url(#${g})"/><path d="M64 30 L94 86 H34 Z M64 102 L34 46 H94 Z" fill="none" stroke="${ENGR}" stroke-width="2.4"/><circle cx="64" cy="66" r="20" fill="none" stroke="${ENGR}" stroke-width="2"/><circle cx="64" cy="66" r="7.5" fill="${gem}"/><path d="M30 50 Q40 32 66 30" stroke="${HI}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  pyramid: (g, gem) =>
    `<path d="M64 22 L106 106 H22 Z" fill="url(#${g})"/><path d="M64 22 L64 106 H22 Z" fill="rgba(255,255,255,.16)"/><path d="M64 22 L106 106 H64 Z" fill="rgba(0,0,0,.12)"/><circle cx="64" cy="20" r="5.5" fill="${gem}"/>`,
  chime: (g) =>
    `<ellipse cx="64" cy="26" rx="32" ry="8" fill="url(#${g})"/><rect x="41" y="32" width="6.5" height="58" rx="3" fill="url(#${g})"/><rect x="57.5" y="32" width="6.5" height="70" rx="3" fill="url(#${g})"/><rect x="74" y="32" width="6.5" height="48" rx="3" fill="url(#${g})"/><circle cx="64" cy="106" r="7.5" fill="url(#${g})"/><ellipse cx="55" cy="24" rx="10" ry="3" fill="${HI}"/>`,
  panel: (g) =>
    `<rect x="30" y="16" width="68" height="96" rx="9" fill="url(#${g})"/><rect x="37" y="23" width="54" height="82" rx="5" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2"/><text x="64" y="80" text-anchor="middle" font-family="'Noto Serif Devanagari',serif" font-size="48" fill="${ENGR}">ॐ</text><path d="M37 26 Q41 21 60 21" stroke="${HI}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  diya: (g) =>
    `<path d="M18 76 Q64 102 110 76 Q102 66 64 66 Q26 66 18 76 Z" fill="url(#${g})"/><path d="M24 74 Q40 62 64 62" stroke="${HI}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M64 62 Q59 46 67 36 Q77 48 69 62 Z" fill="#F5911E"/><path d="M64 58 Q61 49 65 43 Q70 50 66 58 Z" fill="#F4C430"/>`,
  vessel: (g) =>
    `<path d="M34 46 H94 L88 100 Q86 110 76 110 H52 Q42 110 40 100 Z" fill="url(#${g})"/><rect x="28" y="39" width="72" height="10" rx="4.5" fill="url(#${g})"/><path d="M40 50 Q37 74 45 98" stroke="${HI}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
};

export function PieceDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="gCopper" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F6BD8A" /><stop offset=".5" stopColor="#C7703A" /><stop offset="1" stopColor="#7E401E" />
        </linearGradient>
        <linearGradient id="gBrass" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F7E09A" /><stop offset=".5" stopColor="#CBA23B" /><stop offset="1" stopColor="#886220" />
        </linearGradient>
        <linearGradient id="gSilver" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F6F8FB" /><stop offset=".5" stopColor="#C6CCD4" /><stop offset="1" stopColor="#8A929C" />
        </linearGradient>
        <linearGradient id="gAlloy" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ECD07C" /><stop offset=".5" stopColor="#B58734" /><stop offset="1" stopColor="#7A551C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PieceRender({
  glyph, metalGrad, gemHex, className,
}: {
  glyph: string; metalGrad: string; gemHex: string; className?: string;
}) {
  const draw = SHAPE[glyph] ?? SHAPE.vessel;
  const inner = `<ellipse cx="64" cy="118" rx="33" ry="5.5" fill="rgba(90,60,20,.15)"/>${draw(metalGrad, gemHex)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
