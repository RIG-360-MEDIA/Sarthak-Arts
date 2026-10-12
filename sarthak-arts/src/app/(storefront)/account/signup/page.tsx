import type { Metadata } from "next";
import Link from "next/link";
import "../../order/order.css";
import { signUp } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create account — Sarthak Arts" };

export default async function AccountSignup({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  if (sent)
    return (
      <div className="ot-root">
        <div className="ot-wrap">
          <div className="ot-lookup">
            <div className="ot-lookup-card">
              <h1 className="serif">Check your email</h1>
              <p className="sub">We&apos;ve sent a confirmation link. Open it to activate your account, then sign in.</p>
              <p className="foot"><Link href="/account/login">Back to sign in</Link></p>
            </div>
          </div>
        </div>
      </div>
    );
  const message =
    error === "short" ? "Please use a password of at least 8 characters."
    : error === "throttle" ? "Too many attempts. Please wait a few minutes."
    : error ? "We couldn't create that account. Try a different email, or sign in if you already have one."
    : null;
  return (
    <div className="ot-root">
      <div className="ot-wrap">
        <div className="ot-lookup">
          <div className="ot-lookup-card">
            <h1 className="serif">Create your account</h1>
            <p className="sub">Keep your orders and consultations in one place.</p>
            {message && <p className="foot" role="alert" style={{ color: "var(--sold)", marginTop: 0 }}>{message}</p>}
            <form action={signUp}>
              <div className="ot-field" suppressHydrationWarning><label>Name</label><input name="name" autoComplete="name" required autoFocus /></div>
              <div className="ot-field" suppressHydrationWarning><label>Email</label><input name="email" type="email" autoComplete="email" required /></div>
              <div className="ot-field" suppressHydrationWarning><label>Password</label><input name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
              <button type="submit" className="ot-btn primary">Create account</button>
            </form>
            <p className="foot">Already have one? <Link href="/account/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
