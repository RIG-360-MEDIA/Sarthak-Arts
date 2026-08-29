import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response. These are the low-risk,
 * high-value ones. A full Content-Security-Policy is intentionally NOT set here
 * yet — the storefront loads the Razorpay checkout script, Google Fonts and
 * inline styles/3D, so a CSP needs its own dedicated testing pass before it can
 * be enabled without breaking checkout. Tracked as a follow-up.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [75, 90],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
