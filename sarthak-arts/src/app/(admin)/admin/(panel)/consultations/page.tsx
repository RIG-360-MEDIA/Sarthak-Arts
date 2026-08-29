import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { BookingStatusPill } from "../../_ui/status";
import { addSlot, removeSlot, markComplete, setConsultantAccess } from "./actions";

export const dynamic = "force-dynamic";

function fmtSlot(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
}

export default async function AdminConsultations() {
  const [bookings, types, availability, consultant] = await Promise.all([
    prisma.booking.findMany({ include: { consultationType: true, consultant: true }, orderBy: { slotStart: "asc" } }),
    prisma.consultationType.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.consultantAvailability.findMany({ include: { consultant: true }, orderBy: { slotStart: "asc" } }),
    prisma.consultant.findFirst(),
  ]);
  const consultantLogin = consultant?.userId ? await prisma.user.findUnique({ where: { id: consultant.userId } }) : null;

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Consultations</h1>
          <p className="lead">Bookings, availability and your consultant&apos;s access. Times are shown in IST.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 24, alignItems: "start" }} className="adm-prod-grid">
        <div style={{ display: "grid", gap: 16 }}>
          <div className="adm-table-wrap">
            <div className="adm-table-tools"><span className="adm-card-title">Bookings</span></div>
            {bookings.length === 0 ? (
              <div className="adm-empty" style={{ padding: "36px 20px" }}>
                <div className="em-ic"><Icon name="consultations" /></div>
                <h3>No bookings yet</h3>
                <p>When someone books a Vāstu consultation, it will appear here.</p>
              </div>
            ) : (
              <div className="adm-table-scroll">
                <table className="adm-table">
                  <thead><tr><th>Customer</th><th>Type</th><th>When (IST)</th><th>Status</th><th className="right">Action</th></tr></thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td><span className="r-strong">{b.customerName}</span><div className="r-sub">{b.customerEmail}</div></td>
                        <td>{b.consultationType.name}</td>
                        <td>{fmtSlot(b.slotStart)}</td>
                        <td><BookingStatusPill status={b.status} />{b.paymentStatus === "free" ? <span className="adm-pill neutral" style={{ marginLeft: 6 }}>free</span> : null}</td>
                        <td className="right">{b.status === "booked" && (
                          <form action={markComplete}><input type="hidden" name="bookingId" value={b.id} /><button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">Mark done</button></form>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {consultant && (
            <div className="adm-fieldset" style={{ margin: 0 }}>
              <div className="adm-fieldset-head"><h3>Consultant portal access</h3>
                <p>{consultantLogin
                  ? <>They sign in at <a href="/portal/login" style={{ color: "var(--brass-deep)" }}>/portal/login</a> with <strong>{consultantLogin.email}</strong>. Set a new password to reset it.</>
                  : <>Give {consultant.name} their own login for <a href="/portal/login" style={{ color: "var(--brass-deep)" }}>/portal/login</a>.</>}</p>
              </div>
              <form action={setConsultantAccess}>
                <input type="hidden" name="consultantId" value={consultant.id} />
                <div className="adm-field-row">
                  <div className="adm-field"><label>Login email</label><input name="email" type="email" defaultValue={consultantLogin?.email ?? ""} required /></div>
                  <div className="adm-field"><label>{consultantLogin ? "New password" : "Password"}</label><input name="password" type="text" placeholder="Set a password" required /></div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="adm-btn adm-btn-ghost" type="submit">{consultantLogin ? "Reset access" : "Create login"}</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Availability sidebar */}
        <aside style={{ position: "sticky", top: 84 }}>
          <div className="adm-card adm-card-pad">
            <div className="adm-card-title" style={{ marginBottom: 12 }}>Availability</div>
            {availability.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: "0 0 10px" }}>No open slots. Add one below.</p>}
            <div style={{ display: "grid", gap: 6 }}>
              {availability.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "7px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 9 }}>
                  <span>{fmtSlot(a.slotStart)}</span>
                  <form action={removeSlot}><input type="hidden" name="slotId" value={a.id} /><button className="del" type="submit" aria-label="Remove slot" style={{ position: "static", width: 22, height: 22, opacity: 1, background: "transparent", color: "var(--ink-faint)" }}><Icon name="x" /></button></form>
                </div>
              ))}
            </div>
            {consultant && (
              <form action={addSlot} style={{ marginTop: 12 }}>
                <input type="hidden" name="consultantId" value={consultant.id} />
                <div className="adm-field" style={{ marginTop: 0 }}>
                  <label>Add a slot</label>
                  <input name="slotStart" type="datetime-local" required />
                </div>
                <button className="adm-btn adm-btn-ghost" type="submit" style={{ width: "100%", marginTop: 10 }}><Icon name="plus" /> Add slot</button>
              </form>
            )}
          </div>
          {types.length > 0 && (
            <div className="adm-note info" style={{ marginTop: 14 }}><Icon name="info" /> Types offered: {types.map((t) => t.name).join(", ")}.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
