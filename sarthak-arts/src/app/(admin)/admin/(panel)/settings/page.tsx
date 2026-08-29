import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Icon } from "../../_ui/icons";
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
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Settings</h1>
          <p className="lead">Store-wide basics. More controls arrive as they&apos;re built.</p>
        </div>
      </div>

      <form action={saveGeneralSettings} className="adm-form">
        <fieldset className="adm-fieldset">
          <div className="adm-fieldset-head"><h3>Store basics</h3></div>
          <div className="adm-field">
            <label>Store name</label>
            <input name="storeName" defaultValue={storeName} />
          </div>
          <div className="adm-field">
            <label>Announcement bar</label>
            <div className="hint">One line per row — these rotate in the thin bar at the very top of your site.</div>
            <textarea name="announcementLines" rows={3} defaultValue={lines.join("\n")} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button className="adm-btn adm-btn-primary" type="submit"><Icon name="check" /> Save settings</button>
          </div>
        </fieldset>
      </form>

      <div className="adm-subhead">Store configuration</div>
      <div className="adm-grid adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Currencies</span></div>
          <div className="adm-table-scroll"><table className="adm-table"><tbody>
            {currencies.map((c) => <tr key={c.code}><td className="r-strong">{c.code}{c.isDefault ? " · base" : ""}</td><td className="num right">rate {String(c.ratePerBase)}</td><td className="right">{c.active ? <span className="adm-pill ok">active</span> : <span className="adm-pill neutral">off</span>}</td></tr>)}
          </tbody></table></div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Payment gateways</span></div>
          <div className="adm-table-scroll"><table className="adm-table"><tbody>
            {gateways.map((g) => <tr key={g.code}><td className="r-strong">{g.name}</td><td className="right">{g.active ? <span className="adm-pill ok">active</span> : <span className="adm-pill neutral">off</span>}</td></tr>)}
          </tbody></table></div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Shipping zones</span></div>
          <div className="adm-table-scroll"><table className="adm-table"><tbody>
            {zones.map((z) => <tr key={z.code}><td className="r-strong">{z.name}</td><td className="num right">{z.rates[0] ? `₹${(z.rates[0].amountMinor / 100).toLocaleString("en-IN")}` : "—"}</td></tr>)}
          </tbody></table></div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Tax rules</span></div>
          <div className="adm-table-scroll"><table className="adm-table"><tbody>
            {taxRules.map((t) => <tr key={t.id}><td className="r-strong">{t.region}</td><td className="num right">{String(t.ratePercent)}%</td></tr>)}
          </tbody></table></div>
        </div>
      </div>

      <div className="adm-note info" style={{ marginTop: 16 }}><Icon name="info" /> Editing currency rates, gateways, shipping and tax from here is coming in a later step. For now these values are set up for you and safe to leave as they are.</div>
    </div>
  );
}
