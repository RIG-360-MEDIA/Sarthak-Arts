"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CartControl } from "./CartControl";
import { SearchLauncher } from "./SearchLauncher";
import { MobileMenu } from "./MobileMenu";
import { LogoMark } from "./LogoMark";

/**
 * SanctumNav — the top bar. Client-side so we can:
 *  - reveal the search modal / mobile drawer as state
 *  - subtly change on scroll (deeper backdrop once past 12px)
 *  - keep the cart / wishlist affordances in sync with client stores
 *
 * Server-side data (initial cart count) is passed in as a prop so the
 * first paint is correct — the client takes over from there.
 */
type Props = {
  initialCartCount: number;
  panchangSummary: string | null; // one-liner for the mobile menu ("Kāla Choghadiya · inauspicious")
};

export function SanctumNav({ initialCartCount, panchangSummary }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sa-nav${scrolled ? " is-scrolled" : ""}`}
      aria-label="Primary"
      id="sa-nav-top"
    >
      <Link className="sa-nav-logo" href="/">
        <LogoMark size={28} className="sa-nav-mark" />
        <span className="wordmark">Sarthak Arts</span>
      </Link>

      <div className="sa-nav-links">
        <Link href="/collection">The Collection</Link>
        <Link href="/direction">Shop by Direction</Link>
        <Link href="/consultation">Consultations</Link>
        <Link href="/vastu-shastra">Journal</Link>
      </div>

      <div className="sa-nav-actions">
        <SearchLauncher />
        <CartControl initialCount={initialCartCount} />
        <MobileMenu initialCartCount={initialCartCount} panchangSummary={panchangSummary} />
      </div>
    </nav>
  );
}
