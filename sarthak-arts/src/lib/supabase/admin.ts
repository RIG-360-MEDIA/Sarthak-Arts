import { createClient } from "@supabase/supabase-js";

export type AppRole = "admin" | "consultant" | "customer";

/** Service-role client. Server-only: bypasses all access rules, never expose to the browser. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Create the Supabase Auth account for an email, or update its password and role if it exists.
 * The role lives in app_metadata, which users cannot edit themselves.
 */
export async function ensureAuthUser(email: string, password: string, role: AppRole, name?: string): Promise<string> {
  const admin = supabaseAdmin();
  const created = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role }, user_metadata: name ? { name } : {},
  });
  if (created.data.user) return created.data.user.id;

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      const { error: upErr } = await admin.auth.admin.updateUserById(found.id, {
        password, email_confirm: true, app_metadata: { ...found.app_metadata, role },
      });
      if (upErr) throw upErr;
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  throw created.error ?? new Error(`Could not create auth user for ${email}`);
}
