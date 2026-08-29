import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { Icon } from "../../_ui/icons";
import { ProductStatusPill, StockPill } from "../../_ui/status";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Live", value: "live" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const threshold = await getSetting<number>("low_stock_threshold", 5);

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      directions: { include: { direction: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const buildHref = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Products</h1>
          <p className="lead">Every piece in your shop — {products.length} shown.</p>
        </div>
        <Link href="/admin/products/new" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add a product</Link>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-tools">
          <form className="adm-search" method="get">
            <Icon name="search" />
            <input name="q" defaultValue={q} placeholder="Search products by name…" aria-label="Search products" />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
          <div className="adm-chips">
            {STATUS_TABS.map((t) => (
              <Link key={t.value || "all"} href={buildHref(t.value)} className={`adm-chip${status === t.value ? " is-active" : ""}`}>{t.label}</Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="adm-empty">
            <div className="em-ic"><Icon name="products" /></div>
            <h3>{q || status ? "No products match" : "No products yet"}</h3>
            <p>{q || status ? "Try a different search or filter." : "Add your first handcrafted piece — name it, price it, add a photo, and set it live."}</p>
            {!q && !status && <Link href="/admin/products/new" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add your first product</Link>}
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Direction</th><th className="right">Price</th><th>Stock</th><th>Status</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <ProductThumb url={p.images[0]?.url} />
                        <Link href={`/admin/products/${p.id}`} className="r-strong">{p.name}</Link>
                      </div>
                    </td>
                    <td>{p.category.name}</td>
                    <td>{p.directions[0]?.direction.name ?? "—"}</td>
                    <td className="num right">{formatMoney(p.basePriceMinor, p.baseCurrency)}</td>
                    <td><StockPill qty={p.stockQuantity} low={p.stockQuantity <= threshold} /></td>
                    <td><ProductStatusPill status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductThumb({ url }: { url?: string }) {
  if (url) return <span style={{ width: 40, height: 40, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>;
  return (
    <span style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--surface-sink)", border: "1px solid var(--line)", color: "var(--ink-faint)" }}>
      <Icon name="box" style={{ width: 18, height: 18 }} />
    </span>
  );
}
