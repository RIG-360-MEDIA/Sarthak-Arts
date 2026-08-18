import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HeroWebGL } from "@/components/hero/HeroWebGL";
import { SmoothScroll } from "@/components/hero/SmoothScroll";
import { MiniWheel } from "@/components/hero/MiniWheel";
import { getDirectionPage } from "@/lib/direction";
import "@/app/(storefront)/home.css";
import "../direction.css";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const page = await getDirectionPage(code);
  if (!page) return { title: "Direction — Sarthak Arts" };
  return {
    title: `${page.name} · ${page.sanskritName} — Vāstu Direction | Sarthak Arts`,
    description: `${page.governs}. ${page.microcopy}`,
  };
}

export default async function DirectionPage({ params }: Params) {
  const { code } = await params;
  const page = await getDirectionPage(code);
  if (!page) notFound();

  const isCenter = page.code === "center";
  const heading = isCenter
    ? "The center is not a direction — it is the pause."
    : `The ${page.name} wants ${page.governs.split(",")[0].toLowerCase()}.`;

  return (
    <div className="sa-home sa-direction bleed">
      <SmoothScroll />
      <HeroWebGL />

      <div className="sa-overlay">
        {/* Hero — education */}
        <section className="sa-dir-hero">
          <div className="sa-dir-hero-inner">
            <div className="sa-dir-crumbs">
              <Link href="/direction">The eight directions</Link>
              <span> · </span>
              <span>{page.name}</span>
            </div>
            <div className="sa-dir-hero-grid">
              <div className="sa-dir-hero-copy">
                <span className="sa-eyebrow">
                  {isCenter ? "Brahmasthan · the core" : `The ${page.name} · ${page.sanskritName}`}
                </span>
                <div className="sa-dir-deva" lang="sa">{page.deva}</div>
                <h1>{heading}</h1>
                <p className="sa-dir-microcopy">{page.microcopy}</p>
                <div className="sa-dir-facts">
                  {page.element && (
                    <div className="sa-dir-fact"><span className="lbl">Element</span><span className="val">{page.element}</span></div>
                  )}
                  <div className="sa-dir-fact"><span className="lbl">Governs</span><span className="val">{page.governs}</span></div>
                </div>
              </div>
              <div className="sa-dir-hero-wheel">
                <MiniWheel highlight={page.code} size={220} />
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="sa-section sa-section-solid" aria-labelledby="pieces">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Pieces built for this zone</span>
            <h2 id="pieces">
              {page.realProductCount > 0
                ? <>Made for the <em>{page.name}.</em></>
                : <>The <em>{page.name}</em> pieces are on the way.</>}
            </h2>
            <p className="sub">
              {page.products.length === 0
                ? "The workshop is finalizing the first pieces for this zone. Subscribe below and we'll write you the day they land."
                : page.realProductCount > 0
                  ? "Sample pieces are shown alongside — they'll be replaced as the workshop's own pieces for this direction arrive."
                  : "These sample pieces show the kind of work we're building for this zone. The workshop's own pieces are being finalized now."}
            </p>
          </div>

          {page.products.length === 0 ? (
            <div className="sa-dir-empty sa-reveal">
              <Link href="/#newsletter" className="sa-link-line">
                Notify me when they land →
              </Link>
            </div>
          ) : (
            <div className="sa-dir-pieces">
              {page.products.map((p) => {
                const compBits: string[] = [];
                if (p.primaryMetalName && p.primaryMetalWeightG != null)
                  compBits.push(`${p.primaryMetalName} · ${p.primaryMetalWeightG} g`);
                else if (p.primaryMetalName) compBits.push(p.primaryMetalName);
                return (
                  <Link key={p.slug} href={`/collection/${p.slug}`} className="sa-dir-piece sa-reveal">
                    <div className="sa-dir-piece-body">
                      {p.isSample && <span className="sa-piece-badge sample">Sample</span>}
                      {p.deityName && <div className="sa-dir-piece-deity">{p.deityName}</div>}
                      <div className="sa-dir-piece-name">{p.name}</div>
                      <p className="sa-dir-piece-line">{p.positioningLine}</p>
                      {compBits.length > 0 && <div className="sa-dir-piece-comp">{compBits.join(" · ")}</div>}
                      <div className="sa-dir-piece-foot">
                        <span className="sa-piece-price">{p.priceMinorFmt}</span>
                        <span className="sa-dir-piece-cta">See the piece →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Adjacent directions */}
        {(page.prev || page.next) && (
          <section className="sa-section" aria-labelledby="adjacent">
            <div className="sa-section-head sa-reveal">
              <span className="sa-eyebrow">Nearby zones</span>
              <h2 id="adjacent">The <em>{page.name}</em> is held between two neighbours.</h2>
            </div>
            <div className="sa-dir-adjacent">
              {page.prev && <AdjacentCard card={page.prev} label="Preceding" />}
              {page.next && <AdjacentCard card={page.next} label="Following" />}
            </div>
          </section>
        )}

        {/* Placement discipline — deferred honestly */}
        <section className="sa-section sa-section-solid" aria-labelledby="placement">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Placement discipline</span>
            <h2 id="placement">What this direction <em>wants and refuses.</em></h2>
            <p className="sub">
              A short guide — height, angle, what to face, what to avoid — written for the
              {" "}{page.name}{" "}by our resident Vāstu consultant. Coming shortly. If you
              need placement guidance now, a twenty-minute reading is the honest answer.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link href="/consultation" className="sa-link-line">
                Book a Vāstu reading →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdjacentCard({ card, label }: { card: NonNullable<Awaited<ReturnType<typeof getDirectionPage>>>["prev"]; label: string }) {
  if (!card) return null;
  return (
    <Link href={`/direction/${card.code}`} className="sa-dir-adjacent-card sa-reveal">
      <MiniWheel highlight={card.code} size={72} />
      <div>
        <div className="sa-eyebrow">{label}</div>
        <div className="sa-dir-adjacent-name">{card.name} · {card.sanskritName}</div>
        <div className="sa-dir-adjacent-microcopy">{card.microcopy}</div>
      </div>
    </Link>
  );
}
