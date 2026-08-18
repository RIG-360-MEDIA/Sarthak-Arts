import Link from "next/link";
import type { DirectionView } from "@/lib/collection";
import { toQuery, toggleDirection } from "@/lib/collection";
import { PieceRender } from "./Piece";

/**
 * "Shop the Home" — the 3×3 Vāstu-Puruṣa-Maṇḍala hero. North is up; each cell is
 * a direction (colour-coded) that filters the collection when tapped. The center
 * is the Brahmasthān. Server-rendered as real links so it works without JS and
 * is crawlable; selection state comes from the URL.
 */
const GRID: string[] = [
  "northwest", "north", "northeast",
  "west", "center", "east",
  "southwest", "south", "southeast",
];

export function MandalaHome({
  directions, selected, baseParams,
}: {
  directions: DirectionView[];
  selected: string[];
  baseParams: Record<string, string | undefined>;
}) {
  const byCode = new Map(directions.map((d) => [d.code, d]));
  return (
    <section className="mandala-sec">
      <div className="mandala-head">
        <span className="eyb">Shop the home</span>
        <h2 className="serif">Every piece, in its place</h2>
        <p>Each corner shows its direction, its Sanskrit name, and what it governs — tap to enter, or turn the wheel on the left.</p>
      </div>
      <div className="mandala">
        {GRID.map((code) => {
          const d = byCode.get(code);
          if (!d) return <div key={code} />;
          const on = selected.includes(code);
          const href = toQuery({ ...baseParams, direction: toggleDirection(selected, code).join(",") || undefined });
          const style = { ["--pc" as string]: d.color, ["--pc-deep" as string]: d.colorDeep } as React.CSSProperties;

          if (code === "center") {
            return (
              <Link key={code} href={href} className={`mcell center${on ? " on" : ""}`} style={style} aria-pressed={on}>
                <span className="mc-om sa-deva" aria-hidden="true">ॐ</span>
                <span className="mc-brahma">Brahmasthāna</span>
              </Link>
            );
          }
          return (
            <Link key={code} href={href} className={`mcell${on ? " on" : ""}`} style={style} aria-pressed={on}>
              <span className="mc-en">{d.name}</span>
              <span className="mc-sk">{d.iast} · {d.deity}</span>
              <span className="mc-obj">
                {d.sample
                  ? <PieceRender glyph={d.sample.glyph} metalGrad={d.sample.metalGrad} gemHex={d.sample.gemHex} />
                  : null}
              </span>
              <span className="mc-gov">{d.governs}</span>
              {d.liveCount > 0
                ? <span className="mc-count">{d.liveCount} piece{d.liveCount === 1 ? "" : "s"} →</span>
                : <span className="mc-empty">Pieces arriving</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
