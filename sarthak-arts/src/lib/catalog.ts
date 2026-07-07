import type { Prisma } from "@prisma/client";
import { formatDisplay } from "@/lib/currency";

export type ProductFilters = {
  category?: string;
  direction?: string;
  metal?: string;
  purpose?: string;
  maxPriceMinor?: number;
};

export function buildProductWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "live" };
  if (f.category) where.category = { code: f.category };
  if (f.direction) where.directions = { some: { direction: { code: f.direction } } };
  if (f.metal) where.composition = { some: { metal: { code: f.metal } } };
  if (f.purpose) where.purposes = { some: { purpose: { code: f.purpose } } };
  if (f.maxPriceMinor !== undefined) where.basePriceMinor = { lte: f.maxPriceMinor };
  return where;
}

export function buildSearchWhere(term: string): Prisma.ProductWhereInput {
  const q = term.trim();
  if (!q) return { status: "live" };
  return {
    status: "live",
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { positioningLine: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };
}

type ProductWithRels = {
  slug: string;
  name: string;
  images: { url: string; alt: string }[];
  directions: { direction: { name: string; sanskritName: string } }[];
  basePriceMinor: number;
};

export function toCard(p: ProductWithRels, currency: { code: string; ratePerBase: number }) {
  const dir = p.directions[0]?.direction;
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? "/placeholder/copper-vastu-kalash.svg",
    imageAlt: p.images[0]?.alt ?? p.name,
    directionLabel: dir ? `${dir.name} · ${dir.sanskritName}` : null,
    priceDisplay: formatDisplay(p.basePriceMinor, currency.code, currency.ratePerBase),
  };
}
