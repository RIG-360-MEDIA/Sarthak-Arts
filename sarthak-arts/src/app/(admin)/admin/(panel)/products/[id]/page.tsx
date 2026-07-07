import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
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
      },
    }),
    prisma.metal.findMany(),
    prisma.gemstone.findMany(),
    prisma.productPriceHistory.findMany({ where: { productId }, orderBy: { changedAt: "desc" }, take: 5 }),
  ]);
  if (!product) notFound();

  return (
    <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
      <div>
        <h1>Edit — {product.name}</h1>
        <form action={updateProduct}>
          <input type="hidden" name="id" value={product.id} />
          <label>Name</label><input name="name" defaultValue={product.name} required />
          <label>One-line positioning</label><input name="positioningLine" defaultValue={product.positioningLine} />
          <label>Placement note</label><textarea name="placementNote" rows={2} defaultValue={product.placementNote} />
          <label>Description</label><textarea name="description" rows={3} defaultValue={product.description} />
          <label>Care note</label><input name="careNote" defaultValue={product.careNote} />
          <label>What&apos;s included</label><input name="includedItems" defaultValue={product.includedItems} />
          <label>Stock quantity</label><input name="stockQuantity" type="number" defaultValue={product.stockQuantity} />
          <label>Status</label>
          <select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="live">Live</option><option value="archived">Archived</option></select>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <input type="checkbox" name="isFinalSale" defaultChecked={product.isFinalSale} style={{ width: "auto" }} /> Final sale (no returns)
          </label>
          <label>Price (₹) — you set this directly</label>
          <input name="priceRupees" type="number" step="0.01" defaultValue={(product.basePriceMinor / 100).toString()} required />
          <button style={{ marginTop: 16 }}>Save changes</button>
        </form>

        <h3 style={{ marginTop: 28 }}>Composition</h3>
        <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>What the piece is made of — for the listing and certificate. Separate from price.</p>
        <table>
          <tbody>
            {product.composition.map((c) => (
              <tr key={c.id}>
                <td>{c.metal?.name ?? c.gemstone?.name}{c.label ? ` (${c.label})` : ""}</td>
                <td className="num">{c.weightGrams ? `${c.weightGrams}g` : c.gemstoneQty ?? ""}</td>
                <td>
                  <form action={removeComposition}>
                    <input type="hidden" name="compositionId" value={c.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addComposition} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
          <input type="hidden" name="productId" value={product.id} />
          <div><label>Metal</label><select name="metalId" style={{ width: 120 }}><option value="">—</option>{metals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label>Weight (g)</label><input name="weightGrams" type="number" step="0.1" style={{ width: 90 }} /></div>
          <div><label>Gemstone</label><select name="gemstoneId" style={{ width: 120 }}><option value="">—</option>{gemstones.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div><label>Qty</label><input name="gemstoneQty" type="number" style={{ width: 60 }} /></div>
          <div><label>Label</label><input name="label" style={{ width: 120 }} /></div>
          <button className="btn-ghost" style={{ padding: "8px 14px" }}>+ Add line</button>
        </form>
      </div>

      <aside style={{ border: "1px solid var(--brass)", borderRadius: 8, padding: 16, background: "rgba(184,134,62,0.06)", height: "fit-content" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>Price — your call</div>
        <div className="num" style={{ fontSize: 22, margin: "8px 0" }}>{formatMoney(product.basePriceMinor, product.baseCurrency)}</div>
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>No automated suggestion — this is always your number. Other currencies convert from it automatically.</p>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginTop: 16 }}>Price history</div>
        {priceHistory.length === 0 && <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>No changes yet.</p>}
        {priceHistory.map((h) => (
          <div key={h.id} style={{ fontSize: 12, color: "var(--ink-muted)", padding: "4px 0" }}>
            {h.oldPriceMinor ? formatMoney(h.oldPriceMinor, "INR") : "—"} → {formatMoney(h.newPriceMinor, "INR")}
          </div>
        ))}
      </aside>
    </div>
  );
}
