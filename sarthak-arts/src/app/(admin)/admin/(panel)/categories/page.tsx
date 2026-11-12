import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { Icon } from "../../_ui/icons";
import { ConfirmSubmit } from "../products/DeleteControls";
import { createCategory, renameCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  saved: "Category saved.",
  deleted: "Category deleted.",
  inuse: "That category still has products in it — move them to another category first.",
  invalid: "Please type a name.",
};

export default async function AdminCategories({ searchParams }: { searchParams: Promise<{ flash?: string }> }) {
  await requireAdmin();
  const { flash } = await searchParams;
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Categories</h1>
          <p className="lead">The types shoppers filter by on the collection page. Pick one for each product on its edit page.</p>
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
                  <td className="num right">{c._count.products}</td>
                  <td className="right">
                    {c._count.products === 0 && (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit className="adm-btn adm-btn-ghost adm-btn-sm" message={`Delete the category “${c.name}”?`}>Delete</ConfirmSubmit>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
