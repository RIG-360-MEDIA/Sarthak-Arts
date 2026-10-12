# Sarthak Arts

D2C storefront + admin panel for **Sarthak Arts** — handcrafted murtis and Vāstu pieces in copper, brass and silver. Every product is tied to a Vāstu direction and purpose and ships with a certificate of composition. Copy, prices, shipping, FAQ and social posts are database rows the owner edits — not code.

**Live:** https://sarthakarts.in  ·  Admin: `/admin`  ·  Consultant portal: `/portal`  ·  Customer account: `/account`

## Stack

| Part | Tech |
|---|---|
| App | Next.js 16 (App Router, React 19, Server Actions), TypeScript |
| Database | PostgreSQL on **Supabase** (Mumbai), via **Prisma 6** |
| Logins | **Supabase Auth** — admin, consultant and customer; role kept in `app_metadata` |
| Files (product photos, certificate PDFs) | **Supabase Storage** (S3-compatible) behind `src/lib/storage.ts` |
| Payments | **UPI QR** today (owner verifies each payment); **Razorpay** ready behind `PAYMENT_MODE=razorpay` |
| Hosting | **Vercel** (team `rig12`, project `sarthak-arts`, region `bom1`); domain DNS at Hostinger |
| Tests | Vitest |

## Run it locally

Requires Node 20+ (24 works).

```bash
cd sarthak-arts
npm install
cp .env.example .env        # fill in values — ask the project owner for the real ones
npx prisma generate
npm run dev                 # http://localhost:3000
```

The `.env` file is **never committed**. All variables are listed and explained in `.env.example`. The important ones:

| Variable | What it is |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres: pooled (port 6543, `?pgbouncer=true`) / session (port 5432, used by migrations) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys. The secret key is server-only. |
| `STORAGE_DRIVER=s3`, `S3_*` | Supabase Storage bucket `sarthak-media` + its S3 access keys |
| `PAYMENT_MODE`, `UPI_ID`, `UPI_PAYEE_NAME` | `upi` shows a QR at checkout; switch to `razorpay` once live keys exist |
| `NEXT_PUBLIC_SITE_URL` | `https://sarthakarts.in` in production (links, sitemap, previews) |
| `ADMIN_*`, `CONSULTANT_*` | Logins created by the seed script |

> Local development uses the **same Supabase database as the live site** unless you point `.env` at another one. Be careful with test data — or create a separate Supabase project for development.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build (what Vercel runs) |
| `npm test` | Unit tests (Vitest) |
| `npx prisma migrate deploy` | Apply pending migrations to the database in `.env` |
| `npm run db:migrate` | Create a new migration while developing (`prisma migrate dev`) |
| `npm run db:seed` | Reference data, settings, logins (+ sample products in demo mode) |
| `npm run db:seed:prod` | Same without sample products |

## Making changes (team workflow)

1. `git pull` on `master`, then create a branch: `git checkout -b feat/short-description`.
2. Make the change; run `npm test` and `npm run build` in `sarthak-arts/`.
3. **Database change?** Edit `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed` against a dev database, and commit the new folder in `prisma/migrations/`. Prefer additive changes (new columns/tables); never edit an old migration.
4. Push the branch and open a Pull Request into `master`. Vercel builds a preview for every push.
5. Merge → deploy to production (see `DEPLOYMENT.md`). Apply any new migration to the live database **before** the new code goes live: `npx prisma migrate deploy`.

## Where things are

```
sarthak-arts/
  prisma/                schema.prisma, migrations/, seed.ts
  src/app/(storefront)/  public site: home, collection, product, cart, checkout, consultation, account, order tracking
  src/app/(admin)/admin/ owner console (products, orders, consultations, reviews, returns, content, social, subscribers, analytics)
  src/app/(portal)/      consultant portal
  src/app/api/           images, places (birth-place search), admin CSV export
  src/lib/               business logic: orders, payments/upi.ts, product-delete, session, require-admin, supabase/, panchang/ (calendar)
  src/proxy.ts           login + role guard for /admin, /portal, /account
  tests/                 Vitest
```

Every admin server action calls `requireAdmin()` itself — keep doing that for new ones (actions can be called directly, not only from the guarded pages).

## What the owner can do (admin)

Products (add/edit, photos, composition, direction, bulk Live/Draft/Archive/Delete) · Orders (verify UPI payment, mark packed/shipped/delivered) · Consultations (bookings with birth details, availability, consultant logins) · Reviews · Returns · Content (any storefront text) · Social · **Subscribers** (newsletter list, remove, CSV download) · Analytics · Settings.

Deleting a product that was ordered archives it first; deleting it again from the **Archived** tab removes it for good (past orders keep their item details).

## Troubleshooting

| Problem | Fix |
|---|---|
| Live site still shows the old version | Hard refresh (Ctrl+F5). Check the latest deployment is **Ready** in Vercel → Deployments. |
| Vercel build fails with Prisma type errors | The build must run `prisma generate` first — `npm run build` does; don't change the build command to plain `next build`. |
| Works locally, error on Vercel | A variable is missing in Vercel → Settings → Environment Variables (compare with `.env.example`), then redeploy. |
| `relation/column does not exist` | A migration wasn't applied: `npx prisma migrate deploy` with `.env` pointing at that database. |
| Local dev shows 404 on real pages, or build fails with `EPERM … .next` | The `.next` cache is corrupt or locked by OneDrive. Stop the server, delete `sarthak-arts/.next`, run again. Keeping the repo outside OneDrive avoids this. |
| New products don't appear on the site | They're **Draft** — set Status to **Live** in admin. Products without a direction appear under "More pieces". |
| Can't sign in to admin | Reset the password in Supabase → Authentication → Users (the role is in the user's `app_metadata.role`). |
| Signup email links point to the wrong site | Supabase → Authentication → URL Configuration: Site URL `https://sarthakarts.in`, redirect URLs `https://sarthakarts.in/**`. |
| Images don't upload or show | Check `STORAGE_DRIVER=s3` and the `S3_*` values. Supabase Storage needs path-style URLs (handled in `src/lib/storage.ts`). |
| Homepage 3D background missing | Don't add drei `<Environment preset>` back — it loads a remote file and stalls the scene. |
| Consultation "Confirm booking" greyed out | No future time slots — add availability in the portal or admin → Consultations. |
| Site slow everywhere | Check your own connection first, then Supabase status / plan (free plan = smallest machine). |
| Domain shows `DEPLOYMENT_NOT_FOUND` | Domain not attached to the Vercel project: Vercel → Settings → Domains → add it. DNS at Hostinger: `A @ 76.76.21.21`, `CNAME www → sarthakarts.in`. |

See `DEPLOYMENT.md` for accounts, deployment and go-live, and `CLIENT-CHECKLIST.md` for what's still needed from the client.
