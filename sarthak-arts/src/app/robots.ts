import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/portal/", "/checkout/", "/order/", "/api/"],
      },
    ],
    sitemap: "https://sarthakarts.com/sitemap.xml",
  };
}
