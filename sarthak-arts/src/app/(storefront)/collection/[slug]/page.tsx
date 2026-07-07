import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { Mandala } from "@/components/Mandala";
import { resolveDisplayCurrency, formatDisplay } from "@/lib/currency";
import { addToCart } from "./actions";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      composition: { orderBy: { sortOrder: "asc" }, include: { metal: true, gemstone: true } },
      directions: { include: { direction: true } },
    },
  });
  if (!product || product.status !== "live") notFound();
  const allDirections = await prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const currency = await resolveDisplayCurrency();
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "published" },
    orderBy: { createdAt: "desc" },
  });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const dir = product.directions[0]?.direction;
  const accent = product.composition.find((c) => c.gemstone)?.gemstone?.accentHex ?? "var(--brass)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, paddingTop: 24 }}>
      <div>
        <Image
          src={product.images[0]?.url ?? "/placeholder/copper-vastu-kalash.svg"}
          alt={product.images[0]?.alt ?? product.name}
          width={800} height={800} unoptimized
          style={{ width: "100%", height: "auto", borderRadius: 8, background: "var(--ground-raised)" }}
        />
      </div>
      <div>
        {dir && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: accent }}>
              {dir.name} · {dir.sanskritName}
            </span>
            <Mandala size={34} directions={allDirections} litCode={dir.code} />
          </div>
        )}
        <h1 style={{ fontSize: 28, margin: "8px 0" }}>{product.name}</h1>
        <p style={{ color: "var(--ink-muted)" }}>{product.positioningLine}</p>
        <p className="num" style={{ fontSize: 24, color: accent, margin: "16px 0" }}>
          {formatDisplay(product.basePriceMinor, currency.code, currency.ratePerBase)}
        </p>
        <form action={addToCart}>
          <input type="hidden" name="productId" value={product.id} />
          <button type="submit">Add to cart</button>
        </form>
        <h3 style={{ marginTop: 28, fontSize: 15 }}>Placement</h3>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{product.placementNote}</p>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{product.description}</p>
        <h3 style={{ fontSize: 15 }}>Composition</h3>
        <table>
          <tbody>
            {product.composition.map((c) => (
              <tr key={c.id}>
                <td>{c.metal?.name ?? c.gemstone?.name}{c.label ? ` (${c.label})` : ""}</td>
                <td className="num" style={{ textAlign: "right" }}>
                  {c.weightGrams ? `${c.weightGrams}g` : c.gemstoneQty ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={{ fontSize: 15 }}>Care</h3>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{product.careNote}</p>
        <h3 style={{ fontSize: 15 }}>Included</h3>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{product.includedItems}</p>
      </div>

      <section style={{ gridColumn: "1 / -1", marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        <h3 style={{ fontSize: 16 }}>
          Reviews {avg !== null && <span style={{ color: "var(--brass)" }}>· {avg.toFixed(1)}★ ({reviews.length})</span>}
        </h3>
        {reviews.length === 0 && <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 13 }}>
              <strong>{r.customerName}</strong> · {r.rating}★
              {r.verifiedPurchase && <span style={{ color: "var(--success)", fontSize: 11, marginLeft: 6 }}>✓ Verified purchase</span>}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "4px 0" }}>{r.body}</p>
            {r.sellerReply && (
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 16, paddingLeft: 10, borderLeft: "2px solid var(--brass)" }}>
                <strong>Sarthak Arts:</strong> {r.sellerReply}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
