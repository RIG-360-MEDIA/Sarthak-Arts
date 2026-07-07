import Link from "next/link";
import { logout } from "./actions";

const NAV = [
  ["Dashboard", "/portal"],
  ["Availability", "/portal/availability"],
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 200, background: "var(--focus-panel)", padding: "20px 12px", flexShrink: 0 }}>
        <div className="serif" style={{ color: "var(--focus-text)", fontSize: 16, padding: "0 8px 4px" }}>Sarthak Arts</div>
        <div style={{ color: "var(--focus-muted)", fontSize: 11, padding: "0 8px 18px", textTransform: "uppercase", letterSpacing: 1 }}>Consultant portal</div>
        {NAV.map(([label, href]) => (
          <Link key={href} href={href} style={{ display: "block", padding: "10px 12px", fontSize: 14, color: "var(--focus-muted)", textDecoration: "none", borderRadius: 6 }}>
            {label}
          </Link>
        ))}
        <form action={logout} style={{ marginTop: 20, padding: "0 8px" }}>
          <button className="btn-ghost" style={{ color: "var(--focus-muted)", borderColor: "var(--focus-muted)", fontSize: 12, padding: "6px 12px" }}>Sign out</button>
        </form>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
