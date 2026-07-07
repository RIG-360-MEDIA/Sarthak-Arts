"use client";

export function CurrencySelect({
  codes,
  current,
  action,
}: {
  codes: string[];
  current: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <select
        name="code"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ width: "auto", padding: "6px 8px", fontSize: 13 }}
        aria-label="Display currency"
      >
        {codes.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </form>
  );
}
