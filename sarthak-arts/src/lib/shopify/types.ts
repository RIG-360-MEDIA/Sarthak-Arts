/** Raw Storefront API shapes (the fields our fragments request). */

export type Money = { amount: string; currencyCode: string };
export type Image = { url: string; altText: string | null; width: number | null; height: number | null };

export type Metafield = { key: string; value: string; type: string } | null;

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  featuredImage: Image | null;
  images: { nodes: Image[] };
  priceRange: { minVariantPrice: Money };
  variants: { nodes: ProductVariant[] };
  /** Vāstu metafields, requested by identifier — order matches the query. */
  metafields: Metafield[];
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    price: Money;
    product: { handle: string; title: string; featuredImage: Image | null; productType: string };
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: { nodes: CartLine[] };
};

/** The Vāstu metafield keys we read/write on each product (namespace "vastu"). */
export const VASTU_METAFIELD_KEYS = [
  "direction",   // single_line_text — e.g. "north"
  "positioning", // single_line_text — the one-line placement note
  "placement",   // multi_line_text
  "metal",       // single_line_text — "brass" | "copper" | "silver"
  "weight_g",    // number_decimal
  "gemstone",    // single_line_text
  "certified",   // boolean
  "is_sample",   // boolean
] as const;

export type VastuMetafieldKey = (typeof VASTU_METAFIELD_KEYS)[number];
