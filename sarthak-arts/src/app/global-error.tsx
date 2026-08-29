"use client";

/**
 * Root error boundary — the last line of defence. If something throws in the
 * root layout itself, this replaces the whole document, so it must be entirely
 * self-contained (its own <html>/<body>, inline styles — no external CSS that
 * might be the very thing that failed). Branded, calm, and offers a way out.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{
          minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box",
          background: "radial-gradient(60% 60% at 50% 0%, rgba(232,168,28,.12), transparent 60%), linear-gradient(180deg, #2a2017, #1c150f)",
          color: "#F7ECD4", textAlign: "center",
        }}>
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontSize: 52, color: "#E8A81C", opacity: .9, fontFamily: "'Noto Serif Devanagari','Nirmala UI',serif" }} aria-hidden="true">ॐ</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 27, fontWeight: 500, margin: "12px 0 10px", color: "#FBEFD6" }}>Something interrupted the ritual</h1>
            <p style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 15, lineHeight: 1.65, color: "rgba(247,236,212,.82)", margin: "0 0 24px" }}>
              An unexpected error occurred. Your data is safe — please try again in a moment.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => reset()} style={{
                font: "inherit", fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
                color: "#23150c", border: "none", padding: "13px 26px", borderRadius: 12,
                background: "radial-gradient(130% 130% at 30% 20%, #FBE7A6, #E8A81C 64%, #B47D0C)",
              }}>Try again</button>
              <a href="/" style={{
                fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, textDecoration: "none",
                color: "#E8A81C", padding: "13px 26px", borderRadius: 12, border: "1px solid rgba(232,168,28,.4)",
              }}>Return home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
