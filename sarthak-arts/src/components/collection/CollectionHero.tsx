"use client";

/**
 * Collection hero — real WebGL build.
 *
 * Wraps MandalaWebGL (the fixed background) with the actual foreground
 * UI: headline, the five real seeded products as interactive cards, and
 * a direction filter. Hover/wishlist/filter state lives here and flows
 * down to the 3D scene, so the gem zones respond to real interaction —
 * not a simulated one.
 *
 * Data is a static stand-in matching the real seed exactly (see
 * prisma/seed.ts) so the visual/interaction design can be judged before
 * wiring this page to live Prisma data — that wiring is the next step
 * once this is approved, not a placeholder to ship as-is.
 */

import { useState } from "react";
import { VimanaWebGL, type MandalaZone } from "./VimanaWebGL";
import { INVOCATIONS } from "./invocations";
import { InvocationPanel } from "./InvocationPanel";
import { PANCHANG_UNAVAILABLE, type PanchangFlags } from "./panchang-flags";

interface RealProduct {
  id: string;
  name: string;
  zone: MandalaZone;
  directionLabel: string;
  gemLabel: string;
  price: string;
  composition: string;
}

const REAL_PRODUCTS: RealProduct[] = [
  { id: "kalash", name: "Copper Vastu Kalash", zone: "NE", directionLabel: "Northeast · Ishanya", gemLabel: "Blue sapphire", price: "₹8,400", composition: "420g copper · one blue sapphire" },
  { id: "yantra", name: "Silver Sri Yantra Plate", zone: "N", directionLabel: "North · Uttara", gemLabel: "Ruby", price: "₹12,600", composition: "180g silver · ruby at the bindu" },
  { id: "om", name: "Gold-Accent Om Wall Panel", zone: "E", directionLabel: "East · Purva", gemLabel: "Turquoise", price: "₹18,900", composition: "510g brass, 2.5g gold overlay · turquoise inlay" },
  { id: "chime", name: "Copper-Brass Wind Chime", zone: "NW", directionLabel: "Northwest · Vayavya", gemLabel: "Amethyst", price: "₹6,200", composition: "260g copper, 180g brass · amethyst cluster" },
  { id: "pyramid", name: "Brass Ashtadhatu Pyramid", zone: "C", directionLabel: "Center · Brahmasthan", gemLabel: "Clear quartz", price: "₹14,900", composition: "640g brass alloy · clear quartz apex" },
];

// What each direction MEANS in Vastu Shastra — its guardian deity
// (Aṣṭadikpāla), element, the domain of life it governs, and the one-line
// truth of it. Sourced from the Bṛhat Saṃhitā tradition + the brand copy.
interface DirectionMeaning {
  sanskrit: string;
  deity: string;
  element: string;
  governs: string;
  line: string;
}
const DIRECTION_MEANING: Record<MandalaZone, DirectionMeaning> = {
  NE: { sanskrit: "Īśānya", deity: "Īśāna · Śiva", element: "Jala · Water", governs: "Clarity & spiritual grounding", line: "Keep water moving here, and clarity follows." },
  N: { sanskrit: "Uttara", deity: "Kubera", element: "—", governs: "Wealth & career flow", line: "The zone most linked to career and cash flow." },
  NW: { sanskrit: "Vāyavya", deity: "Vāyu", element: "Vāyu · Air", governs: "Support, relationships & movement", line: "Where support from others either flows or stalls." },
  W: { sanskrit: "Paścima", deity: "Varuṇa", element: "Ākāśa · Space", governs: "Gains & creativity", line: "Governs how gains settle, not just how they arrive." },
  C: { sanskrit: "Brahmasthāna", deity: "Brahmā", element: "Ākāśa · Space", governs: "Balance for every zone", line: "The open core of the home — kept light, kept clear." },
  E: { sanskrit: "Pūrva", deity: "Indra", element: "Vāyu · Air", governs: "New beginnings & health", line: "The direction that sets the tone for the day." },
  SE: { sanskrit: "Āgneya", deity: "Agni", element: "Agni · Fire", governs: "Finance, energy & the hearth", line: "Fire and finance share a corner." },
  S: { sanskrit: "Dakṣiṇa", deity: "Yama", element: "Agni · Fire", governs: "Recognition & reputation", line: "What your home says before a guest sits down." },
  SW: { sanskrit: "Nairṛtya", deity: "Nirṛti", element: "Pṛthvī · Earth", governs: "Stability & relationships", line: "The anchor corner — weight goes here, not air." },
};

export interface CollectionHeroProps {
  /** Panchang flags from the server. When absent, defaults to
   *  PANCHANG_UNAVAILABLE — the scene simply drops its cosmic-time
   *  acknowledgment layer, never fabricates a value. */
  panchang?: PanchangFlags;
}

export function CollectionHero({ panchang = PANCHANG_UNAVAILABLE }: CollectionHeroProps = {}) {
  const [hoveredZone, setHoveredZone] = useState<MandalaZone | null>(null);
  const [wishedZones, setWishedZones] = useState<Set<MandalaZone>>(new Set());
  const [filterZone, setFilterZone] = useState<MandalaZone | null>(null);

  function toggleWish(zone: MandalaZone) {
    setWishedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
  }

  return (
    <section className="collection-hero-real">
      <VimanaWebGL hoveredZone={hoveredZone} wishedZones={wishedZones} filterZone={filterZone} panchang={panchang} />

      <div className="collection-hero-real__content">
        <p className="collection-hero-real__eyebrow">Vastu Purusha Mandala · Sandhya Aarti</p>
        <h1 className="collection-hero-real__title">
          Made by hand. <em>Placed with intention.</em>
        </h1>
        <p className="collection-hero-real__lede">
          Every piece is built for one direction of the Vastu Purusha Mandala,
          set with its own certified gemstone — nothing decorative first.
        </p>

        <div className="collection-hero-real__filters">
          <button
            className={filterZone === null ? "chip chip--active" : "chip"}
            onClick={() => setFilterZone(null)}
          >
            All directions
          </button>
          {REAL_PRODUCTS.map((p) => (
            <button
              key={p.zone}
              className={filterZone === p.zone ? "chip chip--active" : "chip"}
              onClick={() => setFilterZone(filterZone === p.zone ? null : p.zone)}
            >
              {p.zone}
            </button>
          ))}
        </div>

        {/* No text panel for filled invocations — the direction's meaning is
            expressed VISUALLY by the InvocationScene behind, the blessed
            card, and the atmospheric shift. For directions whose invocation
            hasn't been authored yet we keep the lightweight fallback so the
            page still has some info per pick until they land. */}
        {filterZone && !INVOCATIONS[filterZone].filled && (
          <div className="direction-meaning" key={filterZone} data-zone={filterZone}>
            <div className="direction-meaning__sanskrit">
              {DIRECTION_MEANING[filterZone].sanskrit}
              <span className="direction-meaning__deity"> · {DIRECTION_MEANING[filterZone].deity}</span>
            </div>
            <div className="direction-meaning__governs">{DIRECTION_MEANING[filterZone].governs}</div>
            <div className="direction-meaning__line">“{DIRECTION_MEANING[filterZone].line}”</div>
            <div className="direction-meaning__element">{DIRECTION_MEANING[filterZone].element}</div>
          </div>
        )}

        <div className="collection-hero-real__grid">
          {REAL_PRODUCTS.map((p) => {
            const isWished = wishedZones.has(p.zone);
            // Card is "blessed" when the invoked direction is this card's
            // direction; dimmed when another filled invocation is active.
            // Unfilled invocations don't dim anything — we don't want
            // side-effects until the direction's real content lands.
            const activeIsFilled = filterZone && INVOCATIONS[filterZone].filled;
            const blessed = activeIsFilled && filterZone === p.zone;
            const dimmed = activeIsFilled && filterZone !== p.zone;
            const cardClass =
              "collection-hero-real__card" +
              (blessed ? " collection-hero-real__card--blessed" : "") +
              (dimmed  ? " collection-hero-real__card--dimmed"  : "");
            return (
              <div
                key={p.id}
                className={cardClass}
                data-zone={p.zone}
                onMouseEnter={() => setHoveredZone(p.zone)}
                onMouseLeave={() => setHoveredZone((z) => (z === p.zone ? null : z))}
              >
                <button
                  className={isWished ? "heart heart--active" : "heart"}
                  aria-label={isWished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                  onClick={() => toggleWish(p.zone)}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21 C 8 17 4 13.5 4 9 A 4 4 0 0 1 12 6 A 4 4 0 0 1 20 9 C 20 13.5 16 17 12 21 Z" />
                  </svg>
                </button>
                <div className="collection-hero-real__card-name">{p.name}</div>
                <div className="collection-hero-real__card-meta">
                  {p.directionLabel} · {p.gemLabel}
                </div>
                <div className="collection-hero-real__card-price">{p.price}</div>
                {hoveredZone === p.zone && (
                  <div className="collection-hero-real__card-comp">{p.composition}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
