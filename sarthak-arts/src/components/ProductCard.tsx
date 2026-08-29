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
    <Link href={`/collection/${p.slug}`} className="pg-card">
      <Image src={p.imageUrl} alt={p.imageAlt} width={400} height={400} unoptimized className="pg-card-img" />
      <div className="pg-card-body">
        {p.directionLabel && <div className="pg-card-dir">{p.directionLabel}</div>}
        <div className="pg-card-name">{p.name}</div>
        <div className="pg-card-price num">{p.priceDisplay}</div>
      </div>
    </Link>
  );
}
