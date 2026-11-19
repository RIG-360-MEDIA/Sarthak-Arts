import { NextResponse, type NextRequest } from "next/server";
import { sendStaleOrderReminders } from "@/lib/email";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const reminded = await sendStaleOrderReminders();
  return NextResponse.json({ ok: true, reminded });
}
