import { prisma } from "@/lib/db";
import { addSlot, removeSlot, markComplete, setConsultantAccess } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminConsultations({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const [bookings, types, availability, consultant] = await Promise.all([
    prisma.booking.findMany({
      where: type ? { consultationType: { code: type } } : {},
      include: { consultationType: true, consultant: true },
      orderBy: { slotStart: "asc" },
    }),
    prisma.consultationType.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.consultantAvailability.findMany({ include: { consultant: true }, orderBy: { slotStart: "asc" } }),
    prisma.consultant.findFirst(),
  ]);
  const consultantLogin = consultant?.userId ? await prisma.user.findUnique({ where: { id: consultant.userId } }) : null;

  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Consultations</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Upcoming bookings</div>
          <table>
            <thead><tr><th>Customer</th><th>Type</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}<div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{b.customerEmail}</div></td>
                  <td>{b.consultationType.name}</td>
                  <td style={{ fontSize: 13 }}>{b.slotStart.toUTCString()}</td>
                  <td>{b.status}{b.paymentStatus === "free" ? " (free)" : ""}</td>
                  <td>{b.status === "booked" && (
                    <form action={markComplete}><input type="hidden" name="bookingId" value={b.id} /><button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Mark done</button></form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No bookings yet.</p>}
        </div>

        <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Availability</div>
          {availability.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "4px 0" }}>
              <span>{a.slotStart.toUTCString()}</span>
              <form action={removeSlot}><input type="hidden" name="slotId" value={a.id} /><button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }}>✕</button></form>
            </div>
          ))}
          {consultant && (
            <form action={addSlot} style={{ marginTop: 10 }}>
              <input type="hidden" name="consultantId" value={consultant.id} />
              <label>Add a slot</label>
              <input name="slotStart" type="datetime-local" required />
              <button className="btn-ghost" style={{ marginTop: 8, width: "100%" }}>+ Add slot</button>
            </form>
          )}
        </aside>
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Types: {types.map((t) => t.name).join(", ")}.</p>

      {consultant && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, marginTop: 16, maxWidth: 460 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Consultant portal access</div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 0 }}>
            {consultantLogin
              ? <>They can sign in at <a href="/portal/login">/portal/login</a> with <strong>{consultantLogin.email}</strong>. Set a new password below to reset it.</>
              : <>Give {consultant.name} their own login for <a href="/portal/login">/portal/login</a>.</>}
          </p>
          <form action={setConsultantAccess}>
            <input type="hidden" name="consultantId" value={consultant.id} />
            <label>Login email</label>
            <input name="email" type="email" defaultValue={consultantLogin?.email ?? ""} required />
            <label>{consultantLogin ? "New password" : "Password"}</label>
            <input name="password" type="text" placeholder="Set a password" required />
            <button className="btn-ghost" style={{ marginTop: 10 }}>{consultantLogin ? "Reset access" : "Create login"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
