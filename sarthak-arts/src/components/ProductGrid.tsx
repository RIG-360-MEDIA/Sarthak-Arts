import { ProductCard, type CardProduct } from "./ProductCard";

export function ProductGrid({ products }: { products: CardProduct[] }) {
  if (products.length === 0)
    return <p style={{ color: "var(--ink-muted)" }}>No pieces match these filters yet.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {products.map((p) => <ProductCard key={p.slug} p={p} />)}
    </div>
  );
}
