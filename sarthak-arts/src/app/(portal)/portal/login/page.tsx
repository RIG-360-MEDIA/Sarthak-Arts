import { login } from "./actions";

export default async function PortalLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={login} style={{ maxWidth: 360, margin: "80px auto", padding: "0 20px" }}>
      <h1>Consultant sign in</h1>
      <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>For consultants and astrologers.</p>
      {error && <p style={{ color: "var(--critical)", fontSize: 13 }}>Wrong email or password.</p>}
      <label>Email</label><input name="email" type="email" required />
      <label>Password</label><input name="password" type="password" required />
      <button style={{ marginTop: 16 }}>Sign in</button>
    </form>
  );
}
