# Client Onboarding Checklist — Sarthak Arts

Everything we need **from the client** to take the finished platform live. The software is complete; these are the business inputs only the client can provide. Grouped by area, with the payment (Razorpay) details called out first since KYC takes the longest.

---

## 1. Razorpay — to accept real payments

Razorpay verifies the **business** before it releases live payment keys. The exact document list is shown in the Razorpay dashboard for the chosen business type; below is what to have ready.

### Account basics
- **Business type** — Individual / Sole Proprietorship / Partnership / Private Limited / LLP / Trust-NGO. (A small handcraft brand is usually **Proprietorship** or **Individual**.)
- **Business/brand name** and **website** — `sarthakarts.com`.
- **Business category** — Ecommerce → handicrafts / religious & devotional items.
- **Contact** — official email and phone number.

### KYC documents
- **PAN** — the business PAN for a company, or the owner's PAN for a proprietorship/individual.
- **Bank account for settlements** — account number + IFSC (this is where order money is deposited), plus a **cancelled cheque or bank statement**. The account name should match the business/owner.
- **Owner's identity & address proof** — Aadhaar / passport / voter ID / driving licence.
- **GSTIN** — if the business is GST-registered (optional for many small sellers; required if registered).
- **Registered companies only** — Certificate of Incorporation, CIN, and (if applicable) GST certificate.

### After KYC is approved (we plug these in)
- **Live Key ID** and **Live Key Secret** (from the Razorpay dashboard).
- We create and set the **webhook** (`https://sarthakarts.com/api/webhooks/razorpay`) — no action needed from the client beyond having the account live.
- **Payment methods to enable** — confirm which of UPI / cards / net-banking / wallets to switch on (all can be on).

> Until KYC clears, we can run the whole site in **test mode** (real site, test payments) so everything is verified end-to-end.

---

## 2. Accounts to create (under the client's business login)

These hold the business's data and money, so they must be the **client's** accounts (all have free tiers to start). The client either creates them and shares access, or authorises us to create them under their business email.

- **Domain** — confirm ownership of `sarthakarts.com` and access to its DNS settings.
- **Database** — Neon (Postgres).
- **Hosting** — Vercel.
- **File storage** — Cloudflare R2 (stores order certificates).
- **Email sending** — Resend (for order & booking emails), plus the ability to add DNS records to verify `sarthakarts.com`.

---

## 3. The product catalogue (the biggest content item)

For **every** product (murtis and Vastu pieces), we need:

- **Name** and a short **positioning line**.
- **Description**, **care note**, and **what's included** in the box.
- **Price** (final selling price in INR — the owner sets this directly).
- **Materials** — each metal (copper / brass / silver / gold overlay) with its **exact weight in grams**, and the **gemstone** (type + quantity) if any.
- **Direction** (which Vastu zone) and **purpose/category**.
- **Deity** and its **placement guidance** — for murtis.
- **Stock quantity**.
- **Photographs** — real, good-quality photos of each piece.

*(The site copy document offered to write the murti listing text in our 7-field format — we still need that plus the per-piece placement guidance.)*

---

## 4. Store settings to confirm

The platform ships with sensible defaults; the client should confirm or replace these real values:

- **Shipping** — real shipping charges by destination, and whether there's a **free-shipping threshold**; which courier.
- **Tax / GST** — GST rate and registration status; whether displayed prices include tax.
- **Return window** — currently **7 days** — confirm or change.
- **Free consultation perk** — the announcement-bar promise "free Vastu consultation on orders over **₹15,000**" — confirm the threshold (all admin-editable).
- **Consultations** — the **consultant's** name; the **astrologer's** identity (same person or separate); the **fee and duration** for Vastu (default ₹999 / 20 min) and Astrology (default ₹999 / 30 min); and the **video-call tool** used for sessions.
- **Store basics** — confirm store name, the announcement-bar text, and the **support email/phone** shown on the site and legal pages (drafts use `hello@sarthakarts.com`).
- **Currencies** — INR at launch; confirm whether to switch on international display now or later.

---

## 5. Legal & brand

- **Legal review** — the Terms, Privacy, and Shipping & Returns drafts (in Admin → Content) should be reviewed by the client / their lawyer before launch.
- **Logo** and any specific **brand imagery** the client wants used.
- **Social handles** — Instagram / Threads (or others) and which posts to feature on the site.

---

### Priority order
1. **Start Razorpay KYC now** (Section 1) — longest wait.
2. Confirm the **domain** and set up the **accounts** (Section 2).
3. Gather the **product catalogue + photos** (Section 3) — the bulk of the content work.
4. Confirm **settings, legal, brand** (Sections 4–5).

Once Razorpay is approved and the accounts exist, launch is: deploy, paste in the keys, add the products, point the domain. No further development required.
