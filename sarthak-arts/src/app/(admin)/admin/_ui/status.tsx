/**
 * Status pills — one consistent, colour-coded vocabulary for every admin table.
 * Colour carries meaning: green = good/done, amber = needs you, red = problem,
 * blue = in progress, neutral = inactive. Text stays human-readable.
 */

type Tone = "ok" | "warn" | "crit" | "info" | "neutral";

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`adm-pill ${tone}`}>{children}</span>;
}

const ORDER_TONE: Record<string, Tone> = {
  pending: "warn", paid: "info", confirmed: "info", packed: "info",
  shipped: "info", delivered: "ok", cancelled: "crit", refunded: "neutral",
};
export function OrderStatusPill({ code, name }: { code: string; name: string }) {
  return <Pill tone={ORDER_TONE[code] ?? "neutral"}>{name}</Pill>;
}

const RETURN_LABEL: Record<string, { tone: Tone; label: string }> = {
  requested: { tone: "warn", label: "Needs decision" },
  approved: { tone: "info", label: "Approved" },
  rejected: { tone: "crit", label: "Rejected" },
  refunded: { tone: "ok", label: "Refunded" },
};
export function ReturnStatusPill({ status }: { status: string }) {
  const s = RETURN_LABEL[status] ?? { tone: "neutral" as Tone, label: status };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

const REVIEW_LABEL: Record<string, { tone: Tone; label: string }> = {
  published: { tone: "ok", label: "Published" },
  hidden: { tone: "crit", label: "Hidden" },
  pending: { tone: "warn", label: "Awaiting approval" },
};
export function ReviewStatusPill({ status }: { status: string }) {
  const s = REVIEW_LABEL[status] ?? { tone: "neutral" as Tone, label: status };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

const PRODUCT_LABEL: Record<string, { tone: Tone; label: string }> = {
  live: { tone: "ok", label: "Live" },
  draft: { tone: "neutral", label: "Draft" },
  archived: { tone: "neutral", label: "Archived" },
};
export function ProductStatusPill({ status }: { status: string }) {
  const s = PRODUCT_LABEL[status] ?? { tone: "neutral" as Tone, label: status };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function StockPill({ qty, low }: { qty: number; low: boolean }) {
  if (qty === 0) return <Pill tone="crit">Out of stock</Pill>;
  if (low) return <Pill tone="warn">Low · {qty} left</Pill>;
  return <Pill tone="ok">{qty} in stock</Pill>;
}

export function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    booked: { tone: "info", label: "Booked" },
    completed: { tone: "ok", label: "Completed" },
    cancelled: { tone: "crit", label: "Cancelled" },
    "no-show": { tone: "neutral", label: "No-show" },
  };
  const s = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
