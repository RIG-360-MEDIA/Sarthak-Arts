import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/auth";

export const SESSION_COOKIE = "admin_session";

/** Read and verify the current session from the cookie (null if signed out / invalid). */
export async function currentSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token, process.env.SESSION_SECRET!);
}
