import type { PieceCard } from "@/lib/collection"; // type-only — no runtime import
import { glyphForCategory, gradForMetal } from "@/lib/piece-visual";
import { visualFor } from "@/lib/direction-visual";
import { VASTU_METAFIELD_KEYS, type ShopifyProduct, type Metafield, type VastuMetafieldKey } from "./types";

/**
 * Pure Shopify → PieceCard mapping (no network, no server-only imports), so it
 * can be unit-tested and reused. A `ShopifyPieceCard` is a drop-in for our
 * existing components plus the Shopify ids the cart and links need.
 */
export type ShopifyPieceCard = PieceCard & {
  shopifyId: string;
  variantId: string;
  handle: string;
  imageUrl: string | null;
  images: { url: string; alt: string }[];
  descriptionHtml: string;
  certified: boolean;
};

const BRAND_GEM = "#B8863E";

/** Metafields come back aligned to the identifier order — read them by key. */
function readMetafields(mf: Metafield[] | null): Partial<Record<VastuMetafieldKey, string>> {
  const out: Partial<Record<VastuMetafieldKey, string>> = {};
  (mf ?? []).forEach((m, i) => {
    const key = VASTU_METAFIELD_KEYS[i];
    if (m && key && m.key === key) out[key] = m.value;
  });
  return out;
}

/** gid://shopify/Product/12345 → 12345 (best-effort numeric id for legacy shapes). */
function numericId(gid: string): number {
  const n = Number(gid.split("/").pop());
  return Number.isFinite(n) ? n : 0;
}

function titleCase(code: string): string {
  return code ? code.charAt(0).toUpperCase() + code.slice(1) : "Center";
}

function priceParts(amount: string, currency: string): { display: string; minor: number } {
  const value = Number(amount) || 0;
  const display = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency", currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  return { display, minor: Math.round(value * 100) };
}

export function adaptShopifyProduct(p: ShopifyProduct): ShopifyPieceCard {
  const meta = readMetafields(p.metafields);
  const code = (meta.direction ?? "center").toLowerCase();
  const v = visualFor(code);
  const variant = p.variants.nodes[0];
  const metalName = meta.metal ?? null;
  const weightG = meta.weight_g != null ? Number(meta.weight_g) : null;
  const { display, minor } = priceParts(
    variant?.price.amount ?? p.priceRange.minVariantPrice.amount,
    variant?.price.currencyCode ?? p.priceRange.minVariantPrice.currencyCode,
  );

  return {
    // Shopify identifiers
    shopifyId: p.id,
    variantId: variant?.id ?? "",
    handle: p.handle,
    imageUrl: p.featuredImage?.url ?? null,
    images: p.images.nodes.map((im) => ({ url: im.url, alt: im.altText ?? p.title })),
    descriptionHtml: p.descriptionHtml,
    certified: meta.certified === "true",
    // PieceCard shape (drop-in for our components)
    productId: numericId(p.id),
    slug: p.handle,
    name: p.title,
    priceDisplay: display,
    priceMinor: minor,
    createdAtMs: 0,
    glyph: glyphForCategory((p.productType || "vessel").toLowerCase()),
    metalGrad: gradForMetal(metalName),
    gemHex: BRAND_GEM,
    gemName: meta.gemstone ?? null,
    primaryMetalName: metalName,
    weightG,
    directionCode: code,
    directionName: titleCase(code),
    directionIast: v.iast,
    directionDeity: v.deity,
    directionDeva: v.deva,
    directionGoverns: "",
    color: v.color,
    colorDeep: v.colorDeep,
    positioningLine: meta.positioning ?? p.description.split("\n")[0] ?? "",
    placementNote: meta.placement ?? "",
    inStock: variant?.availableForSale ?? p.availableForSale,
    stockQuantity: variant?.quantityAvailable ?? 0,
    isSample: meta.is_sample === "true",
    categoryCode: (p.productType || "").toLowerCase(),
  };
}
