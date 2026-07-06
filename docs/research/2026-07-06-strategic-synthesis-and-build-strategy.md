# Sarthak Arts — Strategic Synthesis: What To Build, How, and Where To Start

**Date:** 2026-07-06
**Inputs:** the approved masterplan (docs/superpowers/specs/), the niche-D2C brand study, the e-commerce excellence study, and every scope decision made in design review.
**Purpose:** the single answer to: what should we do, how should it be built and designed, what should the end product be, and where do we start — from both the business/seller point of view and the developer/technical point of view.

---

## 1. The core thesis

Everything researched points to one conclusion:

**Sarthak Arts should be built as the first quiet-premium, guidance-led brand in a category that only has cluttered discount stores — where the platform itself (not just the products) delivers the brand's promise of precision, honesty, and placement.**

The market gap is verified: every existing Vastu/pooja e-commerce player (Satvik, GIRI, DevotionalKart, Indian Art Villa...) is a high-SKU everything-store competing on price. Nobody occupies the position P-TAL proved viable for brass kitchenware and Forest Essentials/Kama Ayurveda proved for Ayurvedic skincare — both of which ended in global acquisitions. The position is open, the playbook is proven, and our plan already matches it. What follows is how to execute it without drift.

---

## 2. The business / seller point of view

### 2.1 Positioning (the one-line identity)
"Handcrafted Vastu instruments, built for one zone of your home, with nothing vague about what they're made of." Premium through honesty and guidance — never through mystique inflation, never through discounts.

### 2.2 The flywheel this category uniquely allows
Most stores have to invent retention mechanics. This category has them built in — **a home has eight directions, and almost no customer starts with all eight addressed:**

1. **Free entry:** the 2-minute home audit (zero risk, immediate personal value).
2. **Guided step:** audit recommends pieces — or a consultation for unusual homes (fee credited toward purchase, so guidance converts rather than gatekeeps).
3. **First purchase:** one hero piece for one direction — with certificate, placement card, honest weights. Trust is established with physical proof.
4. **The natural next purchase:** the other seven directions. Post-purchase content ("your northeast is set — here's what the southwest anchor does") makes the second piece a continuation, not a re-acquisition.
5. **The relationship:** one placement tip a month (the copy's own newsletter), new-piece drops, review with photos → social proof feeds acquisition.

Every stage of this loop is already in the masterplan as a feature. The business insight is to *operate* them as one funnel, not as disconnected features.

### 2.3 The trust ladder (why someone pays premium prices to a new brand)
High-ticket + spiritual category + new brand = maximum skepticism. The research shows trust is built in layers, each already designed:
exact composition & weights on every listing → certificate of composition in every box → named smiths and consultant with faces ("Meet Our Makers") → verified-purchase photo reviews → visible returns policy on every product page → quantified trust strip once real numbers exist (pieces placed, artisan partners, cities shipped).

### 2.4 Revenue architecture
- **Hero pieces:** 1–3 signature products (the Copper Vastu Kalash is the natural candidate) anchor photography, PR, and gifting — the Always Pan / Kumkumadi Oil pattern.
- **Consultations as revenue AND conversion:** Kama Ayurveda proved expert consultation is a premium differentiator; our credit-toward-order mechanic converts advice-seekers into buyers.
- **Drops, not discounts:** small-batch handmade goods naturally support "new pieces this month" cadence (Mejuri's pattern adapted to craft). Never lead with sale banners — that is the observed Nicobar failure mode.
- **International = diaspora-first:** US/UK/UAE, content-led, told with dignity (the Our Place model). Same site, same story, prices in their currency.

### 2.5 What the seller's day looks like (operations)
One non-technical person runs this. The admin panel *is* half the product: morning dashboard (what needs attention) → pack/ship from one order screen → answer a review → consultant manages own calendar → owner edits site text in the CMS without anyone's help. Every business rule (shipping, tax, currencies, consultation types, audit questions) is admin-editable configuration. This is already designed; the build must protect its simplicity as hard as it protects the storefront's beauty.

---

## 3. The developer / technical point of view

### 3.1 Build philosophy
- **Custom Next.js monolith** — validated by the Warby Parker precedent: custom is justified exactly when your differentiators (mandala navigation, config-driven consultation types, home audit, composition/certificate system) don't fit templates. Everything else in the stack stays boring and managed (Postgres, R2, Vercel, Razorpay/Stripe, Resend).
- **The modularity mandate is the architecture:** every business decision is a database row (directions, metals, gemstones, consultation types, currencies, gateways, shipping zones, audit questions, notification rules). The test for every piece of code: "if this changes in six months, is it a config edit or a rebuild?" Mejuri's component-based site independently validates the same principle on the frontend — design tokens + a component library, no page hand-built as a one-off.
- **Conventions where users transact, personality where the brand lives.** Checkout, cart, forms, account pages follow proven patterns exactly (the excellence study: users don't forgive unfamiliar checkouts). The mandala, the parchment-and-brass language, the ledger numerals live in browsing and storytelling layers.

### 3.2 Non-negotiable quality gates (from the evidence)
- **Core Web Vitals budget as CI gate** — every extra second costs ~4.4% conversions; mobile is 62% of traffic. Performance is a feature with a number on it.
- **E2E tests on the money paths** — checkout (both gateways, guest + account), booking, admin order flow. A 70% abandonment baseline means zero tolerance for checkout bugs.
- **Staging before production for every schema change** — the operator cannot recover from a bad migration.
- **Server-side order construction** — prices never trusted from the client.

### 3.3 The seven evidence-driven additions (fold into the build checklist)
1. Returns policy line on every product page (60% of shoppers look for it there).
2. Shipping + tax estimates visible on cart/product page — never first revealed at payment (the #1 abandonment cause).
3. Free-shipping threshold decision + "you're ₹X away" indicator.
4. Short craft-process videos captured during the photography shoot (video lifts conversion; the smith's hammer is our best content asset).
5. Direction-based recommendations in Phase 2 ("complete your home's zones" — the flywheel, productized).
6. Defined post-purchase email sequence: care guide → placement check-in → review request → companion-direction suggestion.
7. Email capture beyond checkout: audit results and placement-tip content as subscription hooks.

---

## 4. How it should be designed (the resolved answer)

The approved four-layer system stands — research strengthened rather than changed it:
1. **Foundation:** warm parchment, ink-brown, brass linework; ledger numerals for weights and prices (material honesty made visual).
2. **Space:** Brahmasthan-inspired restraint — one focal object per view. This is also the conversion principle "one primary action per screen" wearing brand clothing.
3. **Navigation:** the mandala wheel as literal shop-by-direction — the P-TAL shop-by-metal pattern proves navigation-as-philosophy works commercially.
4. **Motif & color:** smith's-process marks; accent colors resolved from each piece's actual gemstone — color as data.

Layered on top, the evidence-based conventions: trust cluster at the buy button, scroll-storytelling product pages (story → proof → specs → FAQ), customer photo reviews, standard checkout patterns, quantified trust strip when numbers exist.

**The design brief in one sentence: unmistakably ours in how it feels, rigorously conventional in how it transacts.**

---

## 5. What the end product is

**For the customer:** a calm, fast site that reads like a well-made object. They arrive curious, take a 2-minute audit or spin the mandala, land on a product page that tells them exactly what the piece is made of (to the gram), what zone it serves and why, what's in the box, and how returns work — then check out in under a minute in their own currency, with a certificate arriving in the box and a placement card that makes them feel guided, not sold to. A month later a single useful tip arrives by email, and the site remembers which directions their home still lacks.

**For the seller:** a control room where the entire business — catalog, prices, orders, returns, reviews, consultations, site copy, social highlights, shipping, taxes, currencies, consultation types, audit questions — is operated from one panel with zero code, and where nothing that grows (a second consultant, a third consultation type, a new market, a new currency, a bigger catalog) ever requires rebuilding what exists.

---

## 6. Where to start — the concrete sequence

### Step 0 — Unblock (business decisions, this week, no code)
The masterplan's Section 14 items that actually block building: initial international markets/currencies (recommend starting set: US/UK/UAE + INR base) · domestic + international shipping partner (evaluate Shiprocket first — one integration, many carriers, international support) · consultation fees/durations for both types · return window. Everything else can be decided while building. **In parallel, start the two long-lead business tracks now: product photography (with process video) and gateway account setup (Razorpay KYC, Stripe account) — both block launch and neither is code.**

### Step 1 — Foundations (the twin bedrock)
Repo, Next.js monolith scaffold with the three route groups, CI with lint/typecheck/test gates, staging environment. Then the two things everything else sits on: **the full Prisma schema** (every table in the masterplan, seeded with the 8 directions, metals, gemstones, both consultation types, and the five sample products from the copy doc) and **the design system as code** (tokens, typography, ledger numerals, buttons, forms, the parameterized mandala component).

### Step 2 — One vertical slice, end to end (the most important move)
Before building any area "completely," make **one product buyable**: PDP → cart → guest checkout → Razorpay test payment → webhook → order row → certificate PDF generated → confirmation email → order visible in a minimal admin. One SKU, the whole pipe. This proves payments, order integrity, PDF generation, email, and the schema in one stroke — every hard integration risk surfaces in week one instead of month three, and every later feature just widens a pipe that already works.

### Step 3 — Widen the storefront
Full catalog + collection page with filters → the mandala direction page → search → homepage → Stripe + multi-currency on the already-working checkout → account/orders → content pages with real copy (brand name swapped to Sarthak Arts).

### Step 4 — Widen the admin
Products CRUD with composition builder and manual price fields → orders queue and detail with status flow + shipping labels → settings (gateways, currencies, shipping, tax) → dashboard. This order because the seller needs catalog and fulfillment before anything else.

### Step 5 — The differentiators
Consultation booking (both types, consultant portal) → home audit (admin-editable questions) → reviews with photos + moderation → returns workflow → notifications/post-purchase sequence → CMS editing → social module → analytics. (This is Phase 1 → Phase 2 of the masterplan, unchanged — the vertical slice just de-risks it.)

**Launch gate:** Core Web Vitals green on mobile · E2E checkout suite passing on both gateways · staging-verified migrations · real photography in place · the five trust elements live (composition, certificate, returns visibility, placement guidance, honest policies).

---

## 7. The three rules that protect everything

1. **Never lead with a discount.** The moment the homepage says "50% off," the brand becomes one of the stores it was built to not be.
2. **Never widen the category before the eight directions are won.** (The Allbirds lesson.) Depth first: more pieces per direction, better guidance, richer content — not adjacent categories.
3. **Never ship a business rule as code.** (The modularity mandate, applied daily.) If the seller might want to change it, it's a row in a table with an admin control.
