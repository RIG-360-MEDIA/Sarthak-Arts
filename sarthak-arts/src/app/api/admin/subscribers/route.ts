import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

/** CSV export of newsletter subscribers (email, joined date) for Mailchimp / Brevo / Gmail. */
export async function GET() {
  await requireAdmin();
  const subs = await prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" } });
  // Quote every field; a leading = + - @ is prefixed so spreadsheet apps don't run it as a formula.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const rows = [["email", "joined"], ...subs.map((s) => [s.email, s.subscribedAt.toISOString().slice(0, 10)])];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sarthak-arts-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
