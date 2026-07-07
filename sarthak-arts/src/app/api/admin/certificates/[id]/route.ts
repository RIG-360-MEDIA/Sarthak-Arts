import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await prisma.orderCertificate.findUnique({ where: { id: Number(id) } });
  if (!cert) return NextResponse.json({ error: "not found" }, { status: 404 });
  const pdf = await storage.get(cert.storageKey);
  return new NextResponse(new Uint8Array(pdf), { headers: { "content-type": "application/pdf" } });
}
