"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Toast — the small slide-in confirmation used across the sanctum experience.
 * A single component shared by the newsletter now, and every future
 * add-to-cart / booking / wishlist toggle later.
 *
 * Usage:
 *   Wrap the tree in <ToastProvider>, then call const push = useToast().
 *   push({ tone: "ok", message: "Subscribed. Look for the first note next month." });
 */

export type ToastTone = "ok" | "warn" | "err";
export type ToastPayload = { tone?: ToastTone; message: string; ttlMs?: number };
type ToastItem = ToastPayload & { id: number; tone: ToastTone; ttlMs: number };

type Ctx = { push: (t: ToastPayload) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.push;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((t: ToastPayload) => {
    const item: ToastItem = {
      id: nextId.current++,
      tone: t.tone ?? "ok",
      message: t.message,
      ttlMs: t.ttlMs ?? 3500,
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="sa-toast-tray" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, item.ttlMs);
    return () => clearTimeout(timer);
  }, [item.ttlMs, onDismiss]);

  return (
    <div className={`sa-toast sa-toast-${item.tone}`} role="status">
      <span className="sa-toast-icon" aria-hidden="true">
        {item.tone === "ok" ? "✦" : item.tone === "warn" ? "•" : "!"}
      </span>
      <span className="sa-toast-msg">{item.message}</span>
      <button
        type="button"
        className="sa-toast-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
