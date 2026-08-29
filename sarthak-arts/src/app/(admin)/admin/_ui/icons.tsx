/**
 * Admin icon set — clean line icons (feather-style), stroke = currentColor so
 * they inherit text colour. One <Icon name="…" /> keeps every screen consistent.
 */
import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
  // ── Navigation ──────────────────────────────────────────────
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  products: (<><path d="M20.5 7.3 12 12 3.5 7.3" /><path d="M12 12v9.5" /><path d="M12 2.5 3.5 7.3v9.4L12 21.5l8.5-4.8V7.3L12 2.5Z" /></>),
  orders: (<><path d="M6 2.5h9l4 4v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3" /><path d="M14.5 2.5V7h4.5" /><path d="M8 13h8M8 17h5" /></>),
  consultations: (<><path d="M20 15.5a2 2 0 0 1-2 2H8l-4 3.5v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" /><path d="m12 8 1 2 2 .3-1.4 1.4.3 2-1.9-1-1.9 1 .3-2L10.5 10.3 12.5 10Z" transform="translate(-.5 0)" /></>),
  reviews: (<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />),
  returns: (<><path d="M3 8a9 9 0 0 1 15.5-4.5L21 6" /><path d="M21 3v3h-3" /><path d="M21 16a9 9 0 0 1-15.5 4.5L3 18" /><path d="M3 21v-3h3" /></>),
  content: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  social: (<><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="M8.3 10.8 14.7 7.2M8.3 13.2l6.4 3.6" /></>),
  analytics: (<><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" rx="1" /><rect x="12.5" y="8" width="3" height="9" rx="1" /><rect x="18" y="5" width="0.5" height="12" /><path d="M7 9l4-3 3 2 4-4" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>),

  // ── UI ──────────────────────────────────────────────────────
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>),
  chevron: (<path d="m9 6 6 6-6 6" />),
  arrowRight: (<><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>),
  external: (<><path d="M15 3h6v6" /><path d="M21 3 11 13" /><path d="M18 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.5" /></>),
  check: (<path d="m5 12 5 5L20 6" />),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.3 2.3L16 9" /></>),
  alert: (<><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4M12 17.5v.5" /></>),
  box: (<><path d="M20.5 7.3 12 12 3.5 7.3M12 12v9.5M12 2.5 3.5 7.3v9.4L12 21.5l8.5-4.8V7.3L12 2.5Z" /></>),
  upload: (<><path d="M12 15V4M12 4 8 8M12 4l4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>),
  trash: (<><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  x: (<path d="M6 6l12 12M18 6 6 18" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h16" />),
  star: (<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />),
  bell: (<><path d="M18 9a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9Z" /><path d="M10.5 20a1.8 1.8 0 0 0 3 0" /></>),
  truck: (<><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>),
  gift: (<><rect x="3.5" y="9" width="17" height="4" rx="1" /><path d="M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 9v12" /><path d="M12 9S10.5 4.5 8 4.5A2.2 2.2 0 0 0 8 9h4Zm0 0s1.5-4.5 4-4.5A2.2 2.2 0 0 1 16 9h-4Z" /></>),
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.7" /></>),
  tag: (<><path d="M3 12.5V4a1 1 0 0 1 1-1h8.5L21 11.5a1.5 1.5 0 0 1 0 2L14 20.5a1.5 1.5 0 0 1-2 0L3.5 12" /><circle cx="7.5" cy="7.5" r="1.3" /></>),
  rupee: (<><path d="M7 5h10M7 9h10M15.5 5c0 4-3 5.5-6 5.5H7l7 8.5" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>),
  logout: (<><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 12h10M17 9l3 3-3 3" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>),
  video: (<><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3z" /></>),
  om: (<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />),
};

type IconProps = SVGProps<SVGSVGElement> & { name: keyof typeof PATHS | string };

export function Icon({ name, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {PATHS[name] ?? PATHS.box}
    </svg>
  );
}

/** The Sarthak Arts lotus/star mark used in the brand lockups. */
export function AdminMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l2.7 5.6 6.1 1-4.4 4.3 1 6L12 16.7 6.6 19.4l1-6L3.2 9.1l6.1-1Z" />
    </svg>
  );
}
