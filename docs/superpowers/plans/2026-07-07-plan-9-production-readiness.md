# Sarthak Arts — Plan 9: Production Readiness & Deployment Setup

> The last code work before launch. After this, going live is: create the client's accounts, paste in keys, deploy. No further code changes needed.

**Goal:** make the platform deployable to a serverless host (Vercel) against a production database, with durable cloud file storage, a clean production data setup (no demo products), and a written deployment guide. Provider-agnostic where it matters — the storage driver is S3-compatible (works with Cloudflare R2 *or* Amazon S3, chosen by env), honoring the modularity mandate.

---

### Task 1: S3-compatible cloud storage driver

**Files:** MODIFY `src/lib/storage.ts`; ADD `@aws-sdk/client-s3`; `tests/storage.test.ts`; `.env.example`

- [ ] Install `@aws-sdk/client-s3`.
- [ ] Add `S3Storage implements Storage` (lazy-imports the SDK, like `email.ts`), reading `S3_BUCKET`, `S3_ENDPOINT` (set for R2), `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- [ ] `makeStorage()` factory: `STORAGE_DRIVER=s3` → S3, else local disk (default). Keeps dev/tests on local, production on cloud — same `Storage` interface, so `orders.ts`/`email.ts`/certificate download are untouched.
- [ ] TDD: `pickStorageDriver(env)` pure helper returns `"s3" | "local"`; unit-test it.
- [ ] Add the S3 vars to `.env.example`.

### Task 2: Production-safe seed

**Files:** MODIFY `prisma/seed.ts`, `package.json`

- [ ] Gate demo data behind `SEED_DEMO` (default `"true"`): the 5 sample products, per-product stock, demo availability slots, and sample social posts only load when `SEED_DEMO !== "false"`. All reference/config data, settings, content blocks, roles, admin + consultant users always load.
- [ ] Add script `db:seed:prod` = `SEED_DEMO=false tsx prisma/seed.ts`.
- [ ] Verify: a `SEED_DEMO=false` run creates 0 products; the normal run still creates the samples.

### Task 3: Deployment configuration + guide

**Files:** MODIFY `prisma/schema.prisma` (datasource `directUrl`), `.env.example`, `next.config.ts`; ADD `DEPLOYMENT.md`

- [ ] Add `directUrl = env("DIRECT_URL")` to the datasource so serverless uses Neon's **pooled** `DATABASE_URL` at runtime while migrations use the **direct** `DIRECT_URL`. Both default to the same value locally.
- [ ] `DEPLOYMENT.md`: step-by-step for the client's accounts — Neon (prod DB, pooled + direct URLs), Vercel (import repo, env vars, build), Cloudflare R2 (bucket + keys), Razorpay live keys + webhook URL, Resend domain + key, domain DNS — with the exact env-var list and the `db:seed:prod` step.
- [ ] Full env list in `.env.example`.

### Task 4: Verify + tag v1.3

- [ ] `npm test` green; `tsc` + `next build` clean (local storage still default, so no cloud needed to build).
- [ ] `SEED_DEMO=false` dry-run against the dev DB confirms reference-only seeding, then reseed with demo for continued dev.
- [ ] Update README + the go-live runbook (mark storage/seed/config done). Commit per task; tag `v1.3`.

## Self-review notes
- **No lock-in:** one S3-compatible driver covers R2 and S3; provider is env config, not code. Local disk stays the zero-setup dev default.
- **Safe swap:** the `Storage` interface is unchanged, so every caller (certificate write, email attach, admin download) works identically on cloud.
- **Prod data hygiene:** production starts with real reference data + the owner's logins and *no* demo products — the client builds the real catalogue through the admin.
- **Deferred (client actions, documented in DEPLOYMENT.md):** creating the accounts and pasting keys — the only steps that need the business's identity/money.
