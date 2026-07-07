# Sarthak Arts — One-Time Client Intake

Everything we need from you to finish and launch the store. Give us these **once** and no further development is required — each line says *why* we need it. Start with Section 1 (Razorpay), as its verification takes the longest.

---

## 1. Razorpay — to accept payments

| We need | Why |
|---|---|
| Business type, name, category | To open the Razorpay account |
| **PAN** (business, or owner's for a proprietorship) | Identity verification (KYC) |
| **Bank account** — number + IFSC + a cancelled cheque | Where your order money is deposited |
| Owner's **ID & address proof** (Aadhaar/passport/etc.) | KYC requirement |
| **GSTIN** — if you're GST-registered | KYC + correct tax |
| *(after approval)* Live API keys | To switch real payments on |
| Which methods to allow (UPI / cards / net-banking / wallets) | What customers can pay with |

## 2. Accounts (kept under your business login)

| We need | Why |
|---|---|
| The domain **sarthakarts.com** + access to its DNS | Your web address; also verifies email & site |
| Go-ahead to set up **database, hosting, file storage, email** (Neon / Vercel / Cloudflare R2 / Resend) | Runs the site and stores order certificates — owned by you, not us |
| A **support inbox** (e.g. hello@sarthakarts.com) | Where customer replies and enquiries land |

## 3. One decision: sell internationally at launch?

| We need | Why |
|---|---|
| Yes/No — and if yes, a **Stripe account** (its own KYC) + which currencies (USD/GBP/AED…) | International orders need a second payment account and confirmed currencies. If no, we launch INR-only and switch this on later — no rework |

## 4. Your products (the main content)

For **each** murti / Vastu piece we need: **name, description, price, metals with exact weights, gemstone, Vastu direction, purpose, deity + placement note (for murtis), care note, what's in the box, stock count, and real photos.** Also the **metal purity** you want stated (e.g. silver %).

*Why:* every product page, the direction/deity guidance, and the certificate that ships with each order are built from this. It's the bulk of the setup.

## 5. Settings to confirm (we have working defaults)

| Setting | Our default | Why we need your value |
|---|---|---|
| Shipping charges + free-shipping threshold | ₹150 India / free over ₹5,000 / ₹2,500 intl | Charged at checkout — must be real |
| GST rate | 3% (placeholder) | Correct tax on every order |
| Return window | 7 days | Your returns policy |
| Free-consultation threshold | ₹15,000 | The announcement-bar promise |
| Consultation fee, duration + consultant / astrologer names + video-call tool | ₹999 each | Powers bookings and who runs sessions |
| Store name, announcement text, support phone | drafts | Shown across the site |

## 6. Words & brand

| We need | Why |
|---|---|
| Your **brand story / About**, **Our Craft**, and **FAQ** answers (review our drafts or send your own) | Currently drafted from the placeholder brief — needs your real voice |
| **Legal review** of the Terms, Privacy, and Shipping drafts | Your policies, ideally lawyer-checked, before going live |
| **Home-audit questions** review (the 2-minute Vastu quiz) | The quiz recommends products — it must reflect real Vastu logic |
| **Logo** + any brand imagery | Site branding |
| **Instagram / Threads** handles + posts to feature | The social section on the site |

---

**Order to do it in:** (1) start Razorpay KYC, (2) confirm domain + accounts, (3) send products + photos, (4) confirm settings, words & brand. Once Razorpay is approved and accounts exist, launch is: deploy → paste keys → add products → point the domain.
