import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { BookingStatusPill } from "../../_ui/status";
import { addSlot, removeSlot, markComplete, setConsultantAccess, updateConsultationType } from "./actions";

export const dynamic = "force-dynamic";

function fmtSlot(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
}

export default async function AdminConsultations({ searchParams }: { searchParams: Promise<{ flash?: string }> }) {
  const { flash } = await searchParams;
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

      {/* ── Consultation types: what customers see and pay ── */}
      <section id="types" style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Fees &amp; descriptions</h2>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>What customers see and pay on the Consultation page. Click <b>Edit fee &amp; content</b> to change one.</p>
        </div>
        {flash === "type-saved" && <div className="adm-note info"><Icon name="checkCircle" /> Saved — the Consultation page is updated.</div>}
        {flash === "type-error" && <div className="adm-note brass"><Icon name="alert" /> Please give a name, a fee and a duration between 5 and 480 minutes.</div>}
        {types.map((t) => (
          <details key={t.id} className="adm-fieldset" style={{ margin: 0 }}>
            <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", listStyle: "none" }}>
              <h3 style={{ margin: 0 }}>{t.name}</h3>
              <span style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, color: "var(--ink-muted)" }}><b style={{ color: "var(--ink)" }}>₹{(t.feeMinor / 100).toLocaleString("en-IN")}</b> · {t.durationMinutes} min · {t.active ? "shown" : "hidden"}</span>
                <span className="adm-btn adm-btn-primary adm-btn-sm">Edit fee &amp; content</span>
              </span>
            </summary>
            <form action={updateConsultationType} className="adm-form" style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={t.id} />
              <div className="adm-field"><label>Name</label><input name="name" required maxLength={80} defaultValue={t.name} /></div>
              <div className="adm-field-row">
                <div className="adm-field"><label>Fee</label><div className="adm-input-prefix"><span className="pfx">₹</span><input name="feeRupees" type="number" min={0} step="1" required defaultValue={t.feeMinor / 100} /></div></div>
                <div className="adm-field"><label>Duration (minutes)</label><input name="durationMinutes" type="number" min={5} max={480} required defaultValue={t.durationMinutes} /></div>
              </div>
              <div className="adm-field"><label>Short line</label><div className="hint">Shown on the card where customers choose a consultation.</div><input name="description" maxLength={300} defaultValue={t.description} /></div>
              <div className="adm-field">
                <label>Full details</label>
                <div className="hint">Shown beside the booking form. Start a line with ## for a heading, ### for a small subtitle; write &ldquo;Label: text&rdquo; for a bold label; put [ Book now ] on its own line for a button.</div>
                <textarea name="details" rows={14} defaultValue={t.details ?? ""} />
              </div>
              <label className="adm-check"><input type="checkbox" name="active" defaultChecked={t.active} /><span className="c-body"><b>Show on the website</b><span>Untick to hide this consultation.</span></span></label>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button className="adm-btn adm-btn-primary" type="submit"><Icon name="check" /> Save</button></div>
            </form>
          </details>
        ))}
      </section>

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
                        <td><span className="r-strong">{b.customerName}</span><div className="r-sub">{b.customerEmail}</div>{b.birthDate && <div className="r-sub">Born {b.birthDate}{b.birthTime ? ` ${b.birthTime}` : ""}{b.birthPlace ? ` · ${b.birthPlace}` : ""}</div>}</td>
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
