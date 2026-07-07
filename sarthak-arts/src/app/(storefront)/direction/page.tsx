import { prisma } from "@/lib/db";
import { buildProductWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";
import { DirectionWheelNav } from "@/components/DirectionWheelNav";

export default async function DirectionPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone } = await searchParams;
  const directions = await prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const active = directions.find((d) => d.code === zone) ?? null;
  const currency = await resolveDisplayCurrency();

  const products = active
    ? await prisma.product.findMany({
        where: buildProductWhere({ direction: active.code }),
        include: { images: { orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
      })
    : [];

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ background: "var(--focus-panel)", borderRadius: 10, padding: 32, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <DirectionWheelNav directions={directions} activeCode={active?.code} />
        <div style={{ color: "var(--focus-text)", flex: 1, minWidth: 260 }}>
          {active ? (
            <>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--brass)", fontWeight: 600 }}>
                {active.name} · {active.sanskritName}{active.element ? ` · ${active.element}` : ""}
              </div>
              <h1 style={{ color: "var(--focus-text)", margin: "8px 0" }}>{active.microcopy}</h1>
              <p style={{ color: "var(--focus-muted)", fontSize: 14 }}>{active.governs}</p>
            </>
          ) : (
            <>
              <h1 style={{ color: "var(--focus-text)" }}>Vastu doesn&apos;t treat your home as one room. Neither do we.</h1>
              <p style={{ color: "var(--focus-muted)", fontSize: 14 }}>Tap a direction on the wheel to see only the pieces built for that zone.</p>
            </>
          )}
        </div>
      </div>
      {active && (
        <div style={{ marginTop: 26 }}>
          <ProductGrid products={products.map((p) => toCard(p, currency))} />
        </div>
      )}
    </div>
  );
}
