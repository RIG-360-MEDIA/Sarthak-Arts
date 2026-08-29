import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "../../../_ui/icons";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const [categories, directions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
  ]);

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
          <div className="adm-field-row">
            <div className="adm-field">
              <label>Category<span className="req">*</span></label>
              <select name="categoryId" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="adm-field">
              <label>Vāstu direction</label>
              <select name="directionId"><option value="">— None —</option>{directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
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
