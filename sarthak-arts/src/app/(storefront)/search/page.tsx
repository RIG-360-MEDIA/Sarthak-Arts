import { prisma } from "@/lib/db";
import { buildSearchWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const currency = await resolveDisplayCurrency();
  const products = q.trim()
    ? await prisma.product.findMany({
        where: buildSearchWhere(q),
        include: { images: { orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
      })
    : [];
  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Search</h1>
      {q.trim() ? (
        <>
          <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
            {products.length} result(s) for “{q}”.
          </p>
          <div style={{ marginTop: 16 }}>
            <ProductGrid products={products.map((p) => toCard(p, currency))} />
          </div>
        </>
      ) : (
        <p style={{ color: "var(--ink-muted)" }}>Type a search above to find a piece.</p>
      )}
    </div>
  );
}
