import "server-only";
import { createStorefrontApiClient, type StorefrontApiClient } from "@shopify/storefront-api-client";
import {
  SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  SHOPIFY_API_VERSION,
  isShopifyEnabled,
} from "./config";

/**
 * The Storefront API client — created lazily and reused. Server-only: the token
 * used here is the Storefront public token (safe to expose), but keeping calls
 * on the server lets us layer caching and avoid leaking the token into bundles.
 */
let cached: StorefrontApiClient | null = null;

function client(): StorefrontApiClient {
  if (!isShopifyEnabled()) {
    throw new Error(
      "Shopify is not configured — set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN (see docs/SHOPIFY_SETUP.md).",
    );
  }
  if (cached) return cached;
  cached = createStorefrontApiClient({
    storeDomain: SHOPIFY_STORE_DOMAIN,
    apiVersion: SHOPIFY_API_VERSION,
    publicAccessToken: SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  });
  return cached;
}

/**
 * Run a Storefront GraphQL operation and return typed data, throwing on any
 * GraphQL/user error so callers can fail soft with a single try/catch.
 */
export async function shopifyFetch<T>(
  operation: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data, errors } = await client().request<T>(operation, variables ? { variables } : undefined);
  if (errors) {
    const message = "graphQLErrors" in errors && Array.isArray(errors.graphQLErrors)
      ? errors.graphQLErrors.map((e: { message: string }) => e.message).join("; ")
      : (errors.message ?? JSON.stringify(errors));
    throw new Error(`Shopify Storefront error: ${message}`);
  }
  if (!data) throw new Error("Shopify Storefront returned no data.");
  return data;
}
