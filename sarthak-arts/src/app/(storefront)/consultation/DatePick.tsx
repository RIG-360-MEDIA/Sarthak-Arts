"use client";
import { useRouter } from "next/navigation";

/** Date input that reloads the booking panel for the chosen day (server renders the slots). */
export function DatePick({ type, value, min }: { type: string; value: string; min: string }) {
  const router = useRouter();
  return (
    <input
      type="date" className="slot-date" aria-label="Choose a date" value={value} min={min}
      onChange={(e) => e.target.value && router.push(`/consultation?type=${type}&date=${e.target.value}#book`, { scroll: false })}
    />
  );
}
