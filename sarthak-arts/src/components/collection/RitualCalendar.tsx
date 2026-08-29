import Link from "next/link";
import type { NextFestival } from "@/lib/home-festivals";

/**
 * RitualCalendar — a living occasion band driven by the real panchāṅga engine.
 * It turns an abstract catalogue into a timely one: "the next festival is N days
 * away — here are the pieces traditionally placed or gifted for it." This is the
 * occasion-and-gifting lever (a reason to buy *now*, not someday) plus a soft
 * countdown for urgency, grounded entirely in verified festival data.
 *
 * Renders nothing when the seeded festival window has run out — better absent
 * than stale (see the devotional-accuracy rule).
 */
export function RitualCalendar({ festival }: { festival: NextFestival | null }) {
  if (!festival) return null;
  const { name, nameDeva, tagline, daysAway, dateLabel, tithiIast, paksha, picks } = festival;

  const when =
    daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`;
  const tithi = [paksha, tithiIast].filter(Boolean).join(" ");

  return (
    <section className="rcal bleed" aria-label={`Upcoming festival: ${name}`}>
      <div className="rcal-in">
        <div className="rcal-head">
          <span className="rcal-eyebrow">
            <span className="rcal-spark" aria-hidden="true" />The ritual calendar
          </span>
          <h2 className="rcal-name serif">
            <span className="rcal-deva sa-deva">{nameDeva}</span>
            {name}
          </h2>
          <p className="rcal-tag">{tagline}</p>
          <div className="rcal-when">
            <span className="rcal-count">{when}</span>
            <span className="rcal-date">{dateLabel}</span>
            {tithi && <span className="rcal-tithi">{tithi}</span>}
          </div>
        </div>

        {picks.length > 0 && (
          <div className="rcal-picks">
            <span className="rcal-picks-lbl">Placed &amp; gifted for the occasion</span>
            <ul className="rcal-list">
              {picks.slice(0, 3).map((pk) => (
                <li key={pk.slug}>
                  <Link href={`/collection/${pk.slug}`} className="rcal-pick">
                    <span className="rcal-pick-name">{pk.name}</span>
                    <span className="rcal-pick-line">{pk.positioningLine}</span>
                    <span className="rcal-pick-foot">
                      <span className="rcal-pick-price">{pk.priceMinorFmt}</span>
                      <span className="rcal-pick-arw" aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
