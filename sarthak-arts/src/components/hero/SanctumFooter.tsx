import Link from "next/link";
import { subscribe } from "@/app/(storefront)/newsletter/actions";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

/**
 * SanctumFooter — the shared platform footer, in sanctum language. Real links
 * and a working newsletter (the `subscribe` server action). Rendered site-wide
 * from the storefront layout so every page closes the same way.
 */
const COLS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Shop", links: [["The Collection", "/collection"], ["Consultations", "/consultation"]] },
  { title: "Learn", links: [["Our Craft", "/our-craft"], ["Understanding the terms", "/glossary"], ["Home audit", "/home-audit"], ["About", "/about"]] },
  { title: "Help", links: [["Track / return an order", "/order-lookup"], ["Shipping & Returns", "/shipping-returns"], ["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"]] },
];

export function SanctumFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="sa-foot">
      <div className="sa-foot-grid">
        <div className="sa-foot-brand">
          <span className="om sa-deva" aria-hidden="true">ॐ</span>
          <p>Handcrafted Vāstu pieces in copper, brass and silver — each made for one direction of the home, certified per piece.</p>
        </div>
        {COLS.map((c) => (
          <div className="sa-foot-col" key={c.title}>
            <h4>{c.title}</h4>
            {c.links.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </div>
        ))}
        <div className="sa-foot-news">
          <h4>One placement tip a month</h4>
          <p>Nothing else — just where to place what, by the calendar.</p>
          <form action={subscribe}>
            <input name="email" type="email" required placeholder="your@email.com" aria-label="Email" />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
      <div className="sa-foot-base">
        <span>© {storeName} · every metal weight and gemstone certified per piece.</span>
        <Link href="/admin" rel="nofollow">Staff login</Link>
        <CurrencySwitcher />
      </div>
    </footer>
  );
}
