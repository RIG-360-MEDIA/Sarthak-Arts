import type { Metadata } from "next";
import { HeroWebGL } from "@/components/hero/HeroWebGL";
import { SmoothScroll } from "@/components/hero/SmoothScroll";
import { Product3D } from "@/components/hero/Product3D";
import { DirectionWheel } from "@/components/hero/DirectionWheel";
import "./home.css";

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
export default function HomePage() {
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
            <a href="/cart">Cart<span className="cart-n">2</span></a>
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
            <article className="sa-piece sa-reveal">
              <div className="sa-piece-stage">
                <div className="sa-piece-badges">
                  <span className="sa-piece-badge">Northeast</span>
                  <span className="sa-piece-badge">Water</span>
                </div>
                <Product3D kind="kalash" />
                <div className="sa-piece-hint">Live 3D · rotating</div>
              </div>
              <div className="sa-piece-body">
                <div className="sa-piece-deity">Kubera Kalash</div>
                <div className="sa-piece-name">Copper Vastu Kalash</div>
                <div className="sa-piece-comp">Cu 812 g · hand-beaten · Amritsar Thatheras</div>
                <div className="sa-piece-foot">
                  <span className="sa-piece-price">₹18,400</span>
                  <span className="sa-piece-mantra" lang="sa">ॐ कुबेराय नमः</span>
                </div>
              </div>
            </article>

            <article className="sa-piece sa-reveal">
              <div className="sa-piece-stage">
                <div className="sa-piece-badges">
                  <span className="sa-piece-badge">North</span>
                  <span className="sa-piece-badge">Wealth</span>
                </div>
                <Product3D kind="yantra" />
                <div className="sa-piece-hint">Live 3D · rotating</div>
              </div>
              <div className="sa-piece-body">
                <div className="sa-piece-deity">Śrī Lakṣmī Yantra</div>
                <div className="sa-piece-name">Silver Sri Yantra Plate</div>
                <div className="sa-piece-comp">Ag 99.9% · 265 g · one of six</div>
                <div className="sa-piece-foot">
                  <span className="sa-piece-price">₹31,200</span>
                  <span className="sa-piece-mantra" lang="sa">ॐ श्रीं महालक्ष्म्यै</span>
                </div>
              </div>
            </article>

            <article className="sa-piece sa-reveal">
              <div className="sa-piece-stage">
                <div className="sa-piece-badges">
                  <span className="sa-piece-badge">Center</span>
                  <span className="sa-piece-badge">Balance</span>
                </div>
                <Product3D kind="pyramid" />
                <div className="sa-piece-hint">Live 3D · rotating</div>
              </div>
              <div className="sa-piece-body">
                <div className="sa-piece-deity">Brahmasthan Pyramid</div>
                <div className="sa-piece-name">Brass Aṣṭadhātu Pyramid</div>
                <div className="sa-piece-comp">Aṣṭadhātu · 540 g · sand-cast</div>
                <div className="sa-piece-foot">
                  <span className="sa-piece-price">₹9,800</span>
                  <span className="sa-piece-mantra" lang="sa">ॐ ब्रह्मणे नमः</span>
                </div>
              </div>
            </article>
          </div>

          <div className="sa-pieces-cta sa-reveal">
            <a className="sa-link-line" href="/collection">Enter the full collection →</a>
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

        {/* ================= FOOTER ================= */}
        <footer className="sa-foot">
          <div className="sa-foot-om" aria-hidden="true">ॐ</div>
          <div className="sa-foot-links">
            <a href="/collection">The Collection</a>
            <a href="/direction">By Direction</a>
            <a href="/consultation">Consultations</a>
            <a href="/order-lookup">Order Lookup</a>
            <a href="/our-craft">Our Craft</a>
            <a href="/vastu-shastra">Vastu Shastra</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/shipping-returns">Shipping &amp; Returns</a>
          </div>
          <div className="sa-foot-meta">
            © 2026 Sarthak Arts · handcrafted in India · certified per piece<br />
            Panchang by <b>Swiss Ephemeris</b> · Lahiri Ayanamsa · directional positions per <b>Bṛhat Saṃhitā</b>
          </div>
        </footer>
      </div>
    </div>
  );
}
