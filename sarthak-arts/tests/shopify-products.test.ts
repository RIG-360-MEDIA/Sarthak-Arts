import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ShopifyProduct } from "@/lib/shopify/types";

// Mock the network client so the fetcher pipeline (query → adapter) is tested
// without a live store or the server-only client module.
vi.mock("@/lib/shopify/client", () => ({ shopifyFetch: vi.fn() }));
import { shopifyFetch } from "@/lib/shopify/client";
import { getShopifyProducts, getShopifyProduct } from "@/lib/shopify/products";

const mocked = shopifyFetch as unknown as ReturnType<typeof vi.fn>;

const FIXTURE: ShopifyProduct = {
  id: "gid://shopify/Product/12345",
  handle: "ashtalakshmi-brass-kalash",
  title: "Ashtalakshmi Brass Kalash",
  description: "One brass kalash.",
  descriptionHtml: "<p>One brass kalash.</p>",
  productType: "kalash",
  tags: [],
  availableForSale: true,
  featuredImage: null,
  images: { nodes: [] },
  priceRange: { minVariantPrice: { amount: "7500.0", currencyCode: "INR" } },
  variants: { nodes: [{ id: "gid://shopify/ProductVariant/999", title: "Default", availableForSale: true, quantityAvailable: 6, price: { amount: "7500.0", currencyCode: "INR" } }] },
  metafields: [
    { key: "direction", value: "northeast", type: "single_line_text_field" },
    null, null,
    { key: "metal", value: "brass", type: "single_line_text_field" },
    null, null, null, null,
  ],
};

describe("getShopifyProducts", () => {
  beforeEach(() => mocked.mockReset());

  it("fetches, then adapts each product to a PieceCard", async () => {
    mocked.mockResolvedValue({ products: { nodes: [FIXTURE] } });
    const cards = await getShopifyProducts({ first: 10 });
    expect(cards).toHaveLength(1);
    expect(cards[0].handle).toBe("ashtalakshmi-brass-kalash");
    expect(cards[0].directionDeity).toBe("Īśāna");
    expect(cards[0].priceDisplay).toBe("₹7,500");
    expect(mocked).toHaveBeenCalledOnce();
    // passes the requested page size through to the query
    expect(mocked.mock.calls[0][1]).toMatchObject({ first: 10 });
  });

  it("returns an empty array when the store has no products", async () => {
    mocked.mockResolvedValue({ products: { nodes: [] } });
    expect(await getShopifyProducts()).toEqual([]);
  });
});

describe("getShopifyProduct", () => {
  beforeEach(() => mocked.mockReset());

  it("returns null when the handle isn't found", async () => {
    mocked.mockResolvedValue({ product: null });
    expect(await getShopifyProduct("does-not-exist")).toBeNull();
  });

  it("adapts a found product", async () => {
    mocked.mockResolvedValue({ product: FIXTURE });
    const card = await getShopifyProduct("ashtalakshmi-brass-kalash");
    expect(card?.name).toBe("Ashtalakshmi Brass Kalash");
    expect(card?.variantId).toBe("gid://shopify/ProductVariant/999");
    expect(card?.metalGrad).toBe("gBrass");
  });
});
