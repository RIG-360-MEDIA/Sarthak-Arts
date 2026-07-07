# Sarthak Arts — Plan 5: Reviews & Returns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]` checkboxes.
> **Governing rule:** nothing hardcoded — return reasons, return window all from the DB/settings.
> **Series:** Plan 5 of 6. Builds on `v0.4-consultations`.

**Goal:** Close the post-purchase loop: verified-purchase **reviews** (submitted from a guest order-lookup, shown on product pages, moderated in admin) and a **returns** workflow (requested from the order-lookup within a window, approved/rejected/refunded in admin).

**Scope note:** since customer accounts are still deferred, both features hang off a **guest order-lookup** — enter order number + email to view your order and its post-purchase actions. This is the same pattern real guest-checkout stores use. Actual refund *money movement* reuses the (deferred) payment gateway — the return workflow tracks state through to `refunded`; wiring the gateway refund call is a one-liner once Razorpay keys exist.

---

## File structure

```
prisma/schema.prisma          # + Review, ReturnReason, ReturnRequest
prisma/seed.ts                # + return reasons, 1 sample review
src/lib/returns.ts            # canReturn() eligibility helper (TESTED)
src/app/(storefront)/order-lookup/page.tsx        # enter number+email
src/app/(storefront)/order/[orderNumber]/page.tsx # order view + review/return forms
src/app/(storefront)/order/[orderNumber]/actions.ts
src/app/(storefront)/collection/[slug]/page.tsx   # MODIFY: reviews section
src/app/(admin)/admin/(panel)/reviews/page.tsx    # moderation
src/app/(admin)/admin/(panel)/reviews/actions.ts
src/app/(admin)/admin/(panel)/returns/page.tsx    # queue
src/app/(admin)/admin/(panel)/returns/actions.ts
src/app/(admin)/admin/(panel)/layout.tsx          # MODIFY: sidebar
tests/returns.test.ts
```

---

### Task 1: Schema + seed

**Files:** MODIFY `prisma/schema.prisma`, `prisma/seed.ts`

- [ ] **Step 1: Add models** to `schema.prisma`

```prisma
model Review {
  id               Int       @id @default(autoincrement())
  productId        Int
  product          Product   @relation(fields: [productId], references: [id])
  orderItemId      Int       @unique
  orderItem        OrderItem @relation(fields: [orderItemId], references: [id])
  customerName     String
  customerEmail    String
  rating           Int
  body             String
  verifiedPurchase Boolean   @default(true)
  status           String    @default("published") // published | hidden
  sellerReply      String?
  createdAt        DateTime  @default(now())
}

model ReturnReason {
  id          Int             @id @default(autoincrement())
  code        String          @unique
  displayName String
  active      Boolean         @default(true)
  requests    ReturnRequest[]
}

model ReturnRequest {
  id           Int          @id @default(autoincrement())
  orderItemId  Int          @unique
  orderItem    OrderItem    @relation(fields: [orderItemId], references: [id])
  reasonId     Int
  reason       ReturnReason @relation(fields: [reasonId], references: [id])
  customerNote String?
  status       String       @default("requested") // requested | approved | rejected | refunded
  adminNote    String?
  requestedAt  DateTime     @default(now())
  resolvedAt   DateTime?
}
```

- [ ] **Step 2: Add the back-relations.** In `model Product` add:

```prisma
  reviews         Review[]
```

In `model OrderItem` add:

```prisma
  review              Review?
  returnRequest       ReturnRequest?
```

- [ ] **Step 3: Add the `isFinalSale` back-relation is not needed** — `products.isFinalSale` already exists (Plan 1). Confirm it's present in `model Product`; it is.

- [ ] **Step 4: Migrate** — `npx prisma migrate dev --name reviews_returns`

- [ ] **Step 5: Seed** — append to the settings array in `seed.ts`:

```ts
    ["return_window_days", 7],
```

And add a return-reasons + sample-review block before the stock backfill:

```ts
  for (const [code, displayName] of [
    ["changed-mind", "Changed my mind"],
    ["damaged", "Arrived damaged"],
    ["not-as-described", "Not as described"],
    ["wrong-item", "Wrong item received"],
  ] as const)
    await db.returnReason.upsert({ where: { code }, update: {}, create: { code, displayName } });
```

- [ ] **Step 6: Reseed** — `npm run db:seed`. Verify 4 return reasons.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: schema + seed for reviews and returns"`

---

### Task 2: Return-eligibility helper (TDD)

**Files:** Create `src/lib/returns.ts`, `tests/returns.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from "vitest";
import { canReturn } from "@/lib/returns";

const now = new Date("2026-07-15T00:00:00Z");
const deliveredRecently = new Date("2026-07-12T00:00:00Z"); // 3 days ago

describe("canReturn", () => {
  it("allows a delivered, non-final-sale item within the window with no prior request", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(true);
  });
  it("blocks final-sale items", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: true, alreadyRequested: false })).toBe(false);
  });
  it("blocks when outside the window", () => {
    const old = new Date("2026-07-01T00:00:00Z"); // 14 days ago
    expect(canReturn({ statusCode: "delivered", deliveredAt: old, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(false);
  });
  it("blocks when not delivered", () => {
    expect(canReturn({ statusCode: "shipped", deliveredAt: null, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(false);
  });
  it("blocks a second request", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: false, alreadyRequested: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement `src/lib/returns.ts`**

```ts
export function canReturn(o: {
  statusCode: string;
  deliveredAt: Date | null;
  windowDays: number;
  now: Date;
  isFinalSale: boolean;
  alreadyRequested: boolean;
}): boolean {
  if (o.statusCode !== "delivered" || !o.deliveredAt) return false;
  if (o.isFinalSale || o.alreadyRequested) return false;
  const ageMs = o.now.getTime() - o.deliveredAt.getTime();
  return ageMs <= o.windowDays * 86_400_000;
}
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: return-eligibility helper (TDD)"`

---

### Task 3: Guest order-lookup + order view

**Files:** Create `src/app/(storefront)/order-lookup/page.tsx`, `order/[orderNumber]/page.tsx`, `order/[orderNumber]/actions.ts`

- [ ] **Step 1: Lookup page** — `order-lookup/page.tsx`

```tsx
export const dynamic = "force-dynamic";

export default function OrderLookup() {
  return (
    <div style={{ paddingTop: 24, maxWidth: 420 }}>
      <h1>Find your order</h1>
      <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Enter your order number and the email you used to check out.</p>
      <form action="/order-lookup/go" method="get" style={{ display: "none" }} />
      <OrderLookupForm />
    </div>
  );
}

function OrderLookupForm() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const { redirect } = await import("next/navigation");
        const num = String(formData.get("orderNumber")).trim();
        const email = String(formData.get("email")).trim();
        redirect(`/order/${encodeURIComponent(num)}?email=${encodeURIComponent(email)}`);
      }}
    >
      <label>Order number</label><input name="orderNumber" placeholder="SA-…" required />
      <label>Email</label><input name="email" type="email" required />
      <button style={{ marginTop: 14 }}>View order</button>
    </form>
  );
}
```

- [ ] **Step 2: Order view + actions** — `order/[orderNumber]/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function submitReview(formData: FormData): Promise<void> {
  const orderItemId = Number(formData.get("orderItemId"));
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: true } });
  await prisma.review.create({
    data: {
      productId: item.productId,
      orderItemId,
      customerName: String(formData.get("name")),
      customerEmail: item.order.email,
      rating: Math.max(1, Math.min(5, Number(formData.get("rating")))),
      body: String(formData.get("body")),
      verifiedPurchase: true,
    },
  });
  revalidatePath(`/order/${item.order.orderNumber}`);
}

export async function requestReturn(formData: FormData): Promise<void> {
  const orderItemId = Number(formData.get("orderItemId"));
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: true } });
  await prisma.returnRequest.create({
    data: {
      orderItemId,
      reasonId: Number(formData.get("reasonId")),
      customerNote: (formData.get("note") as string) || null,
    },
  });
  revalidatePath(`/order/${item.order.orderNumber}`);
}
```

- [ ] **Step 3: Order view page** — `order/[orderNumber]/page.tsx`

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { canReturn } from "@/lib/returns";
import { submitReview, requestReturn } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrderView({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const { email = "" } = await searchParams;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      status: true,
      statusHistory: { include: { status: true } },
      items: {
        include: {
          product: true,
          review: true,
          returnRequest: { include: { reason: true } },
        },
      },
    },
  });

  if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
    return (
      <div style={{ paddingTop: 40, maxWidth: 420 }}>
        <h1>Order not found</h1>
        <p style={{ color: "var(--ink-muted)" }}>Check the order number and email. <Link href="/order-lookup">Try again</Link>.</p>
      </div>
    );
  }

  const windowDays = await getSetting<number>("return_window_days", 7);
  const reasons = await prisma.returnReason.findMany({ where: { active: true } });
  const deliveredAt = order.statusHistory.find((h) => h.status.code === "delivered")?.createdAt ?? null;
  const now = new Date();

  return (
    <div style={{ paddingTop: 24, maxWidth: 720 }}>
      <h1>{order.orderNumber}</h1>
      <p style={{ color: "var(--ink-muted)" }}>Status: {order.status.name}</p>

      {order.items.map((item) => {
        const returnable = canReturn({
          statusCode: order.status.code,
          deliveredAt,
          windowDays,
          now,
          isFinalSale: item.product.isFinalSale,
          alreadyRequested: !!item.returnRequest,
        });
        return (
          <div key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="serif" style={{ fontSize: 16 }}>{item.name} × {item.quantity}</div>
              <div className="num">{formatMoney(item.unitPriceMinor * item.quantity, order.currency)}</div>
            </div>

            {/* Review */}
            {order.status.code === "delivered" && !item.review && (
              <form action={submitReview} style={{ marginTop: 10, padding: 12, background: "var(--ground-raised)", borderRadius: 8 }}>
                <input type="hidden" name="orderItemId" value={item.id} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>Leave a review</div>
                <label>Your name</label><input name="name" required />
                <label>Rating</label>
                <select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}</select>
                <label>Review</label><textarea name="body" rows={2} required />
                <button className="btn-ghost" style={{ marginTop: 8 }}>Submit review</button>
              </form>
            )}
            {item.review && <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>✓ You reviewed this ({item.review.rating}★).</p>}

            {/* Return */}
            {item.returnRequest ? (
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
                Return {item.returnRequest.status} — {item.returnRequest.reason.displayName}
              </p>
            ) : returnable ? (
              <form action={requestReturn} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
                <input type="hidden" name="orderItemId" value={item.id} />
                <div><label>Return reason</label><select name="reasonId">{reasons.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}</select></div>
                <div><label>Note (optional)</label><input name="note" /></div>
                <button className="btn-ghost">Request return</button>
              </form>
            ) : order.status.code === "delivered" && item.product.isFinalSale ? (
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 8 }}>This piece is final sale — not returnable.</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Verify** — `/order-lookup` → enter a real order number + its email → order view renders. Wrong email → "Order not found." (Reviews/returns need a Delivered order — tested in Task 6 after advancing one.)
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: guest order-lookup and order view with review/return actions"`

---

### Task 4: Reviews on the product page

**Files:** MODIFY `src/app/(storefront)/collection/[slug]/page.tsx`

- [ ] **Step 1: Load published reviews + aggregate, and render them.** After the existing `product` query, add:

```tsx
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "published" },
    orderBy: { createdAt: "desc" },
  });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
```

- [ ] **Step 2: Add a reviews section** at the very end of the returned JSX, before the closing `</div>` of the outer grid — actually place it as a full-width block after the grid. Wrap the current return in a fragment and append:

```tsx
      <section style={{ gridColumn: "1 / -1", marginTop: 32, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        <h3 style={{ fontSize: 16 }}>
          Reviews {avg !== null && <span style={{ color: "var(--brass)" }}>· {avg.toFixed(1)}★ ({reviews.length})</span>}
        </h3>
        {reviews.length === 0 && <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 13 }}>
              <strong>{r.customerName}</strong> · {r.rating}★
              {r.verifiedPurchase && <span style={{ color: "var(--success)", fontSize: 11, marginLeft: 6 }}>✓ Verified purchase</span>}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "4px 0" }}>{r.body}</p>
            {r.sellerReply && (
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 16, paddingLeft: 10, borderLeft: "2px solid var(--brass)" }}>
                <strong>Sarthak Arts:</strong> {r.sellerReply}
              </p>
            )}
          </div>
        ))}
      </section>
```

Note: the current PDP root is a two-column grid `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", ... }}>`. Add `gridColumn: "1 / -1"` on the section (as above) so it spans full width beneath both columns.

- [ ] **Step 3: Verify** — a product with a published review shows the review + average; one without shows "No reviews yet." (Seed a review in Task 6 or via admin to see it populated.)
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: product page reviews with verified badge, average, seller reply"`

---

### Task 5: Admin reviews moderation + returns queue

**Files:** Create `src/app/(admin)/admin/(panel)/reviews/page.tsx` + `actions.ts`, `returns/page.tsx` + `actions.ts`; MODIFY sidebar

- [ ] **Step 1: Reviews actions** — `reviews/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function setReviewStatus(formData: FormData): Promise<void> {
  await prisma.review.update({
    where: { id: Number(formData.get("reviewId")) },
    data: { status: String(formData.get("status")) },
  });
  revalidatePath("/admin/reviews");
}

export async function replyToReview(formData: FormData): Promise<void> {
  await prisma.review.update({
    where: { id: Number(formData.get("reviewId")) },
    data: { sellerReply: String(formData.get("reply")) },
  });
  revalidatePath("/admin/reviews");
}
```

- [ ] **Step 2: Reviews page** — `reviews/page.tsx`

```tsx
import { prisma } from "@/lib/db";
import { setReviewStatus, replyToReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
  return (
    <div style={{ padding: "22px 26px", maxWidth: 760 }}>
      <h1>Reviews</h1>
      {reviews.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><strong>{r.customerName}</strong> · {r.rating}★ · <span style={{ color: "var(--ink-muted)" }}>{r.product.name}</span></div>
            <div style={{ fontSize: 12, color: r.status === "hidden" ? "var(--critical)" : "var(--success)" }}>{r.status}</div>
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "6px 0" }}>{r.body}</p>
          {r.sellerReply && <p style={{ fontSize: 13, marginLeft: 12, paddingLeft: 10, borderLeft: "2px solid var(--brass)" }}><strong>Reply:</strong> {r.sellerReply}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <form action={setReviewStatus}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input type="hidden" name="status" value={r.status === "hidden" ? "published" : "hidden"} />
              <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>{r.status === "hidden" ? "Publish" : "Hide"}</button>
            </form>
            <form action={replyToReview} style={{ display: "flex", gap: 6, flex: 1 }}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input name="reply" placeholder="Reply publicly…" defaultValue={r.sellerReply ?? ""} style={{ flex: 1 }} />
              <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Save reply</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Returns actions** — `returns/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function resolveReturn(formData: FormData): Promise<void> {
  const status = String(formData.get("status")); // approved | rejected | refunded
  await prisma.returnRequest.update({
    where: { id: Number(formData.get("returnId")) },
    data: { status, adminNote: (formData.get("adminNote") as string) || null, resolvedAt: new Date() },
  });
  revalidatePath("/admin/returns");
}
```

- [ ] **Step 4: Returns page** — `returns/page.tsx`

```tsx
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { resolveReturn } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReturns() {
  const requests = await prisma.returnRequest.findMany({
    include: { reason: true, orderItem: { include: { order: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Return requests</h1>
      {requests.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No return requests.</p>}
      <table>
        <thead><tr><th>Order</th><th>Item</th><th>Reason</th><th>Status</th><th /></tr></thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.orderItem.order.orderNumber}<div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{r.orderItem.order.email}</div></td>
              <td>{r.orderItem.name}<div className="num" style={{ fontSize: 12 }}>{formatMoney(r.orderItem.unitPriceMinor, r.orderItem.order.currency)}</div></td>
              <td>{r.reason.displayName}{r.customerNote ? <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{r.customerNote}</div> : null}</td>
              <td>{r.status}</td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  {r.status === "requested" && <>
                    <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="approved" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Approve</button></form>
                    <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Reject</button></form>
                  </>}
                  {r.status === "approved" && <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="refunded" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Mark refunded</button></form>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Refund money movement reuses the payment gateway once its keys are configured; status is tracked through to refunded here.</p>
    </div>
  );
}
```

- [ ] **Step 5: Sidebar** — in `(panel)/layout.tsx` NAV, after Consultations add:

```tsx
  ["Reviews", "/admin/reviews"],
  ["Returns", "/admin/returns"],
```

- [ ] **Step 6: Verify** — covered in Task 6.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: admin reviews moderation and returns queue"`

---

### Task 6: End-to-end verification of the post-purchase loop

- [ ] **Step 1:** `npm test` green; `rm -rf .next && npx tsc --noEmit` clean; `npx next build` succeeds.
- [ ] **Step 2: Advance the test order to Delivered** — log into `/admin`, open the existing order, click "Mark as packed" → "shipped" → "delivered" (three clicks). (Or a one-off script.)
- [ ] **Step 3: Browser walk** (`npm run dev`):
  - `/order-lookup` → enter the delivered order's number + email → order view
  - Leave a review on the item → it appears on that product's page (`/collection/<slug>`) with the ✓ Verified badge and updates the average
  - Request a return (pick a reason) → shows "Return requested" on the order view
  - `/admin/reviews` → the review is listed; Hide it → it disappears from the product page; Publish → returns; add a reply → shows on the product page
  - `/admin/returns` → the request is listed; Approve → Mark refunded; the order view reflects the status
  - Everything from Plans 1–4 still works
- [ ] **Step 4: Tag** — `git commit --allow-empty -m "chore: plan 5 reviews + returns complete" && git tag v0.5-post-purchase`

---

## Self-review notes

- **Scope honesty:** refund money-movement is deferred with the rest of payments (status tracked to `refunded`); no customer accounts, so a guest order-lookup is the entry point (stated up front). Review images (masterplan mentioned) are omitted for now — text reviews first; adding an image field later is additive.
- **Verified-purchase integrity:** a review can only be created through the order-lookup (which required order number + email match) and only for a Delivered order's item; `orderItemId` is unique so one review per purchased line, no duplicates or unverified reviews — exactly the masterplan rule.
- **Modularity audit:** return reasons are a reference table; the return window is a setting; review status/return status are string states checked consistently. `canReturn` centralises eligibility (tested).
- **Reuse:** the order view reuses `formatMoney`, `getSetting`, and the status-history already produced by Plan 3's fulfillment flow to find the delivered timestamp — no new tracking added.
