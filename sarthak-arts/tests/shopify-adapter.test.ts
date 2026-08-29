import { describe, it, expect } from "vitest";
import { adaptShopifyProduct } from "@/lib/shopify/adapt";
import type { ShopifyProduct } from "@/lib/shopify/types";

/**
 * Verifies the Shopify → PieceCard adapter (the code that activates the moment
 * credentials are set) against fixture data, so the switch-on path is proven
 * correct without needing a live store: metafield reading, direction visuals,
 * price formatting, id/variant extraction, and sensible fallbacks.
 */

// A fully-populated "Northeast brass kalash" as the Storefront API would return it.
// metafields are ordered to match VASTU_METAFIELD_KEYS:
// [direction, positioning, placement, metal, weight_g, gemstone, certified, is_sample]
const NORTHEAST_KALASH: ShopifyProduct = {
  id: "gid://shopify/Product/12345",
  handle: "ashtalakshmi-brass-kalash",
  title: "Ashtalakshmi Brass Kalash",
  description: "The eight forms of Lakshmi around one brass kalash.",
  descriptionHtml: "<p>The eight forms of Lakshmi around one brass kalash.</p>",
  productType: "kalash",
  tags: [],
  availableForSale: true,
  featuredImage: { url: "https://cdn.shopify.com/kalash.jpg", altText: "Kalash", width: 800, height: 800 },
  images: { nodes: [{ url: "https://cdn.shopify.com/kalash.jpg", altText: "Kalash", width: 800, height: 800 }] },
  priceRange: { minVariantPrice: { amount: "7500.0", currencyCode: "INR" } },
  variants: { nodes: [{ id: "gid://shopify/ProductVariant/999", title: "Default", availableForSale: true, quantityAvailable: 6, price: { amount: "7500.0", currencyCode: "INR" } }] },
  metafields: [
    { key: "direction", value: "northeast", type: "single_line_text_field" },
    { key: "positioning", value: "For the water corner — abundance.", type: "single_line_text_field" },
    { key: "placement", value: "North-east, at eye level.", type: "multi_line_text_field" },
    { key: "metal", value: "brass", type: "single_line_text_field" },
    { key: "weight_g", value: "430", type: "number_decimal" },
    { key: "gemstone", value: "Clear Quartz", type: "single_line_text_field" },
    { key: "certified", value: "true", type: "boolean" },
    { key: "is_sample", value: "false", type: "boolean" },
  ],
};

describe("adaptShopifyProduct — fully populated", () => {
  const card = adaptShopifyProduct(NORTHEAST_KALASH);

  it("extracts Shopify ids, variant, and handle", () => {
    expect(card.shopifyId).toBe("gid://shopify/Product/12345");
    expect(card.variantId).toBe("gid://shopify/ProductVariant/999");
    expect(card.handle).toBe("ashtalakshmi-brass-kalash");
    expect(card.slug).toBe("ashtalakshmi-brass-kalash");
    expect(card.productId).toBe(12345); // numeric part of the gid
  });

  it("formats INR price to minor units and display", () => {
    expect(card.priceMinor).toBe(750000);
    expect(card.priceDisplay).toBe("₹7,500");
  });

  it("maps the Vāstu direction metafield to the brand visual layer", () => {
    expect(card.directionCode).toBe("northeast");
    expect(card.directionName).toBe("Northeast");
    expect(card.directionDeity).toBe("Īśāna");
    expect(card.directionDeva).toBe("ईशान");
    expect(card.directionIast).toBe("Īśānya");
    expect(card.color).toBe("#2BA8C4"); // northeast brand colour
  });

  it("maps metal, weight, gemstone, and certification from metafields", () => {
    expect(card.primaryMetalName).toBe("brass");
    expect(card.metalGrad).toBe("gBrass");
    expect(card.weightG).toBe(430);
    expect(card.gemName).toBe("Clear Quartz");
    expect(card.certified).toBe(true);
    expect(card.isSample).toBe(false);
  });

  it("maps product type to the render silhouette and copy from metafields", () => {
    expect(card.glyph).toBe("kalash");
    expect(card.categoryCode).toBe("kalash");
    expect(card.positioningLine).toBe("For the water corner — abundance.");
    expect(card.placementNote).toBe("North-east, at eye level.");
  });

  it("reads stock from the variant", () => {
    expect(card.inStock).toBe(true);
    expect(card.stockQuantity).toBe(6);
  });
});

describe("adaptShopifyProduct — sparse / missing metafields", () => {
  const sparse: ShopifyProduct = {
    ...NORTHEAST_KALASH,
    id: "gid://shopify/Product/777",
    productType: "",
    availableForSale: false,
    variants: { nodes: [] }, // no variant — must fall back to priceRange
    metafields: [null, null, null, null, null, null, null, null],
  };
  const card = adaptShopifyProduct(sparse);

  it("falls back to Center direction when no direction metafield", () => {
    expect(card.directionCode).toBe("center");
    expect(card.directionName).toBe("Center");
    expect(card.directionDeity).toBe("Brahmā");
  });

  it("falls back to priceRange when there is no variant, and marks empty variant id", () => {
    expect(card.variantId).toBe("");
    expect(card.priceMinor).toBe(750000);
  });

  it("uses a safe render silhouette and honest stock when unknown", () => {
    expect(card.glyph).toBe("vessel"); // default for unknown/empty product type
    expect(card.inStock).toBe(false);
    expect(card.stockQuantity).toBe(0);
    expect(card.certified).toBe(false);
  });
});
