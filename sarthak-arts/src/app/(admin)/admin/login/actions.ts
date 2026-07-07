"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/auth";

export async function login(formData: FormData): Promise<void> {
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
