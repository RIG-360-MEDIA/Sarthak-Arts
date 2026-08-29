/**
 * CheckoutSteps — the shared progress indicator that ties the checkout flow
 * together: Bag → Details → Payment → Confirmed. `current` is 1-based.
 */
const STEPS = ["Bag", "Details", "Payment", "Confirmed"];

function Check() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 6" /></svg>;
}

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="co-steps" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "upcoming";
        return (
          <li key={label} style={{ display: "contents" }}>
            <div className={`co-step ${state}`} aria-current={n === current ? "step" : undefined}>
              <span className="dot">{n < current ? <Check /> : n}</span>
              <span className="lbl">{label}</span>
            </div>
            {n < STEPS.length && <span className={`co-connector${n < current ? " done" : ""}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
