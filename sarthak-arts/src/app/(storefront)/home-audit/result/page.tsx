import type { Metadata } from "next";
import Link from "next/link";
import "../../content-pages.css";
import { prisma } from "@/lib/db";
import { buildProductWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your recommendations — Sarthak Arts" };

export default async function AuditResult({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;

  // Answers arrive as q_0, q_1, … (one per question); keep `a` for backward compat.
  const raw: string[] = [];
  for (const [k, v] of Object.entries(sp)) {
    if (k === "a" || k.startsWith("q_")) {
      if (Array.isArray(v)) raw.push(...v);
      else if (v) raw.push(v);
    }
  }
  const ids = raw.map(Number).filter(Boolean);
  const rules = ids.length ? await prisma.auditAnswerRule.findMany({ where: { id: { in: ids } } }) : [];

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
    <div className="pg-root">
      <div className="pg-wrap">
        <div className="pg-hero">
          <div className="pg-eyebrow">Your audit</div>
          <h1 className="serif">Your placement recommendations</h1>
          {directions.length > 0
            ? <p className="pg-lead">Based on your answers, these are the directions to focus on in your home.</p>
            : <p className="pg-lead">Here&apos;s where to begin for your space.</p>}
        </div>

        {directions.length > 0 && (
          <div className="audit-focus">
            {directions.map((d) => <span key={d.id} className="chip">{d.name}</span>)}
          </div>
        )}

        {recommendConsult && (
          <div className="audit-consult">
            <h2 className="serif">Your layout sounds unusual — a consultation will help</h2>
            <p>A 20-minute Vāstu placement call will tell you more than any product page can — a specialist reads your floor plan and guides each corner.</p>
            <Link href="/consultation?type=vastu-placement" className="pg-btn primary">Book a consultation
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        )}

        {products.length > 0 ? (
          <>
            <div className="srch-meta" style={{ marginTop: 8 }}>Pieces made for your directions</div>
            <ProductGrid products={products.map((p) => toCard(p, currency))} />
          </>
        ) : (
          !recommendConsult && (
            <div className="srch-empty">
              <div className="om" aria-hidden="true">ॐ</div>
              <h2 className="serif">Let&apos;s find your piece</h2>
              <p>Explore the full collection to get started, or retake the audit.</p>
              <div className="srch-chips">
                <Link href="/collection" className="srch-chip">Explore the collection</Link>
                <Link href="/home-audit" className="srch-chip">Retake the audit</Link>
              </div>
            </div>
          )
        )}

        {(products.length > 0 || recommendConsult) && (
          <div className="craft-cta" style={{ marginTop: 30 }}>
            <Link href="/home-audit" className="pg-btn ghost">↺ Retake the audit</Link>
          </div>
        )}
      </div>
    </div>
  );
}
