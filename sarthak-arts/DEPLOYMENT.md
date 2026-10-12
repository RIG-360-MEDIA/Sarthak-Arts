# Deployment — Sarthak Arts

How the live site at **https://sarthakarts.in** is put together, how to deploy changes, and what's left before a full commercial launch.

## Current setup

| Piece | Where | Notes |
|---|---|---|
| Code | GitHub `RIG-360-MEDIA/Sarthak-Arts` | App lives in `sarthak-arts/` |
| Hosting | Vercel, team **RIG** (`rig12`), project **sarthak-arts** | Root directory `sarthak-arts`, function region `bom1` (Mumbai) |
| Database + logins + files | Supabase project **Sarthak Arts** (ref `uhwxrygihovgopezqmzi`, Mumbai) | Postgres, Auth, Storage bucket `sarthak-media` |
| Domain | `sarthakarts.in`, DNS at **Hostinger** | `A @ 76.76.21.21`, `CNAME www → sarthakarts.in`. Nameservers stay Hostinger's. |
| Payments | UPI QR (`UPI_ID` env) | Razorpay switch-ready |

## Deploying a change

**Normal path (recommended):** merge a Pull Request into `master`. The Vercel project is connected to the GitHub repo, so `master` deploys to production and every other branch gets a preview URL.

**Manual path (from a laptop, Vercel CLI logged in to the RIG team):**

```bash
# run from the repo ROOT (the project's root directory is sarthak-arts/)
npx vercel deploy --prod --scope rig12
```

**If the change includes a database migration**, apply it to the live database first (with `.env` pointing at Supabase):

```bash
cd sarthak-arts
npx prisma migrate deploy
```

Migrations should be additive (add columns/tables) so the old code keeps working until the new code is live.

## Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** and **Preview**. Names and meaning are in `.env.example`. Any change needs a redeploy to take effect.

`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `STORAGE_DRIVER`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PAYMENT_MODE`, `UPI_ID`, `UPI_PAYEE_NAME`, `NEXT_PUBLIC_SITE_URL`.

## Supabase settings that live outside the code

- **Authentication → URL Configuration:** Site URL `https://sarthakarts.in`; redirect URLs `https://sarthakarts.in/**`, `https://www.sarthakarts.in/**` (and `http://localhost:3000/**` for development).
- **Authentication → Providers → Email:** keep "Confirm email" **on** (customers' past orders are matched by verified email).
- **Data API:** off. Automatic RLS: on. The app talks to Postgres only through Prisma on the server.
- The database user the app uses is `prisma` (created for this project); its password is inside `DATABASE_URL`.

## Switching payments to Razorpay

1. Client completes Razorpay KYC and creates **live** keys.
2. In Vercel set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`, and `PAYMENT_MODE=razorpay`.
3. In Razorpay add the webhook `https://sarthakarts.in/api/webhooks/razorpay` for `payment.captured` with the same secret. Redeploy.

## Before a full commercial launch

- **Rotate secrets** that were shared during development (Supabase secret key, storage keys, database password) and update Vercel.
- **Change the admin and consultant passwords** (Supabase → Authentication → Users).
- **Ownership:** move the Supabase project and Vercel project to accounts the client owns (or add the client as owner).
- **Plans:** Vercel Hobby is non-commercial — use Vercel Pro (or the client's account). Supabase free is the smallest machine — consider Pro for reliability and backups.
- **Email:** connect Resend (verify `sarthakarts.in`, set `RESEND_API_KEY`) so order/booking confirmations are sent. Update the `from:` addresses in `src/lib/email.ts` to the verified domain.
- Real catalogue, photos, legal text (see `CLIENT-CHECKLIST.md`).

## Rolling back

Vercel → Deployments → pick the last good deployment → **⋯ → Promote to Production** (instant). Database migrations are not rolled back automatically; that's why they should be additive.
