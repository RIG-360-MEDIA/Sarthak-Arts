"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, AdminMark } from "@/app/(admin)/admin/_ui/icons";
import { logout } from "./actions";

/**
 * PortalNav — the top bar of the consultant portal. Lighter than the owner's
 * admin sidebar (a consultant only needs Sessions + Availability), but the same
 * warm-branded family. Active route is highlighted via the current pathname.
 */
const NAV = [
  { label: "Sessions", href: "/portal", icon: "consultations" },
  { label: "Availability", href: "/portal/availability", icon: "calendar" },
];

export function PortalNav({ name }: { name: string }) {
  const pathname = usePathname();
  const initial = (name || "C").trim().charAt(0).toUpperCase();

  return (
    <header className="portal-bar">
      <Link href="/portal" className="portal-brand">
        <span className="mark"><AdminMark size={18} /></span>
        <span className="name">Sarthak Arts<small>Consultant portal</small></span>
      </Link>

      <nav className="portal-nav" aria-label="Portal">
        {NAV.map((item) => {
          const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="spacer" />

      <div className="portal-who">
        <span className="av">{initial}</span>
        <span className="meta"><b>{name || "Consultant"}</b><span>Consultant</span></span>
      </div>
      <form action={logout}>
        <button type="submit" className="portal-signout">Sign out</button>
      </form>
    </header>
  );
}
