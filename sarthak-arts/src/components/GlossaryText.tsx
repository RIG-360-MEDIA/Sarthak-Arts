"use client";
import { Fragment } from "react";
import { AUTO_TERMS } from "@/lib/glossary";
import { Term } from "./Term";

/**
 * GlossaryText — renders a plain string, automatically turning the first
 * occurrence of each known devotional term into a <Term> tooltip. Drop it
 * around any body copy (product descriptions, placement notes, page text) and
 * the vocabulary explains itself everywhere it appears — new products included.
 *
 * Only the first mention of each term is linked, so a paragraph never turns
 * into a field of underlines.
 */
const FLAT = AUTO_TERMS.flatMap((t) => t.patterns.map((p) => ({ key: t.key, p })))
  .sort((a, b) => b.p.length - a.p.length); // longest first: "Śrī Yantra" beats "Yantra"

const PATTERN_TO_KEY = new Map(FLAT.map((x) => [x.p.toLowerCase(), x.key]));
const escaped = FLAT.map((x) => x.p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
// Unicode-aware word boundaries so diacritics (ā, ṣ, ṛ) are matched whole.
const RE = new RegExp(`(?<![\\p{L}])(${escaped.join("|")})(?![\\p{L}])`, "giu");

export function GlossaryText({ children }: { children: string | null | undefined }) {
  const text = children ?? "";
  if (!text) return null;

  const linked = new Set<string>();
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;

  while ((m = RE.exec(text)) !== null) {
    const matched = m[0];
    const key = PATTERN_TO_KEY.get(matched.toLowerCase());
    if (m.index > last) out.push(text.slice(last, m.index));
    if (key && !linked.has(key)) {
      linked.add(key);
      out.push(<Term key={`${key}-${m.index}`} name={key}>{matched}</Term>);
    } else {
      out.push(matched);
    }
    last = m.index + matched.length;
  }
  if (last < text.length) out.push(text.slice(last));

  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}
