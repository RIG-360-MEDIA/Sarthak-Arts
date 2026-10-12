import { NextResponse, type NextRequest } from "next/server";
import { syncFestivals } from "@/lib/festival-refresh";

/** Nightly job (vercel.json → crons). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await syncFestivals();
  return NextResponse.json({ ok: true, ...result });
}
