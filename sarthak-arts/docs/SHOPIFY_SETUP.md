# Headless Shopify — setup & migration

We're running **headless Shopify**: our Next.js pages stay the storefront (your
design), and Shopify becomes the engine behind them — catalogue, cart, and the
**hosted checkout** that securely takes payment.

The integration code lives in `src/lib/shopify/` and is **gated**: until the two
credentials below are set, the site keeps running on the built-in backend and
nothing changes. The moment they're set, the Shopify layer switches on.

---

## Phase 1 — the code (DONE)
Built and type-checked, config-gated, no pages touched yet:
- `src/lib/shopify/config.ts` — reads env, `isShopifyEnabled()`
- `src/lib/shopify/client.ts` — Storefront API client + `shopifyFetch()`
- `src/lib/shopify/queries.ts` — product & cart GraphQL
- `src/lib/shopify/products.ts` — `getShopifyProducts` / `getShopifyProduct` + an
  adapter that maps a Shopify product into our existing `PieceCard` shape
- `src/lib/shopify/cart.ts` — create/get/add/update/remove cart lines

## Phase 2 — YOU set up Shopify (needed before it can go live)

### 1. Create the store
Sign up at **shopify.com** and create a store. Its domain looks like
`your-store.myshopify.com` — that's `SHOPIFY_STORE_DOMAIN`.

### 2. Create a custom app → Storefront API token
In Shopify admin: **Settings → Apps and sales channels → Develop apps →
Create an app**. Then:
- **Configuration → Storefront API** → enable it and tick the scopes:
  `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`,
  `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`.
- **Install app**, then open **API credentials** → copy the
  **Storefront API access token** → that's `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.

> Use the **Storefront** token (public, read-only-ish), **not** the Admin token.

### 3. Put the values in `.env.local` (never commit them)
```
SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_API_VERSION="2025-01"
```

### 4. Add products — and the Vāstu metafields
Standard Shopify fields map like this:
| Shopify field | Used for |
|---|---|
| Title | piece name |
| Description | the story |
| Media (images) | gallery |
| Price / Variants | price, stock (`quantityAvailable`) |
| Product type | our category → render silhouette (`kalash`, `yantra`, `pyramid`, `panel`, `chime`, `murtis`) |

The Vāstu-specific data lives in **metafields**. In admin:
**Settings → Custom data → Products → Add definition**, namespace **`vastu`**:

| key | type | example |
|---|---|---|
| `direction` | Single line text | `northeast` |
| `positioning` | Single line text | "For the water corner…" |
| `placement` | Multi-line text | where/how to place it |
| `metal` | Single line text | `brass` / `copper` / `silver` |
| `weight_g` | Decimal | `430` |
| `gemstone` | Single line text | `Clear Quartz` |
| `certified` | True/false | `true` |
| `is_sample` | True/false | `false` |

Fill these on each product. The adapter reads them and drives the direction
colour, guardian, metal render, etc. — so the pages look exactly as they do now.

## Phase 3 — the switchover — CODE COMPLETE (behind `isShopifyEnabled()`)

Every page is wired to Shopify and gated. With no credentials the site runs on
the built-in backend (verified: all pages 200); set the two env values and the
whole storefront flips to Shopify automatically:

- **Collection** — `getCollectionView()` delegates to `getShopifyCollectionView()`;
  same view shape, so the page + cards render unchanged.
- **Product page** (`[slug]`) — renders from `getShopifyProduct` (gallery, buy
  box, placement, composition from metafields, story from the description).
- **Add to cart** — `addToCartInline` / `addToCart` add by Shopify `variantId`.
- **Cart** — reads the Shopify cart (cookie-stored `cart.id`), steppers update
  Shopify lines, nav badge uses the Shopify cart's `totalQuantity`.
- **Checkout** — "Proceed to checkout" → Shopify's hosted, PCI-compliant
  `cart.checkoutUrl` (replaces the Razorpay custom checkout in Shopify mode).
- **Kept on Neon** (not commerce): consultations, panchang, home-audit.

Not carried over natively: **product reviews** (Shopify has none built in — add a
reviews app, or keep the Neon reviews table) and **related products** — decide
these when the live catalogue exists.

## The ONE remaining step — needs your live store
The code is complete and type-checked, but a payment flow must never be trusted
until it's run for real. Once you finish Phase 2 (store + token + products):
1. Set the env values → the storefront switches to Shopify.
2. **Place one real test order end-to-end** and confirm it lands in Shopify admin.

That live test is the only thing that can't be done without the store existing.
