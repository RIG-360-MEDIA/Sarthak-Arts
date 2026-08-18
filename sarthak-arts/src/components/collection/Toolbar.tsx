"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toQuery } from "@/lib/collection-url";

/**
 * Toolbar — result count, density toggle, and sort. All URL-driven so a filtered,
 * sorted view is shareable and survives a refresh.
 */
export function Toolbar({
  lead, count, sort, density, current,
}: {
  lead: string;
  count: number;
  sort: string;
  density: string;
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const push = (patch: Record<string, string | undefined>) =>
    startTransition(() => router.push(toQuery({ ...current, ...patch }), { scroll: false }));

  return (
    <div className="toolbar">
      <div className="tb-lead">
        <span className="lead serif">{lead}</span>
        <span className="rescount">Showing {count} {count === 1 ? "piece" : "pieces"}</span>
      </div>
      <div className="tb-tools">
        <div className="density">
          <button
            type="button"
            className={`catpill${density !== "compact" ? " on" : ""}`}
            aria-pressed={density !== "compact"}
            onClick={() => push({ density: undefined })}
          >
            Comfortable
          </button>
          <button
            type="button"
            className={`catpill${density === "compact" ? " on" : ""}`}
            aria-pressed={density === "compact"}
            onClick={() => push({ density: "compact" })}
          >
            Compact
          </button>
        </div>
        <label className="tb-sortlbl">
          Sort
          <select value={sort} onChange={(e) => push({ sort: e.target.value === "newest" ? undefined : e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price — low to high</option>
            <option value="price-desc">Price — high to low</option>
          </select>
        </label>
      </div>
    </div>
  );
}
