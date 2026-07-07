import { login } from "./actions";

export default function LoginPage() {
  return (
    <form action={login} style={{ maxWidth: 360, margin: "80px auto", padding: "0 20px" }}>
      <h1>Admin</h1>
      <label>Email</label><input name="email" type="email" required />
      <label>Password</label><input name="password" type="password" required />
      <button style={{ marginTop: 16 }}>Sign in</button>
    </form>
  );
}
