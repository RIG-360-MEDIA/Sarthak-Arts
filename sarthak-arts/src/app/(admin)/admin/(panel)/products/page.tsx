import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: { category: true, directions: { include: { direction: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div style={{ padding: "22px 26px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Products <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{products.length} total</span></h1>
        <Link href="/admin/products/new"><button>+ Add product</button></Link>
      </div>
      <table>
        <thead><tr><th>Product</th><th>Category</th><th>Direction</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
              <td>{p.category.name}</td>
              <td>{p.directions[0]?.direction.name ?? "—"}</td>
              <td className="num">{formatMoney(p.basePriceMinor, p.baseCurrency)}</td>
              <td className="num" style={{ color: p.stockQuantity === 0 ? "var(--critical)" : "inherit" }}>{p.stockQuantity}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
