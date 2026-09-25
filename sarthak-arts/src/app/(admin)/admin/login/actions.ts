"use server";
import { redirect } from "next/navigation";
import { resolveRole } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";

export async function login(formData: FormData): Promise<void> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
  });
  if (error?.status === 429) redirect("/admin/login?error=throttle");
  if (error || !data.user || resolveRole(data.user.app_metadata) !== "admin") {
    if (data?.user) await supabase.auth.signOut();
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}
