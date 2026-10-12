import { prisma } from "@/lib/db";
import { resolveRole } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/admin";

export type SessionPayload = { userId: number; role: AppRole; email: string; emailVerified: boolean };

/**
 * The signed-in user, verified with Supabase Auth on every call (null when signed out).
 * Maps the Supabase account to our own User row, creating it for a new customer.
 */
export async function currentSession(): Promise<SessionPayload | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const au = data.user;
  if (!au?.email) return null;

  const email = au.email.toLowerCase();
  const emailVerified = Boolean(au.email_confirmed_at);
  const role = resolveRole(au.app_metadata);

  let user = await prisma.user.findUnique({ where: { authId: au.id } });
  if (!user) {
    // Only adopt an existing (guest/staff) row by email once the address is verified,
    // otherwise anyone could claim someone else's orders by signing up with their email.
    const byEmail = emailVerified ? await prisma.user.findUnique({ where: { email } }) : null;
    if (byEmail && !byEmail.authId) {
      user = await prisma.user.update({ where: { id: byEmail.id }, data: { authId: au.id, isGuest: false } });
    } else if (!byEmail) {
      user = await prisma.user.create({
        data: { email, authId: au.id, isGuest: false, name: (au.user_metadata?.name as string | undefined) ?? null },
      });
    } else {
      return null;
    }
  }
  return { userId: user.id, role, email, emailVerified };
}
