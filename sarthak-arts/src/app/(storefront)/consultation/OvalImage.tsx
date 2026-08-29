"use client";
import { useEffect, useState } from "react";

/**
 * OvalImage — shows a consultant photo when the file exists, and cleanly shows
 * nothing (revealing the metallic render behind it) when it doesn't. The owner
 * drops real (or AI-generated) portraits into /public/consultants — 1.jpg,
 * 2.jpg, 3.jpg — and they appear instantly, with no broken images meanwhile.
 *
 * Rendered client-side only: if we SSR the <img>, a 404 fires its error event
 * before React hydrates and attaches onError, so the broken image would never
 * be removed. Mounting after hydration guarantees onError is caught.
 */
export function OvalImage({ src, alt }: { src: string; alt: string }) {
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="oval-photo" src={src} alt={alt} onError={() => setFailed(true)} />;
}
