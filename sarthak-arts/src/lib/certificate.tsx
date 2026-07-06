import React from "react";
import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";

type CompositionLine = { material: string; label: string | null; weightGrams: number | null; gemstoneQty: number | null };
export type CertificateData = { orderNumber: string; itemName: string; composition: CompositionLine[]; date: string };

function CertificateDoc({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A5" style={{ padding: 36, backgroundColor: "#F3EAD9", fontFamily: "Helvetica" }}>
        <Text style={{ fontSize: 9, letterSpacing: 2, color: "#B8863E" }}>SARTHAK ARTS</Text>
        <Text style={{ fontSize: 16, marginTop: 8, color: "#2B211A" }}>Certificate of Composition</Text>
        <Text style={{ fontSize: 10, marginTop: 4, color: "#5A4E42" }}>Order {data.orderNumber} · {data.date}</Text>
        <Text style={{ fontSize: 12, marginTop: 16, color: "#2B211A" }}>{data.itemName}</Text>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: "#B8863E" }}>
          {data.composition.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#D9CBAE" }}>
              <Text style={{ fontSize: 10, color: "#2B211A" }}>{c.material}{c.label ? ` (${c.label})` : ""}</Text>
              <Text style={{ fontSize: 10, color: "#2B211A" }}>{c.weightGrams ? `${c.weightGrams}g` : `${c.gemstoneQty ?? ""}`}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 8, marginTop: 16, color: "#8C7C67" }}>
          All metal weights and gemstone details certified per piece at the time of shipping.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<CertificateDoc data={data} />));
}

export async function generateCertificates(orderId: number): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  for (const item of order.items) {
    const pdf = await renderCertificatePdf({
      orderNumber: order.orderNumber,
      itemName: item.name,
      composition: item.compositionSnapshot as CertificateData["composition"],
      date: order.createdAt.toISOString().slice(0, 10),
    });
    const key = `certificates/${order.orderNumber}/${item.id}.pdf`;
    await storage.put(key, pdf);
    await prisma.orderCertificate.create({ data: { orderId, orderItemId: item.id, storageKey: key } });
  }
}
