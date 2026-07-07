# Sarthak Arts — Plan 3: Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]` checkboxes.
> **Governing rule:** nothing hardcoded — statuses, categories, directions, metals all from the DB. Manual pricing (owner types the price; no engine).
> **Series:** Plan 3 of 5. Builds on `v0.2-storefront`.

**Goal:** Give the non-technical owner a real control panel: a sidebar-navigated admin with a dashboard, full product management (create/edit including the composition editor and manual price with change-logging), an orders queue with status progression, and an editable settings page — all live against the database.

**Scope note:** consultations, reviews, returns, CMS, social, analytics, and shipping-label *carrier integration* are later plans. Plan 3 = catalog + fulfillment + settings, the daily-operations core. The "generate shipping label" action is a stubbed placeholder button (real courier API is a later plan).

**Tech stack:** unchanged. Admin forms use server actions (no client form library). Authenticated admin pages move under a `(panel)` route group so they share a sidebar layout while `/admin/login` stays bare.

---

## Route restructure this plan performs

```
src/app/(admin)/admin/
  login/                       # unchanged (no sidebar)
  (panel)/
    layout.tsx                 # sidebar + logout (NEW)
    page.tsx                   # dashboard at /admin (NEW)
    products/page.tsx          # list (NEW)
    products/new/page.tsx      # create (NEW)
    products/[id]/page.tsx     # edit + composition editor (NEW)
    products/actions.ts        # create/update/price/composition server actions (NEW)
    orders/page.tsx            # MOVED from admin/orders + status filter
    orders/[id]/page.tsx       # MOVED + status-update control
    orders/actions.ts          # advanceStatus (NEW)
    settings/page.tsx          # editable settings (NEW)
    settings/actions.ts        # NEW
src/lib/orderflow.ts           # pure next-status helper (TESTED, NEW)
tests/orderflow.test.ts
```

---

### Task 1: Add stock to the product model (migration + seed backfill)

**Files:** MODIFY `prisma/schema.prisma`, `prisma/seed.ts`

- [ ] **Step 1: Add the field** — in `model Product`, after `baseCurrency`:

```prisma
  stockQuantity   Int                   @default(0)
```

- [ ] **Step 2: Add a low-stock threshold setting + per-product stock in the seed.** In `prisma/seed.ts`, add to the `settings` array:

```ts
    ["low_stock_threshold", 5],
```

And give each seeded product a stock value — change the product `create` in the upsert loop to include stock. Simplest: after the product upsert loop, set stock per slug:

```ts
  const stockBySlug: Record<string, number> = {
    "copper-vastu-kalash": 14,
    "brass-ashtadhatu-pyramid": 8,
    "silver-sri-yantra-plate": 3,
    "gold-accent-om-wall-panel": 0,
    "copper-brass-wind-chime": 21,
  };
  for (const [slug, stockQuantity] of Object.entries(stockBySlug))
    await db.product.update({ where: { slug }, data: { stockQuantity } });
```

(Place this just before `console.log("Seed complete.")`.)

- [ ] **Step 3: Migrate + reseed**

Run: `npx prisma migrate dev --name product_stock`
Then: `npm run db:seed`
Expected: migration applies, seed sets stock (yantra=3 → low, panel=0 → out).

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: product stock quantity + low-stock threshold setting"`

---

### Task 2: Order-flow helper (TDD)

**Files:** Create `src/lib/orderflow.ts`, `tests/orderflow.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from "vitest";
import { nextStatusCode } from "@/lib/orderflow";

const flow = ["confirmed", "packed", "shipped", "delivered"];

describe("nextStatusCode", () => {
  it("returns the next status in the flow", () => {
    expect(nextStatusCode("confirmed", flow)).toBe("packed");
    expect(nextStatusCode("packed", flow)).toBe("shipped");
  });
  it("returns null at the end of the flow", () => {
    expect(nextStatusCode("delivered", flow)).toBeNull();
  });
  it("returns null for a status not in the flow (e.g. cancelled)", () => {
    expect(nextStatusCode("cancelled", flow)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement `src/lib/orderflow.ts`**

```ts
export function nextStatusCode(current: string, flow: string[]): string | null {
  const i = flow.indexOf(current);
  if (i === -1 || i === flow.length - 1) return null;
  return flow[i + 1];
}

// The forward fulfillment flow, excluding terminal/side states.
export const FULFILLMENT_FLOW = ["confirmed", "packed", "shipped", "delivered"];
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: order fulfillment next-status helper (TDD)"`

---

### Task 3: Admin panel layout (sidebar) + move orders under it

**Files:** Create `src/app/(admin)/admin/(panel)/layout.tsx`; MOVE `admin/orders/*` → `admin/(panel)/orders/*`; Create logout action

- [ ] **Step 1: Move the existing orders pages into the panel group**

```bash
cd sarthak-arts/src/app/(admin)/admin
mkdir -p "(panel)"
git mv orders "(panel)/orders"
```

(If `git mv` fails because files are staged/untracked, use plain `mv orders "(panel)/orders"`.)

- [ ] **Step 2: Logout action** — create `src/app/(admin)/admin/(panel)/actions.ts`

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout(): Promise<void> {
  (await cookies()).delete("admin_session");
  redirect("/admin/login");
}
```

- [ ] **Step 3: Sidebar layout** — create `src/app/(admin)/admin/(panel)/layout.tsx`

```tsx
import Link from "next/link";
import { logout } from "./actions";

const NAV = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Orders", "/admin/orders"],
  ["Settings", "/admin/settings"],
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 200, background: "var(--focus-panel)", padding: "20px 12px", flexShrink: 0 }}>
        <div className="serif" style={{ color: "var(--focus-text)", fontSize: 16, padding: "0 8px 18px" }}>Sarthak Arts</div>
        {NAV.map(([label, href]) => (
          <Link key={href} href={href}
            style={{ display: "block", padding: "10px 12px", fontSize: 14, color: "var(--focus-muted)", textDecoration: "none", borderRadius: 6 }}>
            {label}
          </Link>
        ))}
        <form action={logout} style={{ marginTop: 20, padding: "0 8px" }}>
          <button className="btn-ghost" style={{ color: "var(--focus-muted)", borderColor: "var(--focus-muted)", fontSize: 12, padding: "6px 12px" }}>Sign out</button>
        </form>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Verify** — `npm run dev`, log in at `/admin/login` → lands on `/admin/orders` (still), now with the dark sidebar. Sidebar links present. Sign out clears session → back to login.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: admin panel sidebar layout; move orders under (panel) group"`

---

### Task 4: Dashboard at /admin

**Files:** Create `src/app/(admin)/admin/(panel)/page.tsx`

- [ ] **Step 1: Implement the dashboard** — today's revenue, order count, low-stock count, and a "needs attention" list

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Dashboard() {
  const threshold = await getSetting<number>("low_stock_threshold", 5);
  const since = startOfToday();
  const [todayOrders, lowStock, recent] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since } } }),
    prisma.product.findMany({ where: { stockQuantity: { lte: threshold }, status: "live" }, orderBy: { stockQuantity: "asc" } }),
    prisma.order.findMany({ include: { status: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const revenueToday = todayOrders.reduce((s, o) => s + o.totalMinor, 0);

  const card = (label: string, value: string, sub?: string) => (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div className="serif" style={{ fontSize: 24, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, marginTop: 4, color: "var(--ink-muted)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Good morning</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "16px 0 22px" }}>
        {card("Revenue, today", formatMoney(revenueToday, "INR"))}
        {card("Orders, today", String(todayOrders.length))}
        {card("Low stock", `${lowStock.length} item(s)`, `at or below ${threshold}`)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Recent orders</div>
          {recent.length === 0 && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>No orders yet.</p>}
          {recent.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
              <span className="num">{formatMoney(o.totalMinor, o.currency)}</span>
              <span style={{ color: "var(--ink-muted)" }}>{o.status.name}</span>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Low stock</div>
          {lowStock.length === 0 && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>All stocked.</p>}
          {lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
              <span className="num" style={{ color: p.stockQuantity === 0 ? "var(--critical)" : "var(--ink)" }}>{p.stockQuantity} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Point the login redirect at the dashboard** — in `src/app/(admin)/admin/login/actions.ts`, change the final `redirect("/admin/orders")` to `redirect("/admin")`.

- [ ] **Step 3: Verify** — log in → dashboard at `/admin` shows the test order in "recent orders", yantra (3) and panel (0) under low stock, today's revenue.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: admin dashboard with revenue, orders, low-stock"`

---

### Task 5: Products list

**Files:** Create `src/app/(admin)/admin/(panel)/products/page.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Verify** — `/admin/products` lists all 5 with category, direction, price, stock, status.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: admin products list"`

---

### Task 6: Product create/edit + composition editor + manual pricing

**Files:** Create `src/app/(admin)/admin/(panel)/products/actions.ts`, `products/new/page.tsx`, `products/[id]/page.tsx`

- [ ] **Step 1: Server actions** — create, update core fields (logging price changes), add/remove composition line

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createProduct(formData: FormData): Promise<void> {
  const name = String(formData.get("name"));
  const categoryId = Number(formData.get("categoryId"));
  const product = await prisma.product.create({
    data: {
      name,
      slug: slugify(name) || `product-${Date.now()}`,
      positioningLine: String(formData.get("positioningLine") ?? ""),
      placementNote: String(formData.get("placementNote") ?? ""),
      description: String(formData.get("description") ?? ""),
      careNote: String(formData.get("careNote") ?? ""),
      includedItems: String(formData.get("includedItems") ?? ""),
      basePriceMinor: Math.round(Number(formData.get("priceRupees") ?? 0) * 100),
      stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      status: String(formData.get("status") ?? "draft"),
      categoryId,
    },
  });
  const directionId = Number(formData.get("directionId"));
  if (directionId) await prisma.productDirection.create({ data: { productId: product.id, directionId } });
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
  const newPriceMinor = Math.round(Number(formData.get("priceRupees") ?? 0) * 100);

  await prisma.product.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      positioningLine: String(formData.get("positioningLine") ?? ""),
      placementNote: String(formData.get("placementNote") ?? ""),
      description: String(formData.get("description") ?? ""),
      careNote: String(formData.get("careNote") ?? ""),
      includedItems: String(formData.get("includedItems") ?? ""),
      basePriceMinor: newPriceMinor,
      stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      status: String(formData.get("status") ?? "draft"),
      isFinalSale: formData.get("isFinalSale") === "on",
    },
  });

  if (newPriceMinor !== existing.basePriceMinor) {
    await prisma.productPriceHistory.create({
      data: { productId: id, oldPriceMinor: existing.basePriceMinor, newPriceMinor },
    });
  }
  revalidatePath(`/admin/products/${id}`);
}

export async function addComposition(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const metalId = formData.get("metalId") ? Number(formData.get("metalId")) : null;
  const gemstoneId = formData.get("gemstoneId") ? Number(formData.get("gemstoneId")) : null;
  await prisma.productComposition.create({
    data: {
      productId,
      metalId,
      gemstoneId,
      weightGrams: formData.get("weightGrams") ? Number(formData.get("weightGrams")) : null,
      gemstoneQty: formData.get("gemstoneQty") ? Number(formData.get("gemstoneQty")) : null,
      label: (formData.get("label") as string) || null,
    },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function removeComposition(formData: FormData): Promise<void> {
  const id = Number(formData.get("compositionId"));
  const productId = Number(formData.get("productId"));
  await prisma.productComposition.delete({ where: { id } });
  revalidatePath(`/admin/products/${productId}`);
}
```

- [ ] **Step 2: Create page** — `products/new/page.tsx`

```tsx
import { prisma } from "@/lib/db";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const [categories, directions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
  ]);
  return (
    <div style={{ padding: "22px 26px", maxWidth: 620 }}>
      <h1>Add product</h1>
      <form action={createProduct}>
        <label>Name</label><input name="name" required />
        <label>One-line positioning</label><input name="positioningLine" />
        <label>Placement note</label><textarea name="placementNote" rows={2} />
        <label>Description</label><textarea name="description" rows={3} />
        <label>Care note</label><input name="careNote" />
        <label>What&apos;s included</label><input name="includedItems" />
        <label>Category</label>
        <select name="categoryId" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label>Direction</label>
        <select name="directionId"><option value="">—</option>{directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <label>Price (₹)</label><input name="priceRupees" type="number" step="0.01" required />
        <label>Stock quantity</label><input name="stockQuantity" type="number" defaultValue={0} />
        <label>Status</label>
        <select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="live">Live</option><option value="archived">Archived</option></select>
        <button style={{ marginTop: 16 }}>Create product</button>
      </form>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Add composition (metals/gemstones) after creating, on the edit screen.</p>
    </div>
  );
}
```

- [ ] **Step 3: Edit page** — `products/[id]/page.tsx` (core form + manual price + composition editor)

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateProduct, addComposition, removeComposition } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const [product, metals, gemstones, priceHistory] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" } }, directions: { include: { direction: true } } },
    }),
    prisma.metal.findMany(),
    prisma.gemstone.findMany(),
    prisma.productPriceHistory.findMany({ where: { productId }, orderBy: { changedAt: "desc" }, take: 5 }),
  ]);
  if (!product) notFound();

  return (
    <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
      <div>
        <h1>Edit — {product.name}</h1>
        <form action={updateProduct}>
          <input type="hidden" name="id" value={product.id} />
          <label>Name</label><input name="name" defaultValue={product.name} required />
          <label>One-line positioning</label><input name="positioningLine" defaultValue={product.positioningLine} />
          <label>Placement note</label><textarea name="placementNote" rows={2} defaultValue={product.placementNote} />
          <label>Description</label><textarea name="description" rows={3} defaultValue={product.description} />
          <label>Care note</label><input name="careNote" defaultValue={product.careNote} />
          <label>What&apos;s included</label><input name="includedItems" defaultValue={product.includedItems} />
          <label>Stock quantity</label><input name="stockQuantity" type="number" defaultValue={product.stockQuantity} />
          <label>Status</label>
          <select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="live">Live</option><option value="archived">Archived</option></select>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <input type="checkbox" name="isFinalSale" defaultChecked={product.isFinalSale} style={{ width: "auto" }} /> Final sale (no returns)
          </label>
          <label>Price (₹) — you set this directly</label>
          <input name="priceRupees" type="number" step="0.01" defaultValue={(product.basePriceMinor / 100).toString()} required />
          <button style={{ marginTop: 16 }}>Save changes</button>
        </form>

        <h3 style={{ marginTop: 28 }}>Composition</h3>
        <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>What the piece is made of — for the listing and certificate. Separate from price.</p>
        <table>
          <tbody>
            {product.composition.map((c) => (
              <tr key={c.id}>
                <td>{c.metal?.name ?? c.gemstone?.name}{c.label ? ` (${c.label})` : ""}</td>
                <td className="num">{c.weightGrams ? `${c.weightGrams}g` : c.gemstoneQty ?? ""}</td>
                <td>
                  <form action={removeComposition}>
                    <input type="hidden" name="compositionId" value={c.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addComposition} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
          <input type="hidden" name="productId" value={product.id} />
          <div><label>Metal</label><select name="metalId" style={{ width: 120 }}><option value="">—</option>{metals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label>Weight (g)</label><input name="weightGrams" type="number" step="0.1" style={{ width: 90 }} /></div>
          <div><label>Gemstone</label><select name="gemstoneId" style={{ width: 120 }}><option value="">—</option>{gemstones.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div><label>Qty</label><input name="gemstoneQty" type="number" style={{ width: 60 }} /></div>
          <div><label>Label</label><input name="label" style={{ width: 120 }} /></div>
          <button className="btn-ghost" style={{ padding: "8px 14px" }}>+ Add line</button>
        </form>
      </div>

      <aside style={{ border: "1px solid var(--brass)", borderRadius: 8, padding: 16, background: "rgba(184,134,62,0.06)", height: "fit-content" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>Price — your call</div>
        <div className="num" style={{ fontSize: 22, margin: "8px 0" }}>{formatMoney(product.basePriceMinor, product.baseCurrency)}</div>
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>No automated suggestion — this is always your number. Other currencies convert from it automatically.</p>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginTop: 16 }}>Price history</div>
        {priceHistory.length === 0 && <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>No changes yet.</p>}
        {priceHistory.map((h) => (
          <div key={h.id} style={{ fontSize: 12, color: "var(--ink-muted)", padding: "4px 0" }}>
            {h.oldPriceMinor ? formatMoney(h.oldPriceMinor, "INR") : "—"} → {formatMoney(h.newPriceMinor, "INR")}
          </div>
        ))}
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Verify** — Create a product → lands on edit. Change its price → save → price history shows the change. Add a composition line (Silver, 200g) → appears; Remove → gone. Set status Live, stock 10 → shows in products list and on the storefront `/collection`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: product create/edit with composition editor and manual pricing"`

---

### Task 7: Orders queue with status filter + status advancement

**Files:** MODIFY `src/app/(admin)/admin/(panel)/orders/page.tsx` and `orders/[id]/page.tsx`; Create `orders/actions.ts`

- [ ] **Step 1: Status-advance action** — `orders/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { nextStatusCode, FULFILLMENT_FLOW } from "@/lib/orderflow";

export async function advanceStatus(formData: FormData): Promise<void> {
  const orderId = Number(formData.get("orderId"));
  const currentCode = String(formData.get("currentCode"));
  const nextCode = nextStatusCode(currentCode, FULFILLMENT_FLOW);
  if (!nextCode) return;
  const next = await prisma.orderStatus.findUniqueOrThrow({ where: { code: nextCode } });
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { statusId: next.id } }),
    prisma.orderStatusHistory.create({ data: { orderId, statusId: next.id, note: `Advanced to ${next.name}` } }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
```

- [ ] **Step 2: Orders list with status filter tabs** — replace `orders/page.tsx`

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const statuses = await prisma.orderStatus.findMany({ orderBy: { displayOrder: "asc" } });
  const orders = await prisma.order.findMany({
    where: status ? { status: { code: status } } : {},
    include: { status: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Orders</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0 16px", flexWrap: "wrap" }}>
        <Link href="/admin/orders" style={{ fontSize: 13, padding: "4px 12px", border: "1px solid var(--line)", borderRadius: 20, textDecoration: "none", background: !status ? "var(--ink)" : "transparent", color: !status ? "var(--ground)" : "var(--ink-muted)" }}>All</Link>
        {statuses.map((s) => (
          <Link key={s.code} href={`/admin/orders?status=${s.code}`} style={{ fontSize: 13, padding: "4px 12px", border: "1px solid var(--line)", borderRadius: 20, textDecoration: "none", background: status === s.code ? "var(--ink)" : "transparent", color: status === s.code ? "var(--ground)" : "var(--ink-muted)" }}>{s.name}</Link>
        ))}
      </div>
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th /></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>{o.email}</td>
              <td className="num">{formatMoney(o.totalMinor, o.currency)}</td>
              <td>{o.status.name}</td>
              <td><Link href={`/admin/orders/${o.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No orders in this view.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Order detail with status control + history + shipping-label stub** — replace `orders/[id]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { nextStatusCode, FULFILLMENT_FLOW } from "@/lib/orderflow";
import { advanceStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true, status: true, certificates: true, payments: true, statusHistory: { include: { status: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const addr = order.shippingAddress as { name: string; line1: string; city: string; state: string; postalCode: string; country: string };
  const next = nextStatusCode(order.status.code, FULFILLMENT_FLOW);

  return (
    <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
      <div>
        <h1>{order.orderNumber} — {order.status.name}</h1>
        <p style={{ color: "var(--ink-muted)" }}>{order.email} · {order.phone}</p>
        <p style={{ fontSize: 14 }}>{addr.name}, {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}</p>
        <table style={{ marginTop: 12 }}>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}><td>{i.name} × {i.quantity}</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td></tr>
            ))}
            <tr><td>Shipping</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(order.shippingMinor, order.currency)}</td></tr>
            <tr><td>Tax</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(order.taxMinor, order.currency)}</td></tr>
            <tr><td><strong>Total</strong></td><td className="num" style={{ textAlign: "right" }}><strong>{formatMoney(order.totalMinor, order.currency)}</strong></td></tr>
          </tbody>
        </table>
        <h3 style={{ marginTop: 20 }}>Certificates</h3>
        <ul>{order.certificates.map((c) => <li key={c.id}><a href={`/api/admin/certificates/${c.id}`}>{c.storageKey}</a></li>)}</ul>
      </div>
      <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Fulfillment</div>
        {order.statusHistory.map((h) => (
          <div key={h.id} style={{ fontSize: 13, padding: "4px 0", color: "var(--ink)" }}>✓ {h.status.name}</div>
        ))}
        {next ? (
          <form action={advanceStatus} style={{ marginTop: 10 }}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="currentCode" value={order.status.code} />
            <button style={{ width: "100%" }}>Mark as {next}</button>
          </form>
        ) : (
          <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 10 }}>Fulfillment complete.</p>
        )}
        <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} disabled title="Courier integration comes in a later plan">Generate shipping label</button>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Verify** — `/admin/orders` shows the test order; filter tabs work; open it → "Mark as packed" advances status, history grows (Confirmed ✓ → Packed ✓), repeat through Shipped/Delivered; then "Fulfillment complete." The shipping-label button is present but disabled.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: orders queue with status filter and fulfillment advancement"`

---

### Task 8: Settings page

**Files:** Create `src/app/(admin)/admin/(panel)/settings/page.tsx`, `settings/actions.ts`

- [ ] **Step 1: Actions** — `settings/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function saveGeneralSettings(formData: FormData): Promise<void> {
  const storeName = String(formData.get("storeName"));
  const announcementLines = String(formData.get("announcementLines"))
    .split("\n").map((l) => l.trim()).filter(Boolean);
  await prisma.setting.upsert({ where: { key: "store_name" }, update: { value: storeName }, create: { key: "store_name", value: storeName } });
  await prisma.setting.upsert({ where: { key: "announcement_lines" }, update: { value: announcementLines }, create: { key: "announcement_lines", value: announcementLines } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
```

- [ ] **Step 2: Page** — `settings/page.tsx`

```tsx
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { saveGeneralSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [storeName, lines, currencies, gateways, zones, taxRules] = await Promise.all([
    getSetting<string>("store_name", "Sarthak Arts"),
    getSetting<string[]>("announcement_lines", []),
    prisma.currency.findMany({ orderBy: { isDefault: "desc" } }),
    prisma.paymentGateway.findMany(),
    prisma.shippingZone.findMany({ include: { rates: true } }),
    prisma.taxRule.findMany(),
  ]);
  return (
    <div style={{ padding: "22px 26px", maxWidth: 640 }}>
      <h1>Settings</h1>

      <form action={saveGeneralSettings} style={{ marginTop: 12 }}>
        <label>Store name</label><input name="storeName" defaultValue={storeName} />
        <label>Announcement bar lines (one per line)</label>
        <textarea name="announcementLines" rows={3} defaultValue={lines.join("\n")} />
        <button style={{ marginTop: 12 }}>Save</button>
      </form>

      <h3 style={{ marginTop: 28 }}>Currencies</h3>
      <table><tbody>{currencies.map((c) => <tr key={c.code}><td>{c.code} {c.isDefault ? "(base)" : ""}</td><td className="num">rate {String(c.ratePerBase)}</td><td>{c.active ? "active" : "off"}</td></tr>)}</tbody></table>

      <h3 style={{ marginTop: 20 }}>Payment gateways</h3>
      <table><tbody>{gateways.map((g) => <tr key={g.code}><td>{g.name}</td><td>{g.active ? "active" : "off"}</td></tr>)}</tbody></table>

      <h3 style={{ marginTop: 20 }}>Shipping &amp; tax</h3>
      <table><tbody>
        {zones.map((z) => <tr key={z.code}><td>{z.name}</td><td className="num">{z.rates[0] ? `${(z.rates[0].amountMinor / 100).toLocaleString()} base` : "—"}</td></tr>)}
        {taxRules.map((t) => <tr key={t.id}><td>Tax: {t.region}</td><td className="num">{String(t.ratePercent)}%</td></tr>)}
      </tbody></table>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Currency rates, gateways, shipping and tax editing UIs arrive in a later plan; values are seeded and DB-editable meanwhile.</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `/admin/settings` shows store name + announcement lines editable; change a line, save → the storefront announcement bar updates. Currencies/gateways/shipping/tax display as read-only tables.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: admin settings - editable store name/announcements, config overview"`

---

### Task 9: Plan 3 verification

- [ ] **Step 1:** `npm test` → all green (adds orderflow tests).
- [ ] **Step 2:** `npx tsc --noEmit` clean; `npx next build` succeeds.
- [ ] **Step 3: Browser walk** (`npm run dev`, log in):
  - Dashboard shows revenue/orders/low-stock + recent orders + low-stock lists
  - Sidebar navigates between Dashboard, Products, Orders, Settings; Sign out works
  - Create a product → edit → change price (history logs) → add/remove composition → set Live → appears on storefront
  - Orders: filter tabs, open order, advance status through the flow, history grows, shipping-label button disabled
  - Settings: edit store name + announcement → storefront reflects it
  - Storefront + guest checkout from Plans 1–2 still work
- [ ] **Step 4: Tag** — `git commit --allow-empty -m "chore: plan 3 admin panel complete" && git tag v0.3-admin`

---

## Self-review notes

- **Scope honesty:** consultations/reviews/returns/CMS/social/analytics and courier-label integration are deferred (Plans 4–5); the shipping-label button is a visible-but-disabled placeholder, not a silent omission.
- **Manual pricing:** the edit screen's price is a plain field the owner types; every change writes `ProductPriceHistory`. No engine, matching the confirmed decision.
- **Modularity audit:** statuses drive the order flow and filter tabs from the DB; categories/directions/metals/gemstones populate the product forms from the DB; settings are rows. The one code constant is `FULFILLMENT_FLOW` (the ordered fulfillment path) — acceptable as structural workflow, and it reads status *names* from the DB rows it references.
- **Type consistency:** `nextStatusCode`/`FULFILLMENT_FLOW` used identically in the order action and detail page; composition add/remove actions and the edit page agree on field names.
