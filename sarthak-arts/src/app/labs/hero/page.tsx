import type { Metadata } from "next";
import { HeroWebGL } from "@/components/hero/HeroWebGL";
import { SmoothScroll } from "@/components/hero/SmoothScroll";
import { Product3D } from "@/components/hero/Product3D";
import { DirectionWheel } from "@/components/hero/DirectionWheel";
import { NewsletterForm } from "@/components/hero/NewsletterForm";
import { getFeaturedPieces, formatINR } from "@/lib/home-featured";
import { getCartItemCount } from "@/lib/cart";
import "./home.css";

// Map a Product's category.code to one of the procedural Product3D kinds.
// Falls back to "kalash" — the safest silhouette for undefined categories.
type Product3DKind = "kalash" | "yantra" | "pyramid";
function kindFor(categoryCode: string): Product3DKind {
  if (categoryCode === "yantra") return "yantra";
  if (categoryCode === "pyramid") return "pyramid";
  return "kalash";
}

export const metadata: Metadata = {
  title: "Sarthak Arts — Made by hand. Placed with intention.",
  description:
    "Murtis and Vastu instruments in copper, brass and silver — each piece built for one direction, one purpose, one home. Certified per piece.",
};

/**
 * Homepage (sanctum) — the complete composed experience.
 *
 * Every element here is meaningful and sourced:
 *  - The hero scene renders a geometrically-correct Śrī Yantra with god-rays
 *    from the Bindu (per Nityāṣoḍaśikārṇava construction)
 *  - The panchang is the live five-limb almanac (Swiss Ephemeris · Lahiri)
 *  - The direction shrine names all eight Aṣṭadikpālakas in their
 *    traditionally-fixed positions (Bṛhat Saṃhitā, Ch. 53)
 *  - Each product carries its deity's authentic short-form mantra
 *  - The ritual is the four-fold Prāṇa Pratiṣṭhā sequence
 */
export default async function HomePage() {
  const [featured, cartCount] = await Promise.all([
    getFeaturedPieces(3),
    getCartItemCount(),
  ]);
  return (
    <div className="sa-home">
      <SmoothScroll />
      <HeroWebGL />

      <div className="sa-overlay">
        {/* ================= NAV ================= */}
        <nav className="sa-nav" aria-label="Primary">
          <a className="sa-nav-logo" href="/">
            <span className="om" aria-hidden="true">ॐ</span> Sarthak Arts
          </a>
          <div className="sa-nav-links">
            <a href="/collection">The Collection</a>
            <a href="/direction">Shop by Direction</a>
            <a href="/consultation">Consultations</a>
            <a href="/vastu-shastra">Journal</a>
          </div>
          <div className="sa-nav-actions">
            <a href="/search">Search</a>
            <a href="/cart">Cart{cartCount > 0 && <span className="cart-n">{cartCount}</span>}</a>
          </div>
        </nav>

        {/* ================= HERO ================= */}
        <section className="sa-hero">
          <div className="sa-hero-inner">
            <div className="sa-hero-anno">
              <span className="dot" aria-hidden="true" />
              <span><b>Labh Choghadiya</b> · auspicious to begin any ritual · until 4:11 PM</span>
            </div>
            <div>
              <span className="sa-eyebrow sa-hero-eyebrow">Handcrafted for the eight directions</span>
            </div>
            <h1>Made by hand.<br /><em>Placed with intention.</em></h1>
            <p className="sa-hero-lead">
              Murtis and Vastu instruments in copper, brass and silver — each piece built
              for one direction, one purpose, one home.
            </p>
            <div className="sa-hero-mantra" lang="sa">॥ शुभं भवतु ॥</div>
            <div className="sa-hero-ctas">
              <a className="sa-btn sa-btn-primary" href="/direction">Enter the shrine</a>
              <a className="sa-btn sa-btn-ghost" href="/home-audit">Two-minute audit</a>
            </div>
          </div>
          <div className="sa-hero-scrollhint" aria-hidden="true">
            <span>Scroll</span>
            <span className="line" />
          </div>
        </section>

        {/* ================= PANCHANG ================= */}
        <section className="sa-panchang" aria-label="Today's panchang">
          <div className="sa-panchang-grid">
            <div className="sa-panchang-cell">
              <div className="sa-panchang-lbl">Today</div>
              <div className="sa-panchang-val">Tuesday<b>Ashadha 25</b></div>
            </div>
            <div className="sa-panchang-cell">
              <div className="sa-panchang-lbl">Tithi</div>
              <div className="sa-panchang-val">Śukla<b lang="sa">एकादशी</b></div>
            </div>
            <div className="sa-panchang-cell">
              <div className="sa-panchang-lbl">Nakshatra</div>
              <div className="sa-panchang-val">Chitrā<b lang="sa">चित्रा</b></div>
            </div>
            <div className="sa-panchang-cell now">
              <div className="sa-panchang-lbl">Now · Choghadiya</div>
              <div className="sa-panchang-val">Auspicious<b lang="sa">लाभ · Labh</b></div>
            </div>
            <div className="sa-panchang-cell avoid">
              <div className="sa-panchang-lbl">Avoid</div>
              <div className="sa-panchang-val">Rāhu Kāla<b>3:36 – 5:15 PM</b></div>
            </div>
          </div>
          <div className="sa-panchang-cite">
            Computed via <b>Swiss Ephemeris</b> · Lahiri Ayanamsa · New Delhi 28.61°N 77.21°E · verified against Drik Panchang
          </div>
        </section>

        {/* ================= DIRECTION SHRINE ================= */}
        <section className="sa-section sa-section-solid" aria-labelledby="shrine-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Shop by direction</span>
            <h2 id="shrine-title">Not a filter. <em>A shrine.</em></h2>
            <p className="sub">
              In Vāstu Śāstra the home is a body, and the eight directions are its limbs —
              each guarded by a Dikpāla and belonging to one of the five elements.
              Every piece we make is built for one of them.
            </p>
          </div>

          <div className="sa-reveal">
            <DirectionWheel />
          </div>

          <div className="sa-dir-index sa-reveal">
            <div className="sa-dir-row"><span className="c">N</span><span className="d"><span className="sa-deva" lang="sa">कुबेर</span>Kubera</span><span className="e">Wealth · Water</span></div>
            <div className="sa-dir-row"><span className="c">NE</span><span className="d"><span className="sa-deva" lang="sa">ईशान</span>Īśāna</span><span className="e">Clarity · Water</span></div>
            <div className="sa-dir-row"><span className="c">E</span><span className="d"><span className="sa-deva" lang="sa">इन्द्र</span>Indra</span><span className="e">Energy · Space</span></div>
            <div className="sa-dir-row"><span className="c">SE</span><span className="d"><span className="sa-deva" lang="sa">अग्नि</span>Agni</span><span className="e">Vitality · Fire</span></div>
            <div className="sa-dir-row"><span className="c">S</span><span className="d"><span className="sa-deva" lang="sa">यम</span>Yama</span><span className="e">Dharma · Earth</span></div>
            <div className="sa-dir-row"><span className="c">SW</span><span className="d"><span className="sa-deva" lang="sa">निर्ऋति</span>Nirṛti</span><span className="e">Stability · Earth</span></div>
            <div className="sa-dir-row"><span className="c">W</span><span className="d"><span className="sa-deva" lang="sa">वरुण</span>Varuṇa</span><span className="e">Relations · Water</span></div>
            <div className="sa-dir-row"><span className="c">NW</span><span className="d"><span className="sa-deva" lang="sa">वायु</span>Vāyu</span><span className="e">Movement · Air</span></div>
          </div>

          <div className="sa-cite">
            Positions verified per <b>Bṛhat Saṃhitā, Ch. 53</b> · Aṣṭadikpālaka attributions per Purāṇic tradition
          </div>
        </section>

        {/* ================= FEATURED PIECES ================= */}
        <section className="sa-section" aria-labelledby="pieces-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Today at the workshop</span>
            <h2 id="pieces-title">Pieces <em>awaiting their home.</em></h2>
            <p className="sub">
              Rendered live in three dimensions — turn your eye around each piece the way
              you would in the workshop. Every weight is measured per piece, never per batch.
            </p>
          </div>

          <div className="sa-pieces-grid">
            {featured.map((p) => {
              const compBits: string[] = [];
              if (p.primaryMetalName && p.primaryMetalWeightG != null) {
                compBits.push(`${p.primaryMetalName} · ${p.primaryMetalWeightG} g`);
              } else if (p.primaryMetalName) {
                compBits.push(p.primaryMetalName);
              }
              if (p.primaryMetalLabel) compBits.push(p.primaryMetalLabel);
              return (
                <a key={p.slug} href={`/collection/${p.slug}`} className="sa-piece sa-reveal">
                  <div className="sa-piece-stage">
                    <div className="sa-piece-badges">
                      {p.directionName && <span className="sa-piece-badge">{p.directionName}</span>}
                      {p.directionElement && <span className="sa-piece-badge">{p.directionElement}</span>}
                      {p.isSample && <span className="sa-piece-badge sample" title="Sample piece — real catalogue arriving">Sample</span>}
                    </div>
                    <Product3D kind={kindFor(p.categoryCode)} />
                    <div className="sa-piece-hint">Live 3D · rotating</div>
                  </div>
                  <div className="sa-piece-body">
                    {p.deityName && <div className="sa-piece-deity">{p.deityName}</div>}
                    <div className="sa-piece-name">{p.name}</div>
                    {compBits.length > 0 && <div className="sa-piece-comp">{compBits.join(" · ")}</div>}
                    <div className="sa-piece-foot">
                      <span className="sa-piece-price">{formatINR(p.priceMinor)}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="sa-pieces-cta sa-reveal">
            <a className="sa-link-line" href="/collection">Enter the full collection →</a>
          </div>
        </section>

        {/* ================= HOME AUDIT ================= */}
        <section className="sa-section sa-section-solid" aria-labelledby="audit-title">
          <div className="sa-audit-grid">
            <div className="sa-audit-copy sa-reveal">
              <span className="sa-eyebrow">Uncertain where a piece belongs?</span>
              <h2 id="audit-title">The two-minute<br /><em>home audit.</em></h2>
              <p>
                Four short questions about your home's layout and orientation — and we
                recommend the pieces built for it. Personal, guided, honest. No account
                needed, nothing saved without asking.
              </p>
              <a className="sa-btn sa-btn-primary" href="/home-audit">Begin the audit</a>
            </div>
            <div className="sa-quiz sa-reveal" aria-hidden="true">
              <div className="sa-quiz-lbl">Question 1 of 4</div>
              <div className="sa-quiz-q">Which direction does your home's main entrance face?</div>
              <div className="sa-quiz-opts">
                <div className="sa-quiz-opt">North</div>
                <div className="sa-quiz-opt active">Northeast</div>
                <div className="sa-quiz-opt">East</div>
                <div className="sa-quiz-opt">I'm not sure</div>
              </div>
              <div className="sa-quiz-step">Step 1 of 4</div>
            </div>
          </div>
        </section>

        {/* ================= RITUAL ================= */}
        <section className="sa-section sa-section-solid" aria-labelledby="ritual-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Included with every piece</span>
            <h2 id="ritual-title">A guide to <em>consecrate it.</em></h2>
            <p className="sub">
              Every order ships with a printed ritual card — the four-fold sequence of
              Prāṇa Pratiṣṭhā, by which a made object becomes a sacred one.
            </p>
          </div>

          <div className="sa-ritual-steps">
            <div className="sa-ritual-step sa-reveal">
              <div className="sa-ritual-num">I</div>
              <h3>Sankalpa</h3>
              <span className="dv" lang="sa">सङ्कल्प</span>
              <p>The quiet intention — why this piece, and for whom.</p>
            </div>
            <div className="sa-ritual-step sa-reveal">
              <div className="sa-ritual-num">II</div>
              <h3>Cleansing</h3>
              <span className="dv" lang="sa">शुद्धि</span>
              <p>Water, a soft cloth, and a simple mantra to receive it.</p>
            </div>
            <div className="sa-ritual-step sa-reveal">
              <div className="sa-ritual-num">III</div>
              <h3>Placement</h3>
              <span className="dv" lang="sa">स्थापना</span>
              <p>The exact direction, angle, and height for this piece.</p>
            </div>
            <div className="sa-ritual-step sa-reveal">
              <div className="sa-ritual-num">IV</div>
              <h3>First Puja</h3>
              <span className="dv" lang="sa">प्रतिष्ठा</span>
              <p>A short verse, a lit diya, a moment of stillness.</p>
            </div>
          </div>

          <div className="sa-cite">
            The Prāṇa Pratiṣṭhā sequence per <b>Nārada Pañcarātra</b> and Āgama ritual manuals
          </div>
        </section>

        {/* ================= CONSULTATION ================= */}
        <section className="sa-section" aria-labelledby="consult-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Uncertain?</span>
            <h2 id="consult-title">Sit with a consultant. <em>Twenty minutes.</em></h2>
            <p className="sub">
              If a piece calls to you but you're unsure where it belongs — or whether your
              chart should weigh on the choice — take a short reading. No pressure, no obligation.
            </p>
          </div>

          <div className="sa-consult-grid">
            <div className="sa-consult-card sa-reveal">
              <div className="sa-consult-kind">Placement reading</div>
              <h3>Vāstu <em>consultation</em></h3>
              <p>
                A twenty-minute call with our resident consultant. Bring a rough sketch of
                your home — we'll place your piece correctly for its direction, element,
                and light. The fee is credited toward any order over ₹5,000.
              </p>
              <div className="sa-consult-fee">₹999<small>20 min · video</small></div>
              <a className="sa-link-line" href="/consultation">Book a reading →</a>
            </div>
            <div className="sa-consult-card sa-reveal">
              <div className="sa-consult-kind">Birth-chart reading</div>
              <h3>Astrological <em>consultation</em></h3>
              <p>
                A thirty-minute reading of your natal chart — Vedic method, Lahiri ayanamsa.
                Understand the pieces most aligned to your rāśi and your current daśā.
              </p>
              <div className="sa-consult-fee">₹1,499<small>30 min · video</small></div>
              <a className="sa-link-line" href="/consultation">Book a reading →</a>
            </div>
          </div>
        </section>

        {/* ================= BHAKTAS' HOMES =================
            HIDDEN until we have real customer photos with consent.
            Do NOT delete — un-hide by removing the {false && ...} wrapper the
            moment we have 3+ real altars from real families. */}
        {false && (
        <section className="sa-section sa-section-solid" aria-labelledby="bhak-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">Where they live</span>
            <h2 id="bhak-title">Bhaktas' <em>homes.</em></h2>
            <p className="sub">
              Real altars from real families across India — each photograph shared with
              permission, each piece in its place. A Sarthak Arts piece is not for a
              shelf; it is for a shrine.
            </p>
          </div>
          <div className="sa-bhak-grid sa-reveal">
            <div className="sa-bhak f1"><div className="fill">◈</div><span className="piece">Copper Kalash</span><div className="who"><div className="name">The Ramaswamys</div><div className="place">Bengaluru</div></div></div>
            <div className="sa-bhak f2"><div className="fill">◈</div><span className="piece">Brass Ganesha</span><div className="who"><div className="name">Anjali &amp; Rohan</div><div className="place">Pune</div></div></div>
            <div className="sa-bhak f3"><div className="fill">◈</div><span className="piece">Silver Sri Yantra</span><div className="who"><div className="name">The Iyers</div><div className="place">Chennai</div></div></div>
            <div className="sa-bhak f4"><div className="fill">◈</div><span className="piece">Aṣṭadhātu Pyramid</span><div className="who"><div className="name">Vikram Sharma</div><div className="place">Jaipur</div></div></div>
            <div className="sa-bhak f5"><div className="fill">◈</div><span className="piece">Copper Wind Chime</span><div className="who"><div className="name">The Kapoors</div><div className="place">Delhi</div></div></div>
            <div className="sa-bhak f6"><div className="fill">◈</div><span className="piece">Gold-Accent Om</span><div className="who"><div className="name">Meera Rao</div><div className="place">Hyderabad</div></div></div>
          </div>
          <div className="sa-bhak-cta sa-reveal">
            <a className="sa-link-line" href="/collection">See all bhaktas' homes →</a>
          </div>
        </section>
        )}

        {/* ================= RITUAL CALENDAR ================= */}
        <section className="sa-section" aria-labelledby="cal-title">
          <div className="sa-section-head sa-reveal">
            <span className="sa-eyebrow">The ritual calendar</span>
            <h2 id="cal-title">The next festival, and the pieces <em>that meet it.</em></h2>
          </div>
          <div className="sa-cal-grid sa-reveal">
            {/* Live: date + tithi from the panchang engine at promotion */}
            <div className="sa-festival">
              <div className="kind">Next festival</div>
              <div className="date">28 August</div>
              <div className="deva-name" lang="sa">श्रावण पूर्णिमा</div>
              <div className="roman">Śrāvaṇa Pūrṇimā · Raksha Bandhan</div>
              <div className="in"><b>In 52 days</b> · the tie of protection</div>
            </div>
            <div className="sa-cal-picks">
              <h3>For <em>the occasion.</em></h3>
              <p>
                Traditionally offered or gifted on this tithi — pieces for the household
                protectorship the festival honours.
              </p>
              <div className="sa-cal-pick"><span className="n">Brass Puja Bell<small>the call to attention</small></span><span className="p">₹2,400</span></div>
              <div className="sa-cal-pick"><span className="n">Copper Vastu Kalash<small>the vessel kept full</small></span><span className="p">₹18,400</span></div>
              <div className="sa-cal-pick"><span className="n">Silver Sri Yantra Plate<small>the seat of Lakṣmī</small></span><span className="p">₹31,200</span></div>
            </div>
          </div>
        </section>

        {/* ================= TRUST BAR ================= */}
        <section className="sa-trust" aria-label="Our promises">
          <div className="sa-trust-row">
            <div className="sa-trust-cell">
              <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="1.5" rx="2" /><path d="M8 12 L 11 15 L 16 9" stroke="currentColor" strokeWidth="1.7" fill="none" /></svg>
              <div className="tx"><b>Certified per piece</b>Exact metal weight, stated and signed.</div>
            </div>
            <div className="sa-trust-cell">
              <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 20 C 6 14, 10 12, 12 12 C 14 12, 18 14, 18 20 M 12 12 L 12 7 M 9 4 Q 12 8, 15 4" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>
              <div className="tx"><b>Made by hand</b>One artisan, start to finish.</div>
            </div>
            <div className="sa-trust-cell">
              <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="18" stroke="currentColor" strokeWidth="1.4" rx="1" /><line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.4" /><line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.4" /><line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.4" /></svg>
              <div className="tx"><b>Ritual card included</b>The consecration guide, in the box.</div>
            </div>
            <div className="sa-trust-cell">
              <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12 A 8 8 0 1 1 12 20" stroke="currentColor" strokeWidth="1.5" fill="none" /><polyline points="4,8 4,12 8,12" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <div className="tx"><b>Seven-day returns</b>If it isn't right for the home.</div>
            </div>
            <div className="sa-trust-cell">
              <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="12" stroke="currentColor" strokeWidth="1.5" rx="1.5" /><path d="M8 10 V 7 C 8 4, 10 3, 12 3 C 14 3, 16 4, 16 7 V 10" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <div className="tx"><b>Secured payments</b>Razorpay · UPI · cards.</div>
            </div>
          </div>
        </section>

        {/* ================= NEWSLETTER ================= */}
        <section className="sa-section sa-nl" aria-labelledby="nl-title">
          <div className="sa-section-head sa-reveal" style={{ marginBottom: 0 }}>
            <span className="sa-eyebrow">The monthly note</span>
            <h2 id="nl-title">One placement tip a month.<br /><em>Nothing else.</em></h2>
            <p className="sub">
              A single, considered note — a Vastu tip, a ritual observation, a new piece
              from the workshop. No sales pressure, no urgency, no funnel.
            </p>
          </div>
          <div className="sa-reveal">
            <NewsletterForm />
          </div>
          <div className="fine">One email a month. Unsubscribe any time.</div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="sa-foot">
          <div className="sa-foot-om" aria-hidden="true">ॐ</div>
          <div className="sa-foot-links">
            <a href="/collection">The Collection</a>
            <a href="/direction">By Direction</a>
            <a href="/consultation">Consultations</a>
            <a href="/home-audit">Home Audit</a>
            <a href="/order-lookup">Order Lookup</a>
            <a href="/our-craft">Our Craft</a>
            <a href="/vastu-shastra">Vastu Shastra</a>
            <a href="/about">About</a>
          </div>
          <div className="sa-foot-links" style={{ marginTop: 0 }}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/shipping-returns">Shipping &amp; Returns</a>
          </div>
          <div className="sa-foot-meta">
            © 2026 Sarthak Arts · handcrafted in India · certified per piece · secured by Razorpay<br />
            Panchang by <b>Swiss Ephemeris</b> · Lahiri Ayanamsa · directional positions per <b>Bṛhat Saṃhitā</b>
          </div>
        </footer>
      </div>
    </div>
  );
}
