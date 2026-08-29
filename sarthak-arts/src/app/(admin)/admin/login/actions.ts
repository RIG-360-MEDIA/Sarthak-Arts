"use server";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function login(formData: FormData): Promise<void> {
  // Throttle repeated attempts from the same client (brute-force defence).
  const ip = clientIp(await headers());
  if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60 * 1000).ok) redirect("/admin/login?error=throttle");

  const user = await prisma.user.findUnique({
    where: { email: String(formData.get("email")) },
    include: { roles: { include: { role: true } } },
  });
  const ok = user?.passwordHash && (await bcrypt.compare(String(formData.get("password")), user.passwordHash));
  const isAdmin = user?.roles.some((r) => r.role.code === "admin");
  if (!ok || !isAdmin) redirect("/admin/login?error=1");
  const token = await signSession({ userId: user!.id, role: "admin" }, process.env.SESSION_SECRET!);
  (await cookies()).set("admin_session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  redirect("/admin");
}
