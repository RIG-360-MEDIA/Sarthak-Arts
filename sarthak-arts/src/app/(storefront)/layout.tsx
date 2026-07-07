import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

// Storefront reads live settings/cart/products; Plan 2 introduces ISR for
// cacheable product pages. For now, render on demand so the build does not
// require a database connection for static generation.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const lines = await getSetting<string[]>("announcement_lines", []);
  const storeName = await getSetting<string>("store_name", "Store");
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
      <footer style={{ borderTop: "1px solid var(--line)", padding: 24, textAlign: "center", fontSize: 12, color: "var(--ink-faint)" }}>
        © {storeName}. All metal weights and gemstone details listed are certified per piece at the time of shipping.
      </footer>
    </>
  );
}
