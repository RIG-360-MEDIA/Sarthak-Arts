import type { MetadataRoute } from "next";

const BASE = "https://sarthakarts.com";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/collection", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/direction", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/consultation", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/home-audit", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/vastu-shastra", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/our-craft", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/search", priority: 0.3, changeFrequency: "weekly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/shipping-returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/order-lookup", priority: 0.3, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
