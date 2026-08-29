/**
 * Shopify connection health check.  Run:  npm run shopify:check
 *
 * Verifies your Storefront credentials without touching the app: connects,
 * reads the shop name, and lists the first few products (with a note on whether
 * each has its Vāstu `direction` metafield set). Use it right after Phase 2.
 */
import fs from "node:fs";
import path from "node:path";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";

// ── Load env from .env.local (preferred) then .env — no dependency needed ──
function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/\s+#.*$/, "");
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (env[key] === undefined) env[key] = val; // .env.local wins
    }
  }
  return env;
}

const env = loadEnv();
const domain = (env.SHOPIFY_STORE_DOMAIN ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const token = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";
const apiVersion = env.SHOPIFY_API_VERSION || "2025-01";

if (!domain || !token) {
  console.log("✗ Shopify not configured.");
  console.log("  Add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local");
  console.log("  (see docs/SHOPIFY_SETUP.md). The site keeps running on the built-in backend until then.");
  process.exit(0);
}

const client = createStorefrontApiClient({ storeDomain: domain, apiVersion, publicAccessToken: token });

const QUERY = `
  query Health {
    shop { name primaryDomain { url } }
    products(first: 5) {
      nodes {
        title
        handle
        totalInventory
        metafield(namespace: "vastu", key: "direction") { value }
      }
    }
  }
`;

try {
  console.log(`→ Connecting to ${domain} (API ${apiVersion})…`);
  const { data, errors } = await client.request(QUERY);
  if (errors) {
    console.log("✗ Storefront API error:");
    console.log("  " + (errors.message ?? JSON.stringify(errors.graphQLErrors ?? errors)));
    console.log("  Check the token is a STOREFRONT token and the app is installed with product scopes.");
    process.exit(1);
  }
  console.log(`✓ Connected to “${data.shop.name}” (${data.shop.primaryDomain.url})`);
  const products = data.products?.nodes ?? [];
  console.log(`✓ Found ${products.length} product(s):`);
  if (products.length === 0) {
    console.log("  (none yet — add products in Shopify admin, see docs/SHOPIFY_SETUP.md)");
  }
  for (const p of products) {
    const dir = p.metafield?.value ? `direction=${p.metafield.value}` : "⚠ no vastu.direction metafield";
    console.log(`  • ${p.title}  [${p.handle}]  stock:${p.totalInventory ?? "?"}  ${dir}`);
  }
  console.log("\nAll good. Set the env values and the storefront switches to Shopify automatically.");
} catch (err) {
  console.log("✗ Could not reach Shopify:");
  console.log("  " + (err?.message ?? String(err)));
  console.log("  Verify SHOPIFY_STORE_DOMAIN looks like your-store.myshopify.com and the token is correct.");
  process.exit(1);
}
