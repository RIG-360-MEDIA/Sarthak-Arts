import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { Icon } from "@/app/(admin)/admin/_ui/icons";
import { addSlot, removeSlot } from "../actions";

export const dynamic = "force-dynamic";

function fmtSlot(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
}

export default async function PortalAvailability() {
  const session = await currentSession();
  const consultant = session ? await prisma.consultant.findFirst({ where: { userId: session.userId } }) : null;
  if (!consultant) {
    return (
      <div className="adm-page narrow"><div className="adm-table-wrap"><div className="adm-empty">
        <div className="em-ic"><Icon name="info" /></div><h3>Consultant not found</h3>
        <p>Your login isn&apos;t linked to a consultant profile. Ask the store owner to set this up.</p>
      </div></div></div>
    );
  }

  const now = new Date();
  const slots = await prisma.consultantAvailability.findMany({ where: { consultantId: consultant.id }, orderBy: { slotStart: "asc" } });
  const booked = new Set(
    (await prisma.booking.findMany({ where: { consultantId: consultant.id }, select: { slotStart: true } })).map((b) => b.slotStart.getTime()),
  );
  const openCount = slots.filter((s) => s.slotStart.getTime() >= now.getTime() && !booked.has(s.slotStart.getTime())).length;

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Your availability</h1>
          <p className="lead">The open slots customers can book. {openCount} open and upcoming. Times are shown in IST.</p>
        </div>
      </div>

      <form action={addSlot} className="adm-fieldset">
        <div className="adm-fieldset-head"><h3>Add an open slot</h3><p>Pick a date and time you&apos;re available for a 20-minute session.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Date &amp; time</label>
            <input name="slotStart" type="datetime-local" required />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add slot</button>
        </div>
      </form>

      <div className="adm-subhead">Your slots</div>
      <div className="adm-table-wrap">
        {slots.length === 0 ? (
          <div className="adm-empty" style={{ padding: "40px 20px" }}>
            <div className="em-ic"><Icon name="calendar" /></div>
            <h3>No slots yet</h3>
            <p>Add your first open slot above so customers can book a session with you.</p>
          </div>
        ) : (
          slots.map((s) => {
            const isBooked = booked.has(s.slotStart.getTime());
            const isPast = s.slotStart.getTime() < now.getTime();
            return (
              <div key={s.id} className={`pf-slot${isPast ? " past" : ""}`}>
                <span className="when">
                  <Icon name="clock" style={{ width: 15, height: 15, color: "var(--ink-faint)" }} />
                  {fmtSlot(s.slotStart)}
                  {isBooked && <span className="adm-pill info">Booked</span>}
                  {isPast && !isBooked && <span className="adm-pill neutral">Past</span>}
                </span>
                {!isBooked && (
                  <form action={removeSlot}>
                    <input type="hidden" name="slotId" value={s.id} />
                    <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">Remove</button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="adm-note info" style={{ marginTop: 16 }}><Icon name="info" /> Booked slots can&apos;t be removed here — mark the session done from your <a href="/portal" style={{ color: "var(--brass-deep)", fontWeight: 600 }}>Sessions</a> page once it&apos;s complete.</div>
    </div>
  );
}
