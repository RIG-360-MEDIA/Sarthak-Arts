import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { freeSlots } from "@/lib/booking";
import { createBooking } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const types = await prisma.consultationType.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const active = types.find((t) => t.code === type) ?? null;

  let slots: Date[] = [];
  if (active) {
    const [availability, bookings] = await Promise.all([
      prisma.consultantAvailability.findMany({ where: { consultant: { types: { some: { consultationTypeId: active.id } }, active: true } } }),
      prisma.booking.findMany({ where: { consultationTypeId: active.id, status: { not: "cancelled" } } }),
    ]);
    slots = freeSlots(availability.map((a) => a.slotStart), bookings.map((b) => b.slotStart), new Date());
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Book a consultation</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "16px 0 24px" }}>
        {types.map((t) => (
          <Link
            key={t.code}
            href={`/consultation?type=${t.code}`}
            style={{ border: `${active?.code === t.code ? 2 : 1}px solid ${active?.code === t.code ? "var(--brass)" : "var(--line)"}`, borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit" }}
          >
            <div className="serif" style={{ fontSize: 16 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6 }}>
              {t.durationMinutes} min · {formatMoney(t.feeMinor, "INR")}{t.creditsTowardOrder ? " · credited toward orders over ₹15,000" : ""}
            </div>
          </Link>
        ))}
      </div>

      {active && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
          <form action={createBooking}>
            <input type="hidden" name="consultationTypeId" value={active.id} />
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>{active.name} selected</div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{active.description}</p>
            <label>Choose a time</label>
            <select name="slot" required>
              {slots.length === 0 && <option value="">No slots available</option>}
              {slots.map((s) => <option key={s.toISOString()} value={s.toISOString()}>{s.toUTCString()}</option>)}
            </select>
            <label>Full name</label><input name="name" required />
            <label>Email</label><input name="email" type="email" required />
            <label>Phone</label><input name="phone" required />
            <button style={{ marginTop: 16 }} disabled={slots.length === 0}>Confirm booking</button>
          </form>
          <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>Fee</div>
            <div className="num" style={{ fontSize: 20, margin: "6px 0" }}>{formatMoney(active.feeMinor, "INR")}</div>
            <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              If you have a free consultation from an order over ₹15,000, it&apos;s applied automatically at booking.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
