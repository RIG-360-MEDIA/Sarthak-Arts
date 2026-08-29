import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Icon } from "../../../_ui/icons";
import { ProductStatusPill, StockPill } from "../../../_ui/status";
import { ImageUploader } from "../ImageUploader";
import { updateProduct, addComposition, removeComposition } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const [product, metals, gemstones, priceHistory] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" } },
        directions: { include: { direction: true } },
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    }),
    prisma.metal.findMany(),
    prisma.gemstone.findMany(),
    prisma.productPriceHistory.findMany({ where: { productId }, orderBy: { changedAt: "desc" }, take: 5 }),
  ]);
  if (!product) notFound();

  const low = product.stockQuantity <= 5;

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <div className="eyebrow"><Link href="/admin/products" style={{ color: "inherit", textDecoration: "none" }}>← All products</Link></div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{product.name} <ProductStatusPill status={product.status} /></h1>
          <p className="lead">{product.category.name}{product.directions[0] ? ` · ${product.directions[0].direction.name}` : ""}</p>
        </div>
        {product.status === "live" && (
          <a className="adm-btn adm-btn-ghost" href={`/collection/${product.slug}`} target="_blank" rel="noopener noreferrer"><Icon name="eye" /> View live</a>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 24, alignItems: "start" }} className="adm-prod-grid">
        <div>
          {/* Core details form */}
          <form action={updateProduct} className="adm-form">
            <input type="hidden" name="id" value={product.id} />

            <fieldset className="adm-fieldset">
              <div className="adm-fieldset-head"><h3>The basics</h3><p>The name and words a shopper sees first.</p></div>
              <div className="adm-field">
                <label>Product name<span className="req">*</span></label>
                <input name="name" defaultValue={product.name} required />
              </div>
              <div className="adm-field">
                <label>One-line positioning</label>
                <div className="hint">A short, evocative subtitle shown under the name — e.g. &ldquo;Cast in copper for the northeast corner.&rdquo;</div>
                <input name="positioningLine" defaultValue={product.positioningLine} />
              </div>
              <div className="adm-field">
                <label>Description</label>
                <div className="hint">The full story of the piece — what it is, how it&apos;s made, why it matters.</div>
                <textarea name="description" rows={4} defaultValue={product.description} />
              </div>
            </fieldset>

            <fieldset className="adm-fieldset">
              <div className="adm-fieldset-head"><h3>Placement &amp; care</h3><p>The guidance that ships with the piece.</p></div>
              <div className="adm-field">
                <label>Placement note</label>
                <div className="hint">Where in the home this piece belongs and how to place it.</div>
                <textarea name="placementNote" rows={2} defaultValue={product.placementNote} />
              </div>
              <div className="adm-field-row">
                <div className="adm-field"><label>Care note</label><input name="careNote" defaultValue={product.careNote} /></div>
                <div className="adm-field"><label>What&apos;s included</label><input name="includedItems" defaultValue={product.includedItems} /></div>
              </div>
            </fieldset>

            <fieldset className="adm-fieldset">
              <div className="adm-fieldset-head"><h3>Pricing &amp; stock</h3><p>Your price is always your own number — nothing is auto-calculated.</p></div>
              <div className="adm-field-row">
                <div className="adm-field">
                  <label>Price<span className="req">*</span></label>
                  <div className="adm-input-prefix"><span className="pfx">₹</span><input name="priceRupees" type="number" step="0.01" defaultValue={(product.basePriceMinor / 100).toString()} required /></div>
                </div>
                <div className="adm-field">
                  <label>Stock quantity</label>
                  <input name="stockQuantity" type="number" defaultValue={product.stockQuantity} />
                </div>
              </div>
              <div className="adm-field">
                <label>Status</label>
                <div className="hint">Draft is hidden from shoppers. Live is on your storefront. Archived is retired.</div>
                <select name="status" defaultValue={product.status}>
                  <option value="draft">Draft — hidden</option>
                  <option value="live">Live — on the storefront</option>
                  <option value="archived">Archived — retired</option>
                </select>
              </div>
              <label className="adm-check">
                <input type="checkbox" name="isFinalSale" defaultChecked={product.isFinalSale} />
                <span className="c-body"><b>Final sale</b><span>Tick if this piece can&apos;t be returned.</span></span>
              </label>
            </fieldset>

            <div className="adm-savebar">
              <span className="note">Changes go live the moment you save.</span>
              <button type="submit" className="adm-btn adm-btn-primary"><Icon name="check" /> Save changes</button>
            </div>
          </form>

          {/* Photos */}
          <fieldset className="adm-fieldset" style={{ marginTop: 18 }}>
            <div className="adm-fieldset-head"><h3>Photos</h3><p>The first photo is the cover shown on your storefront. Add as many as you like.</p></div>
            <div style={{ marginTop: 14 }}>
              <ImageUploader productId={product.id} images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} />
            </div>
          </fieldset>

          {/* Composition */}
          <fieldset className="adm-fieldset">
            <div className="adm-fieldset-head"><h3>Composition</h3><p>What the piece is made of — used in the listing and the authenticity certificate. Separate from price.</p></div>
            {product.composition.length > 0 && (
              <div className="adm-table-scroll" style={{ marginTop: 12 }}>
                <table className="adm-table">
                  <tbody>
                    {product.composition.map((c) => (
                      <tr key={c.id}>
                        <td className="r-strong">{c.metal?.name ?? c.gemstone?.name}{c.label ? ` (${c.label})` : ""}</td>
                        <td className="num">{c.weightGrams ? `${c.weightGrams} g` : c.gemstoneQty ?? ""}</td>
                        <td className="right">
                          <form action={removeComposition}>
                            <input type="hidden" name="compositionId" value={c.id} />
                            <input type="hidden" name="productId" value={product.id} />
                            <button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">Remove</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form action={addComposition} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 14 }}>
              <input type="hidden" name="productId" value={product.id} />
              <div className="adm-field" style={{ margin: 0 }}><label>Metal</label><select name="metalId" style={{ width: 130 }}><option value="">—</option>{metals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="adm-field" style={{ margin: 0 }}><label>Weight (g)</label><input name="weightGrams" type="number" step="0.1" style={{ width: 100 }} /></div>
              <div className="adm-field" style={{ margin: 0 }}><label>Gemstone</label><select name="gemstoneId" style={{ width: 130 }}><option value="">—</option>{gemstones.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div className="adm-field" style={{ margin: 0 }}><label>Qty</label><input name="gemstoneQty" type="number" style={{ width: 70 }} /></div>
              <div className="adm-field" style={{ margin: 0 }}><label>Label</label><input name="label" style={{ width: 130 }} /></div>
              <button className="adm-btn adm-btn-ghost" type="submit"><Icon name="plus" /> Add line</button>
            </form>
          </fieldset>
        </div>

        {/* Sidebar */}
        <aside style={{ display: "grid", gap: 16, position: "sticky", top: 84 }}>
          <div className="adm-card adm-card-pad">
            <div className="adm-card-title" style={{ marginBottom: 10 }}>At a glance</div>
            <div className="adm-dl">
              <div className="row"><span className="k">Price</span><span className="v num">{formatMoney(product.basePriceMinor, product.baseCurrency)}</span></div>
              <div className="row"><span className="k">Stock</span><span className="v"><StockPill qty={product.stockQuantity} low={low} /></span></div>
              <div className="row"><span className="k">Status</span><span className="v"><ProductStatusPill status={product.status} /></span></div>
              <div className="row"><span className="k">Photos</span><span className="v">{product.images.length}</span></div>
              <div className="row"><span className="k">Added</span><span className="v">{product.createdAt.toISOString().slice(0, 10)}</span></div>
            </div>
          </div>

          <div className="adm-card adm-card-pad">
            <div className="adm-card-title" style={{ marginBottom: 10 }}>Price history</div>
            {priceHistory.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: 0 }}>No changes yet.</p>
            ) : (
              <div className="adm-dl">
                {priceHistory.map((h) => (
                  <div key={h.id} className="row">
                    <span className="k num">{h.oldPriceMinor ? formatMoney(h.oldPriceMinor, "INR") : "—"} → {formatMoney(h.newPriceMinor, "INR")}</span>
                    <span className="v" style={{ fontWeight: 400, color: "var(--ink-faint)" }}>{h.changedAt.toISOString().slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
