"use client";
import { useEffect } from "react";

/**
 * Storefront error boundary — catches an error thrown while rendering any
 * storefront page and shows a calm, on-brand recovery screen (with the site
 * chrome still around it) instead of a raw crash. `reset()` retries the render.
 */
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for logging/monitoring (Next logs server errors; a tool like
    // Sentry would capture these in production).
    console.error("[storefront] render error:", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Noto Serif Devanagari','Nirmala UI',serif", fontSize: 48, color: "var(--gold-lit, #E8A81C)", opacity: .85 }} aria-hidden="true">ॐ</div>
      <h1 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26, fontWeight: 500, margin: "12px 0 8px", color: "var(--ink, #2A2016)" }}>
        Something went off-balance
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-muted, #6B5E4E)", margin: "0 0 24px" }}>
        An unexpected error stopped this page from loading. Your cart and details are safe — please try again.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => reset()} style={{
          font: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#23150c", border: "none",
          padding: "13px 26px", borderRadius: 12, background: "radial-gradient(130% 130% at 30% 20%, #FBE7A6, #E8A81C 64%, #B47D0C)",
        }}>Try again</button>
        <a href="/" style={{
          fontSize: 14, fontWeight: 700, textDecoration: "none", color: "var(--gold-deep, #B47D0C)",
          padding: "13px 26px", borderRadius: 12, border: "1px solid rgba(232,168,28,.42)",
        }}>Return home</a>
      </div>
    </div>
  );
}
