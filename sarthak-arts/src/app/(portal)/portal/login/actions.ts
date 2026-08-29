"use server";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function login(formData: FormData): Promise<void> {
  const ip = clientIp(await headers());
  if (!rateLimit(`portal-login:${ip}`, 8, 15 * 60 * 1000).ok) redirect("/portal/login?error=throttle");

  const user = await prisma.user.findUnique({
    where: { email: String(formData.get("email")) },
    include: { roles: { include: { role: true } } },
  });
  const ok = user?.passwordHash && (await bcrypt.compare(String(formData.get("password")), user.passwordHash));
  const isConsultant = user?.roles.some((r) => r.role.code === "consultant");
  if (!ok || !isConsultant) redirect("/portal/login?error=1");
  const token = await signSession({ userId: user!.id, role: "consultant" }, process.env.SESSION_SECRET!);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  redirect("/portal");
}
