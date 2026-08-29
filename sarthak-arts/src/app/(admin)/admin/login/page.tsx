import "../admin.css";
import { AdminMark } from "../_ui/icons";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="admin">
      <div className="adm-login-wrap">
        <form className="adm-login" action={login}>
          <div className="brand">
            <span className="mark"><AdminMark size={26} /></span>
            <h1>Welcome back</h1>
            <p>Sign in to your Sarthak Arts console</p>
          </div>

          {error && <div className="err">That email or password didn&apos;t match. Please try again.</div>}

          <div className="adm-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="adm-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          <button type="submit" className="adm-btn adm-btn-primary">Sign in</button>
          <p className="foot">Protected area — for the shop owner only.</p>
        </form>
      </div>
    </div>
  );
}
