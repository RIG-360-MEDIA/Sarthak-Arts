"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, AdminMark } from "../_ui/icons";
import { FlashToast } from "../_ui/FlashToast";
import { logout } from "./actions";

/**
 * AdminShell — the warm-branded chrome around every admin screen.
 *  - grouped sidebar with icons, active highlight and attention badges
 *  - owner identity + sign-out at the foot
 *  - sticky topbar with breadcrumb and a "View store" shortcut
 *  - collapses to an off-canvas drawer under 900px
 *
 * Server data (who's signed in, how many things need attention) is passed in;
 * the client only owns the drawer open/close state and active-route logic.
 */
type NavItem = { label: string; href: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }] },
  {
    label: "Sell",
    items: [
      { label: "Products", href: "/admin/products", icon: "products" },
      { label: "Orders", href: "/admin/orders", icon: "orders" },
      { label: "Returns", href: "/admin/returns", icon: "returns" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Consultations", href: "/admin/consultations", icon: "consultations" },
      { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Content", href: "/admin/content", icon: "content" },
      { label: "Social", href: "/admin/social", icon: "social" },
      { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
      { label: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

export type ShellProps = {
  user: { name: string; email: string };
  badges: Record<string, number>;
  children: React.ReactNode;
};

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ user, badges, children }: ShellProps) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const current = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(i.href, pathname));
  const initial = (user.name || user.email || "A").trim().charAt(0).toUpperCase();

  return (
    <div className="adm-shell" data-drawer={drawer ? "open" : "closed"}>
      <div className="adm-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <aside className="adm-side">
        <div className="adm-brand">
          <span className="mark"><AdminMark size={18} /></span>
          <span className="name">Sarthak Arts<small>Owner console</small></span>
        </div>

        <nav className="adm-nav" aria-label="Admin sections">
          {NAV.map((group) => (
            <div key={group.label} className="adm-nav-group">
              <div className="lbl">{group.label}</div>
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const badge = badges[item.href] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`adm-nav-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setDrawer(false)}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                    {badge > 0 && <span className="badge">{badge > 99 ? "99+" : badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-side-foot">
          <div className="adm-who">
            <span className="av">{initial}</span>
            <span className="meta">
              <b>{user.name || "Owner"}</b>
              <span>{user.email}</span>
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="adm-signout">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button type="button" className="adm-burger" onClick={() => setDrawer(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <div className="adm-crumb">
            <span>Admin</span>
            {current && <><Icon name="chevron" style={{ width: 13, height: 13 }} /><b>{current.label}</b></>}
          </div>
          <div className="spacer" />
          <a className="adm-view-site" href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" /><span className="lbl">View store</span>
          </a>
        </header>

        <main>{children}</main>
      </div>

      <Suspense fallback={null}><FlashToast /></Suspense>
    </div>
  );
}
