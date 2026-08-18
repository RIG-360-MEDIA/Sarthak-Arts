import "@/app/sanctum-chrome.css";
import { getSetting } from "@/lib/settings";
import { getCartItemCount } from "@/lib/cart";
import { SanctumNav } from "@/components/hero/SanctumNav";
import { SanctumFooter } from "@/components/hero/SanctumFooter";
import { ToastProvider } from "@/components/hero/Toast";

// Storefront reads live settings/cart/products; render on demand so the build
// does not require a database connection for static generation.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [lines, storeName, cartCount] = await Promise.all([
    getSetting<string[]>("announcement_lines", []),
    getSetting<string>("store_name", "Sarthak Arts"),
    getCartItemCount(),
  ]);

  return (
    <div className="sa-chrome">
      <a href="#main" className="sa-link-line" style={{ position: "fixed", top: 6, left: 6, zIndex: 100, transform: "translateY(-160%)" }}>
        Skip to content
      </a>
      <ToastProvider>
        {lines[0] && <div className="sa-announce">{lines[0]}</div>}
        <SanctumNav initialCartCount={cartCount} panchangSummary={null} />
        <main id="main" className="container" style={{ paddingBottom: 80 }}>{children}</main>
        <SanctumFooter storeName={storeName} />
      </ToastProvider>
    </div>
  );
}
