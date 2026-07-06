# Sarthak Arts — E-Commerce Platform Masterplan

**Status:** Approved design, revised for market + pricing scope changes
**Date:** 2026-07-03 (revised)
**Mockups:** https://claude.ai/code/artifact/cfd4136e-5ab0-4fa5-a87b-951b5b65ddee (full masterplan with embedded mockups) · plain-language client walkthrough: https://claude.ai/code/artifact/90b70a05-fb84-4fc4-8cfa-dd6b120a6aa6
**Source copy:** `bhoomi-dhatu-site-copy.md` (placeholder brand name "Bhoomi & Dhatu" — swap to **Sarthak Arts** throughout implementation)

---

## 0. What this document is

A complete, implementation-ready blueprint for the Sarthak Arts e-commerce platform: a premium, single-seller D2C store selling handcrafted Vastu Shastra instruments (copper, brass, silver pieces set with a single gemstone each), selling to both Indian and international customers. It covers architecture, data model, design system, every customer-facing page, every admin/seller screen, the platform's bespoke consultation booking system, the full order/returns/reviews lifecycles, SEO, legal pages, testing strategy, infrastructure, and a phased build roadmap.

This document assumes the reader has not seen the brainstorming conversation that produced it — every decision is stated with its reasoning, not just its conclusion.

---

## 1. The one rule that governs everything

**Nothing is hardcoded. Every layer — frontend, backend, database — is modular, configurable, and evolvable without ever requiring a rebuild or a restart-from-scratch.**

This is not a nice-to-have; it is the primary architectural constraint on this project, stated explicitly by the business owner and treated as a hard gate on every decision below. Concretely:

- Anything that is a **business decision** (a direction's name, a role's permissions, a shipping zone, a discount type, a payment gateway) lives as **data in the database**, editable from the admin panel.
- Anything that is a **structural/technical decision** (how the database is normalized, which framework renders a page) lives in code — but is written so business decisions never leak into it as literals.
- The test applied to every design choice in this document: *"If this needs to change in six months, does it require a rebuild, or just a configuration/data change?"* If the answer is "rebuild," the design was rejected and redone.
- This governs every table, every screen, every integration described below, and continues to govern the project after launch.

---

## 2. Business facts this design is built around

| Fact | Detail |
|---|---|
| Brand | **Sarthak Arts** (domain: sarthakarts.com) — the site copy's placeholder name "Bhoomi & Dhatu" is swapped throughout |
| Business model | Single-seller D2C — one business, one seller/admin entity. Not a multi-vendor marketplace. |
| Product | **Murtis (deity idols) and Indian Vastu products** (client's stated scope, 2026-07-06) — handcrafted in copper/brass/silver. The Vastu instruments (kalash, yantra, pyramid, panel, chime) map to the 8 directions and typically carry a single gemstone; murtis fit the same placement-guidance brand naturally, since Vastu prescribes where deities are placed and which way they face (e.g. the pooja space in the northeast). Both lines share the same catalog machinery — categories, composition, placement cards, certificates. |
| Catalog scale | Medium at launch (~30-100 SKUs), explicitly architected to scale well beyond that without redesign |
| Market at launch | **India and international, both active from day one** — INR for Indian customers, other currencies for international customers, both Razorpay and Stripe live at launch (see Section 10). Which specific international countries to start with is an open item (Section 14). |
| Operator | Non-technical owner runs the business day-to-day — the admin panel must be fully self-service, no code/database knowledge assumed |
| Consultation service | Custom-built booking system, generalized to support **multiple consultation types** — launching with **Vastu placement consultation** and **astrology consultation**, both bookable through the same system. One consultant per type at launch (may or may not be the same person as the admin, or the same person across both types — the system doesn't assume either way). Phone/video format. Adding a third type later (e.g. numerology) is a data operation, not a rebuild. |
| Pricing model | **Fully manual.** The admin/seller sets the price of every product directly, themselves, through the admin panel — full control, no automated calculation, no live rate integration of any kind. |
| Content ownership | Owner edits editorial pages (About, Our Craft, Philosophy, FAQ) themselves via a built-in lightweight CMS — no developer needed for copy changes |
| Social presence | Instagram/Threads/X activity surfaced on the platform, launching as admin-curated content, upgradeable later to live API sync without restructuring |
| Checkout access | Guest checkout allowed (see Section 7.4) — account creation is optional, offered after purchase, not required before it |
| Client platform | Fully responsive web only at launch — no native mobile app (see Section 14, Phase 3 candidate only if usage data justifies it) |

---

## 3. Architecture & tech stack

**Chosen approach: a unified Next.js monolith**, evaluated against two alternatives (separate frontend/backend services, and a headless-commerce engine like Medusa.js) and preferred because:
- Three distinct user-facing surfaces (customer storefront, admin panel, consultant portal) need one coherent data model and auth system — a monolith keeps type-safety and auth logic shared, not duplicated across a network boundary.
- The consultation booking system doesn't map onto any off-the-shelf commerce engine's built-in models — it would be built custom regardless, so a headless engine's opinions on cart/checkout would be inherited for no real savings.
- At this scale (medium catalog, single seller), a separate backend service is meaningfully more operational complexity for no present benefit.

**Stack:**

| Layer | Choice | Why |
|---|---|---|
| App framework | Next.js 15, App Router, TypeScript | SSR/ISR for the SEO-critical storefront, one codebase for all three surfaces via route groups |
| Route structure | `(storefront)`, `(admin)`, `(consultant)` route groups, one app | Shared types/auth, independent layouts and access rules per group |
| Database | PostgreSQL (Neon or Supabase) | Relational integrity for orders/inventory/pricing history; serverless-friendly, branchable for staging |
| ORM | Prisma | Type-safe schema, migrations that stay additive (never destructive) per the modularity rule |
| Search | Postgres full-text search (`tsvector` + trigram indexes) at launch, behind an abstraction that allows swapping to Meilisearch/Algolia later without touching calling code | Sufficient at medium catalog scale; avoids operating second search infra prematurely, while remaining a swap-not-rewrite later |
| File storage | Cloudflare R2 (S3-compatible) | Product images, certificates, consultant documents; no egress fees |
| PDF generation | Server-side PDF library (e.g. `@react-pdf/renderer`) | Powers the certificate of composition (Section 7.1) and downloadable invoices |
| Background jobs | Vercel Cron | Abandoned-cart emails, low-stock checks, booking reminders |
| Payments | **Razorpay and Stripe, both active at launch** | Razorpay for India (UPI, cards, net banking, COD); Stripe for international cards. Gateway chosen automatically by shipping destination, not a manual switch |
| Currency | Multi-currency active at launch (INR + at least one international currency, extensible) | Shopper sees prices in their own currency; admin still sets and thinks in one base currency (see Section 9.1) |
| Email | Resend | Transactional email (order confirmations, password resets, booking reminders) and the newsletter (Resend Broadcasts) — one vendor for all outbound email rather than adding a second ESP |
| SMS/WhatsApp | MSG91 or Twilio | OTP login, order status updates |
| Hosting | Vercel (app) + Neon/Supabase (DB) + Cloudflare R2 (storage) + Cloudflare (DNS/CDN) | Managed, low-ops, scales without infra rework |
| Auth | Custom session-based auth (bcrypt-hashed passwords, HttpOnly cookies) | Three distinct role shapes (customer/admin/consultant) with different login flows are simpler to own directly than to bend a generic third-party auth product into three shapes |
| Testing | Vitest (unit/integration), Playwright (E2E) | See Section 12 |

**Applying the modularity rule to this layer specifically:**
- Directions, metals, gemstones, categories, purposes → reference tables, not enums in code.
- RBAC roles/permissions → tables with a join table, not a switch statement.
- Payment gateway routing, currencies, shipping zones, tax rules → config records evaluated by a generic rules engine, not if/else chains keyed to literal country codes. Adding a third gateway or a new supported currency later is a data operation.
- Notification triggers → an event-rule table (`event type → template → channel`), so adding a trigger or channel is a data operation.

---

## 4. Data model

### 4.1 Configuration / reference tables (admin-editable, never hardcoded)

| Table | Purpose | Key fields |
|---|---|---|
| `directions` | The 8 Vastu zones (extensible — count is not assumed to be exactly 8 in code) | code, sanskrit_name, element, governs_text, microcopy, display_order, active |
| `metals` | Copper/brass/silver/gold-accent etc. — used to describe what a product is made of | code, display_name, purity_spec |
| `gemstones` | Ruby, sapphire, quartz, amethyst, turquoise... | code, display_name, accent_hex (drives dynamic UI color) |
| `categories` | Hierarchical — at launch: **Murtis** (with deity subcategories) and Vastu instruments (kalash / yantra / pyramid / panel / chime). Adding either side's subcategories is a data operation | code, display_name, parent_id |
| `deities` | For murti products — Ganesha, Lakshmi, Shiva, Hanuman, etc., each with its own traditional placement/facing guidance text | code, display_name, placement_guidance, display_order, active |
| `purposes` | Wealth / Health / Relationships / Career / Peace | code, display_name |
| `roles` / `permissions` / `role_permissions` | RBAC | role code, permission code, join table |
| `order_statuses` | Confirmed → Packed → Shipped → Delivered (extensible workflow) | code, display_name, display_order |
| `return_reasons` | Reasons a customer can select when requesting a return | code, display_name, active |
| `currencies` | INR and international currencies, all active at launch | code, symbol, active, is_default |
| `payment_gateways` | Razorpay and Stripe, both active | code, display_name, active, routing_rule |
| `shipping_zones` / `shipping_rates` | Rate table by region, covering both domestic and international zones | zone definition, rate rules (structured, not literals) |
| `tax_rules` | GST for India, applicable tax/duty handling per international zone | region, rate, applies_to |
| `audit_questions` | Questions powering the home audit tool (Section 7.3) | question_text, input_type, display_order, active |
| `audit_answer_rules` | Maps an answer to recommended direction(s)/purpose(s) | question_id, answer_value, maps_to_direction_id / maps_to_purpose_id |
| `consultation_types` | The kinds of consultation bookable on the platform — launches with Vastu Placement and Astrology, extensible to more later | code, display_name, description, duration_minutes, fee, credits_toward_order (bool), active, display_order |

### 4.2 Core commerce entities

- **`products`** — structured to mirror the client copy doc's per-SKU template (its section 6) exactly, as distinct fields rather than one description blob: name, slug, **positioning_line** (the one-line "what it does, said plainly"), **placement_note** (direction + why, per-piece nuance beyond the direction's own copy), description (rich text, 2–3 sentences), **care_note** (one line), **included_items** (box contents — also feeds the certificate/packing flow), category_id, status (draft/pending/live), **`base_price` and `base_currency`** (set directly by the admin — see Section 9.1), SEO fields (meta_title, meta_description — see Section 7.5), timestamps. Composition is its own table (below). Keeping the template as fields means every product page renders the client's template structure consistently, and the admin form guides the owner to fill exactly these seven things. Murti products additionally carry an optional **deity_id** (from the `deities` table), which powers deity-based filtering and pulls that deity's traditional placement/facing guidance onto the product page and placement card — the same guidance-first treatment the instruments get from their direction mapping.
- **`product_variants`** — actual sellable SKUs; every product has at least one default variant even if it never grows size/finish variants.
- **`product_composition`** — the heart of the honest-materials copy and the certificate generator: metal_id, weight_grams, gemstone_id, gemstone_qty per variant. Supports any number of line items (not a fixed 2-slot form). Purely descriptive of what the piece is made of — **it has no connection to pricing**; the admin's price entry and the composition list are two independent fields the admin fills in separately.
- **`product_price_history`** — a simple log of the admin's own price changes over time (old price, new price, changed_by, changed_at) — kept for the admin's own reference (e.g. "what was this priced at three months ago"), not tied to any automated calculation.
- **`product_directions`** — join table (a product can map to more than one zone if that's ever true).
- **`product_images`** — ordered, with required alt text (enforced at save time — see Section 7.5).
- **`carts`** / **`cart_items`** — persisted per user or session (guest carts persist by session/cookie and merge into the account cart if the guest creates an account post-purchase).
- **`orders`** / **`order_items`** / **`order_status_history`** — status resolved from `order_statuses`, never a hardcoded enum. `orders.is_guest_order` flags orders placed without an account. `orders.currency` records what currency the customer actually paid in.
- **`order_certificates`** — generated PDF reference per order (storage key, generated_at), linking back to the exact `product_composition` snapshot at time of purchase (so a later composition edit on the live product never retroactively changes a past certificate).
- **`return_requests`** — order_id, reason_id (from `return_reasons`), customer note, status (Requested/Approved/Rejected/Refunded), requested_at, resolved_at.
- **`addresses`** — multiple per user, typed (shipping/billing), default flag, supports international address formats (not India-only fields).
- **`payments`** — gateway, gateway_txn_id, amount, currency, status, linked order, refund_amount, refund_reason.
- **`reviews`** — product_id, rating, body, images, verified_purchase flag (true only if linked to a Delivered order), status (published/hidden), seller_reply.
- **`coupons`** — code, type (percent/fixed/free-shipping), rules as structured JSON (min order, applicable categories) so new discount shapes never need a schema change.
- **`gift_options`** — order-level flag (`is_gift`) + `gift_note` text field, captured at checkout (see Section 7.4 for scope).

### 4.3 Consultation booking entities

The booking system is built once, generically, around **consultation types** rather than being hardcoded to Vastu consultation alone — this is what lets astrology slot in as a second type today, and any future type slot in the same way, without touching the booking logic itself.

- **`consultants`** — linked to a user account holding the Consultant role. One row per consultant at launch (one for Vastu placement, one for astrology — or the same person for both, the schema doesn't assume either way); every screen built against this table already supports any number of consultants.
- **`consultant_consultation_types`** — join table: which consultation type(s) a given consultant offers. A consultant can offer one type or several.
- **`consultant_availability`** — recurring + one-off slots, owned by the consultant via their own login. Since availability belongs to the consultant (not to a type), a consultant offering both types manages one calendar, not two.
- **`bookings`** — consultant_id, **consultation_type_id**, customer_id, slot, status, video-link, linked order. The `credits_toward_order` flag on `consultation_types` decides whether a given type's fee counts toward the "credited toward your first order over ₹15,000" rule — this can differ per type (e.g. it might make sense for Vastu placement, since it directly informs a product purchase, and not for astrology, or vice versa — a business decision, not a technical one, see Section 14).
- **`consultation_entitlements`** — powers the announcement bar's promise "Free Vastu placement consultation with every order over ₹15,000" (taken verbatim from the client copy doc): customer_id, source_order_id, consultation_type_id, status (unused/used/expired), granted_at. Created automatically when an order's total crosses the configured threshold; redeemed through the normal booking flow at zero fee. The threshold amount, which consultation type it grants, and whether the perk is active at all are settings values — never hardcoded.

### 4.4 Content/CMS entities

- **`content_blocks`** — key (e.g. `about.body`, `our-craft.materials-section`, `legal.privacy-policy`), rich text, last-edited-by, last-edited-at. Powers every owner-editable editorial region, including the legal/policy pages in Section 7.6. Adding a new editable section anywhere on the site is a new row, not a new form to build.

### 4.5 Social media entities

- **`social_accounts`** — platform (Instagram/Threads/X/...), handle, profile URL, active flag.
- **`social_posts`** — caption, media, permalink, `source` field (`manual` | `synced`). Launches fully admin-curated (owner pins posts by hand, zero API dependency); the `source` field is what allows a later upgrade to live API sync (Instagram Graph API, etc.) without restructuring this table or any screen built against it.

### 4.6 Identity & access

- **`users`** — one table for all people (customers, admin, consultant), differentiated by assigned role(s) via `user_roles` (many-to-many) — so a single person can hold both Admin and Consultant roles simultaneously without the schema assuming either way. Guest checkout orders link to a lightweight guest record (email/phone/address only, no password) that upgrades to a full `users` row if they later sign up with the same email.
- No `seller_id`/tenant isolation anywhere, since this is single-seller. If the business ever goes multi-vendor, adding that column later is a normal additive migration — not a rebuild, consistent with the modularity rule.

---

## 5. Design system

The visual language was developed by fusing three structural concepts researched and workshopped during design review — not chosen as a flat palette, but as **four layers, each governing a different part of the system**, so the pieces compose instead of competing.

### 5.1 The four layers

1. **Foundation** — warm parchment ground (`#F3EAD9`), ink-brown text (`#2B211A`), brass linework (`#B8863E`). Ledger-honest, not stark; used everywhere except the two dark-panel moments below.
2. **Space** (from the Brahmasthan principle — a home's sacred center is traditionally kept open, not filled) — every page protects one dominant focal object and a deliberately empty center. This is an enforced layout rule, not a vague aesthetic preference.
3. **Navigation** (from the Mandala Interface concept) — the 8-direction Vastu Purusha Mandala wheel is the literal, functional "Shop by Direction" filter, not a decorative picture of one. It renders on a rare dark charcoal panel (`#201B17`) reserved *only* for this component and the homepage hero glyph — darkness signals "this is the sacred structural device," nowhere else on the site.
4. **Motif + dynamic color** (from the Smith's Hand concept) — a recurring design → shape → set → certify process line-art motif (the exact four steps named in the client's copy doc, section 7) appears on the Our Craft page and every product composition block. Accent color is **never arbitrary**: it is always the real gemstone color of the piece or direction in view, resolved from the `gemstones.accent_hex` / `directions.element_accent` data, never a fixed CSS constant.

### 5.2 Tokens

| Token | Value | Use |
|---|---|---|
| `--ground` | `#F3EAD9` | primary background |
| `--ground-raised` | `#EBE0CE` | cards, image placeholders |
| `--ink` | `#2B211A` | primary text, fine linework |
| `--ink-muted` | `#5A4E42` | secondary text |
| `--brass` | `#B8863E` | structural accent — dividers, numerals, wheel linework |
| `--focus-panel` | `#201B17` | the rare dark ground — mandala nav + hero glyph only |
| `--accent-dynamic` | resolved per-record | gemstone/direction color, read from data, never hardcoded |

### 5.3 Typography

- **Display serif** for headlines and product names — evokes engraved stone/carved inscription (production candidate: Fraunces or similar; mockups use Georgia as a faithful system-font stand-in).
- **Humanist sans** for UI, body, navigation — clean at small sizes (production candidate: Inter).
- **Ledger numerals** — tabular figures used specifically for weights, prices, and dates, so measured facts visually read as "certified data," reinforcing the material-transparency promise already central to the copy.

### 5.4 Component rules

- The mandala wheel is built once as a reusable component parameterized by `directions` data — wedge count reads from however many active rows exist (8 today), never hardcoded to 8.
- No generic "spiritual site" stock iconography (no clip-art om symbols, no lotus motifs) — the only recurring motifs are the mandala wheel and the smith's-process marks, keeping the visual language unmistakably this brand's own.
- Accessibility: WCAG 2.1 AA baseline. Dynamic accent colors are checked for contrast against their background programmatically before being allowed to save in the admin — a gemstone accent too light to read gets flagged, not silently shipped.
- Mobile-first for the storefront (majority of craft/jewelry e-commerce traffic is mobile); desktop-first for the admin panel (data-dense tables), usable on tablet.

---

## 6. Site map — every route, customer and admin

Consolidated navigation reference — every route in the platform, in one place.

### 6.1 Customer storefront

| Route | Page |
|---|---|
| `/` | Homepage |
| `/direction` | Shop by Direction (interactive mandala wheel) |
| `/collection` | Full collection (PLP), filterable |
| `/collection/[slug]` | Product detail (PDP) |
| `/home-audit` | The 2-minute home audit tool (Section 7.3) |
| `/cart` | Cart |
| `/checkout` | Checkout (guest or logged-in) |
| `/account` | Account overview |
| `/account/orders` | Order history + tracking + certificate/invoice download |
| `/account/orders/[id]/return` | Return request flow (Section 7.2) |
| `/account/wishlist` | Wishlist |
| `/account/addresses` | Saved addresses |
| `/account/wallet` | Store credit / consultation-fee credit balance |
| `/consultation` | Book a consultation — choose Vastu placement or astrology, then proceed to slot booking |
| `/our-craft` | Our Craft |
| `/vastu-shastra` | Vastu philosophy + FAQ |
| `/about` | About |
| `/legal/terms` | Terms of Service (Section 7.6) |
| `/legal/privacy` | Privacy Policy (Section 7.6) |
| `/shipping-returns` | Shipping & Returns policy (Section 7.6) |
| Footer (persistent) | Nav columns, social grid, newsletter signup |

### 6.2 Admin & seller panel

| Route | Screen |
|---|---|
| `/admin` | Dashboard |
| `/admin/products` | Product list |
| `/admin/products/[id]` | Add/edit product (includes setting the price directly — Section 9.1) |
| `/admin/orders` | Orders list |
| `/admin/orders/[id]` | Order detail |
| `/admin/returns` | Return requests queue (Section 9.5) |
| `/admin/reviews` | Review moderation (Section 9.6) |
| `/admin/consultations` | Consultation calendar (admin view + each consultant's own availability, across both consultation types) |
| `/admin/content` | Content/CMS editor (includes legal pages) |
| `/admin/customers` | Customer list |
| `/admin/analytics` | Analytics & reports |
| `/admin/settings` | Store profile, shipping, tax, gateways, currencies, roles, social accounts |
| `/admin/social` | Social content curation |

---

## 7. Customer storefront — every page and feature

*(Full visual mockups: [artifact link](https://claude.ai/code/artifact/cfd4136e-5ab0-4fa5-a87b-951b5b65ddee).)*

| Page | What it does | Key design decision |
|---|---|---|
| **Homepage** | Establishes the core claim (functional instruments, not décor); routes into direction-first or audit-first browsing | Hero mandala glyph is the only dark-panel use outside the navigation page itself; value strip and direction previews pull live from `directions`/copy tables |
| **Shop by Direction** | Direction-first browsing | The mandala wheel *is* the filter — hover previews a zone, click filters the grid in place. Wedge count and content are data-driven |
| **Collection (PLP)** | Browse-and-narrow for non-direction-first shoppers | Filter rail (category/direction/metal/purpose/price — plus deity, for murtis) reads from the same reference tables powering the direction wheel — a filter added there appears here automatically |
| **Product page (PDP)** | Convert a single product | Demonstrates the dynamic accent system live — a ruby-set piece renders every accent on its page in ruby, pulled from that product's actual composition data, not a template variant. Price is shown converted into the shopper's own currency (Section 9.1) |
| **Cart** | Review and adjust before checkout | Single-seller simplicity — no multi-seller grouping logic, since this isn't a marketplace |
| **Checkout** | Address → shipping → payment → review | Guest checkout is allowed (Section 7.4); payment gateway is chosen automatically — Razorpay for Indian addresses, Stripe for international — both active at launch, not a future flip |
| **Account — Orders** | Order history, tracking, certificate/invoice download, reorder, return request | Status vocabulary is a reference table — a step can be added without a migration |
| **Account — Wishlist, Addresses, Wallet, Settings** | Standard account management | Wallet shows any consultation-fee credit available; addresses support international formats |
| **Book a Consultation** | The custom booking flow, covering both Vastu placement and astrology | Customer first picks a consultation type (reads from `consultation_types`, so a third type shows up here automatically once added), then proceeds to slot selection. Consultant-picker step is skipped entirely when a type has only one consultant, and re-appears automatically the moment a second one is added — no rebuild either way. Whether a type's fee credits toward a first order over ₹15,000 depends on that type's own configuration |
| **Our Craft** | Craft/process storytelling | Primary home of the full-size design→shape→set→certify motif, which then recurs in miniature on every PDP |
| **Vastu Shastra / FAQ** | Education + trust content, combined for scannability | Accordion pattern; content sourced from `content_blocks`, owner-editable |
| **About** | Brand story + persistent footer | Footer includes the admin-curated social post grid and newsletter signup |
| **Legal & policy pages** | Terms, Privacy, Shipping & Returns | See Section 7.6 |

### 7.1 The certificate of composition — how it's actually produced

Every order ships with a certificate stating exact metal weight and gemstone (a core trust promise in the copy). Mechanism:
1. At the moment an order is confirmed (payment succeeds), the system reads that exact product's **current** `product_composition` rows and snapshots them into `order_certificates` — so a later edit to the live product's composition never retroactively rewrites a certificate already issued.
2. A PDF is generated server-side (`@react-pdf/renderer`), styled with the same design tokens as the site (ledger typography, brass rule lines), stored in Cloudflare R2.
3. Attached to the order-confirmation email and available for re-download anytime from `/account/orders`.
4. **Admin does not do anything manually here** — generation is fully automatic on order confirmation, consistent with the "certified per piece at the time of shipping" language already in the footer legal line. The certificate states composition only — never a price or cost breakdown.

### 7.2 Returns — the customer-facing side

1. From `/account/orders`, within the configured return window (a config value, not hardcoded — see Section 9.5 for the admin side), the customer opens `/account/orders/[id]/return`.
2. Selects a reason from `return_reasons` (admin-editable list), adds an optional note, submits — creates a `return_requests` row with status `Requested`.
3. Customer sees status update in their order history as the admin processes it (Section 9.5): `Requested → Approved → Refunded` (or `Rejected`, with the admin's reason shown).
4. **Engraved/personalized pieces are excluded from returns** — the copy doc's own note ("engraved/personalized pieces are typically final sale") is enforced by a `products.is_final_sale` flag that hides the return-request option for that order line.
5. International returns follow the same flow — the refund is issued in the currency the customer originally paid in, via whichever gateway (Razorpay or Stripe) processed that order.

### 7.3 The 2-minute home audit — what it actually is

Referenced directly in the homepage hero copy ("Not sure where to start? Take the 2-minute home audit") but never specified until now. Design: a short, guided multi-step quiz at `/home-audit`.

- A handful of plain-language questions (e.g. "Which direction does your main entrance face?", "Do you know your kitchen's direction?", "Is your home a standard rectangular layout, or irregular — L-shaped, multi-use floors, corner plot?").
- Each question and its answer options live in `audit_questions`; each answer maps to recommended directions/purposes via `audit_answer_rules` — **the quiz itself is fully admin-editable data, not a hardcoded wizard**, consistent with the modularity rule. The owner can add, remove, or reword questions from the admin without a code change.
- Result screen: a shortlist of recommended pieces/directions based on the answers, exactly mirroring how the direction wheel and PLP filters already work.
- If the customer's answers indicate an irregular layout (matching the copy's own "Do I need a consultation?" guidance), the result screen surfaces the booking CTA for the **Vastu placement** consultation type specifically (not astrology) instead of/alongside product recommendations — directly reusing the existing copy logic rather than inventing new rules.
- **Needs your confirmation:** the exact question set and scoring rules above are a reasonable first draft consistent with the brand's existing copy, but the real questions should be reviewed by whoever understands the Vastu logic in depth before this ships (flagged again in Section 14).

### 7.4 Guest checkout

Checkout allows completing a purchase without creating an account — email, phone, and shipping address are collected as normal order fields, and the order links to a lightweight guest record rather than a full `users` row. After a successful guest order, the confirmation page offers one-click account creation using the details already entered (no re-typing), at which point the guest record and any prior guest orders under that email attach to the new account. This is a recommended default for a premium checkout (reduces friction) rather than something explicitly requested — flagged for confirmation in Section 14.

### 7.5 SEO & discoverability

The original copy doc specifies exact title-tag and meta-description templates; this section is how they're actually implemented, not just written as copy:

- **Dynamic meta tags per page**: `products.meta_title`/`meta_description` fields, falling back to the template pattern from the copy doc (`[Product Name] — [Direction] Vastu Piece in [Primary Metal] | Sarthak Arts`) when left blank, so the admin never *has* to fill these in manually for every product but can override any one.
- **Structured data (JSON-LD)**: `Product` schema (price, availability, composition-derived material) and `Review`/`AggregateRating` schema on every PDP; `BreadcrumbList` on category/direction pages; `FAQPage` schema on the Vastu Shastra/FAQ page.
- **XML sitemap**: auto-generated from live `products`/`categories`/`directions` on every deploy and content change, submitted to Search Console.
- **Canonical URLs**: enforced on filtered/paginated collection views so filter combinations never create duplicate-content issues.
- **Image alt text**: a required field on `product_images` at save time — the admin cannot publish a product with an untagged image.
- **Core Web Vitals**: addressed structurally by the SSR/ISR architecture already chosen in Section 3, not as a separate initiative.

### 7.6 Legal & policy pages

Three pages referenced by the footer nav (`Shipping & Returns`) and standard e-commerce compliance needs, none of which existed as designed pages before this revision:

- **Terms of Service** (`/legal/terms`)
- **Privacy Policy** (`/legal/privacy`) — must state what customer data is collected (accounts, guest checkout records, cart/order history) and how it's used, given payment and shipping data are handled, and should account for international privacy expectations (e.g. GDPR-style language) given the international customer base
- **Shipping & Returns** (`/shipping-returns`) — states the real shipping partner/timelines and the real return policy once the owner supplies them (Section 14), for both domestic and international shipping

All three are `content_blocks`-backed, exactly like About/Our Craft/Philosophy — owner-editable from the same CMS screen (Section 8.7), not separate infrastructure.

### 7.7 Gifting — minimal launch scope

The footer lists "Gifting" as a nav item in the copy doc, with no further detail given anywhere. Rather than leave it unscoped or silently drop it, minimal Phase 2 scope: an `is_gift` flag + `gift_note` text field captured at checkout (`gift_options` table, Section 4.2) — the recipient's package includes the note, and price/certificate information is omitted from what's visible to the recipient. A full gift-registry or gift-card system is explicitly **not** in scope unless the owner asks for more than this (Section 14).

---

## 8. Admin & seller panel — every screen, every control

*(Full visual mockups: same artifact as Section 7.)*

### 8.1 Dashboard (`/admin`)
**What the owner sees first, every morning.**
- Revenue today (with delta vs. yesterday), orders today (with pending count), low-stock item count, upcoming consultations.
- A "needs your attention" panel: pending orders to ship, low-stock alerts, unreplied reviews, open return requests — pulled live, not a static checklist.
- **Admin can:** see everything that needs action today without navigating anywhere else.

### 8.2 Products (`/admin/products`)
**Full catalog control, built for scale from day one even though launch catalog is medium-sized.**
- Searchable/filterable product table: name, direction, price, stock, status.
- Bulk actions: multi-select for bulk status change, bulk price update; CSV import/export.
- **Admin can:** create, edit, publish/unpublish, archive any product; bulk-edit at scale; export the full catalog for accounting or backup.

### 8.3 Add / Edit product (`/admin/products/[id]`)
**The most detail-critical admin screen — where the modularity rule is most visible to the owner directly.**
- Standard fields: name, description (rich text), category, direction(s), images (drag-drop, reorder, alt text required — Section 7.5), `is_final_sale` flag for engraved/personalized pieces (Section 7.2).
- **Composition builder** — add any number of metal/gemstone line items (not a fixed 2-slot form); each line item has metal, weight in grams, and optionally a gemstone + quantity. This is what the "exact weight, no ranges" copy promise and the certificate generator (Section 7.1) read from. Purely descriptive — has no bearing on price.
- **Price field** — the admin types in the exact selling price directly, in their base currency. No formula, no live rate, no suggestion. Full, direct control (see Section 9.1). Every change is logged to `product_price_history` for the admin's own reference.
- SEO fields (meta title, description, slug) — see Section 7.5.
- **Admin can:** fully author every fact about a product — including its price — with total authority and no system-generated number in the way.

### 8.4 Orders (`/admin/orders`)
**The daily fulfillment queue.**
- Filterable by status (Pending/Packed/Shipped/Delivered/Returns) — filters read from the `order_statuses` reference table, so a new status shows up here automatically.
- Order table with quick-open action into detail; guest orders and international orders are flagged inline.
- **Admin can:** see every order at every stage of fulfillment, filter to exactly what needs action right now.

### 8.5 Order detail (`/admin/orders/[id]`)
**Everything about one order, one place.**
- Full item list, customer contact info, shipping address, gift note if `is_gift` (Section 7.7), currency the order was paid in.
- Status-update control (a clear linear progression, matching the reference-table workflow).
- Shipping label generation action, aware of domestic vs. international shipping.
- Direct link to the certificate that was generated for this order (Section 7.1).
- **Admin can:** update fulfillment status, generate a shipping label, and see exactly what was promised to the customer (composition/certificate data) without leaving the screen — critical for answering customer questions about "what's actually in this order" without a separate lookup.

### 8.6 Consultations (`/admin/consultations`)
**Dual-purpose: each consultant's own calendar + admin's booking overview, across every consultation type.**
- Upcoming bookings list with status, filterable by consultation type (Vastu placement / astrology).
- Availability editor — owned directly by the logged-in consultant (per the requirement that consultants manage their own calendar). A consultant offering both types manages one calendar; the type is just an attribute of each booking.
- **Because `consultants` and `consultation_types` are real, generic tables, a second consultant, or a third consultation type entirely, appears on this exact same screen the moment it's added — nothing here gets rebuilt to support that.**
- Consultation type management (fee, duration, whether it credits toward an order) lives in Settings (Section 8.10) — the same admin-editable pattern as every other config in this document.
- **Admin/consultant can:** see and manage all upcoming bookings across both consultation types, set/edit their own weekly availability, mark a consultation complete (which is what triggers the order-credit logic, if that type has it enabled).

### 8.7 Content editor (`/admin/content`)
**The lightweight CMS.**
- A list of every editable content region (About story, Our Craft intro/materials, Philosophy intro, FAQ entries, Terms/Privacy/Shipping & Returns...), each mapped to a `content_blocks` row.
- Rich-text editing (bold, links, paragraphs) with a save action and a "last edited by / when" trail.
- **Admin can:** edit any editorial or legal copy on the site themselves, with zero code deploy and zero developer involvement. Adding a new editable section anywhere later is a data operation (a new `content_blocks` row + a render call), not a new form to build.

### 8.8 Customers (`/admin/customers`)
**Deliberately simple at this scale.**
- List with order count, lifetime value, last order date, guest-vs-account flag, home country.
- **Admin can:** see who's buying and how much they're worth, without an over-built CRM the business doesn't need yet — with room to grow into segmentation/tagging later without restructuring the underlying `users` table.

### 8.9 Analytics (`/admin/analytics`)
**The reporting an owner actually checks.**
- Revenue trend (30-day), shown in a base currency with a breakdown by market (India vs. international) available.
- Top products by units sold.
- **Sales by direction** — a report unique to this business (most e-commerce platforms have no reason to report "which compass zone sells best," but here it's exactly the metric that matters).
- **Admin can:** see what's selling, what's trending, and which Vastu zones and which markets are driving the business.

### 8.10 Settings (`/admin/settings`)
**The control room for every config-driven system in this document.**
- Store profile, shipping zones/rates (domestic and international), tax rules, return window length.
- Payment gateways — Razorpay and Stripe both shown active.
- Currencies — which currencies are offered to shoppers, and which is the admin's own base currency for entering prices.
- Roles & access — launches with Admin + Consultant, designed to extend to more granular roles (Catalog Manager, Fulfillment) later purely as data.
- Social accounts — connect/manage Instagram, Threads, X handles.
- Home audit questions — edit the quiz from Section 7.3 directly.
- Consultation types — add, edit, or deactivate a consultation type (name, description, duration, fee, whether it credits toward an order); this is exactly how astrology was added and how any future type would be added, without a code change.
- **Admin can:** control every business-decision toggle described in this whole document from one place — shipping, tax, gateways, currencies, roles, social, the audit quiz, consultation types — without ever touching code.

### 8.11 Social content (`/admin/social`)
**Launches fully admin-curated, upgradeable later.**
- Connection status per platform (Instagram/Threads/X).
- A grid of pinned posts shown on the homepage/about page, added manually by the owner.
- **Admin can:** curate exactly which social content represents the brand on the site today; later, flip a platform to live-synced (via that platform's API) without this screen's shape changing — the `source` field on `social_posts` is what makes that an upgrade, not a rebuild.

### 8.12 Returns queue (`/admin/returns`)
See Section 9.5 for the full workflow. Screen shows every `return_requests` row, filterable by status, with approve/reject actions and a link into the linked order.

### 8.13 Review moderation (`/admin/reviews`)
See Section 9.6 for the full workflow. Screen lists all reviews, filterable by published/hidden/unreplied, with hide/publish toggle and a reply field.

---

## 9. Core intelligent systems — full working

### 9.1 Pricing — fully manual, by design

There is no pricing engine, no live metal-rate feed, and no automated price computation anywhere in this platform. This is a deliberate business decision, not a deferred feature:

1. When creating or editing a product, the admin fills in the `base_price` field directly, in their chosen base currency — a plain number they type in themselves.
2. `product_composition` (the metal/gemstone breakdown) is entered separately and used only for the honesty-in-materials promise and the certificate — it has no computational link to the price field.
3. **International pricing:** the admin's entered price is treated as the base price; the storefront converts and displays it in the shopper's local currency at the current exchange rate (a straightforward currency-conversion display step, not a pricing decision) — the admin can also set an explicit override price per currency if they want a specific number in a specific market (e.g. a clean $199 instead of a converted $198.73), rather than always relying on live conversion.
4. Every time the admin changes a price, the old and new values are logged to `product_price_history` with a timestamp — purely for the admin's own record-keeping, not shown to customers.
5. **There is nothing to keep confidential here that isn't already normal for any store**: since there's no formula, no rate feed, and no suggestion mechanism, there's no computed cost/margin data in the system at all — the admin's own reasoning for a price lives in their head or their own notes, never in a system field that could leak.

### 9.2 The consultation booking system, end to end

1. Customer opens `/consultation` and first picks a consultation type — **Vastu placement** or **astrology** — read live from the `consultation_types` table, so a third type appears here automatically the moment one is added. If only one type is ever active, this step collapses to a single card, the same way the consultant-picker step collapses when there's only one consultant.
2. Within the chosen type, the flow proceeds as before: if that type has one consultant, it skips straight to date/slot selection; if it has several, a consultant-picker step appears.
3. Available slots are computed from that consultant's `consultant_availability` rows minus already-booked `bookings`.
4. Customer selects a slot, pays that type's consultation fee (via Razorpay or Stripe depending on their location), and a `bookings` row is created with the chosen `consultation_type_id`.
5. The consultant (logged in with their own Consultant-role account) sees the booking on their `/admin/consultations` (or a consultant-scoped view of the same screen) and manages their own availability directly — the admin doesn't have to do this on their behalf. A consultant offering both types sees both on one calendar.
6. At the booking time, a video/call link is sent via email/SMS (Resend + MSG91/Twilio) — accounting for the customer's timezone if booking internationally.
7. After the consultant marks the booking complete: **if** that consultation type has `credits_toward_order` enabled, the linked customer record carries a credit flag — an order over ₹15,000 (or the equivalent) applies the fee as a discount at checkout, enforced by the `bookings.linked_order` relationship. Whether astrology should carry this same credit, the same fee, and the same duration as Vastu placement is a business decision, not a technical one — flagged in Section 14.
8. **The reverse direction also works — the big-order gift.** When any order's total crosses the configured threshold (₹15,000 at launch), the system automatically creates a `consultation_entitlements` row for that customer: one free Vastu placement consultation, exactly as the announcement bar promises. The customer sees it on their account (and in the order-confirmation email) and books it through the normal flow with the fee showing as ₹0. Threshold, granted type, and on/off are admin settings.

### 9.3 Notifications — full trigger list

Every trigger below is a row in an event-rule table (`event type → template → channel(s)`), not code wired into business logic — adding a new one is a data operation.

| Trigger | Channel(s) | Recipient |
|---|---|---|
| Order confirmed | Email + SMS | Customer |
| Order packed / shipped (with tracking) | Email + SMS | Customer |
| Order delivered | Email | Customer |
| Order cancelled | Email + SMS | Customer |
| Abandoned cart (after 24h idle) | Email | Customer |
| Back-in-stock on wishlisted item | Email | Customer |
| Return request submitted | Email | Customer + Admin |
| Return approved / rejected / refunded | Email | Customer |
| New order placed | Email + in-admin alert | Admin |
| Low stock threshold crossed | In-admin alert | Admin |
| New review submitted | In-admin alert | Admin |
| Booking confirmed | Email + SMS, with call/video link | Customer + Consultant |
| Booking reminder (1 hour before) | SMS | Customer + Consultant |
| Newsletter monthly send | Email | Subscribers (opted-in via footer signup) |

### 9.4 Search, end to end

- Product search and the direction/category/purpose filters all query the same underlying `products` + reference-table joins via Postgres full-text search (`tsvector`, trigram indexes for typo tolerance) at launch.
- The query layer is written behind a small search-service abstraction specifically so that if catalog size or query complexity ever outgrows Postgres FTS, swapping to Meilisearch/Algolia is a backend swap behind that same interface — not a rewrite of every page that calls it.

### 9.5 The core commerce data flow — browse to fulfillment

This is the platform's most fundamental flow; every other system in this document plugs into it.

1. **Browse:** customer views products via the storefront (Section 7), reading from `products`/`product_variants`/`product_composition`/reference tables, with the price displayed converted into their detected currency. No write activity yet.
2. **Add to cart:** a `cart_items` row is created, linked either to the logged-in user's `carts` row or to a guest session cookie.
3. **Checkout begins:** address entered (or selected from saved `addresses`, supporting international formats); `shipping_rates` resolves shipping cost from the address's zone (domestic or international); `tax_rules` resolves tax/duty; `coupons` applied if a code is entered — all resolved from config tables, not hardcoded math.
4. **Payment:** the gateway is chosen automatically by destination — Razorpay for India, Stripe for international — both active at launch. On the gateway's success webhook:
   - An `orders` row and its `order_items` are created from the cart contents (never from client-submitted data, to prevent price tampering).
   - `order_status_history` logs the initial `Confirmed` status.
   - `order_certificates` are generated per item (Section 7.1).
   - The relevant notifications fire (Section 9.3: order confirmed, low-stock check if applicable).
   - The cart is cleared.
   - **No internal payout engine is needed** — because this is single-seller, both Razorpay and Stripe settle funds directly to the business's own bank account(s) on their standard settlement cycles; the platform does not need to build seller-payout logic a marketplace would require.
5. **Fulfillment:** admin updates status through `Packed` → `Shipped` (capturing a tracking number, triggering the shipped notification) → `Delivered`.
6. **Post-delivery:** the return window opens (config value in settings); the customer may leave a review (Section 9.6) or request a return (Section 9.5 below) within that window.

### 9.5 Returns & refunds, end to end

1. Customer submits a return request from `/account/orders/[id]/return` (Section 7.2) — creates a `return_requests` row, status `Requested`. Excluded automatically for any order line flagged `is_final_sale` (engraved/personalized pieces).
2. Admin reviews the request on `/admin/returns` (Section 8.12) — approves or rejects, with a reason visible to the customer either way.
3. If approved: reverse pickup is scheduled (or drop-off instructions sent, depending on the real shipping partner chosen — Section 14; international returns may use a simpler process, e.g. customer-paid return shipping, to be confirmed) and status moves to `Approved`.
4. On confirmed receipt of the returned item, the admin triggers the refund — processed via the original payment gateway's refund API (Razorpay or Stripe, whichever was used) back to the original payment method, in the original currency, `payments.refund_amount`/`refund_reason` populated, status moves to `Refunded`.
5. `order_status_history` reflects the full return journey alongside the original fulfillment history — one continuous, auditable record per order.

### 9.6 Reviews & moderation, end to end

1. A customer can only submit a review on a product from an order in `Delivered` status — this sets `reviews.verified_purchase = true` automatically; there's no unverified review path at all, so every review on the site is provably a real purchase.
2. On submission, the review defaults to `published` (configurable to `requires approval` in settings if the owner later wants to pre-moderate).
3. Admin can hide any review (status → `hidden`, removed from the public PDP but retained in the database) or reply via `seller_reply` — both actions available from `/admin/reviews` (Section 8.13) and surfaced as a dashboard alert (Section 8.1) when a review is new and unreplied.

---

## 10. Payments, auth & security

- **Payments:** Razorpay and Stripe both live at launch. Razorpay handles India transactions (UPI, cards, net banking, COD); Stripe handles international cards. Gateway selection is a config lookup by shipping-destination + active-gateway rules, not a hardcoded conditional — adding a third gateway later (e.g. a region-specific one) is the same kind of config addition, not a rebuild.
- **Auth:** custom session-based auth. Customers get social login + OTP options, plus guest checkout (Section 7.4) as a non-authenticated path; staff (admin/consultant) get email+password with MFA required. Session cookies are HttpOnly, secure, with refresh-token rotation.
- **RBAC:** `roles`/`permissions`/`role_permissions` tables, checked via middleware per route group. A user can hold multiple roles simultaneously (supports the same person being both Admin and Consultant without the system assuming either way).
- **Data protection:** TLS everywhere, encrypted at rest (managed by Neon/Supabase + R2), parameterized queries via Prisma (no raw SQL string interpolation), CSRF protection on all state-changing routes, rate limiting on login/OTP endpoints.
- **Audit trail:** price history, order status history, return history, and content-edit history (last-edited-by/when) are all permanent, append-only records — nothing silently overwritten anywhere in the system.
- **Order integrity:** orders are always built server-side from cart/database state at payment-confirmation time, never trusting client-submitted prices — closes the most common tampering vector in DIY checkout builds.
- **International compliance:** the Privacy Policy (Section 7.6) and checkout data handling account for international customers, not just Indian ones — since pricing is manual and there's no metal-rate/formula data in the system at all, there's no confidential pricing-mechanics data to protect beyond ordinary business practice (the admin's own price-setting reasoning, which lives outside the system).

---

## 11. Infrastructure & DevOps

- **Hosting:** Vercel for the Next.js app (auto-scaling, edge-cached storefront pages via ISR).
- **Database:** Neon or Supabase Postgres, with branch-per-environment (production/staging) so schema changes are tested before they touch live data.
- **Storage:** Cloudflare R2 for all media/certificates, fronted by Cloudflare CDN.
- **CI/CD:** lint → typecheck → test → deploy pipeline (GitHub Actions), with staging as a mandatory gate before production for schema-affecting changes.
- **Monitoring:** error tracking (Sentry) + uptime checks from day one, given the owner has no engineering team to notice an outage manually.
- **Backups:** automated daily Postgres backups (managed by the DB provider), retained on a rolling window sufficient to recover from any single bad migration.

---

## 12. Testing & QA strategy

Given the "no compromise, no rebuilds" mandate, correctness has to be enforced continuously, not just checked once at launch.

| Layer | Tool | Covers |
|---|---|---|
| Unit tests | Vitest | Currency conversion/display logic, discount/coupon logic, tax/shipping rate resolution, notification-rule matching — the parts of the system where a silent math error is expensive |
| Integration tests | Vitest + test database | Order creation from cart state, payment webhook handling (both gateways), return/refund state transitions, RBAC permission checks |
| End-to-end tests | Playwright | The full checkout flow (both gateways, including guest checkout), the admin product-creation flow (including entering price and composition), the consultation booking flow |
| Manual QA gate | Staging environment (Section 11) | Every schema-affecting change is verified in staging before touching production data — non-negotiable given a non-technical owner has no way to recover from a bad production migration themselves |

---

## 13. Phased roadmap

Structured to be timeline-agnostic (works whether the build takes weeks or months) — each phase is a complete, shippable state, not a partial one.

### Phase 1 — MVP
- Storefront: homepage, Shop by Direction (wheel-as-navigation), PLP, PDP, cart, checkout (Razorpay + Stripe both active, multi-currency display, guest checkout included), account/orders.
- Certificate of composition generation (automatic on order confirmation).
- Admin: dashboard, products (full CRUD with manual price entry, no bulk tools yet), orders, basic settings including currency/gateway configuration.
- Manual pricing entry — this is the permanent pricing model, not a placeholder for something more automated later.
- Consultation booking for both launch types (Vastu placement and astrology), each with one consultant.
- Content pages (About, Our Craft, Philosophy, FAQ, legal pages) shipped with real copy, CMS editing deferred to Phase 2.
- Core notification set (order confirmed/shipped/delivered).
- SEO foundation (meta tags, sitemap, structured data) — not deferred, since it compounds from day one.
- Unit + E2E test coverage for checkout (both gateways) and order logic (Section 12).

### Phase 2 — Core differentiators
- CMS editor for editorial *and* legal content.
- Returns & refunds workflow (customer request → admin approval → refund, both gateways).
- Review submission + moderation.
- The home audit tool.
- Bulk product tooling (CSV import/export, bulk actions).
- Analytics dashboard, including the direction-wise and market-wise (India vs. international) sales reports.
- Social content module (admin-curated).
- Gifting (minimal scope, Section 7.7).
- Full notification set (abandoned cart, back-in-stock, returns, reviews).
- Newsletter integration (Resend Broadcasts).
- Per-currency price overrides (Section 9.1) if live conversion display isn't precise enough for the owner's taste.

### Phase 3 — Further expansion
- Additional international markets/currencies beyond the initial launch set, as demand shows up.
- A second consultant for either consultation type, or a third consultation type entirely (already supported structurally; this phase is just the first time either is actually used).
- Live social API sync (Instagram Graph API etc.), replacing/augmenting manual curation.
- Search backend swap to Meilisearch/Algolia if catalog scale warrants it.
- Granular RBAC roles (Catalog Manager, Fulfillment) if the team grows beyond one person.
- Native mobile app — only if usage data at that point actually justifies it; not assumed.

**Every phase boundary above is a configuration/data change, not a rebuild — this was checked against the modularity rule as this roadmap was written.**

---

## 14. Open items for the business owner to confirm before implementation begins

Real business decisions the design intentionally left as data/config rather than guessing at a value, plus decisions made provisionally during design review that deserve an explicit yes/no rather than silent assumption:

1. **Which specific international markets/currencies to support at launch** — e.g. US/UK/UAE as a starting set, or a broader/different list. This determines which currencies and shipping zones are pre-configured on day one (more can always be added later as data, per the modularity rule).
2. Real shipping partner(s) for both domestic (e.g. Shiprocket, Delhivery) and international shipping — needed to wire the label-generation and return-pickup actions.
3. Return/refund policy specifics: return window length, which conditions qualify, and whether the policy differs for international orders — the copy doc itself flags this as a placeholder.
4. Real consultation fee amount for Vastu placement and for astrology (they can be priced differently), and whether either differs for international customers (mockup uses ₹999 as a placeholder for both).
   - Who the astrology consultant is — a new person, or the same person as the Vastu consultant offering a second service.
   - Astrology consultation's duration if different from the 20-minute Vastu format.
   - Whether astrology bookings should also credit toward a first order over ₹15,000 the way Vastu placement does, or whether that incentive only makes sense for Vastu (since it directly informs which physical product to buy) and astrology should stand alone.
5. The exact home-audit question set and scoring logic (Section 7.3) — drafted here consistent with existing copy, but should be reviewed by whoever owns the Vastu guidance logic before it ships.
6. Confirm guest checkout is wanted (Section 7.4) — assumed yes as a premium-checkout best practice, but not something explicitly requested.
7. Confirm gifting's minimal scope (Section 7.7 — just a note field) is sufficient, or whether a fuller gift feature (gift cards, gift-wrapped product line) is wanted.
8. Who drafts the actual legal copy for Terms of Service and Privacy Policy (Section 7.6), with international privacy expectations in mind — this is a legal-accuracy matter, not something to draft as placeholder business copy.
9. Whether the admin wants per-currency price overrides available from day one (Section 9.1), or whether relying on live currency conversion for display is fine to start with.
10. **RESOLVED (2026-07-06): manual pricing confirmed — copy will be softened.** The owner has confirmed pricing is fully manual (admin/seller decides every price). Accordingly, the two copy passages that promised automated rate-tracking will be revised at implementation: collection-page intro becomes "Every piece below lists the metal it's made from, its exact weight, and the single gemstone set into it. Our prices reflect the true cost of the materials in each piece — what you see at checkout is what you pay, no surprises after." and the FAQ answer to "Why do prices change?" becomes "Because our pieces are priced on the real cost of their materials, prices are reviewed and adjusted as metal costs move. The price shown at checkout is locked in for your order." Both remain honest under manual pricing while keeping the original copy's tone and its true promises (material honesty, price locked at checkout).
11. **RESOLVED (2026-07-06): the big-order free-consultation perk will be built.** The client's copy doc states verbatim in its announcement bar: "Free Vastu placement consultation with every order over ₹15,000." Since the doc is the client brief, this is treated as a requirement, not an option. Mechanic (see Section 4.3 and Section 9.2): any order whose total crosses the configured threshold (₹15,000 at launch — a settings value, not hardcoded, per the modularity rule) grants the customer one free Vastu placement consultation booking, recorded as a `consultation_entitlements` row and redeemable through the normal booking flow at zero fee. Both directions of the loop now exist: consult-first (fee credited toward a qualifying order) and buy-first (qualifying order grants a free consultation).

12. **The actual product list from the client.** The client has stated the scope as "murtis and Indian Vastu products" (2026-07-06). Needed before launch: the real product list (which murtis — which deities, sizes, metals — and which Vastu instruments), listing copy for each in the copy doc's 7-field template (the copy doc's author explicitly offered to write these once the product list exists), and confirmation of each murti's placement/facing guidance for its placement card.

None of these block the design or the implementation plan — they're inputs the system is built to accept as configuration, exactly per the modularity rule.
