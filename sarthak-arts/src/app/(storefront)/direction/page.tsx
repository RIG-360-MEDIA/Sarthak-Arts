import type { Metadata } from "next";
import Link from "next/link";
import { HeroWebGL } from "@/components/hero/HeroWebGL";
import { SmoothScroll } from "@/components/hero/SmoothScroll";
import { MiniWheel } from "@/components/hero/MiniWheel";
import { getAllDirections } from "@/lib/direction";
import "../home.css";
import "./direction.css";

export const metadata: Metadata = {
  title: "Shop by Direction — The Eight Vāstu Zones | Sarthak Arts",
  description:
    "In Vāstu Śāstra the home is a body, and the eight directions are its limbs — each guarded by a Dikpāla and belonging to one of the five elements.",
};

export default async function DirectionIndexPage() {
  const dirs = await getAllDirections();
  const cardinals = dirs.filter((d) => d.code !== "center");
  const center = dirs.find((d) => d.code === "center") ?? null;

  return (
    <div className="sa-home sa-direction bleed">
      <SmoothScroll />
      <HeroWebGL />

      <div className="sa-overlay">
        <section className="sa-dir-index-hero">
          <div className="sa-dir-hero-inner">
            <span className="sa-eyebrow">Shop by direction</span>
            <h1>Eight limbs of your home. <em>One shrine for each.</em></h1>
            <p className="sa-dir-microcopy">
              In Vāstu Śāstra the home is a body, and the eight directions are its
              limbs — each guarded by a Dikpāla and belonging to one of the five
              elements. Every piece we make is built for one of them.
            </p>
          </div>
        </section>

        <section className="sa-section" aria-labelledby="grid">
          <h2 id="grid" className="sa-visually-hidden">All directions</h2>
          <div className="sa-dir-grid">
            {cardinals.map((d) => (
              <Link key={d.code} href={`/direction/${d.code}`} className="sa-dir-tile sa-reveal">
                <MiniWheel highlight={d.code} size={110} />
                <div className="sa-dir-tile-body">
                  <div className="sa-eyebrow">{d.name} · {d.sanskritName}</div>
                  <div className="sa-dir-tile-deva" lang="sa">{d.deva}</div>
                  <div className="sa-dir-tile-governs">{d.governs}</div>
                  <div className="sa-dir-tile-count">
                    {d.realProductCount > 0
                      ? `${d.realProductCount} real · ${d.productCount - d.realProductCount} sample`
                      : d.productCount > 0
                        ? `${d.productCount} sample`
                        : "coming shortly"}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {center && (
            <div className="sa-dir-center-band">
              <Link href={`/direction/${center.code}`} className="sa-dir-tile sa-dir-tile-center sa-reveal">
                <MiniWheel highlight="center" size={110} />
                <div className="sa-dir-tile-body">
                  <div className="sa-eyebrow">Brahmasthan · the pause</div>
                  <div className="sa-dir-tile-deva" lang="sa">{center.deva}</div>
                  <div className="sa-dir-tile-governs">{center.governs}</div>
                  <p className="sub">{center.microcopy}</p>
                </div>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
