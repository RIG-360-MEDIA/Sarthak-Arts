import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { expandWeekly, freeSlots } from "@/lib/booking";
import { Icon } from "@/app/(admin)/admin/_ui/icons";
import { addSlot, removeSlot, addWeeklyHour, removeWeeklyHour, addDayOff, removeDayOff } from "../actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmtSlot(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
}
function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
function fmtDate(key: string) {
  return new Date(`${key}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" });
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
  const [slots, weekly, daysOff, bookings] = await Promise.all([
    prisma.consultantAvailability.findMany({ where: { consultantId: consultant.id }, orderBy: { slotStart: "asc" } }),
    prisma.consultantWeeklyHour.findMany({ where: { consultantId: consultant.id }, orderBy: [{ weekday: "asc" }, { time: "asc" }] }),
    prisma.consultantDayOff.findMany({ where: { consultantId: consultant.id }, orderBy: { date: "asc" } }),
    prisma.booking.findMany({ where: { consultantId: consultant.id, status: { not: "cancelled" } }, select: { slotStart: true } }),
  ]);
  const booked = new Set(bookings.map((b) => b.slotStart.getTime()));
  const openCount = freeSlots(
    [...slots.map((s) => s.slotStart), ...expandWeekly(weekly, daysOff.map((d) => d.date), now)],
    bookings.map((b) => b.slotStart), now,
  ).length;
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Your availability</h1>
          <p className="lead">Customers can book {openCount} open slots over the next 8 weeks. Times are IST; every session is 20 minutes.</p>
        </div>
      </div>

      <form action={addWeeklyHour} className="adm-fieldset">
        <div className="adm-fieldset-head"><h3>Weekly hours</h3><p>Your default times — they repeat every week until you remove them. Add one line per slot, e.g. Monday 10:00 am.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Day</label>
            <select name="weekday" required defaultValue="1">{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </div>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Time</label>
            <input name="time" type="time" required step={300} />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add weekly slot</button>
        </div>
        {weekly.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {weekly.map((w) => (
              <div key={w.id} className="pf-slot">
                <span className="when"><Icon name="clock" style={{ width: 15, height: 15, color: "var(--ink-faint)" }} />Every {WEEKDAYS[w.weekday]} · {fmtTime(w.time)}</span>
                <form action={removeWeeklyHour}><input type="hidden" name="id" value={w.id} /><button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">Remove</button></form>
              </div>
            ))}
          </div>
        )}
      </form>

      <form action={addDayOff} className="adm-fieldset">
        <div className="adm-fieldset-head"><h3>Days off</h3><p>Dates when your weekly hours should not be offered — holidays, travel, leave.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Date</label>
            <input name="date" type="date" required min={today} />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add day off</button>
        </div>
        {daysOff.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {daysOff.map((d) => (
              <div key={d.id} className={`pf-slot${d.date < today ? " past" : ""}`}>
                <span className="when"><Icon name="calendar" style={{ width: 15, height: 15, color: "var(--ink-faint)" }} />{fmtDate(d.date)}</span>
                <form action={removeDayOff}><input type="hidden" name="id" value={d.id} /><button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">Remove</button></form>
              </div>
            ))}
          </div>
        )}
      </form>

      <form action={addSlot} className="adm-fieldset">
        <div className="adm-fieldset-head"><h3>Extra one-off slots</h3><p>A single date and time outside your weekly hours.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Date &amp; time</label>
            <input name="slotStart" type="datetime-local" required />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add slot</button>
        </div>
      </form>

      {slots.length > 0 && (
        <>
          <div className="adm-subhead">Your one-off slots</div>
          <div className="adm-table-wrap">
            {slots.map((s) => {
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
            })}
          </div>
        </>
      )}
      <div className="adm-note info" style={{ marginTop: 16 }}><Icon name="info" /> Booked times can&apos;t be removed here — mark the session done from your <a href="/portal" style={{ color: "var(--brass-deep)", fontWeight: 600 }}>Sessions</a> page once it&apos;s complete.</div>
    </div>
  );
}
