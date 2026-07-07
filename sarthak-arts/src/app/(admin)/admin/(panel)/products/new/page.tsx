import { prisma } from "@/lib/db";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const [categories, directions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
  ]);
  return (
    <div style={{ padding: "22px 26px", maxWidth: 620 }}>
      <h1>Add product</h1>
      <form action={createProduct}>
        <label>Name</label><input name="name" required />
        <label>One-line positioning</label><input name="positioningLine" />
        <label>Placement note</label><textarea name="placementNote" rows={2} />
        <label>Description</label><textarea name="description" rows={3} />
        <label>Care note</label><input name="careNote" />
        <label>What&apos;s included</label><input name="includedItems" />
        <label>Category</label>
        <select name="categoryId" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label>Direction</label>
        <select name="directionId"><option value="">—</option>{directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <label>Price (₹)</label><input name="priceRupees" type="number" step="0.01" required />
        <label>Stock quantity</label><input name="stockQuantity" type="number" defaultValue={0} />
        <label>Status</label>
        <select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="live">Live</option><option value="archived">Archived</option></select>
        <button style={{ marginTop: 16 }}>Create product</button>
      </form>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Add composition (metals/gemstones) after creating, on the edit screen.</p>
    </div>
  );
}
