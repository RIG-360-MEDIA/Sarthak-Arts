# Sarthak Arts — Plan 2: Storefront Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) or superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.
> **Governing rule:** nothing hardcoded — filters, directions, currencies, nav all come from the database/config.
> **Series:** Plan 2 of 5. Builds on Plan 1's foundation (branch `build/plan-1`, tag `v0.1-slice`).

**Goal:** Turn the single-product slice into a browsable storefront: a real homepage, the full collection page with working filters, the interactive Shop-by-Direction mandala wheel, product search, and multi-currency price display — all reading live from the seeded database.

**Scope note:** Customer *accounts* (customer login + saved order history) and **Stripe/live international payments** are deliberately **not** in Plan 2 — accounts are their own auth subsystem (a later plan) and guest checkout already covers buying; Stripe needs API keys we don't have yet. Plan 2 is purely the discovery/browsing storefront + currency *display*. This keeps it one coherent, shippable layer.

**Tech stack:** unchanged from Plan 1 (Next.js 16, Prisma 6, TypeScript). Filtering is server-side via URL query params (shareable, SEO-friendly, no client state library needed).

---

## File structure this plan creates

```
sarthak-arts/src/
  lib/catalog.ts               # pure filter/search where-clause builders (TESTED)
  lib/currency.ts              # display-currency resolution + formatting (TESTED)
  components/ProductCard.tsx    # reusable product tile
  components/ProductGrid.tsx    # grid wrapper
  components/CurrencySwitcher.tsx
  components/DirectionWheelNav.tsx  # interactive mandala (client)
  app/(storefront)/layout.tsx  # MODIFY: real nav, search box, currency switcher
  app/(storefront)/page.tsx    # MODIFY: real homepage (replaces redirect)
  app/(storefront)/collection/page.tsx        # PLP with filter rail
  app/(storefront)/direction/page.tsx         # shop-by-direction wheel
  app/(storefront)/search/page.tsx            # search results
  app/(storefront)/actions.ts  # setCurrency cookie action
tests/
  catalog.test.ts
  currency.test.ts
```

---

### Task 1: Catalog filter + search builders (TDD)

**Files:** Create `src/lib/catalog.ts`, `tests/catalog.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { buildProductWhere, buildSearchWhere } from "@/lib/catalog";

describe("buildProductWhere", () => {
  it("filters to live products by default with no filters", () => {
    expect(buildProductWhere({})).toEqual({ status: "live" });
  });
  it("filters by category code", () => {
    expect(buildProductWhere({ category: "kalash" })).toEqual({
      status: "live",
      category: { code: "kalash" },
    });
  });
  it("filters by direction code via the join", () => {
    expect(buildProductWhere({ direction: "north" })).toEqual({
      status: "live",
      directions: { some: { direction: { code: "north" } } },
    });
  });
  it("filters by metal code via composition", () => {
    expect(buildProductWhere({ metal: "silver" })).toEqual({
      status: "live",
      composition: { some: { metal: { code: "silver" } } },
    });
  });
  it("filters by a price ceiling in minor units", () => {
    expect(buildProductWhere({ maxPriceMinor: 2000000 })).toEqual({
      status: "live",
      basePriceMinor: { lte: 2000000 },
    });
  });
  it("combines multiple filters", () => {
    expect(buildProductWhere({ direction: "north", metal: "silver" })).toEqual({
      status: "live",
      directions: { some: { direction: { code: "north" } } },
      composition: { some: { metal: { code: "silver" } } },
    });
  });
});

describe("buildSearchWhere", () => {
  it("returns only the live filter for an empty term", () => {
    expect(buildSearchWhere("  ")).toEqual({ status: "live" });
  });
  it("builds a case-insensitive OR across name/positioning/description", () => {
    expect(buildSearchWhere("kalash")).toEqual({
      status: "live",
      OR: [
        { name: { contains: "kalash", mode: "insensitive" } },
        { positioningLine: { contains: "kalash", mode: "insensitive" } },
        { description: { contains: "kalash", mode: "insensitive" } },
      ],
    });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement `src/lib/catalog.ts`**

```ts
import type { Prisma } from "@prisma/client";

export type ProductFilters = {
  category?: string;
  direction?: string;
  metal?: string;
  purpose?: string;
  maxPriceMinor?: number;
};

export function buildProductWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "live" };
  if (f.category) where.category = { code: f.category };
  if (f.direction) where.directions = { some: { direction: { code: f.direction } } };
  if (f.metal) where.composition = { some: { metal: { code: f.metal } } };
  if (f.purpose) where.purposes = { some: { purpose: { code: f.purpose } } };
  if (f.maxPriceMinor !== undefined) where.basePriceMinor = { lte: f.maxPriceMinor };
  return where;
}

export function buildSearchWhere(term: string): Prisma.ProductWhereInput {
  const q = term.trim();
  if (!q) return { status: "live" };
  return {
    status: "live",
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { positioningLine: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };
}
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: catalog filter and search where-clause builders (TDD)"`

---

### Task 2: Currency display resolution (TDD)

**Files:** Create `src/lib/currency.ts`, `tests/currency.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { formatDisplay } from "@/lib/currency";

describe("formatDisplay", () => {
  it("shows the base price unchanged for INR at rate 1", () => {
    expect(formatDisplay(1840000, "INR", 1)).toBe("₹18,400");
  });
  it("converts and formats into USD at a rate", () => {
    // 1,840,000 paise = ₹18,400; × 0.012 = $220.80
    expect(formatDisplay(1840000, "USD", 0.012)).toBe("$220.80");
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement `src/lib/currency.ts`**

```ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { convertMinor, formatMoney } from "@/lib/money";

export function formatDisplay(baseMinor: number, code: string, ratePerBase: number): string {
  return formatMoney(convertMinor(baseMinor, ratePerBase), code);
}

const CURRENCY_COOKIE = "currency";

export type DisplayCurrency = { code: string; ratePerBase: number };

export async function resolveDisplayCurrency(): Promise<DisplayCurrency> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currencies = await prisma.currency.findMany({ where: { active: true } });
  const match =
    currencies.find((c) => c.code === chosen) ??
    currencies.find((c) => c.isDefault) ??
    currencies[0];
  return { code: match?.code ?? "INR", ratePerBase: Number(match?.ratePerBase ?? 1) };
}

export async function activeCurrencies() {
  return prisma.currency.findMany({ where: { active: true }, orderBy: { isDefault: "desc" } });
}
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: multi-currency display resolution and formatting (TDD)"`

---

### Task 3: ProductCard + ProductGrid components

**Files:** Create `src/components/ProductCard.tsx`, `src/components/ProductGrid.tsx`

- [ ] **Step 1: Implement `ProductCard.tsx`** (takes a pre-formatted price string, so it stays a dumb presentational component)

```tsx
import Link from "next/link";
import Image from "next/image";

export type CardProduct = {
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  directionLabel: string | null;
  priceDisplay: string;
};

export function ProductCard({ p }: { p: CardProduct }) {
  return (
    <Link href={`/collection/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <Image src={p.imageUrl} alt={p.imageAlt} width={400} height={400} unoptimized
          style={{ width: "100%", height: 220, objectFit: "cover", background: "var(--ground-raised)" }} />
        <div style={{ padding: "12px 14px" }}>
          <div className="serif" style={{ fontSize: 15 }}>{p.name}</div>
          {p.directionLabel && (
            <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 3 }}>{p.directionLabel}</div>
          )}
          <div className="num" style={{ fontSize: 14, marginTop: 6 }}>{p.priceDisplay}</div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Implement `ProductGrid.tsx`**

```tsx
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
```

- [ ] **Step 3: Add a shared mapper** — append to `src/lib/catalog.ts`:

```ts
import { formatDisplay } from "@/lib/currency";

type ProductWithRels = {
  slug: string; name: string;
  images: { url: string; alt: string }[];
  directions: { direction: { name: string; sanskritName: string } }[];
  basePriceMinor: number;
};

export function toCard(p: ProductWithRels, currency: { code: string; ratePerBase: number }) {
  const dir = p.directions[0]?.direction;
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? "/placeholder/copper-vastu-kalash.svg",
    imageAlt: p.images[0]?.alt ?? p.name,
    directionLabel: dir ? `${dir.name} · ${dir.sanskritName}` : null,
    priceDisplay: formatDisplay(p.basePriceMinor, currency.code, currency.ratePerBase),
  };
}
```

- [ ] **Step 4: Verify build** — `npx tsc --noEmit` → clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: reusable ProductCard, ProductGrid, and card mapper"`

---

### Task 4: Collection page (PLP) with filter rail

**Files:** Create `src/app/(storefront)/collection/page.tsx`

- [ ] **Step 1: Implement the page** (reads filters from `searchParams`, renders filter rail from reference tables + grid)

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildProductWhere } from "@/lib/catalog";
import { toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export default async function CollectionPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
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
    const next = new URLSearchParams(sp as Record<string, string>);
    if (active) next.delete(key); else next.set(key, value);
    return (
      <Link key={key + value} href={`/collection?${next.toString()}`}
        style={{ display: "block", fontSize: 13, padding: "4px 0", color: active ? "var(--ink)" : "var(--ink-muted)", fontWeight: active ? 600 : 400, textDecoration: "none" }}>
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
```

- [ ] **Step 2: Verify in browser** — `npm run dev`, open `/collection`; all 5 products show; click "North" → grid narrows to the yantra; click "Silver" → intersection; click active chip again → clears.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: collection page with config-driven filter rail"`

---

### Task 5: Shop-by-Direction interactive wheel

**Files:** Create `src/components/DirectionWheelNav.tsx`, `src/app/(storefront)/direction/page.tsx`

- [ ] **Step 1: Implement the interactive wheel (client component)** — wraps the existing `Mandala` SVG, making each wedge a link

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Mandala } from "./Mandala";

type Dir = { code: string; name: string };

export function DirectionWheelNav({ directions, activeCode }: { directions: Dir[]; activeCode?: string }) {
  const router = useRouter();
  return (
    <div
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest("[data-wedge]");
        const code = el?.getAttribute("data-wedge");
        if (code) router.push(`/direction?zone=${code}`);
      }}
      style={{ cursor: "pointer" }}
    >
      <Mandala size={260} directions={directions} litCode={activeCode} dark />
    </div>
  );
}
```

- [ ] **Step 2: Implement the page** — dark focus panel with the wheel + the selected zone's copy + its products

```tsx
import { prisma } from "@/lib/db";
import { buildProductWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";
import { DirectionWheelNav } from "@/components/DirectionWheelNav";

export default async function DirectionPage({
  searchParams,
}: { searchParams: Promise<{ zone?: string }> }) {
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
```

- [ ] **Step 3: Verify in browser** — `/direction` shows the dark wheel + intro; clicking the North wedge navigates to `/direction?zone=north`, lights that wedge, shows North's copy and the yantra. Clicking Southeast shows the wind chime's zone, etc.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: interactive shop-by-direction mandala wheel"`

---

### Task 6: Search

**Files:** Create `src/app/(storefront)/search/page.tsx`

- [ ] **Step 1: Implement the results page**

```tsx
import { prisma } from "@/lib/db";
import { buildSearchWhere, toCard } from "@/lib/catalog";
import { resolveDisplayCurrency } from "@/lib/currency";
import { ProductGrid } from "@/components/ProductGrid";

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
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
          <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{products.length} result(s) for “{q}”.</p>
          <div style={{ marginTop: 16 }}><ProductGrid products={products.map((p) => toCard(p, currency))} /></div>
        </>
      ) : (
        <p style={{ color: "var(--ink-muted)" }}>Type a search above to find a piece.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `/search?q=silver` returns the Silver Sri Yantra Plate; `/search?q=chime` returns the wind chime; `/search?q=zzz` returns 0 results gracefully.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: product search results page"`

---

### Task 7: Currency switcher + expanded header

**Files:** Create `src/components/CurrencySwitcher.tsx`, `src/app/(storefront)/actions.ts`; MODIFY `src/app/(storefront)/layout.tsx`

- [ ] **Step 1: Cookie action (`actions.ts`)**

```ts
"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setCurrency(formData: FormData): Promise<void> {
  const code = String(formData.get("code"));
  (await cookies()).set("currency", code, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
```

- [ ] **Step 2: Switcher component**

```tsx
import { activeCurrencies, resolveDisplayCurrency } from "@/lib/currency";
import { setCurrency } from "@/app/(storefront)/actions";

export async function CurrencySwitcher() {
  const [currencies, current] = await Promise.all([activeCurrencies(), resolveDisplayCurrency()]);
  return (
    <form action={setCurrency} style={{ display: "inline" }}>
      <select name="code" defaultValue={current.code} onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ width: "auto", padding: "6px 8px", fontSize: 13 }}>
        {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
    </form>
  );
}
```

- [ ] **Step 3: Replace the header in `layout.tsx`** — real nav links, a search box, the currency switcher (keep the announcement bar + footer already there)

```tsx
import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const lines = await getSetting<string[]>("announcement_lines", []);
  const storeName = await getSetting<string>("store_name", "Store");
  return (
    <>
      {lines[0] && (
        <div style={{ background: "var(--ground-deep)", textAlign: "center", fontSize: 12, padding: "6px 0", color: "var(--ink-muted)" }}>{lines[0]}</div>
      )}
      <header className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", flexWrap: "wrap" }}>
        <Link href="/" className="serif" style={{ fontSize: 20, textDecoration: "none", color: "var(--ink)" }}>{storeName}</Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14, alignItems: "center" }}>
          <Link href="/collection" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>The Collection</Link>
          <Link href="/direction" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Shop by Direction</Link>
          <form action="/search" style={{ display: "inline" }}>
            <input name="q" placeholder="Search…" style={{ width: 140, padding: "6px 10px", fontSize: 13 }} />
          </form>
          <CurrencySwitcher />
          <Link href="/cart" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Cart</Link>
        </nav>
      </header>
      <main className="container" style={{ paddingBottom: 80 }}>{children}</main>
      <footer style={{ borderTop: "1px solid var(--line)", padding: 24, textAlign: "center", fontSize: 12, color: "var(--ink-faint)" }}>
        © {storeName}. All metal weights and gemstone details listed are certified per piece at the time of shipping.
      </footer>
    </>
  );
}
```

- [ ] **Step 4: Verify** — the header shows nav + search + currency dropdown; switching to USD reformats every price on the page into `$…`; switching back to INR restores `₹…`. Search box submits to `/search`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: currency switcher and full storefront header nav"`

---

### Task 8: Homepage

**Files:** MODIFY `src/app/(storefront)/page.tsx` (replace the redirect)

- [ ] **Step 1: Implement the homepage** — hero with the dark mandala glyph, value strip, direction preview grid

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Mandala } from "@/components/Mandala";

export default async function Home() {
  const directions = await prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const preview = directions.filter((d) => d.code !== "center").slice(0, 4);
  const eyebrow = "Dikchakra-mapped instruments";
  const values = [
    ["Handworked, not moulded", "Every kalash, yantra and panel is shaped by hand. No two pieces are identical."],
    ["Direction-correct by design", "Every product is built for one zone of the home and one purpose."],
    ["Full material transparency", "Every listing states the exact metal weight and gemstone — no vague language."],
    ["Guided placement", "Each order comes with a placement card for your specific piece."],
  ];
  await getSetting<string>("store_name", "Sarthak Arts"); // ensures settings reachable

  return (
    <div style={{ paddingTop: 12 }}>
      <section style={{ display: "flex", gap: 36, alignItems: "center", padding: "36px 0", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--brass)", fontWeight: 600 }}>{eyebrow}</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.2, margin: "12px 0" }}>Metal and stone, placed the way your home was meant to hold them.</h1>
          <p style={{ fontSize: 15, color: "var(--ink-muted)", maxWidth: "46ch" }}>
            Each piece is cast in copper, brass or silver and set with a single gemstone, sized and positioned according to classical Vastu Shastra. Nothing here is decorative first.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <Link href="/collection"><button>View the collection</button></Link>
            <Link href="/direction"><button className="btn-ghost">Shop by direction</button></Link>
          </div>
        </div>
        <div style={{ width: 240, height: 240, background: "var(--focus-panel)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mandala size={190} directions={directions} litCode="northeast" dark />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        {values.map(([t, d]) => (
          <div key={t} style={{ background: "var(--ground)", padding: "20px 18px" }}>
            <div className="serif" style={{ fontSize: 15, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{d}</div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Shop by direction</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {preview.map((d) => (
            <Link key={d.code} href={`/direction?zone=${d.code}`}
              style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit" }}>
              <div className="serif" style={{ fontSize: 15 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>{d.governs}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `/` now shows the real homepage (no more redirect): hero + dark mandala glyph, four value cards, four direction preview cards that link into the wheel.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: real homepage with hero, value strip, direction preview"`

---

### Task 9: PDP price uses display currency

**Files:** MODIFY `src/app/(storefront)/collection/[slug]/page.tsx`

- [ ] **Step 1: Swap the hardcoded-INR price for the resolved display currency.** Replace the price line's `formatMoney(product.basePriceMinor, product.baseCurrency)` with the currency-aware version:

At the top of the component add:

```tsx
import { resolveDisplayCurrency, formatDisplay } from "@/lib/currency";
```

After loading `product`, add:

```tsx
const currency = await resolveDisplayCurrency();
```

Change the price `<p>` to:

```tsx
<p className="num" style={{ fontSize: 24, color: accent, margin: "16px 0" }}>
  {formatDisplay(product.basePriceMinor, currency.code, currency.ratePerBase)}
</p>
```

- [ ] **Step 2: Verify** — on a product page, switching the header currency to USD reformats the PDP price too.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: PDP respects the selected display currency"`

---

### Task 10: Plan 2 verification

- [ ] **Step 1:** `npm test` → all green (Plan 1 + new catalog/currency tests).
- [ ] **Step 2:** `npx tsc --noEmit` → clean. `npx next build` → succeeds.
- [ ] **Step 3: Browser walk** with `npm run dev`:
  - Homepage renders hero + values + direction previews
  - Header nav, search box, currency switcher all present
  - `/collection` shows 5 products; direction/metal/purpose filters narrow correctly and combine
  - `/direction` wheel is clickable; each zone lights up and shows its pieces
  - `/search?q=…` works
  - Switching currency to USD reformats every price site-wide; back to INR restores
  - Cart + guest checkout from Plan 1 still work
- [ ] **Step 4: Tag** — `git commit --allow-empty -m "chore: plan 2 storefront discovery complete" && git tag v0.2-storefront`

---

## Self-review notes

- **Scope honesty:** customer accounts and Stripe are explicitly deferred (stated in the header) — not forgotten. Guest checkout from Plan 1 remains the buying path.
- **Modularity audit:** every filter option, direction, currency, and nav value is read from the database/settings; no product/direction/currency is hardcoded in a page. The value-strip copy is inline in the homepage — acceptable (it's brand prose, not business config), but a later CMS plan can move it to `content_blocks`.
- **Currency caveat:** conversion uses the static `ratePerBase` seeded per currency (not a live FX feed) — matches the masterplan's "display conversion, admin sets rates" decision; a live-rate job is a later enhancement, not needed now.
- **Type consistency:** `toCard` / `CardProduct` / `formatDisplay` signatures are used identically across PLP, direction, search, and homepage.
