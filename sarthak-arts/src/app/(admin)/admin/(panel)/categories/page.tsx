import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { Icon } from "../../_ui/icons";
import { ConfirmSubmit } from "../products/DeleteControls";
import { createCategory, renameCategory, deleteCategory, assignProducts } from "./actions";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  saved: "Category saved.",
  deleted: "Category deleted.",
  assigned: "Products updated.",
  inuse: "That category still has products in it — move them to another category first.",
  invalid: "Please type a name.",
};

export default async function AdminCategories({ searchParams }: { searchParams: Promise<{ flash?: string; manage?: string }> }) {
  await requireAdmin();
  const { flash, manage } = await searchParams;
  const [cats, allProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { productCategories: true } }, productCategories: { select: { productId: true } } } }),
    manage ? prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const manageCat = manage ? cats.find((c) => String(c.id) === manage) : null;

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Categories</h1>
          <p className="lead">Products can belong to multiple categories. Shoppers filter by these on the collection page.</p>
        </div>
      </div>

      {flash && FLASH[flash] && (
        <div className={`adm-note ${flash === "inuse" || flash === "invalid" ? "brass" : "info"}`} style={{ marginBottom: 16 }}>
          <Icon name={flash === "inuse" || flash === "invalid" ? "info" : "checkCircle"} /> {FLASH[flash]}
        </div>
      )}

      <form action={createCategory} className="adm-fieldset">
        <div className="adm-fieldset-head"><h3>Add a category</h3><p>It appears on the collection page as soon as a live product uses it.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div className="adm-field" style={{ margin: 0, flex: 1 }}>
            <label>Name</label>
            <input name="name" required maxLength={60} placeholder="e.g. Brass Vastu articles" />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add</button>
        </div>
      </form>

      <div className="adm-subhead">Your categories</div>
      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead><tr><th>Name</th><th className="right">Products</th><th></th></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td>
                    <form action={renameCategory} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <input name="name" defaultValue={c.name} required maxLength={60} style={{ minWidth: 220 }} />
                      <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">Rename</button>
                    </form>
                  </td>
                  <td className="num right">{c._count.productCategories}</td>
                  <td className="right" style={{ display: "flex", gap: 6 }}>
                    <a href={`/admin/categories?manage=${c.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">Manage products</a>
                    {c._count.productCategories === 0 && (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit className="adm-btn adm-btn-ghost adm-btn-sm" message={`Delete the category "${c.name}"?`}>Delete</ConfirmSubmit>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {manageCat && (
        <form action={assignProducts} className="adm-fieldset" style={{ marginTop: 24 }}>
          <input type="hidden" name="categoryId" value={manageCat.id} />
          <div className="adm-fieldset-head">
            <h3>Products in &ldquo;{manageCat.name}&rdquo;</h3>
            <p>Tick the products that belong to this category, then save.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6, maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
            {allProducts.map((p) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer" }}>
                <input type="checkbox" name="productIds" value={p.id} defaultChecked={manageCat.productCategories.some((pc) => pc.productId === p.id)} />
                {p.name}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="adm-btn adm-btn-primary"><Icon name="check" /> Save</button>
            <a href="/admin/categories" className="adm-btn adm-btn-ghost" style={{ marginLeft: 8 }}>Cancel</a>
          </div>
        </form>
      )}
    </div>
  );
}
