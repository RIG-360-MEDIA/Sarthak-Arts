import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "../../../_ui/icons";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <div className="eyebrow"><Link href="/admin/products" style={{ color: "inherit", textDecoration: "none" }}>← All products</Link></div>
          <h1>Add a product</h1>
          <p className="lead">Just the essentials to start — you&apos;ll add photos and composition on the next screen.</p>
        </div>
      </div>

      <form action={createProduct} className="adm-form">
        <fieldset className="adm-fieldset">
          <div className="adm-fieldset-head"><h3>The basics</h3></div>
          <div className="adm-field">
            <label>Product name<span className="req">*</span></label>
            <input name="name" required autoFocus placeholder="e.g. Copper Kalash for the Northeast" />
          </div>
          <div className="adm-field">
            <label>One-line positioning</label>
            <div className="hint">A short subtitle shown under the name.</div>
            <input name="positioningLine" />
          </div>
          <div className="adm-field">
            <label>Description</label>
            <textarea name="description" rows={3} />
          </div>
        </fieldset>

        <fieldset className="adm-fieldset">
          <div className="adm-fieldset-head"><h3>Placement &amp; care</h3></div>
          <div className="adm-field"><label>Placement note</label><textarea name="placementNote" rows={2} /></div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Care note</label><input name="careNote" /></div>
            <div className="adm-field"><label>What&apos;s included</label><input name="includedItems" /></div>
          </div>
        </fieldset>

        <fieldset className="adm-fieldset">
          <div className="adm-fieldset-head"><h3>Category, price &amp; stock</h3></div>
          <div className="adm-field">
            <label>Categories<span className="req">*</span></label>
            <div className="hint">Pick one or more.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 6 }}>
              {categories.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 10, cursor: "pointer" }}>
                  <input type="checkbox" name="categoryIds" value={c.id} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="adm-field-row">
            <div className="adm-field">
              <label>Price<span className="req">*</span></label>
              <div className="adm-input-prefix"><span className="pfx">₹</span><input name="priceRupees" type="number" step="0.01" required /></div>
            </div>
            <div className="adm-field">
              <label>Stock quantity</label>
              <input name="stockQuantity" type="number" defaultValue={0} />
            </div>
          </div>
          <div className="adm-field">
            <label>Status</label>
            <div className="hint">Start as a draft while you add photos, then set it live when ready.</div>
            <select name="status" defaultValue="draft">
              <option value="draft">Draft — hidden</option>
              <option value="live">Live — on the storefront</option>
            </select>
          </div>
        </fieldset>

        <div className="adm-savebar">
          <span className="note">Next: add photos and composition.</span>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="check" /> Create product</button>
        </div>
      </form>
    </div>
  );
}
