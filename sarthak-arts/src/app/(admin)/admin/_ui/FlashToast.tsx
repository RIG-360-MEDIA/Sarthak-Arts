"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./icons";

/**
 * FlashToast — a brief "Saved ✓" confirmation. Server actions redirect back
 * with a `?flash=<key>` param; this reads it, shows the matching message, then
 * quietly cleans the URL so a refresh doesn't show it again. Non-technical
 * owners need to *see* that their change took effect.
 */
const MESSAGES: Record<string, string> = {
  saved: "Changes saved",
  created: "Product created — now add photos and details",
  "photo-added": "Photo added",
  "review-updated": "Review updated",
  "return-updated": "Return updated",
  "order-updated": "Order updated",
  "content-saved": "Content updated — it's live on your site now",
};

export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("flash");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    setMsg(MESSAGES[key] ?? "Done");
    // Strip the flash param from the URL without adding history.
    const next = new URLSearchParams(params);
    next.delete("flash");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!msg) return null;
  return (
    <div className="adm-toast-wrap">
      <div className="adm-toast ok" role="status">
        <Icon name="checkCircle" className="t-ic" />
        {msg}
      </div>
    </div>
  );
}
