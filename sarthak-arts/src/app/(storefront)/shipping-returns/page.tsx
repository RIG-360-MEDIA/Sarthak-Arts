import { getBlock } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ShippingReturns() {
  const b = await getBlock("legal.shipping", "Shipping & Returns coming soon.");
  return (
    <div style={{ paddingTop: 24, maxWidth: 680 }}>
      <h1>{b.title ?? "Shipping & Returns"}</h1>
      <div style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{b.body}</div>
    </div>
  );
}
