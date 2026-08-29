import type { Metadata } from "next";
import "../legal.css";
import { prisma } from "@/lib/db";
import { LegalDoc } from "@/components/LegalDoc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shipping & Returns — Sarthak Arts" };

export default async function ShippingReturns() {
  const b = await prisma.contentBlock.findUnique({ where: { key: "legal.shipping" } });
  return <LegalDoc currentKey="legal.shipping" title={b?.title ?? "Shipping & Returns"} body={b?.body ?? "Shipping & Returns coming soon."} updatedAt={b?.updatedAt} />;
}
