import "@/app/(admin)/admin/admin.css";
import { AdminMark } from "@/app/(admin)/admin/_ui/icons";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="admin">
      <div className="adm-login-wrap">
        <form className="adm-login" action={login}>
          <div className="brand">
            <span className="mark"><AdminMark size={26} /></span>
            <h1>Consultant sign in</h1>
            <p>Your Sarthak Arts sessions &amp; availability</p>
          </div>

          {error && <div className="err">{error === "throttle" ? "Too many attempts. Please wait a few minutes, then try again." : "That email or password didn't match. Please try again."}</div>}

          <div className="adm-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="adm-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          <button type="submit" className="adm-btn adm-btn-primary">Sign in</button>
          <p className="foot">For consultants and astrologers only.</p>
        </form>
      </div>
    </div>
  );
}
