import type { Metadata } from "next";
import "../legal.css";
import { prisma } from "@/lib/db";
import { LegalDoc } from "@/components/LegalDoc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy Policy — Sarthak Arts" };

export default async function Privacy() {
  const b = await prisma.contentBlock.findUnique({ where: { key: "legal.privacy" } });
  return <LegalDoc currentKey="legal.privacy" title={b?.title ?? "Privacy Policy"} body={b?.body ?? "Privacy Policy coming soon."} updatedAt={b?.updatedAt} />;
}
