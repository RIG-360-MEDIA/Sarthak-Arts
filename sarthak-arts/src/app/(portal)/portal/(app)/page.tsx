import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { partitionBookings } from "@/lib/portal";
import { formatMoney } from "@/lib/money";
import { markDone, setVideoLink } from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await currentSession();
  const consultant = session ? await prisma.consultant.findFirst({ where: { userId: session.userId } }) : null;
  if (!consultant) {
    return <div style={{ padding: "22px 26px" }}><h1>Consultant not found</h1><p style={{ color: "var(--ink-muted)" }}>Your login isn't linked to a consultant profile. Ask the store admin to set this up.</p></div>;
  }

  const bookings = await prisma.booking.findMany({
    where: { consultantId: consultant.id },
    include: { consultationType: true },
    orderBy: { slotStart: "asc" },
  });
  const { upcoming, past } = partitionBookings(bookings, new Date());

  return (
    <div style={{ padding: "22px 26px", maxWidth: 820 }}>
      <h1>Welcome, {consultant.name}</h1>
      <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>Your upcoming sessions. Add a call link ahead of time; mark done afterwards.</p>

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, margin: "22px 0 8px" }}>Upcoming ({upcoming.length})</div>
      {upcoming.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No upcoming sessions.</p>}
      {upcoming.map((b) => (
        <div key={b.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="serif" style={{ fontSize: 16 }}>{b.consultationType.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>{b.customerName} · {b.customerEmail} · {b.customerPhone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13 }}>{b.slotStart.toUTCString()}</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{b.paymentStatus === "free" ? "Free (order perk)" : formatMoney(b.feeMinorAtBooking, "INR")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "end" }}>
            <form action={setVideoLink} style={{ display: "flex", gap: 6, alignItems: "end", flex: 1, minWidth: 240 }}>
              <input type="hidden" name="bookingId" value={b.id} />
              <div style={{ flex: 1 }}>
                <label>Video call link</label>
                <input name="videoLink" defaultValue={b.videoLink ?? ""} placeholder="https://meet…" />
              </div>
              <button className="btn-ghost" style={{ fontSize: 12, padding: "8px 12px" }}>Save link</button>
            </form>
            <form action={markDone}>
              <input type="hidden" name="bookingId" value={b.id} />
              <button style={{ fontSize: 12, padding: "8px 14px" }}>Mark done</button>
            </form>
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-faint)", fontWeight: 600, margin: "26px 0 8px" }}>Past ({past.length})</div>
          {past.slice(0, 10).map((b) => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-muted)", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
              <span>{b.consultationType.name} · {b.customerName}</span>
              <span>{b.slotStart.toUTCString().slice(0, 16)} · {b.status}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
