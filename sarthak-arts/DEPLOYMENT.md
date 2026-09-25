# Deployment Guide — Sarthak Arts

This takes the finished platform to a live site at **sarthakarts.com**. Do it in order. Everything that needs the *business's* identity (Razorpay, domain, accounts) is called out — create those under the client's business logins, not a personal account.

Recommended host: **Vercel** (built for Next.js). Database: **Neon** (Postgres). File storage: **Cloudflare R2** (or Amazon S3). Email: **Resend**.

---

## 0. Prerequisites

- The code on GitHub, under the client's account.
- Client business details ready for Razorpay KYC (business PAN, bank account, address proof).
- The domain `sarthakarts.com` registered.

## 1. Production database (Neon)

1. Create a Neon project under the client's account (choose a region near customers, e.g. Singapore).
2. From the connection details, copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this becomes `DATABASE_URL`.
   - **Direct** (no `-pooler`) → this becomes `DIRECT_URL`.
3. Leave Neon Auth off — the app has its own login system.

## 2. File storage (Cloudflare R2)

1. In Cloudflare, create an R2 bucket (e.g. `sarthak-arts-certificates`).
2. Create an R2 API token (Object Read & Write) → note the **Access Key ID** and **Secret Access Key**.
3. Note the **S3 endpoint**: `https://<account-id>.r2.cloudflarestorage.com`.

(Amazon S3 works too — create a bucket + IAM keys, leave `S3_ENDPOINT` blank, set `S3_REGION` to the AWS region.)

## 3. Email (Resend)

1. Create a Resend account; add and **verify the `sarthakarts.com` domain** (add the DNS records it gives you).
2. Create an API key → `RESEND_API_KEY`.

Until this is set, order/booking emails are skipped silently (no errors) — nothing else is affected.

## 4. Payments (Razorpay)

1. Sign up at razorpay.com with the **business** details and complete **KYC** (this can take a few days).
2. Once live, from the dashboard get the **live** Key ID and Key Secret.
3. Add a **webhook**: URL `https://sarthakarts.com/api/webhooks/razorpay`, event `payment.captured`, and set a webhook secret you choose.

## 5. Deploy to Vercel

1. In Vercel, **Import** the GitHub repo. Root directory: `sarthak-arts`. Framework preset: Next.js (auto-detected).
2. Add the **environment variables** (Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** string |
   | `DIRECT_URL` | Neon **direct** string |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | from Supabase → Project Settings → API Keys |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the owner's admin login |
   | `CONSULTANT_EMAIL` / `CONSULTANT_PASSWORD` | first consultant login (changeable later in admin) |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay **live** keys |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same live Key ID |
   | `RAZORPAY_WEBHOOK_SECRET` | the webhook secret from step 4 |
   | `RESEND_API_KEY` | Resend key |
   | `STORAGE_DRIVER` | `s3` |
   | `S3_BUCKET` | R2 bucket name |
   | `S3_ENDPOINT` | R2 endpoint (blank for AWS S3) |
   | `S3_REGION` | `auto` for R2 (AWS region for S3) |
   | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2/S3 keys |

3. Deploy.

## 6. Set up the database (once)

From a machine with the production `DATABASE_URL` + `DIRECT_URL` in `.env` (or via Vercel CLI), run:

```bash
npm run db:migrate:deploy     # apply the schema
npm run db:seed:prod          # reference data + owner/consultant logins, NO sample products
```

`db:seed:prod` seeds directions, currencies, order statuses, settings, page copy, return reasons, consultation types, and the admin + consultant accounts — and **no** demo products. The owner adds the real catalogue through the admin.

## 7. Domain

1. In Vercel, add the domain `sarthakarts.com` and follow the DNS instructions at the registrar.
2. Wait for HTTPS (the padlock) to go green.

## 8. Go-live smoke test

On the live site:
- Browse the storefront; open a product page.
- Place one **real** small order → confirm the order appears in **Admin → Orders**, the **certificate PDF** downloads, and the confirmation **email** arrives.
- Sign in to **/admin** (owner) and **/portal** (consultant) and confirm each loads its own area.
- Book a consultation; confirm it shows in the consultant's portal.

When those pass, the store is open.

---

## Notes

- **Test mode first:** you can deploy with Razorpay **test** keys and place test orders before KYC clears — everything works except real money movement.
- **Rotating a consultant's password** or adding the real consultant: **Admin → Consultations → Consultant portal access**.
- **Editing legal/store copy:** **Admin → Content** — changes go live immediately.
