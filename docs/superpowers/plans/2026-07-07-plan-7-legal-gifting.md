# Sarthak Arts — Plan 7: Legal Pages & Gifting

> Post-v1.0 polish pass closing the two remaining audit gaps. Everything config-driven.

**Goal:** (1) **Legal pages** — Terms, Privacy, Shipping & Returns — as **owner-editable content blocks** (reusing the Plan 6 CMS), linked from the footer. (2) **Gifting** — a "this is a gift" toggle + gift message at checkout, threaded intent → order, shown to the seller and on the order view, with prices already omitted from the certificate/parcel.

**Scope note:** the seeded legal copy is a sensible India-focused starting draft (7-day return window matching `return_window_days`, non-final-sale). It is meant to be reviewed by the owner/counsel before launch and edited in `/admin/content` — no code change needed.

---

### Task 1: Legal content blocks + storefront pages + footer links

**Files:** MODIFY `prisma/seed.ts`; create `terms/`, `privacy/`, `shipping-returns/` pages; MODIFY storefront `layout.tsx`; MODIFY admin `content/page.tsx` (roomier textarea)

- [ ] Seed three blocks `legal.terms`, `legal.privacy`, `legal.shipping` (multi-paragraph bodies, `\n\n` separated).
- [ ] Reseed.
- [ ] Create `/terms`, `/privacy`, `/shipping-returns` — each `getBlock` + render body with `whiteSpace: "pre-wrap"`.
- [ ] Footer Help column: add the three legal links.
- [ ] CMS editor: grow the textarea to fit long bodies (`rows` from line count).
- [ ] Verify + commit.

### Task 2: Gifting — schema + checkout capture

**Files:** MODIFY `prisma/schema.prisma` (CheckoutIntent), `checkout/page.tsx`, `checkout/actions.ts`

- [ ] Add `isGift Boolean @default(false)` + `giftNote String?` to `CheckoutIntent`; migrate `gift_intent`. (Order already has both fields.)
- [ ] Checkout form: a "This is a gift" checkbox and a gift-message textarea.
- [ ] `beginCheckout`: read `isGift` (checkbox → "on") + `giftNote`, persist on the intent.

### Task 3: Gifting — order creation + display

**Files:** MODIFY `src/lib/orders.ts`, admin `orders/[id]/page.tsx`, storefront `order/[orderNumber]/page.tsx`

- [ ] `completeIntent`: copy `isGift`/`giftNote` from intent to the created order.
- [ ] Admin order detail: when `isGift`, a prominent seller banner — enclose the message, no prices in the parcel (certificate already omits price).
- [ ] Order view (guest lookup): show the gift message if present.
- [ ] Verify end-to-end via `simulate:webhook`, commit, tag `v1.1`.

---

## Self-review notes
- Legal text lives in `content_blocks` — same editor, same modularity as all other copy; storefront pages hold only fallbacks.
- Gifting reuses fields already in the `Order` schema; only `CheckoutIntent` needed the two columns to carry them across payment. No new pricing/packing logic — the certificate already excludes price, satisfying "no prices in a gift parcel."
