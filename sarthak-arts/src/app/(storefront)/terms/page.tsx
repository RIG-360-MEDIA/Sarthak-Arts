import type { Metadata } from "next";
import "../legal.css";
import { prisma } from "@/lib/db";
import { LegalDoc } from "@/components/LegalDoc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Terms of Service — Sarthak Arts" };

export default async function Terms() {
  const b = await prisma.contentBlock.findUnique({ where: { key: "legal.terms" } });
  return <LegalDoc currentKey="legal.terms" title={b?.title ?? "Terms of Service"} body={b?.body ?? "Terms of Service coming soon."} updatedAt={b?.updatedAt} />;
}
