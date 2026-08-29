# Collection Page — Design Spec

- **Date:** 2026-08-05
- **Status:** Draft for review (pre-implementation)
- **Route:** `/collection` (real storefront route; replaces the plain current page and retires `public/the-house-mockup.html`)
- **Concept name:** *The Dial & The Field* — a compass-as-instrument that filters the catalogue by Vāstu direction.
- **Aesthetic direction:** *"Brass Instrument, Cream Paper"* — engraved almanac; restrained sacred / editorial.

---

## 1. Context & goal

Sarthak Arts sells handcrafted Vāstu / Sanātana devotional pieces, each made for one specific Vāstu direction. The Collection page is the primary **shopping surface**: browse pieces, filter by direction, evaluate, click into a product.

Two prior attempts failed review for the same root reason: **the background carried the meaning while the products became a camouflaged secondary layer.** A cosmic-mandala WebGL scene and then a literal cutaway "house" both put decoration in front and pushed the catalogue behind.

This spec starts from zero on a corrected principle: **meaning lives in structure and interaction, not behind the products.** Direction is the organizing logic, expressed as a *functional instrument* the user operates — not scenery. The compass is the page's single earned gesture; everything else is calm, scannable, and product-first.

### What we are explicitly correcting from v1
- Decoration masquerading as function → the compass **is** the filter; the ornament does the work.
- Figure–ground collapse (cards camouflaged) → products dominate; the page is calm paper, not a busy scene.
- Standalone island (fake nav/data/tokens) → real route, real `SanctumNav`, real Prisma data, shared tokens.
- Tone/coherence mismatch → same "house" as the homepage: same paper, brass, type, motion.
- Doesn't scale → a regular, scannable grid that holds 12 or 200+ pieces.

## 2. Success criteria

1. A first-time visitor understands within seconds that they can pick a direction (or several) and see the pieces made for it.
2. Products are unmistakably the primary content; the compass supports, never competes.
3. The page feels like the same platform as the homepage — one hand made both.
4. Fully usable on a low-end phone on a slow connection; ceremony degrades gracefully, never blocks shopping.
5. Every Sanskrit name, element, and deity shown is sourced from platform data or verified — never guessed.
6. Filters are shareable (URL), SSR-correct, and back-button honest.
7. Accessible: keyboard-operable compass, correct ARIA, reduced-motion path, WCAG AA contrast.

## 3. Named aesthetic direction — "Brass Instrument, Cream Paper"

The visual world of **engraved scientific instruments and the printed pañcāṅga almanac**: mariner's compass rose, hairline rules, engraved linework, cream rag paper, large margins. Reverence via **precision and restraint**, never ornament. One beautiful brass instrument; a lot of quiet paper around it.

**Guiding test for every decision:** *"Does this feel like a brass instrument on cream paper?"*

- **Type does the expressive work** (type-first). Fraunces (display/prices/compass numerals) exploiting its `opsz` / `wght` / `SOFT` axes; Inter for body/UI.
- **Color is restrained**; saffron is a rare sacred *signal*, never a surface.
- **Ornament near-zero**; elevation via hairlines and tone, not shadow.
- **Motion is weighted and placed**, like handling a heavy brass object — never playful.

## 4. Design tokens

All tokens live in the **shared token layer** consumed by both the homepage and Collection (see §10). Existing base tokens are unchanged; the following are **added** so they are platform-available and consistent.

### Existing (unchanged, from `globals.css`)
```
--ground:        #F3EAD9   /* page paper */
--ground-raised: #EBE0CE
--ground-deep:   #E4D6BC
--ink:           #2B211A   /* primary text */
--ink-muted:     #5A4E42
--ink-faint:     #8C7C67
--brass:         #B8863E   /* material / structure */
--line:          #D9CBAE   /* hairlines */
```

### Added — temple white + sacred saffron
```
--paper:        #FBF6EC   /* warm temple-white; raised surface for compass + cards.
                             OKLCH ≈ L .975 C .012 H 85 — reads white, belongs to the family */
--saffron:      #DD7A2E   /* kesari/marigold. FILLS, MARKS, GLOWS ONLY (non-text).
                             OKLCH ≈ L .68 C .14 H 55. NOT the neon flag #FF9933 */
--saffron-ink:  #A8531A   /* deepened saffron for saffron TEXT / thin borders needing AA contrast */
```

### Added — motion tokens (shared)
```
--ease-place:  cubic-bezier(0.22, 1, 0.36, 1)   /* slow-out "settling" for placed objects */
--dur-quick:   140ms      /* hover / mark toggles */
--dur-settle:  520ms      /* product settle-in */
--dur-dock:    680ms      /* compass FLIP-dock */
/* Compass needle uses a spring, not a bezier: mass 1, stiffness 120, damping 18 (tune in build). */
```

### Warm-channel role separation (the discipline that keeps it from muddying)
| Color | Job | Where it appears |
|---|---|---|
| **Brass** `--brass` | Material / structure | Compass body, engraved linework, hairline rules |
| **Saffron** `--saffron` | The sacred signal | Active/selected bearing, Brahmasthāna bindu, one ceremonial rule |
| **Gemstone dot** (real `Gemstone.accentHex`) | Per-piece identity | Small dot on the individual card **only** |

**Saffron restraint rules:** ≤ ~5% of on-screen marks at any moment; only on `--paper`; never a background wash, card fill, or body text.

## 5. Information architecture & page states

The page has two macro-states driven entirely by URL:

- **Resting state** (`/collection`, no filter): the compass at rest as a focused hero; the full collection shown below in a calm editorial order. *The page is fully useful even if the compass is never touched* (progressive disclosure).
- **Filtered state** (`/collection?direction=east` or `?direction=east,north`): the compass is **docked** to a compact control; the field shows the selected direction(s).

**Repeat-visit / deep-link behaviour:** arriving with a `direction` param in the URL (a shared link, a return visit, back-button) lands **directly in the docked/filtered state** — the full ceremonial hero is the *first-touch* experience, not a toll booth on every visit. The hero is also dismissible.

## 6. The Dial (the compass)

### 6.1 Medium — SVG, not WebGL (decision)
The compass is **SVG engraved line art**: razor-crisp at any DPI, tiny payload, animated on the compositor thread (Web Animations API / Motion One), fully accessible. This is what lets the ceremony survive on a low-end phone. **No WebGL for page chrome** (reserve WebGL only for a possible future product-3D view).

### 6.2 Structure & orientation
- Outer engraved ring carries the **8 dikpāla bearings** placed at their **true geographic positions**: **North up**, East right, South down, West left, and the ordinals between. (Standard magnetic-compass / Vāstu site-plan convention; see §16 accuracy checklist.)
- **Brahmasthāna** is the still **center** — a saffron bindu.
- Nine bearings = the nine `Direction` rows. Screen placement is by true bearing, **independent of** `displayOrder` (which is the platform's list-traversal order, not a screen layout).

### 6.3 Labels — IAST (verified data, not hardcoded)
Each bearing is engraved with its **IAST** direction name and (optionally) its guardian deity. These forms are **not yet in the data** and must be seeded as verified fields (see §9.1). Proposed forms, pending final devotional sign-off:

| code | direction (IAST) | guardian dikpāla | element (from seed — authoritative) |
|---|---|---|---|
| east | Pūrva | Indra | Air |
| southeast | Āgneya | Agni | Fire |
| south | Dakṣiṇa | Yama | Fire |
| southwest | Nairṛtya | Nirṛti | Earth |
| west | Paścima | Varuṇa | Space |
| northwest | Vāyavya | Vāyu | Air |
| north | Uttara | Kubera | — (null in seed) |
| northeast | Īśānya | Īśāna (Śiva) | Water |
| center | Brahmasthāna | Brahmā | — (null in seed) |

> Elements are taken **verbatim from the seed**, which intentionally differs from some textbook pañcabhūta tables. The seed is the source of truth.

### 6.4 Interaction grammar
- **Pointer hover:** nearest bearing lifts; needle leans subtly toward the cursor (alive, not idle). No hover on touch — all interactions are **tap-complete**.
- **Click / tap a bearing:** toggles it. Selected = **saffron-lit mark + brass ring segment**.
- **Multi-select:** additive toggling; tap a lit bearing to release; a quiet "release all" affordance resets. A first-run hint communicates that more than one can be chosen.
- **Needle semantics:** on a **single** selection the needle **swings and settles** (spring) onto that bearing — "the instrument points you there." When **multiple** bearings are active, the needle **retracts to center**; the lit marks carry the state (avoids a needle pointing at one of three).
- **Commit / reveal:** on the first pick the compass **FLIP-docks** and the field rises (see §8). Docked control shows lit bearings + live count + tap-to-reopen.
- **Live count:** "14 pieces face East" → "23 pieces across East & North," updating as bearings toggle.

### 6.5 Keyboard & ARIA
The compass is a **group of toggle buttons** (multi-select), not a listbox/radiogroup.
- Container `role="group"` with an accessible name ("Filter by Vāstu direction").
- Each bearing: a real `<button>` with `aria-pressed`, an accessible label ("East · Pūrva, 14 pieces").
- Keyboard: `Tab` into the group; `Arrow` keys move focus bearing-to-bearing around the ring (clockwise/counter); `Enter`/`Space` toggles; `Esc` releases all when focus is in the group.
- The needle and glow are decorative (`aria-hidden`); state is conveyed by `aria-pressed` + the live count (an `aria-live="polite"` region).

## 7. Motion system

- **Character:** weighted, placed, ceremonial. Nothing bounces.
- **Needle:** spring (mass/stiffness/damping in §4), single-selection only.
- **Compass FLIP-dock:** `--dur-dock`, `--ease-place`. This transition must be *silk* — it is the signature moment; build quality lives or dies here.
- **Product settle-in:** staggered, `--dur-settle`, `--ease-place`, slight arc, small opacity+translate. Stagger cap so large sets don't feel slow.
- **Reduced motion (`prefers-reduced-motion: reduce`):** no transforms, no needle swing, no stagger — instant cross-fade only. This is a **required parallel design**, not an afterthought.

## 8. The Field (the products)

### 8.1 Layout — regular grid (scannability over spectacle)
A **calm, regular grid** (uniform cells) so the eye compares like-for-like — the deliberate correction of v1's anti-scannable layout.
- CSS Grid, `auto-fit` with `minmax()` sized via `clamp()`; **container queries** so the field responds to *its column*, not the viewport (works with or without the compass rail).
- **Asymmetry is allowed only for a single optional "lead" piece** per direction section — never a fully asymmetric field.
- **Virtualization** past ~60 cards to protect mobile memory/INP.

### 8.2 Grouping on multi-select
- **One direction:** a single section, no redundant heading (the docked compass already names it).
- **Multiple directions:** quiet **grouped sections**, each headed by that direction's engraved identity line (IAST name + `microcopy`, real data) — e.g. *"East · Pūrva — the direction that sets the tone for the rest of the day."* Grouping teaches and stays scannable.
- **Sort × grouping:** sort (`newest` / price) reorders **within** each group; a "mix / group" toggle is available for users who prefer one stream.

### 8.3 Card anatomy — "specimen on paper"
Refines the existing platform `ProductCard` (not a new card):
- Dominant image on `--paper`, **hairline frame, no shadow**.
- Fraunces name; the **placement line** (`placementNote`) as the emotional payload; **tabular Fraunces price**; a single small **gemstone dot** in real `accentHex`.
- Sample pieces honestly badged via `isSample`.
- Whole card links to `/collection/[slug]`.

### 8.4 States
- **Default/resting:** whole collection, calm order, populated directions first.
- **Loading/streaming:** skeleton cards while RSC streams; the compass state is optimistic (bearing lights instantly).
- **Empty (ceremonial):** a *genuinely* empty direction reads, in engraved type, e.g. *"No pieces face Nairṛtya yet — the corner waits."* — not "No results." Default view avoids leading with empty directions.
- **Error / DB asleep (fail-soft):** compass still renders; field shows a graceful "the collection is resting" state, matching existing fail-soft wrappers.

## 9. Data model & flow

### 9.1 Required data extensions (verified, seeded — not hardcoded)
Following the platform's existing festival `nameIast` / `nameDeva` convention:
- **`Direction.sanskritNameIast: String`** — verified IAST forms (§6.3).
- **`Direction.guardianDeity: String?`** — verified dikpāla name (§6.3), optional; if absent, the deity is simply not engraved (wrong is worse than absent).
- (Optional, future) `Direction.sanskritNameDeva` for a later Devanāgarī option.

Seed these with a migration; do **not** inline Sanskrit/deity strings into the component.

### 9.2 Query & filtering
- Extend `buildProductWhere` so `direction` accepts a **list**: `directions: { some: { direction: { code: { in: [...] } } } }` (currently single-value).
- URL is the state: `?direction=east` or `?direction=east,north`; `sort` param for ordering.

### 9.3 Rendering & performance
- `/collection` is a **server component inside the storefront layout** → inherits `SanctumNav`, footer, cart, currency, panchang.
- The **compass is a client island**; the **field is server-rendered** and streamed.
- **Perceived performance (Linear standard):** compass picks update the URL and render optimistically (bearing lit + field skeleton) while the server **streams** the filtered set. **Server-side filtering** — do *not* ship the whole catalogue to the client. Images lazy-loaded; grid virtualized past ~60.
- **Fail-soft:** every Prisma call wrapped; a suspended Neon endpoint yields the resting state, never a crash.

## 10. Platform coherence (one platform)

Canonical system = the **refined homepage** (`/labs/hero`: `SanctumNav` + its refined tokens).

- **One shared token source of truth.** Consolidate the current fork (homepage `home.css` vs. `globals.css`) into a single shared layer both pages import; add the §4 tokens there once. No page-local hexes.
- **One canonical nav + footer** — the Collection page uses the real `SanctumNav` and footer (cart, search, panchang), never a bespoke header.
- **Reuse real primitives** — `ProductCard`, buttons, inputs, focus rings — refined, not reinvented, so a piece looks identical everywhere it appears.
- **Shared motion grammar** — §4 easing tokens are platform-wide.
- **Build-alongside safety:** construct the new page and extract shared tokens **without destabilising the working homepage**; swap the live `/collection` only when verified. Retire `public/the-house-mockup.html`.

## 11. Responsive (phone is first-class)

- **Phone (≤640px):** compass owns the first viewport (~320px, centered on `--paper`); bearings are **≥44px touch targets**; tap-complete; on first pick, **FLIP-dock to a sticky top strip** and the field becomes a single column. Instrument always one tap away.
- **Tablet (641–1024px):** compass as a sticky left companion at reduced size; field = 2 columns.
- **Desktop (≥1025px):** full ceremony — hero → dock top-left → grid; needle-follows-cursor; hover mini-previews.
- **Mechanics:** fluid `clamp()` type/space (Utopia-style, minimal hard breakpoints); container queries on the field; the one justified mode-switch is compass hero-vs-docked (a real touch-vs-pointer interaction difference).

## 12. Accessibility

- Keyboard-operable compass with correct toggle-group ARIA (§6.5).
- WCAG AA contrast: saffron **text** only via `--saffron-ink`; bright `--saffron` for non-text marks/glows.
- `prefers-reduced-motion` parallel design (§7).
- Touch targets ≥44px; visible focus rings (shared token); `aria-live` count.
- All imagery has real `alt` (from `ProductImage.alt`).

## 13. Performance budget

- **No WebGL** for chrome; SVG compass.
- Targets: **LCP < 2.5s** on mid-tier mobile / throttled; **CLS < 0.1** (reserve image aspect ratios; no font-swap shift — fonts already `next/font`); **INP < 200ms** (server-filter, virtualization, compositor-thread motion).
- Lazy images; stream the field; virtualize past ~60 cards.

## 14. Devotional accuracy checklist (must pass before ship)

- [ ] Compass **orientation** (North-up) confirmed against an authoritative Vāstu reference and acceptable to the client/pandit.
- [ ] **Dikpāla placement** (E-Indra … NE-Īśāna, C-Brahmā) verified.
- [ ] **IAST forms** (§6.3) verified for diacritics and seeded into `Direction.sanskritNameIast`.
- [ ] **Elements** rendered verbatim from seed (E=Air, W=Space, etc.), not from memory.
- [ ] No Sanskrit/deity string hardcoded in a component — all from seeded, verified data.

## 15. Open items to resolve during/just before build
1. Final devotional sign-off on §14 (orientation + IAST + dikpāla).
2. Exact spring constants for the needle (tune live).
3. Whether guardian deity is engraved on the dial or reserved for the field teaching line (data supports either; default: teaching line, to keep the dial uncluttered).
4. Confirm the homepage sanctum motif is visually distinct enough from the compass (check against live homepage during build).

## 16. Non-goals / deferred
- The radial "Bearing" overview toggle (A+B) — deferred; can be added later without rework.
- Devanāgarī script option — deferred (data field reserved).
- Ambient audio — out.
- Real 3D product models in-scene — out.
- Any change to product detail pages, cart, or checkout.
