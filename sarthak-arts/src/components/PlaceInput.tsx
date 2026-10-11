"use client";
import { useEffect, useId, useRef, useState } from "react";

type Place = { label: string; lat: number; lon: number };

/**
 * Text input with place suggestions as you type ("Rish" → "Rishikesh, Uttarakhand, India").
 * Free text still works if a place isn't listed.
 */
export function PlaceInput({ name, placeholder, required, maxLength = 120 }: {
  name: string; placeholder?: string; required?: boolean; maxLength?: number;
}) {
  const [value, setValue] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const picked = useRef<string | null>(null);
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2 || q === picked.current) { setPlaces([]); setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { places: Place[] };
        setPlaces(data.places);
        setActive(-1);
        setOpen(true);
      } catch { /* aborted or offline — keep free text */ }
      finally { if (!ctrl.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value]);

  const choose = (p: Place) => {
    picked.current = p.label;
    setValue(p.label);
    setOpen(false);
    setPlaces([]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || places.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % places.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? places.length - 1 : i - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(places[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="place-input" suppressHydrationWarning>
      <input
        name={name}
        value={value}
        onChange={(e) => { picked.current = null; setValue(e.target.value); }}
        onKeyDown={onKey}
        onFocus={() => places.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && places.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      />
      {loading && <span className="place-input-spin" aria-hidden="true" />}
      {open && places.length > 0 && (
        <ul id={listId} role="listbox" className="place-input-list">
          {places.map((p, i) => {
            const [head, ...rest] = p.label.split(", ");
            return (
              <li
                key={p.label}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? "is-active" : undefined}
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => setActive(i)}
              >
                <b>{head}</b>{rest.length > 0 && <span>{rest.join(", ")}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
