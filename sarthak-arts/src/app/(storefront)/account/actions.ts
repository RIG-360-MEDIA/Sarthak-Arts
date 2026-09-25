"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function signIn(formData: FormData): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/account/login?error=${error.status === 429 ? "throttle" : "1"}`);
  redirect("/account");
}

export async function signUp(formData: FormData): Promise<void> {
  const name = String(formData.get("name")).trim();
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  if (password.length < 8) redirect("/account/signup?error=short");

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/account/signup?error=${error.status === 429 ? "throttle" : "failed"}`);
  // With email confirmation on there is no session yet: ask the customer to check their inbox.
  redirect(data.session ? "/account" : "/account/signup?sent=1");
}

export async function signOut(): Promise<void> {
  await (await supabaseServer()).auth.signOut();
  redirect("/");
}
