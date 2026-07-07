# Sarthak Arts

A custom D2C storefront and admin panel for **Sarthak Arts** — handcrafted Murtis and Indian Vastu products (copper, brass and silver pieces, set with gemstones). Built direction-first: every product is tied to a Vastu direction and purpose, ships with a certificate of composition, and the whole platform is configuration-driven — copy, currencies, shipping, statuses, FAQ and social posts are all database rows the owner edits, never code.

## Stack

- **Next.js 16** (App Router, React 19, Server Actions) + TypeScript
- **Prisma 6** + **PostgreSQL** (Neon)
- Custom session auth (jose JWT + bcrypt, HttpOnly cookie, `proxy.ts`-gated `/admin`)
- Money stored as integer minor units; multi-currency display via cookie + per-currency rate
- Razorpay webhook-driven orders (HMAC-verified, idempotent); certificate PDFs via `@react-pdf/renderer` behind a storage abstraction
- Vitest (TDD for all pure-logic modules)

## Running locally

```bash
npm install
cp .env.example .env         # then fill in DATABASE_URL and SESSION_SECRET
npm run db:migrate           # apply migrations
npm run db:seed              # reference data, settings, sample products, content
npm run dev                  # http://localhost:3000
```

- **Storefront:** `/`
- **Admin:** `/admin` — sign in with the seeded owner account:
  - `owner@sarthakarts.com` / `SarthakAdmin!2026`
- **Simulate a paid order** without a public webhook URL: `npm run simulate:webhook`

## What's in it

**Storefront:** homepage, collection listing + filters, product pages (with reviews, gemstone-accent pricing, SEO metadata), shop-by-direction wheel, search, cart, guest checkout → payment → order, consultation booking, 2-minute home audit, guest order lookup with review/return, and editorial pages (About, Our Craft, Vastu Shastra/FAQ) with a full footer + newsletter capture.

**Admin:** dashboard, products (manual pricing, composition editor, price history), orders (status flow), consultations (bookings + availability + provisioning consultant logins), reviews (moderation), returns, **content** (edit any storefront copy — goes live instantly), **social** (curate the Instagram feed), **analytics** (revenue, top products, sales-by-direction), and settings.

**Consultant / astrologer portal** (`/portal`): each consultant signs in to see only their own bookings (customer details, mark done, add a video-call link) and manage their own availability. Role-gated separately from admin. The admin creates/resets consultant logins from the Consultations screen.

### Logins (dev)

- **Admin:** `owner@sarthakarts.com` / `SarthakAdmin!2026` → `/admin`
- **Consultant:** `consultant@sarthakarts.com` / (set via `CONSULTANT_PASSWORD`) → `/portal`

## Deferred (operational inputs, not missing features)

These are wired and waiting on real credentials/content — no code changes needed to switch on:

- **Payment keys** — Razorpay/Stripe live keys are behind KYC; the webhook + signature verification are complete and tested against a local simulator.
- **Transactional email** — `src/lib/email.ts` no-ops cleanly without `RESEND_API_KEY`; order- and booking-confirmation emails send the moment a key is set. The broader notification set (abandoned cart, back-in-stock) plugs into the same module.
- **Customer accounts** — checkout is guest-first with email-gated order lookup; a full account area is a later addition.
- **Live social sync** — posts are admin-curated now; the `SocialPost.source` field is ready for API sync later.
- **Real product photography and catalog** — sample products and placeholder art ship in the seed; the admin accepts the real catalog as data.

## Tag history

`v0.1-slice` → `v0.2-storefront` → `v0.3-admin` → `v0.4-consultations` → `v0.5-post-purchase` → `v1.0` (CMS, social, analytics, polish — feature-complete) → `v1.1` (legal pages via CMS + gifting) → **`v1.2`** (consultant/astrologer portal — every role now has its own interface).
