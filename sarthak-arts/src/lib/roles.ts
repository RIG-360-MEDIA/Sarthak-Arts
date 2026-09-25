import type { AppRole } from "@/lib/supabase/admin";

/** Read the app role from a Supabase user's app_metadata. Anyone signed in without one is a customer. */
export function resolveRole(appMetadata: Record<string, unknown> | null | undefined): AppRole {
  const r = appMetadata?.role;
  return r === "admin" || r === "consultant" ? r : "customer";
}
