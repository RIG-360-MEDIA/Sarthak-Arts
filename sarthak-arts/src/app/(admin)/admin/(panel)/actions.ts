"use server";
import { requireAdmin } from "@/lib/require-admin";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function logout(): Promise<void> {
  await requireAdmin();
  await (await supabaseServer()).auth.signOut();
  redirect("/admin/login");
}
