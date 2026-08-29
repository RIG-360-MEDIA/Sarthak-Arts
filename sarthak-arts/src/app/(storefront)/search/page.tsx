import type { Metadata } from "next";
import "../content-pages.css";
import { prisma } from "@/lib/db";
import { buildSearchWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export const metadata: Metadata = { title: "Search — Sarthak Arts" };

const SUGGESTIONS = ["Kalash", "Yantra", "Copper", "Wind chime", "Northeast"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const currency = await resolveDisplayCurrency();
  const products = query
    ? await prisma.product.findMany({
        where: buildSearchWhere(query),
        include: { images: { orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
      })
    : [];

  return (
    <div className="pg-root">
      <div className="pg-wrap">
        <div className="pg-hero">
          <div className="pg-eyebrow">Search</div>
          <h1 className="serif">Find your piece</h1>
        </div>

        <form className="srch-bar" method="get" action="/search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input name="q" defaultValue={q} placeholder="Search by name, metal, direction…" aria-label="Search" autoFocus={!query} />
          <button type="submit">Search</button>
        </form>

        {query ? (
          products.length > 0 ? (
            <>
              <div className="srch-meta"><b>{products.length}</b> {products.length === 1 ? "piece" : "pieces"} for &ldquo;{query}&rdquo;</div>
              <ProductGrid products={products.map((p) => toCard(p, currency))} />
            </>
          ) : (
            <div className="srch-empty">
              <div className="om" aria-hidden="true">ॐ</div>
              <h2 className="serif">Nothing found for &ldquo;{query}&rdquo;</h2>
              <p>Try another word, or browse by one of these:</p>
              <div className="srch-chips">
                {SUGGESTIONS.map((s) => <a key={s} href={`/search?q=${encodeURIComponent(s)}`} className="srch-chip">{s}</a>)}
              </div>
            </div>
          )
        ) : (
          <div className="srch-empty">
            <div className="om" aria-hidden="true">ॐ</div>
            <h2 className="serif">What are you looking for?</h2>
            <p>Search for a piece by name, the metal it&apos;s cast in, or the direction it&apos;s made for.</p>
            <div className="srch-chips">
              {SUGGESTIONS.map((s) => <a key={s} href={`/search?q=${encodeURIComponent(s)}`} className="srch-chip">{s}</a>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
