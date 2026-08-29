import { FULFILLMENT_FLOW } from "@/lib/orderflow";

/**
 * OrderTimeline — the vertical "where's my piece?" tracker. Steps completed so
 * far are gold with a check and a timestamp; the current step gently pulses;
 * upcoming steps are muted. Cancelled / refunded orders are handled by the page
 * with a banner instead of this timeline.
 */
const STEPS = [
  { code: "confirmed", label: "Order confirmed", desc: "Payment received — your order is placed." },
  { code: "packed", label: "Packed with care", desc: "Wrapped and readied for dispatch." },
  { code: "shipped", label: "On its way", desc: "Handed to the courier, travelling to you." },
  { code: "delivered", label: "Delivered", desc: "May it bless the corner it was made for." },
];

function Check() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 6" /></svg>;
}

function fmt(d?: Date) {
  if (!d) return null;
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
}

export function OrderTimeline({ currentCode, dates }: { currentCode: string; dates: Record<string, Date | undefined> }) {
  const ci = FULFILLMENT_FLOW.indexOf(currentCode);

  return (
    <div className="ot-timeline">
      {STEPS.map((step, i) => {
        const state = i < ci ? "done" : i === ci ? "current" : "";
        const reached = i <= ci;
        const when = fmt(dates[step.code]);
        return (
          <div key={step.code} className={`ot-tstep ${state}`}>
            <span className="ot-tdot">{reached ? <Check /> : null}</span>
            <div className="ot-tbody">
              <div className="ot-tlabel serif">{step.label}</div>
              <div className="ot-tdesc">{step.desc}</div>
              {when && <div className="ot-tdate">{when}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
