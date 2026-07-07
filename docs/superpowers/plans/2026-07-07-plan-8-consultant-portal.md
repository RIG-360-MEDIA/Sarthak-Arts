# Sarthak Arts — Plan 8: Consultant / Astrologer Portal

> Completes the last role that had no interface of its own. One portal serves both consultants and astrologers (an astrologer is a consultant offering the astrology type).

**Goal:** a consultant/astrologer can **log into their own portal**, see **their** bookings (upcoming + past), **mark a session done** and **add a video-call link**, and manage **their own availability** — all scoped so they only ever see their own data. The **admin provisions** consultant logins (sets/resets a password) from the existing Consultations screen, keeping the single-seller in control of who has access.

**Foundation reused:** existing `User`/`Role`/`UserRole` RBAC, `jose` session (`role` already in the payload), `bcryptjs`, the `admin_session` cookie (now a shared session cookie — the `role` decides access), and the booking/availability actions already written for admin.

**Deferred (unchanged, external):** charging for a *paid* consultation still reuses the payment gateway once Razorpay keys exist — same gate as customer payments. The free-entitlement path already works.

---

### Task 1: Roles, consultant login seed, session helper (TDD)

- [ ] **Seed:** add Role `consultant`; link the seeded "Resident Consultant" to a `User` (`consultant@sarthakarts.com` / `ConsultantPass!2026`, envable) with that role; set `Consultant.userId`.
- [ ] **`src/lib/portal.ts` (TDD):** `partitionBookings(bookings, now)` → `{ upcoming, past }` (past = slotStart < now OR status completed). Pure, unit-tested.
- [ ] **`src/lib/session.ts`:** `currentSession()` — reads `admin_session` cookie via `next/headers`, returns `verifySession` payload or null (server helper for portal pages to know *which* consultant).

### Task 2: Auth — consultant login + proxy gating

- [ ] **`/portal/login`** page + action: verify user, require role `consultant`, sign session `{ userId, role: "consultant" }`, set cookie, redirect `/portal`.
- [ ] **`proxy.ts`:** extend matcher to `/portal/:path*`; allow `/portal/login`; else require `role === "consultant"`. `/admin` rules unchanged. (Same cookie, path decides required role.)
- [ ] **Logout** shared action deleting the cookie.

### Task 3: Portal — dashboard + availability (own-data scoped)

- [ ] **`(portal)` layout** with its own light sidebar (Dashboard, Availability, Sign out).
- [ ] **`/portal` dashboard:** resolve consultant by `userId = session.userId`; `partitionBookings`; show upcoming (customer name/email/phone, type, slot, free/paid, status) with **mark done** + **add video link**; show recent past collapsed.
- [ ] **`/portal/availability`:** this consultant's slots, add/remove.
- [ ] **`portal/actions.ts`:** `addSlot`/`removeSlot`/`markDone`/`setVideoLink` — each re-derives the consultant from the session and verifies the target row belongs to them (no cross-consultant writes).

### Task 4: Admin provisions consultant logins

- [ ] On `/admin/consultations`, a small "Consultant access" form: set/reset the consultant's login email + password (creates/links the `User` + `consultant` role, hashes password). Replaces the "dedicated login is a later enhancement" note.

### Task 5: Verify + tag v1.2

- [ ] `npm test` green; `tsc` + `next build` clean.
- [ ] Live: log in at `/portal/login` as the consultant → see only their bookings; mark done + set video link persist; add/remove availability; confirm a consultant cannot reach `/admin` (redirected) and admin cannot reach `/portal` (redirected).
- [ ] README + memory; commit per task; tag `v1.2`.

## Self-review notes
- **Security:** every portal write re-derives the consultant from the verified session and checks ownership of the slot/booking — the form cannot act on another consultant's data even if IDs are tampered.
- **Modularity:** no new role hardcoding beyond the seeded `consultant` Role row; multiple consultants already supported (each resolves their own data by `userId`). Astrologer needs nothing extra — it's a consultation type the same consultant offers.
- **Reuse:** booking/availability logic mirrors the admin actions; auth mirrors the admin login; only the role and ownership-scoping differ.
