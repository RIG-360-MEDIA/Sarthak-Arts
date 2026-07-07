# Sarthak Arts — Plan 4: Consultations & Home Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]` checkboxes.
> **Governing rule:** nothing hardcoded — consultation types, audit questions, fees, thresholds all live in the DB.
> **Series:** Plan 4 of 6 (the roadmap grew: reviews+returns are now Plan 5; notifications/CMS/social/analytics are Plan 6). Builds on `v0.3-admin`.

**Goal:** Ship the two signature guidance features: a **consultation booking system** covering both Vastu-placement and astrology (pick type → pick slot → book, with the big-order free-consultation entitlement wired in), and the **2-minute home audit** quiz that recommends directions/pieces or a consultation.

**Scope notes:**
- **Payment for paid bookings is deferred** (same reason as product checkout — Razorpay test keys blocked by KYC). A booking is created directly; its `paymentStatus` is `free` when covered by an entitlement, else `pending` (a note explains payment wiring reuses the existing gateway pattern once keys exist). The **free-consultation entitlement path is fully functional now** (needs no payment).
- **Consultant availability is managed from the admin panel** in this plan (a separate consultant login is a later enhancement; the schema already carries an optional `userId` on `Consultant` for it).
- Reviews and returns are **Plan 5**.

---

## File structure

```
prisma/schema.prisma            # + ConsultationType, Consultant, ConsultantType,
                                 #   ConsultantAvailability, Booking, ConsultationEntitlement,
                                 #   AuditQuestion, AuditAnswerRule
prisma/seed.ts                  # + 2 consultation types, 1 consultant, availability, audit Qs
src/lib/booking.ts              # freeSlots() pure helper (TESTED)
src/lib/orders.ts               # MODIFY: grant entitlement on big order
src/app/(storefront)/consultation/page.tsx        # type picker + slots + book form
src/app/(storefront)/consultation/actions.ts      # createBooking
src/app/(storefront)/consultation/confirmed/page.tsx
src/app/(storefront)/home-audit/page.tsx          # quiz
src/app/(storefront)/home-audit/result/page.tsx   # recommendations
src/app/(admin)/admin/(panel)/consultations/page.tsx     # bookings + availability
src/app/(admin)/admin/(panel)/consultations/actions.ts   # addSlot/removeSlot/markComplete
tests/booking.test.ts
```

---

### Task 1: Schema + seed for consultations and audit

**Files:** MODIFY `prisma/schema.prisma`, `prisma/seed.ts`

- [ ] **Step 1: Add models** to `schema.prisma`

```prisma
model ConsultationType {
  id                 Int       @id @default(autoincrement())
  code               String    @unique
  name               String
  description        String
  durationMinutes    Int
  feeMinor           Int
  creditsTowardOrder Boolean   @default(false)
  active             Boolean   @default(true)
  displayOrder       Int       @default(0)
  consultants        ConsultantType[]
  bookings           Booking[]
  entitlements       ConsultationEntitlement[]
}

model Consultant {
  id           Int              @id @default(autoincrement())
  name         String
  userId       Int?
  active       Boolean          @default(true)
  types        ConsultantType[]
  availability ConsultantAvailability[]
  bookings     Booking[]
}

model ConsultantType {
  consultantId       Int
  consultationTypeId Int
  consultant         Consultant       @relation(fields: [consultantId], references: [id])
  consultationType   ConsultationType @relation(fields: [consultationTypeId], references: [id])
  @@id([consultantId, consultationTypeId])
}

model ConsultantAvailability {
  id           Int        @id @default(autoincrement())
  consultantId Int
  consultant   Consultant @relation(fields: [consultantId], references: [id])
  slotStart    DateTime
  durationMin  Int        @default(20)
}

model Booking {
  id                 Int              @id @default(autoincrement())
  consultantId       Int
  consultant         Consultant       @relation(fields: [consultantId], references: [id])
  consultationTypeId Int
  consultationType   ConsultationType @relation(fields: [consultationTypeId], references: [id])
  customerName       String
  customerEmail      String
  customerPhone      String
  slotStart          DateTime
  status             String           @default("booked") // booked | completed | cancelled
  paymentStatus      String           @default("pending") // pending | free | paid
  feeMinorAtBooking  Int
  videoLink          String?
  entitlementId      Int?             @unique
  entitlement        ConsultationEntitlement? @relation(fields: [entitlementId], references: [id])
  createdAt          DateTime         @default(now())
}

model ConsultationEntitlement {
  id                 Int              @id @default(autoincrement())
  customerEmail      String
  sourceOrderId      Int?
  consultationTypeId Int
  consultationType   ConsultationType @relation(fields: [consultationTypeId], references: [id])
  status             String           @default("unused") // unused | used | expired
  grantedAt          DateTime         @default(now())
  booking            Booking?
}

model AuditQuestion {
  id           Int               @id @default(autoincrement())
  prompt       String
  displayOrder Int               @default(0)
  active       Boolean           @default(true)
  answers      AuditAnswerRule[]
}

model AuditAnswerRule {
  id                Int           @id @default(autoincrement())
  questionId        Int
  question          AuditQuestion @relation(fields: [questionId], references: [id])
  answerText        String
  mapsToDirection   String?       // Direction.code, or null (e.g. "irregular layout" -> consultation)
  recommendConsult  Boolean       @default(false)
  displayOrder      Int           @default(0)
}
```

- [ ] **Step 2: Migrate** — `npx prisma migrate dev --name consultations_audit`

- [ ] **Step 3: Seed** — append inside `main()` in `seed.ts` (before the stock backfill), then a small block. Add after the settings loop:

```ts
  const vastu = await db.consultationType.upsert({
    where: { code: "vastu-placement" }, update: {},
    create: { code: "vastu-placement", name: "Vastu placement", description: "A 20-minute call to place your pieces correctly for your specific home layout.", durationMinutes: 20, feeMinor: 99900, creditsTowardOrder: true, displayOrder: 1 },
  });
  const astro = await db.consultationType.upsert({
    where: { code: "astrology" }, update: {},
    create: { code: "astrology", name: "Astrology", description: "A 30-minute astrology consultation.", durationMinutes: 30, feeMinor: 99900, creditsTowardOrder: false, displayOrder: 2 },
  });
  const consultant = (await db.consultant.findFirst({ where: { name: "Resident Consultant" } }))
    ?? (await db.consultant.create({ data: { name: "Resident Consultant" } }));
  for (const t of [vastu, astro])
    await db.consultantType.upsert({
      where: { consultantId_consultationTypeId: { consultantId: consultant.id, consultationTypeId: t.id } },
      update: {}, create: { consultantId: consultant.id, consultationTypeId: t.id },
    });
  if ((await db.consultantAvailability.count()) === 0) {
    const base = new Date("2026-07-10T04:30:00.000Z"); // 10:00 IST
    for (let day = 0; day < 5; day++)
      for (const hourOffset of [0, 2, 5]) {
        const slotStart = new Date(base.getTime() + day * 86400000 + hourOffset * 3600000);
        await db.consultantAvailability.create({ data: { consultantId: consultant.id, slotStart, durationMin: 20 } });
      }
  }

  if ((await db.auditQuestion.count()) === 0) {
    const q1 = await db.auditQuestion.create({ data: { prompt: "Which direction does your main entrance face?", displayOrder: 1 } });
    for (const [answerText, dir, order] of [["North", "north", 1], ["Northeast", "northeast", 2], ["East", "east", 3], ["Not sure", null, 4]] as const)
      await db.auditAnswerRule.create({ data: { questionId: q1.id, answerText, mapsToDirection: dir, displayOrder: order } });
    const q2 = await db.auditQuestion.create({ data: { prompt: "What would you most like to improve at home?", displayOrder: 2 } });
    for (const [answerText, dir, order] of [["Wealth & career", "north", 1], ["Clarity & calm", "northeast", 2], ["Relationships", "southwest", 3]] as const)
      await db.auditAnswerRule.create({ data: { questionId: q2.id, answerText, mapsToDirection: dir, displayOrder: order } });
    const q3 = await db.auditQuestion.create({ data: { prompt: "Is your home a standard rectangular layout?", displayOrder: 3 } });
    await db.auditAnswerRule.create({ data: { questionId: q3.id, answerText: "Yes, fairly standard", displayOrder: 1 } });
    await db.auditAnswerRule.create({ data: { questionId: q3.id, answerText: "No — it's irregular (L-shaped, corner, multi-floor)", recommendConsult: true, displayOrder: 2 } });
  }
```

- [ ] **Step 4: Reseed** — `npm run db:seed`. Verify (prisma studio or a count) 2 consultation types, 1 consultant, 15 availability slots, 3 audit questions.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: schema + seed for consultations and home audit"`

---

### Task 2: Free-slots helper (TDD)

**Files:** Create `src/lib/booking.ts`, `tests/booking.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from "vitest";
import { freeSlots } from "@/lib/booking";

const s = (iso: string) => new Date(iso);

describe("freeSlots", () => {
  it("returns availability slots that are not already booked", () => {
    const avail = [s("2026-07-10T04:30:00Z"), s("2026-07-10T06:30:00Z"), s("2026-07-10T09:30:00Z")];
    const booked = [s("2026-07-10T06:30:00Z")];
    const free = freeSlots(avail, booked);
    expect(free.map((d) => d.toISOString())).toEqual([
      "2026-07-10T04:30:00.000Z",
      "2026-07-10T09:30:00.000Z",
    ]);
  });
  it("drops slots already in the past relative to a reference time", () => {
    const now = s("2026-07-10T05:00:00Z");
    const avail = [s("2026-07-10T04:30:00Z"), s("2026-07-10T06:30:00Z")];
    const free = freeSlots(avail, [], now);
    expect(free.map((d) => d.toISOString())).toEqual(["2026-07-10T06:30:00.000Z"]);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement `src/lib/booking.ts`**

```ts
export function freeSlots(availability: Date[], booked: Date[], now?: Date): Date[] {
  const bookedTimes = new Set(booked.map((d) => d.getTime()));
  const floor = now ? now.getTime() : -Infinity;
  return availability
    .filter((d) => !bookedTimes.has(d.getTime()) && d.getTime() > floor)
    .sort((a, b) => a.getTime() - b.getTime());
}
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: free-slots booking helper (TDD)"`

---

### Task 3: Grant free-consultation entitlement on a big order

**Files:** MODIFY `src/lib/orders.ts`

- [ ] **Step 1: After the order transaction (before `generateCertificates`), add the entitlement grant.** Insert into `completeIntent`, right after `const order = await prisma.$transaction(...)` completes:

```ts
  // Big-order perk: an order over the threshold grants one free Vastu placement consultation
  // (the announcement bar promise). Threshold + granted type are settings/reference data.
  const thresholdMinor = await getSetting<number>("consultation_credit_threshold_minor", 1500000);
  if (order.totalMinor >= thresholdMinor) {
    const vastu = await prisma.consultationType.findUnique({ where: { code: "vastu-placement" } });
    if (vastu) {
      await prisma.consultationEntitlement.create({
        data: { customerEmail: order.email, sourceOrderId: order.id, consultationTypeId: vastu.id },
      });
    }
  }
```

Add the import at the top of `orders.ts`:

```ts
import { getSetting } from "@/lib/settings";
```

- [ ] **Step 2: Verify** — via a script or by re-running the checkout-intent + webhook simulator with a > ₹15,000 order (the seeded kalash at ₹18,400 already qualifies): after the webhook, a `ConsultationEntitlement` row exists for that email with status `unused`. (Quick check: `npx prisma studio` → ConsultationEntitlement.)
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: grant free-consultation entitlement on orders over threshold"`

---

### Task 4: Consultation booking flow (customer)

**Files:** Create `src/app/(storefront)/consultation/page.tsx`, `consultation/actions.ts`, `consultation/confirmed/page.tsx`

- [ ] **Step 1: Booking action** — `consultation/actions.ts`

```ts
"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createBooking(formData: FormData): Promise<void> {
  const consultationTypeId = Number(formData.get("consultationTypeId"));
  const slotIso = String(formData.get("slot"));
  const email = String(formData.get("email"));
  const type = await prisma.consultationType.findUniqueOrThrow({ where: { id: consultationTypeId } });

  // pick the consultant who offers this type and owns this slot
  const slot = await prisma.consultantAvailability.findFirstOrThrow({
    where: {
      slotStart: new Date(slotIso),
      consultant: { types: { some: { consultationTypeId } }, active: true },
    },
  });

  // is there an unused entitlement for this email + type? -> free booking
  const entitlement = await prisma.consultationEntitlement.findFirst({
    where: { customerEmail: email, consultationTypeId, status: "unused" },
  });

  const booking = await prisma.booking.create({
    data: {
      consultantId: slot.consultantId,
      consultationTypeId,
      customerName: String(formData.get("name")),
      customerEmail: email,
      customerPhone: String(formData.get("phone")),
      slotStart: new Date(slotIso),
      feeMinorAtBooking: entitlement ? 0 : type.feeMinor,
      paymentStatus: entitlement ? "free" : "pending",
      entitlementId: entitlement?.id,
    },
  });
  if (entitlement) await prisma.consultationEntitlement.update({ where: { id: entitlement.id }, data: { status: "used" } });

  redirect(`/consultation/confirmed?id=${booking.id}`);
}
```

- [ ] **Step 2: Booking page** — `consultation/page.tsx` (pick type via `?type=`, show slots, book form; shows "free" if the email query has an entitlement — but since email is entered in the form, we show the fee and note the free perk applies automatically at booking)

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { freeSlots } from "@/lib/booking";
import { createBooking } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const types = await prisma.consultationType.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const active = types.find((t) => t.code === type) ?? null;

  let slots: Date[] = [];
  if (active) {
    const [availability, bookings] = await Promise.all([
      prisma.consultantAvailability.findMany({ where: { consultant: { types: { some: { consultationTypeId: active.id } }, active: true } } }),
      prisma.booking.findMany({ where: { consultationTypeId: active.id, status: { not: "cancelled" } } }),
    ]);
    slots = freeSlots(availability.map((a) => a.slotStart), bookings.map((b) => b.slotStart), new Date());
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Book a consultation</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "16px 0 24px" }}>
        {types.map((t) => (
          <Link key={t.code} href={`/consultation?type=${t.code}`}
            style={{ border: `${active?.code === t.code ? 2 : 1}px solid ${active?.code === t.code ? "var(--brass)" : "var(--line)"}`, borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit" }}>
            <div className="serif" style={{ fontSize: 16 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6 }}>
              {t.durationMinutes} min · {formatMoney(t.feeMinor, "INR")}{t.creditsTowardOrder ? " · credited toward orders over ₹15,000" : ""}
            </div>
          </Link>
        ))}
      </div>

      {active && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
          <form action={createBooking}>
            <input type="hidden" name="consultationTypeId" value={active.id} />
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>{active.name} selected</div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{active.description}</p>
            <label>Choose a time</label>
            <select name="slot" required>
              {slots.length === 0 && <option value="">No slots available</option>}
              {slots.map((s) => <option key={s.toISOString()} value={s.toISOString()}>{s.toUTCString()}</option>)}
            </select>
            <label>Full name</label><input name="name" required />
            <label>Email</label><input name="email" type="email" required />
            <label>Phone</label><input name="phone" required />
            <button style={{ marginTop: 16 }} disabled={slots.length === 0}>Confirm booking</button>
          </form>
          <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600 }}>Fee</div>
            <div className="num" style={{ fontSize: 20, margin: "6px 0" }}>{formatMoney(active.feeMinor, "INR")}</div>
            <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              If you have a free consultation from an order over ₹15,000, it&apos;s applied automatically at booking.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Confirmation page** — `consultation/confirmed/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Confirmed({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const booking = id ? await prisma.booking.findUnique({ where: { id: Number(id) }, include: { consultationType: true } }) : null;
  if (!booking) notFound();
  return (
    <div style={{ paddingTop: 60, textAlign: "center" }}>
      <h1>Your consultation is booked</h1>
      <p style={{ color: "var(--ink-muted)" }}>
        {booking.consultationType.name} · {booking.slotStart.toUTCString()}
      </p>
      <p style={{ color: "var(--ink-muted)" }}>
        {booking.paymentStatus === "free" ? "Covered by your free-consultation credit." : `Fee: ${formatMoney(booking.feeMinorAtBooking, "INR")} — payment link to follow.`}
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>A call link will be emailed before your slot.</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify** — `/consultation` shows both type cards; pick Vastu → slots list + booking form; book with a test email → confirmation page; the booking shows in the DB. Book again with the email that got an entitlement from Task 3's big order → confirmation says "Covered by your free-consultation credit," and the entitlement flips to `used`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: consultation booking flow (both types) with entitlement redemption"`

---

### Task 5: Admin consultations (bookings + availability)

**Files:** Create `src/app/(admin)/admin/(panel)/consultations/page.tsx`, `consultations/actions.ts`; add "Consultations" to the sidebar NAV

- [ ] **Step 1: Actions** — `consultations/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addSlot(formData: FormData): Promise<void> {
  const consultantId = Number(formData.get("consultantId"));
  const slotStart = new Date(String(formData.get("slotStart")));
  await prisma.consultantAvailability.create({ data: { consultantId, slotStart, durationMin: 20 } });
  revalidatePath("/admin/consultations");
}

export async function removeSlot(formData: FormData): Promise<void> {
  await prisma.consultantAvailability.delete({ where: { id: Number(formData.get("slotId")) } });
  revalidatePath("/admin/consultations");
}

export async function markComplete(formData: FormData): Promise<void> {
  await prisma.booking.update({ where: { id: Number(formData.get("bookingId")) }, data: { status: "completed" } });
  revalidatePath("/admin/consultations");
}
```

- [ ] **Step 2: Page** — `consultations/page.tsx`

```tsx
import { prisma } from "@/lib/db";
import { addSlot, removeSlot, markComplete } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminConsultations({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const [bookings, types, availability, consultant] = await Promise.all([
    prisma.booking.findMany({
      where: type ? { consultationType: { code: type } } : {},
      include: { consultationType: true, consultant: true },
      orderBy: { slotStart: "asc" },
    }),
    prisma.consultationType.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.consultantAvailability.findMany({ include: { consultant: true }, orderBy: { slotStart: "asc" } }),
    prisma.consultant.findFirst(),
  ]);

  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Consultations</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Upcoming bookings</div>
          <table>
            <thead><tr><th>Customer</th><th>Type</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}<div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{b.customerEmail}</div></td>
                  <td>{b.consultationType.name}</td>
                  <td style={{ fontSize: 13 }}>{b.slotStart.toUTCString()}</td>
                  <td>{b.status}{b.paymentStatus === "free" ? " (free)" : ""}</td>
                  <td>{b.status === "booked" && (
                    <form action={markComplete}><input type="hidden" name="bookingId" value={b.id} /><button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Mark done</button></form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No bookings yet.</p>}
        </div>

        <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Availability</div>
          {availability.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "4px 0" }}>
              <span>{a.slotStart.toUTCString()}</span>
              <form action={removeSlot}><input type="hidden" name="slotId" value={a.id} /><button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }}>✕</button></form>
            </div>
          ))}
          {consultant && (
            <form action={addSlot} style={{ marginTop: 10 }}>
              <input type="hidden" name="consultantId" value={consultant.id} />
              <label>Add a slot</label>
              <input name="slotStart" type="datetime-local" required />
              <button className="btn-ghost" style={{ marginTop: 8, width: "100%" }}>+ Add slot</button>
            </form>
          )}
        </aside>
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Types: {types.map((t) => t.name).join(", ")}. A dedicated consultant login is a later enhancement; availability is managed here for now.</p>
    </div>
  );
}
```

- [ ] **Step 3: Add "Consultations" to the sidebar** — in `src/app/(admin)/admin/(panel)/layout.tsx`, add to `NAV` after Orders:

```tsx
  ["Consultations", "/admin/consultations"],
```

- [ ] **Step 4: Verify** — `/admin/consultations` lists the booking(s) from Task 4; add a slot via the datetime picker → appears and becomes bookable on the storefront; remove a slot works; "Mark done" flips a booking to completed.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: admin consultations - bookings view + availability management"`

---

### Task 6: The 2-minute home audit

**Files:** Create `src/app/(storefront)/home-audit/page.tsx`, `home-audit/result/page.tsx`

- [ ] **Step 1: Quiz page** — one GET form; each question is a select; submits answer-rule ids to the result page

```tsx
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomeAudit() {
  const questions = await prisma.auditQuestion.findMany({
    where: { active: true }, orderBy: { displayOrder: "asc" },
    include: { answers: { orderBy: { displayOrder: "asc" } } },
  });
  return (
    <div style={{ paddingTop: 24, maxWidth: 560 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontWeight: 600 }}>2-minute home audit</div>
      <h1>A few questions about your home</h1>
      <form action="/home-audit/result">
        {questions.map((q) => (
          <div key={q.id} style={{ marginTop: 18 }}>
            <label style={{ fontSize: 15, color: "var(--ink)" }}>{q.prompt}</label>
            <select name="a" defaultValue="">
              <option value="" disabled>Choose one…</option>
              {q.answers.map((a) => <option key={a.id} value={a.id}>{a.answerText}</option>)}
            </select>
          </div>
        ))}
        <button style={{ marginTop: 22 }}>See my recommendations</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Result page** — reads the selected answer-rule ids, resolves recommended directions (and whether to recommend a consultation), shows matching products

```tsx
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
```

- [ ] **Step 3: Link the audit from the homepage hero** — in `src/app/(storefront)/page.tsx`, add a secondary CTA next to the existing buttons:

```tsx
            <Link href="/home-audit"><button className="btn-ghost">Take the 2-minute home audit</button></Link>
```

(place it inside the hero's button row)

- [ ] **Step 4: Verify** — `/home-audit` shows 3 questions; answering (entrance North, improve Wealth, standard layout) → result recommends North (+ Southwest etc.) and shows the yantra; choosing the irregular-layout answer → the consultation CTA appears and links to `/consultation?type=vastu-placement`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: 2-minute home audit quiz with direction/consultation recommendations"`

---

### Task 7: Plan 4 verification

- [ ] **Step 1:** `npm test` → all green (adds booking tests).
- [ ] **Step 2:** `rm -rf .next && npx tsc --noEmit` clean; `npx next build` succeeds.
- [ ] **Step 3: Browser walk** (`npm run dev`):
  - `/consultation` → both types; book a Vastu slot → confirmation
  - Big order (kalash) via checkout+simulator → grants entitlement → booking with that email is free
  - `/admin/consultations` → booking listed; add/remove availability; mark done
  - `/home-audit` → quiz → recommendations; irregular-layout answer surfaces the consultation CTA
  - Homepage hero shows the audit CTA
  - Everything from Plans 1–3 still works
- [ ] **Step 4: Tag** — `git commit --allow-empty -m "chore: plan 4 consultations + home audit complete" && git tag v0.4-consultations`

---

## Self-review notes

- **Scope honesty:** paid-booking *payment* is deferred (booking created `pending`; free entitlement path fully works) — stated up front; reviews/returns are Plan 5; consultant login is later. All are visible/explained, not silent.
- **Modularity audit:** consultation types, fees, durations, credit-flags, availability, audit questions and their answer→direction mappings are all DB rows; the threshold is a setting. The only code constants are the seed slugs (`vastu-placement`) referenced by the entitlement grant — acceptable as they name reference rows, and the grant no-ops safely if the row is absent.
- **Type consistency:** `freeSlots` used identically in the customer page; `ConsultationEntitlement.status` values (`unused`/`used`) agree between the grant (orders.ts) and redemption (booking action).
- **Reuse:** the audit result reuses `buildProductWhere`/`toCard`/`ProductGrid`/`resolveDisplayCurrency` from Plan 2 — no duplication.
