import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = { userId: number; role: string };

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { userId: payload.userId as number, role: payload.role as string };
  } catch {
    return null;
  }
}
