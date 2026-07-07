import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { addSlot, removeSlot } from "../actions";

export const dynamic = "force-dynamic";

export default async function PortalAvailability() {
  const session = await currentSession();
  const consultant = session ? await prisma.consultant.findFirst({ where: { userId: session.userId } }) : null;
  if (!consultant) {
    return <div style={{ padding: "22px 26px" }}><h1>Consultant not found</h1></div>;
  }

  const now = new Date();
  const slots = await prisma.consultantAvailability.findMany({
    where: { consultantId: consultant.id },
    orderBy: { slotStart: "asc" },
  });
  const booked = new Set(
    (await prisma.booking.findMany({ where: { consultantId: consultant.id }, select: { slotStart: true } })).map((b) => b.slotStart.getTime()),
  );

  return (
    <div style={{ padding: "22px 26px", maxWidth: 560 }}>
      <h1>Your availability</h1>
      <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>Open slots customers can book. Times are shown in UTC.</p>

      <form action={addSlot} style={{ display: "flex", gap: 8, alignItems: "end", margin: "16px 0 22px" }}>
        <div style={{ flex: 1 }}>
          <label>Add a slot</label>
          <input name="slotStart" type="datetime-local" required />
        </div>
        <button style={{ padding: "9px 14px" }}>+ Add</button>
      </form>

      {slots.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No slots yet — add your first above.</p>}
      {slots.map((s) => {
        const isBooked = booked.has(s.slotStart.getTime());
        const isPast = s.slotStart.getTime() < now.getTime();
        return (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--line)", opacity: isPast ? 0.55 : 1 }}>
            <span style={{ fontSize: 13.5 }}>
              {s.slotStart.toUTCString()}
              {isBooked && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--brass)", fontWeight: 600 }}>BOOKED</span>}
            </span>
            {!isBooked && (
              <form action={removeSlot}><input type="hidden" name="slotId" value={s.id} /><button className="btn-ghost" style={{ padding: "3px 10px", fontSize: 12 }}>Remove</button></form>
            )}
          </div>
        );
      })}
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 14 }}>Booked slots can't be removed here — mark the session done from your dashboard once it's complete.</p>
    </div>
  );
}
