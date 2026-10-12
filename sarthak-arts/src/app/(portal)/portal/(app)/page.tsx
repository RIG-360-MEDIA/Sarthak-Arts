import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { partitionBookings } from "@/lib/portal";
import { formatMoney } from "@/lib/money";
import { Icon } from "@/app/(admin)/admin/_ui/icons";
import { markDone, setVideoLink } from "./actions";

export const dynamic = "force-dynamic";

function fmtSlot(d: Date) {
  const t = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(d);
  return { t: `${t} IST`, d: day };
}

function NotLinked() {
  return (
    <div className="adm-page narrow">
      <div className="adm-table-wrap"><div className="adm-empty">
        <div className="em-ic"><Icon name="info" /></div>
        <h3>Your login isn&apos;t linked to a consultant profile yet</h3>
        <p>Ask the store owner to connect your account in the admin, then refresh this page.</p>
      </div></div>
    </div>
  );
}

export default async function PortalDashboard() {
  const session = await currentSession();
  const consultant = session ? await prisma.consultant.findFirst({ where: { userId: session.userId } }) : null;
  if (!consultant) return <NotLinked />;

  const bookings = await prisma.booking.findMany({
    where: { consultantId: consultant.id },
    include: { consultationType: true },
    orderBy: { slotStart: "asc" },
  });
  const { upcoming, past } = partitionBookings(bookings, new Date());
  const firstName = consultant.name.split(" ")[0];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Namaste{firstName ? `, ${firstName}` : ""}</h1>
          <p className="lead">Your upcoming sessions. Add a call link ahead of time, and mark each done once it&apos;s complete.</p>
        </div>
      </div>

      <div className="adm-subhead">Upcoming · {upcoming.length}</div>
      {upcoming.length === 0 ? (
        <div className="adm-table-wrap"><div className="adm-empty" style={{ padding: "40px 20px" }}>
          <div className="em-ic"><Icon name="consultations" /></div>
          <h3>No upcoming sessions</h3>
          <p>When someone books a session with you, it will appear here. Keep your open slots current under Availability.</p>
        </div></div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {upcoming.map((b) => {
            const when = fmtSlot(b.slotStart);
            return (
              <div key={b.id} className="adm-card pf-session">
                <div className="pf-session-top">
                  <div>
                    <div className="pf-session-type">{b.consultationType.name}</div>
                    <div className="pf-session-cust">
                      <span>{b.customerName}</span>
                      <a href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a>
                      {b.customerPhone && <a href={`tel:${b.customerPhone}`}>{b.customerPhone}</a>}
                    </div>
                    {b.birthDate && (
                      <div className="pf-session-cust" style={{ marginTop: 4 }}>
                        <span>Born {b.birthDate}{b.birthTime ? ` at ${b.birthTime}` : " (time unknown)"}{b.birthPlace ? ` · ${b.birthPlace}` : ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="pf-session-when">
                    <div className="t">{when.t}</div>
                    <div className="d">{when.d} · {b.consultationType.durationMinutes} min</div>
                    <div style={{ marginTop: 6 }}>
                      {b.paymentStatus === "free"
                        ? <span className="adm-pill neutral">Free · order perk</span>
                        : <span className="adm-pill ok">{formatMoney(b.feeMinorAtBooking, "INR")}</span>}
                    </div>
                  </div>
                </div>
                <div className="pf-session-do">
                  <form action={setVideoLink} className="pf-linkform">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <div className="adm-field">
                      <label><Icon name="video" style={{ width: 13, height: 13, verticalAlign: "-2px", marginRight: 4 }} />Video call link</label>
                      <input name="videoLink" defaultValue={b.videoLink ?? ""} placeholder="https://meet.google.com/…" />
                    </div>
                    <button type="submit" className="adm-btn adm-btn-ghost">Save link</button>
                  </form>
                  <form action={markDone}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="adm-btn adm-btn-primary"><Icon name="check" /> Mark done</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="adm-subhead">Past · {past.length}</div>
          <div className="adm-table-wrap">
            <div className="adm-table-scroll">
              <table className="adm-table">
                <thead><tr><th>Session</th><th>Customer</th><th>When (IST)</th><th>Status</th></tr></thead>
                <tbody>
                  {past.slice(0, 15).map((b) => {
                    const when = fmtSlot(b.slotStart);
                    return (
                      <tr key={b.id}>
                        <td className="r-strong">{b.consultationType.name}</td>
                        <td>{b.customerName}</td>
                        <td style={{ color: "var(--ink-muted)" }}>{when.d}, {when.t}</td>
                        <td><span className={`adm-pill ${b.status === "completed" ? "ok" : "neutral"}`}>{b.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
