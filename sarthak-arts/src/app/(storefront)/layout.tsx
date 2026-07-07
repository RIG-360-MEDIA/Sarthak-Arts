import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { subscribe } from "@/app/(storefront)/newsletter/actions";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

// Storefront reads live settings/cart/products; Plan 2 introduces ISR for
// cacheable product pages. For now, render on demand so the build does not
// require a database connection for static generation.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const lines = await getSetting<string[]>("announcement_lines", []);
  const storeName = await getSetting<string>("store_name", "Store");
  const posts = await prisma.socialPost.findMany({ where: { pinned: true }, orderBy: { createdAt: "desc" }, take: 3 });
  return (
    <>
      {lines[0] && (
        <div style={{ background: "var(--ground-deep)", textAlign: "center", fontSize: 12, padding: "6px 0", color: "var(--ink-muted)" }}>
          {lines[0]}
        </div>
      )}
      <header className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", flexWrap: "wrap" }}>
        <Link href="/" className="serif" style={{ fontSize: 20, textDecoration: "none", color: "var(--ink)" }}>{storeName}</Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14, alignItems: "center" }}>
          <Link href="/collection" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>The Collection</Link>
          <Link href="/direction" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Shop by Direction</Link>
          <form action="/search" style={{ display: "inline" }}>
            <input name="q" placeholder="Search…" style={{ width: 140, padding: "6px 10px", fontSize: 13 }} />
          </form>
          <CurrencySwitcher />
          <Link href="/cart" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Cart</Link>
        </nav>
      </header>
      <main className="container" style={{ paddingBottom: 80 }}>{children}</main>
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--focus-panel)", color: "var(--focus-text)", padding: "32px 20px" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", marginBottom: 10 }}>Shop</div>
            {[["The Collection", "/collection"], ["Shop by Direction", "/direction"], ["Book a Consultation", "/consultation"]].map(([l, h]) => (
              <a key={h} href={h} style={{ display: "block", fontSize: 13, color: "var(--focus-muted)", textDecoration: "none", padding: "3px 0" }}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", marginBottom: 10 }}>Learn</div>
            {[["Vastu Shastra, briefly", "/vastu-shastra"], ["Our Craft", "/our-craft"], ["Home audit", "/home-audit"], ["About", "/about"]].map(([l, h]) => (
              <a key={h} href={h} style={{ display: "block", fontSize: 13, color: "var(--focus-muted)", textDecoration: "none", padding: "3px 0" }}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", marginBottom: 10 }}>Help</div>
            <a href="/order-lookup" style={{ display: "block", fontSize: 13, color: "var(--focus-muted)", textDecoration: "none", padding: "3px 0" }}>Track / return an order</a>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", marginBottom: 10 }}>On Instagram</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              {posts.map((p) => (
                <a key={p.id} href={p.permalink} style={{ display: "block", aspectRatio: "1", background: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--focus-muted)", marginTop: 12 }}>Get one placement tip a month, nothing else.</div>
            <form action={subscribe} style={{ display: "flex", gap: 0, marginTop: 8 }}>
              <input name="email" type="email" required placeholder="your@email.com" style={{ borderRadius: "4px 0 0 4px", fontSize: 12, padding: "7px 9px" }} />
              <button style={{ borderRadius: "0 4px 4px 0", background: "var(--brass)", color: "#fff", border: "1px solid var(--brass)", fontSize: 12, padding: "7px 12px", cursor: "pointer" }}>Subscribe</button>
            </form>
          </div>
        </div>
        <div className="container" style={{ fontSize: 11, color: "var(--focus-muted)", marginTop: 24 }}>
          © {storeName}. All metal weights and gemstone details listed are certified per piece at the time of shipping.
        </div>
      </footer>
    </>
  );
}
