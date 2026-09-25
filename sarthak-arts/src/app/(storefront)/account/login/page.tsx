import type { Metadata } from "next";
import Link from "next/link";
import "../../order/order.css";
import { signIn } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in — Sarthak Arts" };

export default async function AccountLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="ot-root">
      <div className="ot-wrap">
        <div className="ot-lookup">
          <div className="ot-lookup-card">
            <h1 className="serif">Welcome back</h1>
            <p className="sub">Sign in to see your orders and consultations.</p>
            {error && (
              <p className="foot" role="alert" style={{ color: "var(--sold)", marginTop: 0 }}>
                {error === "throttle" ? "Too many attempts. Please wait a few minutes." : "That email or password didn't match."}
              </p>
            )}
            <form action={signIn}>
              <div className="ot-field" suppressHydrationWarning><label>Email</label><input name="email" type="email" autoComplete="email" required autoFocus /></div>
              <div className="ot-field" suppressHydrationWarning><label>Password</label><input name="password" type="password" autoComplete="current-password" required /></div>
              <button type="submit" className="ot-btn primary">Sign in</button>
            </form>
            <p className="foot">New here? <Link href="/account/signup">Create an account</Link></p>
            <p className="foot">Or <Link href="/order-lookup">track an order without an account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
