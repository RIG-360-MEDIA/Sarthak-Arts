# Collection Page — Design Spec

**Date:** 2026-07-15
**Status:** Approved for implementation
**Route:** `/labs/collection` (experimental; promoted to `/collection` alongside `/labs/hero` → `/`)

---

## 1. What this page is

The Collection page is the primary product browsing surface — where a
customer sees everything Sarthak Arts sells, narrows to what fits their
home, and clicks through to buy. It is the commercial centre of the
platform; the homepage sells the brand, this page sells the pieces.

## 2. The governing principle

An immersive background and a scannable product grid want opposite things.
Immersion invites the eye to wander; shopping requires the eye to compare
prices and land on a card. Every decision in this spec resolves that
tension the same way:

> **The background is never a picture behind the products. It is the space
> the products stand in, and it must always be the dimmest, softest, least
> sharp thing on screen. The product is the only thing in focus.**

A corollary learned the hard way during design (see §9): **never mix
fidelity levels in one frame.** Photoreal elements need photography or
photoreal rendering; abstract, geometric, iconographic elements are where
SVG belongs. A stylised shape placed inside a photoreal scene reads as
broken, regardless of how well it is drawn.

## 3. The core idea — the sanctum you are standing in

The background is a single continuous 3D space: a dark, softly-lit shrine
interior. The camera is the visitor's viewpoint. Scrolling moves the camera
through the space; choosing a direction turns the camera to face it.

This is bound to real product data rather than invented decoration. The
`Direction` table already carries a traditionally-correct `element` per
direction (seeded, verified):

| Direction | Sanskrit | Element | Governs |
| --- | --- | --- | --- |
| Northeast | Ishanya | Water | Clarity, spiritual grounding |
| North | Uttara | — | Wealth, career flow |
| Northwest | Vayavya | Air | Support, relationships, movement |
| West | Paschima | Space | Gains, creativity |
| Southwest | Nairutya | Earth | Stability, relationships |
| South | Dakshina | Fire | Recognition, reputation |
| Southeast | Agneya | Fire | Finance, energy, the kitchen |
| East | Purva | Air | New beginnings, health |
| Center | Brahmasthan | — | Balance for every other zone |

The sanctum's light, colour, and particle behaviour derive from
`Direction.element` of the active filter. Filtering to Southeast (Agneya,
Fire) warms the space — amber light, embers drifting upward. Filtering to
Northeast (Ishanya, Water) cools it — soft blue, slow caustic ripple.

**Why this converts:** the background teaches the Vastu meaning of the
piece being viewed, wordlessly. The product stops reading as an item in a
catalogue and starts reading as an object in its rightful place in a home.
The mechanism is meaning, not spectacle.

**Consequence:** the direction compass is not a filter widget rendered on
top of a scene — it *is* the camera control. Navigation and experience are
the same gesture.

## 4. Page structure

Single vertical scroll, five stacked sections. No filter sidebar: with four
filter dimensions and a modest catalogue, a horizontal bar stays calmer,
is mobile-native, and suits the editorial tone. Revisit if the catalogue
or filter count grows substantially.

### 4.1 Hero

Purpose: mood and brand. No shopping function.

- Full-bleed locked shrine illustration
  (`public/hero/collection-puja-ghar-base.png`, 1915×821) — a home puja
  ghar at dusk during sandhya aarti, brass Ganesha murti with correct
  iconography (four arms bearing modak, parashu, lotus, abhaya mudra;
  mukuta; mushika at base), copper kalash, lit diya tray, incense, hanging
  bell, marigold torana.
- Headline + philosophy copy in the left safe zone (desktop overlay) or
  stacked beneath (mobile).
- **No human figure.** See §9.
- Motion accents only, at a scale where stylisation is invisible: diya
  flame flicker, incense drift, a slow warm glow pulse behind the murti.
- Desktop: dark gradient scrim behind text for contrast, as an independent
  CSS layer — never baked into the artwork, so the scrim can be retuned and
  the base image reused elsewhere.
- Bottom gradient fade dissolving into sanctum dark.

### 4.2 Active filters + count bar

Purpose: orientation — "here is what you are looking at."

- Slim full-width strip, gold hairline rule top and bottom.
- Live item count: `Showing {N} pieces`.
- Active filter chips, individually removable (`Direction: North ✕`).
  Labels resolve from `Direction`/`Metal`/`Purpose`/`Category` tables —
  never hardcoded.
- `Clear all` link, shown only when ≥1 filter is active.
- Sort control: Newest · Price low→high · Price high→low.
- Driven by `searchParams` (`category`, `direction`, `metal`, `purpose`),
  consistent with the existing `buildProductWhere()` in `src/lib/catalog.ts`.
- Removing a chip updates the URL and re-queries via Next.js routing.

### 4.3 Direction compass

Purpose: the signature browse mechanism, and the camera control.

- SVG, geometric — the correct fidelity for an abstract diagram, and
  consistent with the Śrī Yantra already on the homepage.
- All eight active directions from the `Direction` table arranged radially
  around a centre (Brahmasthan), each labelled `name` + `sanskritName`,
  with `governs` as hover/tap microcopy.
- Selecting a direction filters the grid *and* rotates the sanctum to face
  it, shifting the light to that direction's element.
- Stays in sync bidirectionally with §4.2: a compass selection appears as a
  chip, and removing the chip returns the camera to centre.
- Responsive: circular down to tablet; on phone degrades to a horizontally
  scrollable row of direction pills — same eight directions, honest layout
  change for a shape that does not survive that width.

### 4.4 Product grid — Shrine cards

Purpose: the shopping surface.

- Responsive grid: 3 columns desktop, 2 tablet, 1 mobile.
- Card contents:
  - `Product3D` render (existing WebGL component, reused from homepage)
  - Deity eyebrow (`product.deity.name`, when set)
  - Product name + `positioningLine`
  - Composition summary (metal + gemstone from `ProductComposition`)
  - Price from `basePriceMinor`, via existing `resolveDisplayCurrency()`
  - Direction badge(s)
  - `WishlistHeart` (existing component)
- Pagination: **Load more** button. Initial batch of 12; button loads the
  next batch on demand. Chosen over infinite scroll (footer reachability,
  back-button behaviour) and numbered pages (dated for this tone).
- Required states, not optional polish:
  - **Empty:** "No pieces match these filters" + clear-filters action
  - **Out of stock:** badge when `stockQuantity === 0`
  - **Sample:** badge when `isSample === true` — placeholder catalogue
    items must be honestly labelled, never passed off as real inventory
  - **Loading:** skeleton cards, never a blank flash

### 4.5 Trust strip + footer

Purpose: reassurance and close-out.

- Horizontal row of 3–4 trust points (certified handmade, secure payment,
  shipping/returns) with simple SVG icons — abstract symbols, correct
  fidelity for SVG.
- Standard footer: About, Contact, legal links, and `NewsletterForm`
  (existing component).

## 5. Scroll choreography

One `<Canvas>`, fixed behind page content, camera animated on a GSAP
timeline driven by Lenis scroll progress. **One persistent scene — not a
canvas per section.** This is the entire performance strategy.

| Scroll position | Camera | Rationale |
| --- | --- | --- |
| Hero | At the threshold, shrine ahead, lit, warm; slow drift | First impression |
| Filter bar | Glides forward; shrine recedes into soft focus | Depth-of-field blur keeps the bar legible |
| Compass | Pulls back to Brahmasthan; eight directions as faint architectural cues | Standing at the centre of a home, choosing |
| Product grid | **Settles still.** Products are lit objects catching directional light | Camera stops so shopping never fights motion |
| Trust/footer | Lowers; light warms to diya glow; space quiets | Emotional close |

Optional tie-in: `computePanchang` (existing) can tint the sanctum's light
to the real current time of day — dusk light at actual dusk.

## 6. Technical architecture

No new dependencies. All already installed and proven on the homepage:

- `three` `^0.185.1`, `@react-three/fiber` `^9.6.1`, `@react-three/drei`
  `^10.7.7` — the scene
- `@react-three/postprocessing` `^3.0.4` — bloom, depth-of-field (same
  technique as the existing Śrī Yantra god-rays hero)
- `lenis` `^1.3.25` — smooth scroll (existing `SmoothScroll` component)
- `gsap` `^3.15.0` — scroll-linked camera timeline

Next.js notes (this version has breaking changes; docs consulted at
`node_modules/next/dist/docs/`):

- `priority` is **deprecated** in favour of `preload` on `next/image`
- `images.qualities` must allowlist any non-default quality value —
  already set to `[75, 90]` in `next.config.ts`

File layout:

```
src/app/labs/collection/page.tsx        route
src/app/labs/collection/collection.css  page styles + sanctum tokens
src/components/collection/              page-specific components
public/hero/collection-puja-ghar-base.png
```

Sanctum design tokens are currently duplicated between
`labs/hero/home.css` and `labs/collection/collection.css`. This is
deliberate while both are experimental. **On promotion of either route to
production, factor the tokens into a shared stylesheet both import.**

## 7. Performance

Platform rule: smooth on every device and connection. Tiers:

- **Tier A** — capable desktop: full scene, bloom, depth-of-field, particles
- **Tier B** — mid-range and mobile: scene retained with directional light
  and camera movement; no depth-of-field, minimal particles, reduced
  resolution
- **Tier C** — no WebGL, low-end, or `prefers-reduced-motion`: static shrine
  hero + solid sanctum dark. Everything functions; nothing is missing.

Detection at load: WebGL support, `navigator.hardwareConcurrency`,
`prefers-reduced-motion`.

**Live frame-rate sampling is mandatory, not optional.** If sustained frame
rate sags below threshold, the page drops a tier automatically — including
all the way to Tier C. Mobile runs Tier B by decision; the sampler is the
floor that keeps that decision safe on weak hardware.

Additional:

- Hero image `preload`; all grid imagery lazy-loads below the fold
- The scene never blocks interaction and never gates content
- Verify against throttled network and a real mobile viewport before any
  completion claim — not desktop preview alone

## 8. Accessibility

- Compass and filter chips fully keyboard-navigable, with `aria-pressed` /
  `aria-current` state — not indicated by colour alone
- The 3D scene is decorative: `aria-hidden`, never focusable, never a
  prerequisite for reaching content
- `prefers-reduced-motion` honoured across camera movement, figure
  animation, and flame/particle accents

## 9. Decisions and their history

Recorded so they are not relitigated:

- **Human figure in the hero: removed.** Three approaches were tried. AI
  inpainting produced scale/proportion drift between variants and required
  unsustainable manual iteration. A hand-coded SVG silhouette failed for a
  more fundamental reason: an abstract flat shape inside a photoreal scene
  reads as broken (§2). The empty shrine is dignified and premium on its
  own. Any future figure must match the photograph's fidelity — i.e. real
  compositing of a photoreal cut-out, not a stylised stand-in.
- **Base scene: locked.** Do not regenerate. Regeneration drifts the shrine
  position, which the safe-zone layout depends on.
- **Layout: hero band fading into the grid**, not a full-page fixed photo
  backdrop — chosen for legibility and load cost. (Distinct from the 3D
  scene, which *does* run full-page; the photograph does not.)
- **Filters: horizontal bar, not a sidebar** — appropriate at current
  catalogue size and filter count.
- **Grid: Load more**, not infinite scroll or numbered pages.
- **Scene scope: full page.** Highest ambition; raises the legibility stakes,
  which makes §2 binding rather than advisory.
- **Mobile: Tier B (reduced 3D)** by explicit decision, with the frame-rate
  sampler as the mandated safety net.

## 10. Risks

1. **Cost.** The sanctum scene is the most expensive item in the project —
   a multi-session build, not an afternoon.
2. **Gimmick risk.** An immersive scene can delay the sale. Mitigated by:
   the camera settles to stillness at the grid; the scene never blocks
   interaction; content is never gated behind it.
3. **The restraint must hold.** The moment the background is bright or sharp
   enough to notice while reading a price, it has failed — regardless of how
   beautiful it is in isolation. §2 is the acceptance criterion.
4. **Mobile.** Tier B on mid-range Android is the highest-risk surface.
   The frame-rate sampler is what makes this survivable; it must be
   verified on real throttled conditions, not assumed.

## 11. Build order

1. Hero fix — remove the silhouette, add flame/incense motion accents
2. Filters + count bar (§4.2)
3. Direction compass, static SVG first (§4.3)
4. Product grid — Shrine cards, states, Load more (§4.4)
5. Trust strip + footer (§4.5)
6. Sanctum 3D scene + scroll choreography (§3, §5) — last, layered behind
   a page that is already complete and functional without it

Rationale: the page must be finished, correct, and shippable before the
scene is added. That guarantees Tier C is a genuinely good experience
rather than a degraded one, and keeps the most expensive, highest-risk
work from blocking the commercial core of the page.

Review after each step.
