import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { saveGeneralSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [storeName, lines, currencies, gateways, zones, taxRules] = await Promise.all([
    getSetting<string>("store_name", "Sarthak Arts"),
    getSetting<string[]>("announcement_lines", []),
    prisma.currency.findMany({ orderBy: { isDefault: "desc" } }),
    prisma.paymentGateway.findMany(),
    prisma.shippingZone.findMany({ include: { rates: true } }),
    prisma.taxRule.findMany(),
  ]);
  return (
    <div style={{ padding: "22px 26px", maxWidth: 640 }}>
      <h1>Settings</h1>

      <form action={saveGeneralSettings} style={{ marginTop: 12 }}>
        <label>Store name</label><input name="storeName" defaultValue={storeName} />
        <label>Announcement bar lines (one per line)</label>
        <textarea name="announcementLines" rows={3} defaultValue={lines.join("\n")} />
        <button style={{ marginTop: 12 }}>Save</button>
      </form>

      <h3 style={{ marginTop: 28 }}>Currencies</h3>
      <table><tbody>{currencies.map((c) => <tr key={c.code}><td>{c.code} {c.isDefault ? "(base)" : ""}</td><td className="num">rate {String(c.ratePerBase)}</td><td>{c.active ? "active" : "off"}</td></tr>)}</tbody></table>

      <h3 style={{ marginTop: 20 }}>Payment gateways</h3>
      <table><tbody>{gateways.map((g) => <tr key={g.code}><td>{g.name}</td><td>{g.active ? "active" : "off"}</td></tr>)}</tbody></table>

      <h3 style={{ marginTop: 20 }}>Shipping &amp; tax</h3>
      <table><tbody>
        {zones.map((z) => <tr key={z.code}><td>{z.name}</td><td className="num">{z.rates[0] ? `${(z.rates[0].amountMinor / 100).toLocaleString()} base` : "—"}</td></tr>)}
        {taxRules.map((t) => <tr key={t.id}><td>Tax: {t.region}</td><td className="num">{String(t.ratePercent)}%</td></tr>)}
      </tbody></table>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Currency rates, gateways, shipping and tax editing UIs arrive in a later plan; values are seeded and DB-editable meanwhile.</p>
    </div>
  );
}
