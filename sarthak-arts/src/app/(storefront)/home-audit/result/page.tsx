import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildProductWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

export default async function AuditResult({ searchParams }: { searchParams: Promise<{ a?: string | string[] }> }) {
  const sp = await searchParams;
  const ids = (Array.isArray(sp.a) ? sp.a : sp.a ? [sp.a] : []).map(Number).filter(Boolean);
  const rules = await prisma.auditAnswerRule.findMany({ where: { id: { in: ids } } });

  const recommendConsult = rules.some((r) => r.recommendConsult);
  const dirCodes = [...new Set(rules.map((r) => r.mapsToDirection).filter((c): c is string => !!c))];
  const currency = await resolveDisplayCurrency();

  const products = dirCodes.length
    ? await prisma.product.findMany({
        where: { ...buildProductWhere({}), directions: { some: { direction: { code: { in: dirCodes } } } } },
        include: { images: { orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
        take: 8,
      })
    : [];

  const directions = await prisma.direction.findMany({ where: { code: { in: dirCodes } } });

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Your placement recommendations</h1>
      {directions.length > 0 && (
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
          Based on your answers, focus on: {directions.map((d) => d.name).join(", ")}.
        </p>
      )}

      {recommendConsult && (
        <div style={{ background: "var(--focus-panel)", color: "var(--focus-text)", borderRadius: 10, padding: 20, margin: "16px 0" }}>
          <div className="serif" style={{ fontSize: 17 }}>Your layout sounds unusual — a consultation will help.</div>
          <p style={{ color: "var(--focus-muted)", fontSize: 13 }}>A 20-minute Vastu placement call will tell you more than any product page can.</p>
          <Link href="/consultation?type=vastu-placement"><button style={{ marginTop: 10 }}>Book a consultation</button></Link>
        </div>
      )}

      {products.length > 0 ? (
        <div style={{ marginTop: 16 }}><ProductGrid products={products.map((p) => toCard(p, currency))} /></div>
      ) : (
        !recommendConsult && <p style={{ color: "var(--ink-muted)" }}>Explore the <Link href="/collection">full collection</Link> to get started.</p>
      )}
    </div>
  );
}
