"use client";
import { useEffect, useState } from "react";

type Props = { lines: string[] };

export function HeroEyebrow({ lines }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (lines.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % lines.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <span className={`sa-eyebrow sa-hero-eyebrow${visible ? "" : " sa-eyebrow-fade"}`}>
      {lines[idx]}
    </span>
  );
}
