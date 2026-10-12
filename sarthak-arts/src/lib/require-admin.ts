import "server-only";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";

/** Every admin server action calls this first: actions can be invoked directly, not only from the guarded pages. */
export async function requireAdmin() {
  const s = await currentSession();
  if (!s || s.role !== "admin") redirect("/admin/login");
  return s;
}
