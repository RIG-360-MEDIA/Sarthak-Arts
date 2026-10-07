import type { Metadata } from "next";
import Link from "next/link";
import "./consultation.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { freeSlots } from "@/lib/booking";
import { createBooking } from "./actions";
import { PieceDefs, PieceRender } from "@/components/collection/Piece";
import { OvalImage } from "./OvalImage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Vāstu Consultation — Private Expert Session | Sarthak Arts",
  description:
    "Book a private video consultation with a certified Vāstu expert. Get a placement plan for your home — the fee credits toward your handcrafted pieces.",
};

const IST = "Asia/Kolkata";
const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
const fmtShort = (d: Date) => d.toLocaleString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

const FAQS: [string, string][] = [
  ["What happens in a Vāstu consultation?",
   "A private one-to-one video session with a certified consultant who reviews your home's layout and its directions, then gives you a clear placement plan — which piece belongs in which corner, and why."],
  ["How is the fee credited toward my pieces?",
   "Orders over ₹15,000 include a free consultation credit — it's applied automatically when you book with the same email. Your time with an expert quite literally works toward the home you're building."],
  ["What should I have ready?",
   "A rough floor plan or sketch of your home helps, along with the directions (your phone's compass is enough). The more your consultant can see, the more precise the guidance."],
  ["Is the session really private?",
   "Yes — it's a confidential one-to-one video call. A call link is emailed to you before your slot. Your details are never shared."],
  ["Can I reschedule?",
   "If something comes up, reply to your confirmation email and we'll find you another time from the available slots."],
];

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const types = await prisma.consultationType.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const active = types.find((t) => t.code === type) ?? null;

  // Real next-available slot for the honest "next opening" pill.
  const nextSlot = await prisma.consultantAvailability.findFirst({
    where: { slotStart: { gt: new Date() }, consultant: { active: true } },
    orderBy: { slotStart: "asc" },
  });

  let slots: Date[] = [];
  if (active) {
    const [availability, bookings] = await Promise.all([
      prisma.consultantAvailability.findMany({ where: { consultant: { types: { some: { consultationTypeId: active.id } }, active: true } } }),
      prisma.booking.findMany({ where: { consultationTypeId: active.id, status: { not: "cancelled" } } }),
    ]);
    slots = freeSlots(availability.map((a) => a.slotStart), bookings.map((b) => b.slotStart), new Date());
  }

  // Group free slots by day for the chip picker.
  const byDay = new Map<string, Date[]>();
  for (const s of slots) {
    const k = fmtDay(s);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(s);
  }

  return (
    <div className="cons-root">
      {/* ── Hero (split: copy left, portrait ovals right) ── */}
      <header className="cons-hero bleed">
        <PieceDefs />
        <div className="cons-hero-grid">
          <div className="cons-hero-left">
            <span className="cons-live">
              <span className="dot" aria-hidden="true" />
              {nextSlot ? <>Next opening · <b>{fmtShort(nextSlot.slotStart)}</b> IST</> : <>Certified Vāstu consultant · book a session</>}
            </span>
            <h1>Vāstu guidance,<br /><em>placed with intention.</em></h1>
            <ul className="cons-checks">
              <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Private 1:1 video with a certified expert</li>
              <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>A placement plan for every corner</li>
              <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Fee credited toward your pieces</li>
            </ul>
            <a href="#choose" className="cons-hero-cta">Book a consultation
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <div className="cons-stats">
              <div className="cons-stat"><b>9</b><span>DIRECTIONS OF THE HOME</span></div>
              <div className="cons-stat"><b>1:1</b><span>PRIVATE VIDEO SESSION</span></div>
              <div className="cons-stat"><b>100%</b><span>CERTIFIED CRAFT</span></div>
              <div className="cons-stat"><b>24&times;7</b><span>BOOK ANYTIME</span></div>
            </div>
          </div>
          <div className="cons-hero-right">
            <div className="cons-oval">
              <PieceRender glyph="yantra" metalGrad="gSilver" gemHex="#B8863E" className="obj" />
              <OvalImage src="/consultants/1.jpg" alt="Vāstu consultant" />
            </div>
            <div className="cons-oval">
              <PieceRender glyph="kalash" metalGrad="gCopper" gemHex="#B8863E" className="obj" />
              <OvalImage src="/consultants/2.jpg" alt="Vāstu consultant" />
            </div>
            <div className="cons-oval">
              <PieceRender glyph="pyramid" metalGrad="gBrass" gemHex="#B8863E" className="obj" />
              <OvalImage src="/consultants/3.jpg" alt="Vāstu consultant" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Choose a consultation ── */}
      <section id="choose" className="cons-section">
        <span className="cons-kicker">Choose your session</span>
        <h2 className="cons-h">What would you like guidance on?</h2>
        <p className="cons-sub">Each session is a private video call with a certified consultant. Pick one to see available times.</p>
        {types.length === 0 ? (
          <p className="slot-empty">Consultations are being scheduled — please check back shortly.</p>
        ) : (
          <div className="ctype-grid">
            {types.map((t) => (
              <Link key={t.code} href={`/consultation?type=${t.code}#book`} className={`ctype${active?.code === t.code ? " on" : ""}`}>
                <div className="ctype-top">
                  <span className="ctype-name serif">{t.name}</span>
                  {t.creditsTowardOrder && <span className="ctype-credit">Credited</span>}
                </div>
                <p className="ctype-desc">{t.description}</p>
                <div className="ctype-meta">
                  <span className="ctype-dur">{t.durationMinutes} min · video</span>
                  <span className="ctype-fee">{formatMoney(t.feeMinor, "INR")}</span>
                </div>
                <div className="ctype-cta">{active?.code === t.code ? "Selected — book below ↓" : "Choose a time →"}</div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Booking panel ── */}
        {active && (
          <div id="book" className="cons-book">
            <form action={createBooking} className="cons-book-main">
              <input type="hidden" name="consultationTypeId" value={active.id} />
              <div className="cons-book-sel">{active.name} · {active.durationMinutes} min</div>
              <div className="cons-book-name serif">Reserve your time</div>

              <span className="cons-field-lbl">Choose a time</span>
              {slots.length === 0 ? (
                <p className="slot-empty">No open slots right now — please check back soon, or try another consultation.</p>
              ) : (
                <div className="slot-picker">
                  {[...byDay.entries()].map(([day, daySlots]) => (
                    <div key={day} className="slot-day">
                      <div className="slot-day-h">{day}</div>
                      <div className="slot-chips">
                        {daySlots.map((s) => (
                          <label key={s.toISOString()} className="slot-chip">
                            <input type="radio" name="slot" value={s.toISOString()} required />
                            <span>{fmtTime(s)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <span className="cons-field-lbl">Your details</span>
              <div className="cons-inputs">
                <input name="name" placeholder="Full name" required autoComplete="name" />
                <input name="email" type="email" placeholder="Email" required autoComplete="email" />
                <input name="phone" placeholder="Phone" required autoComplete="tel" />
              </div>

              <span className="cons-field-lbl">Birth details</span>
              <p className="cons-birth-hint">Your consultant uses these to prepare your reading before the call.</p>
              <div className="cons-inputs cons-birth">
                <label className="cons-birth-f">
                  <span>Date of birth</span>
                  <input name="birthDate" type="date" required max={new Date().toISOString().slice(0, 10)} />
                </label>
                <label className="cons-birth-f">
                  <span>Time of birth <em>(if known)</em></span>
                  <input name="birthTime" type="time" />
                </label>
                <label className="cons-birth-f wide">
                  <span>Place of birth</span>
                  <input name="birthPlace" placeholder="City, State, Country" required maxLength={120} autoComplete="off" />
                </label>
              </div>

              <button className="cons-submit" disabled={slots.length === 0}>Confirm booking</button>
            </form>

            <aside className="cons-summary">
              <div className="cons-sum-k">{active.creditsTowardOrder ? "Session fee" : "Fee"}</div>
              <div className="cons-sum-fee">{formatMoney(active.feeMinor, "INR")}</div>
              <div className="cons-sum-dur">{active.durationMinutes} minutes · private video</div>
              <p className="cons-sum-note">
                {active.creditsTowardOrder
                  ? <>Ordered a piece over ₹15,000? Your <b>free consultation credit</b> is applied automatically when you book with the same email.</>
                  : <>A confidential one-to-one video session. A call link is emailed before your slot.</>}
              </p>
            </aside>
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="cons-how bleed">
        <div className="cons-how-in">
          <span className="cons-kicker light">How it works</span>
          <h2>From your question to your corners.</h2>
          <div className="chow-grid">
            {[
              ["1", "Choose your consultation", "Pick the session that fits your home and your question."],
              ["2", "Pick a time", "Reserve a slot that suits you — mornings to evenings, IST."],
              ["3", "Meet your expert", "A private video call with a certified Vāstu consultant."],
              ["4", "Place with intention", "Receive your placement plan — then shop the pieces for those corners."],
            ].map(([n, t, b]) => (
              <div key={n} className="chow-step">
                <span className="chow-num serif">{n}</span>
                <div className="chow-title">{t}</div>
                <div className="chow-body">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why book with us ── */}
      <section className="cons-section">
        <span className="cons-kicker">Why book with us</span>
        <h2 className="cons-h">Guidance you can build a home on.</h2>
        <div className="cwhy-grid" style={{ marginTop: 22 }}>
          <div className="cwhy">
            <span className="cwhy-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <div className="cwhy-title serif">Certified expertise</div>
            <div className="cwhy-body">Guidance rooted in Vāstu Śāstra and verified craft — not guesswork.</div>
          </div>
          <div className="cwhy">
            <span className="cwhy-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" strokeLinejoin="round" /></svg></span>
            <div className="cwhy-title serif">Private &amp; personal</div>
            <div className="cwhy-body">A one-to-one video session about your home — confidential, unhurried.</div>
          </div>
          <div className="cwhy">
            <span className="cwhy-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V7l9-4 9 4v14" /><path d="M9 21v-6h6v6" /></svg></span>
            <div className="cwhy-title serif">Credited to your home</div>
            <div className="cwhy-body">Your consultation fee works toward the pieces you place — advice that pays forward.</div>
          </div>
        </div>
      </section>

      {/* ── Cross-link to the free audit ── */}
      <section className="cons-section" style={{ paddingTop: 0 }}>
        <div className="cons-audit">
          <div className="cons-audit-copy">
            <div className="t serif">Not ready to book?</div>
            <div className="s">Start with the free 2-minute home audit — we&apos;ll point you to the corners that matter most.</div>
          </div>
          <Link href="/home-audit" className="cons-audit-link">Take the free audit →</Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="cons-section" style={{ paddingTop: 0 }}>
        <span className="cons-kicker">Questions, answered</span>
        <h2 className="cons-h">Before you book.</h2>
        <div className="cons-faq-list" style={{ marginTop: 8 }}>
          {FAQS.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <div className="cons-faq-body">{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Sacred close ── */}
      <section className="cons-close bleed">
        <div className="om" aria-hidden="true">ॐ</div>
        <p className="l">Placed with intention.</p>
        <p className="s">Sarthak Arts · guidance for every corner of home</p>
      </section>
    </div>
  );
}
