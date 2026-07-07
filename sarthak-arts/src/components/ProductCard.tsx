import Link from "next/link";
import Image from "next/image";

export type CardProduct = {
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  directionLabel: string | null;
  priceDisplay: string;
};

export function ProductCard({ p }: { p: CardProduct }) {
  return (
    <Link href={`/collection/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <Image
          src={p.imageUrl}
          alt={p.imageAlt}
          width={400}
          height={400}
          unoptimized
          style={{ width: "100%", height: 220, objectFit: "cover", background: "var(--ground-raised)" }}
        />
        <div style={{ padding: "12px 14px" }}>
          <div className="serif" style={{ fontSize: 15 }}>{p.name}</div>
          {p.directionLabel && (
            <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 3 }}>{p.directionLabel}</div>
          )}
          <div className="num" style={{ fontSize: 14, marginTop: 6 }}>{p.priceDisplay}</div>
        </div>
      </div>
    </Link>
  );
}
