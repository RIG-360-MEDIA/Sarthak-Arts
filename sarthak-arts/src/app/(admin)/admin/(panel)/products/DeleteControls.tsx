"use client";
import { useEffect, useRef, useState } from "react";

/** Submit button that asks for confirmation first. */
export function ConfirmSubmit({ message, className, children, disabled, name, value }: {
  message: string; className?: string; children: React.ReactNode; disabled?: boolean; name?: string; value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={disabled}
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}

/**
 * Bulk-delete bar for the products table: a select-all checkbox and a
 * "Delete selected (n)" button that tracks the row checkboxes (name="ids") in the same form.
 */
export function BulkDeleteBar({ permanent = false }: { permanent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const boxes = () => [...form.querySelectorAll<HTMLInputElement>('input[name="ids"]')];
    const sync = () => { setCount(boxes().filter((b) => b.checked).length); setTotal(boxes().length); };
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, []);

  const toggleAll = (checked: boolean) => {
    const form = ref.current?.closest("form");
    form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((b) => { b.checked = checked; });
    setCount(checked ? total : 0);
  };

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={total > 0 && count === total} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all products" />
        Select all
      </label>
      <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{count} selected</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
      <button type="submit" name="intent" value="live" className="adm-btn adm-btn-ghost adm-btn-sm" disabled={count === 0}>Make live</button>
      <button type="submit" name="intent" value="draft" className="adm-btn adm-btn-ghost adm-btn-sm" disabled={count === 0}>Move to draft</button>
      <button type="submit" name="intent" value="archived" className="adm-btn adm-btn-ghost adm-btn-sm" disabled={count === 0}>Archive</button>
      <ConfirmSubmit
        name="intent"
        value="delete"
        className="adm-btn adm-btn-ghost adm-btn-sm"
        disabled={count === 0}
        message={permanent
          ? `Permanently delete ${count} archived product${count === 1 ? "" : "s"}? This removes them from the database and cannot be undone. Past orders keep their item details.`
          : `Delete ${count} product${count === 1 ? "" : "s"}? This removes them from the shop and the database and cannot be undone. Products that appear in past orders are archived first — delete them again from the Archived tab to remove them for good.`}
      >
        {permanent ? "Delete permanently" : "Delete selected"}{count > 0 ? ` (${count})` : ""}
      </ConfirmSubmit>
      </div>
    </div>
  );
}
