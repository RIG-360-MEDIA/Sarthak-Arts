import { ProductCard, type CardProduct } from "./ProductCard";

export function ProductGrid({ products }: { products: CardProduct[] }) {
  if (products.length === 0)
    return <p style={{ color: "var(--ink-muted)" }}>No pieces match yet.</p>;
  return (
    <div className="pg-grid">
      {products.map((p) => <ProductCard key={p.slug} p={p} />)}
    </div>
  );
}
