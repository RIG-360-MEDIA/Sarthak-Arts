import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildProductWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = { category: sp.category, direction: sp.direction, metal: sp.metal, purpose: sp.purpose };
  const currency = await resolveDisplayCurrency();

  const [products, directions, metals, purposes] = await Promise.all([
    prisma.product.findMany({
      where: buildProductWhere(filters),
      include: { images: { orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
    prisma.metal.findMany(),
    prisma.purpose.findMany(),
  ]);

  const chip = (label: string, key: string, value: string) => {
    const active = sp[key] === value;
    const next = new URLSearchParams(
      Object.fromEntries(Object.entries(sp).filter(([, v]) => v !== undefined)) as Record<string, string>,
    );
    if (active) next.delete(key);
    else next.set(key, value);
    return (
      <Link
        key={key + value}
        href={`/collection?${next.toString()}`}
        style={{
          display: "block",
          fontSize: 13,
          padding: "4px 0",
          color: active ? "var(--ink)" : "var(--ink-muted)",
          fontWeight: active ? 600 : 400,
          textDecoration: "none",
        }}
      >
        {active ? "✓ " : ""}{label}
      </Link>
    );
  };

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>The collection</h1>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", maxWidth: "58ch" }}>
        Every piece lists the metal it&apos;s made from, its exact weight, and the single gemstone set into it.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, marginTop: 20 }}>
        <aside>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 6 }}>Direction</div>
          {directions.map((d) => chip(d.name, "direction", d.code))}
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, margin: "16px 0 6px" }}>Metal</div>
          {metals.map((m) => chip(m.name, "metal", m.code))}
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, margin: "16px 0 6px" }}>Purpose</div>
          {purposes.map((p) => chip(p.name, "purpose", p.code))}
        </aside>
        <ProductGrid products={products.map((p) => toCard(p, currency))} />
      </div>
    </div>
  );
}
