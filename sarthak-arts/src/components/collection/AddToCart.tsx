"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartInline } from "@/app/(storefront)/collection/actions";
import { useToast } from "@/components/hero/Toast";

/**
 * The grid's add-to-cart control. Calls the inline server action (no redirect),
 * confirms with a toast, and refreshes so any cart count in the chrome updates.
 * Guards against double-submits and gates on stock.
 */
export function AddToCart({
  productId, variantId, pieceName, inStock,
}: {
  productId: number; variantId?: string; pieceName: string; inStock: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const push = useToast();

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || !inStock) return;
    setBusy(true);
    try {
      await addToCartInline(productId, variantId);
      push({ tone: "ok", message: `${pieceName} added to your cart.` });
      router.refresh();
    } catch {
      push({ tone: "err", message: "Could not add that piece. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="niche-cart">
      <button type="button" onClick={onClick} disabled={busy || !inStock}>
        {!inStock ? "Sold out" : busy ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
