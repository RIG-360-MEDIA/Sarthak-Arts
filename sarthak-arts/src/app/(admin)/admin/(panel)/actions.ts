"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function logout(): Promise<void> {
  await (await supabaseServer()).auth.signOut();
  redirect("/admin/login");
}
