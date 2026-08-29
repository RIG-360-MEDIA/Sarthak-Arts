import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const DESC =
  "Direction-mapped Vastu Shastra pieces handcrafted in copper, brass and silver, each set with a single gemstone. Full material transparency, placement guidance included.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sarthak Arts — Handcrafted Vastu Shastra Instruments in Copper, Brass & Silver",
  description: DESC,
  openGraph: {
    title: "Sarthak Arts — Handcrafted Vastu pieces, made for one direction",
    description: DESC,
    siteName: "Sarthak Arts",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Sarthak Arts — Handcrafted Vastu pieces" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarthak Arts — Handcrafted Vastu pieces",
    description: DESC,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
