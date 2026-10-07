import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "./cart.css";
import { prisma } from "@/lib/db";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { glyphForCategory, gradForMetal } from "@/lib/collection";
import { visualFor } from "@/lib/direction-visual";
import { PieceDefs, PieceRender } from "@/components/collection/Piece";
import Image from "next/image";
import { updateQuantity, updateShopifyLine } from "./actions";
import { isShopifyEnabled } from "@/lib/shopify/config";
import { getSessionShopifyCart } from "@/lib/shopify/cart-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Cart — Sarthak Arts" };

const FREE_SHIP_MINOR = 15000 * 100; // ₹15,000

const CART_PRODUCT_INCLUDE = {
  category: true,
  composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" as const } },
  directions: { include: { direction: true } },
};
function loadCartProducts(ids: number[]) {
  return prisma.product.findMany({ where: { id: { in: ids } }, include: CART_PRODUCT_INCLUDE });
}
type CartItems = NonNullable<Awaited<ReturnType<typeof getCartWithItems>>>["items"];
type CartProducts = Awaited<ReturnType<typeof loadCartProducts>>;

function EmptyCart() {
  return (
    <div className="cart-root">
      <div className="cart-empty">
        <div className="om" aria-hidden="true">ॐ</div>
        <h1 className="serif">Your cart is empty</h1>
        <p>Every piece has its corner — none chosen yet. Begin with the collection, or let us guide you to the right one.</p>
        <Link href="/collection" className="btn">Explore the collection</Link>
      </div>
    </div>
  );
}

/** Headless Shopify cart — same styling, sourced from the Shopify cart. */
async function renderShopifyCart() {
  const cart = await getSessionShopifyCart().catch(() => null);
  const lines = cart?.lines.nodes ?? [];
  if (!cart || lines.length === 0) return <EmptyCart />;

  const cur = cart.cost.subtotalAmount.currencyCode;
  const fmt = (amt: string) =>
    new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", {
      style: "currency", currency: cur, minimumFractionDigits: Number.isInteger(Number(amt)) ? 0 : 2,
    }).format(Number(amt));
  const subtotalMinor = Math.round(Number(cart.cost.subtotalAmount.amount) * 100);
  const remaining = Math.max(0, FREE_SHIP_MINOR - subtotalMinor);
  const shipPct = Math.min(100, Math.round((subtotalMinor / FREE_SHIP_MINOR) * 100));
  const count = cart.totalQuantity;

  return (
    <div className="cart-root">
      <PieceDefs />
      <div className="cart-wrap">
        <div className="cart-head">
          <h1 className="serif">Your cart</h1>
          <span className="count">{count} {count === 1 ? "piece" : "pieces"}</span>
        </div>
        <div className="cart-layout">
          <div>
            <div className="cart-items">
              {lines.map((line) => {
                const m = line.merchandise;
                return (
                  <article key={line.id} className="citem">
                    <Link href={`/collection/${m.product.handle}`} className="citem-thumb">
                      {m.product.featuredImage?.url
                        ? <Image src={m.product.featuredImage.url} alt={m.product.title} width={92} height={92} unoptimized />
                        : <PieceRender glyph={glyphForCategory((m.product.productType || "vessel").toLowerCase())} metalGrad="gAlloy" gemHex="#B8863E" className="obj" />}
                    </Link>
                    <div className="citem-info">
                      <Link href={`/collection/${m.product.handle}`} className="citem-name serif">{m.product.title}</Link>
                      {m.title && m.title !== "Default Title" && <div className="citem-spec">{m.title}</div>}
                      <div className="citem-unit">{fmt(m.price.amount)} each</div>
                    </div>
                    <div className="citem-side">
                      <span className="citem-total">{fmt(line.cost.totalAmount.amount)}</span>
                      <form action={updateShopifyLine} className="citem-qtyform">
                        <input type="hidden" name="lineId" value={line.id} />
                        <div className="qty-stepper">
                          <button name="quantity" value={line.quantity - 1} aria-label="Decrease quantity">−</button>
                          <span>{line.quantity}</span>
                          <button name="quantity" value={line.quantity + 1} aria-label="Increase quantity">+</button>
                        </div>
                        <button name="quantity" value={0} className="citem-remove" aria-label="Remove">Remove</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
            <Link href="/collection" className="cart-continue">← Continue shopping</Link>
          </div>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div className="cart-ship">
              {remaining > 0
                ? <div className="cart-ship-text">Add <b>{fmt(String(remaining / 100))}</b> for free shipping</div>
                : <div className="cart-ship-text done">✓ You&apos;ve unlocked free shipping</div>}
              <div className="cart-ship-bar"><span className="cart-ship-fill" style={{ width: `${shipPct}%` }} /></div>
            </div>
            <div className="csum-row"><span>Subtotal</span><span className="v">{fmt(cart.cost.subtotalAmount.amount)}</span></div>
            <div className="csum-row"><span>Shipping</span><span className="v">{remaining > 0 ? "Calculated at checkout" : "Free"}</span></div>
            <div className="csum-row csum-total"><span>Total</span><span className="v">{fmt(cart.cost.totalAmount.amount)}</span></div>
            <a href={cart.checkoutUrl} className="cart-checkout">Proceed to checkout</a>
            <div className="cart-trust">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>Certified metal &amp; gemstone, per piece</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>Secure payment · Shopify checkout</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>7-day easy returns</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default async function CartPage() {
  if (isShopifyEnabled()) return await renderShopifyCart();

  const cartId = (await cookies()).get("cart_id")?.value;

  // Fail soft: Neon sleeps frequently — a DB blip shouldn't 500 the whole cart.
  let rawItems: CartItems = [];
  let products: CartProducts = [];
  let failed = false;
  try {
    const cart = cartId ? await getCartWithItems(cartId) : null;
    rawItems = cart?.items ?? [];
    if (rawItems.length) products = await loadCartProducts(rawItems.map((i) => i.productId));
  } catch (err) {
    console.warn("[cart] load failed:", err instanceof Error ? err.message : err);
    failed = true;
  }

  if (failed) {
    return (
      <div className="cart-root">
        <div className="cart-empty">
          <div className="om" aria-hidden="true">ॐ</div>
          <h1 className="serif">We couldn&apos;t load your cart</h1>
          <p>The workshop is catching its breath. Your cart is safe — please refresh in a moment.</p>
          <Link href="/cart" className="btn">Refresh</Link>
        </div>
      </div>
    );
  }

  if (rawItems.length === 0) {
    return (
      <div className="cart-root">
        <div className="cart-empty">
          <div className="om" aria-hidden="true">ॐ</div>
          <h1 className="serif">Your cart is empty</h1>
          <p>Every piece has its corner — none chosen yet. Begin with the collection, or let us guide you to the right one.</p>
          <Link href="/collection" className="btn">Explore the collection</Link>
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotalMinor(rawItems.map((i) => ({ unitPriceMinor: i.product.basePriceMinor, quantity: i.quantity })));
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = rawItems.map((i) => {
    const p = byId.get(i.productId);
    const code = p?.directions[0]?.direction.code ?? "center";
    const v = visualFor(code);
    const metal = p?.composition.find((c) => c.metal)?.metal;
    const gem = p?.composition.find((c) => c.gemstone)?.gemstone;
    const weightG = metal ? p?.composition.find((c) => c.metal)?.weightGrams : null;
    const spec = [metal?.name, weightG != null ? `${Number(weightG)}g` : null].filter(Boolean).join(" · ");
    return {
      id: i.id, productId: i.productId, slug: p?.slug ?? "", name: i.product.name,
      quantity: i.quantity, stock: p?.stockQuantity ?? 99,
      unitMinor: i.product.basePriceMinor, lineMinor: i.product.basePriceMinor * i.quantity,
      glyph: glyphForCategory(p?.category.code ?? "vessel"),
      metalGrad: gradForMetal(metal?.name), gemHex: gem?.accentHex ?? "#B8863E",
      dirName: p?.directions[0]?.direction.name ?? "Center", deity: v.deity, deva: v.deva,
      color: v.color, colorDeep: v.colorDeep, spec,
    };
  });

  const remaining = Math.max(0, FREE_SHIP_MINOR - subtotal);
  const shipPct = Math.min(100, Math.round((subtotal / FREE_SHIP_MINOR) * 100));
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="cart-root">
      <PieceDefs />
      <div className="cart-wrap">
        <div className="cart-head">
          <h1 className="serif">Your cart</h1>
          <span className="count">{count} {count === 1 ? "piece" : "pieces"}</span>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div>
            <div className="cart-items">
              {items.map((it) => (
                <article key={it.id} className="citem" style={{ ["--pc" as string]: it.color, ["--pc-deep" as string]: it.colorDeep } as React.CSSProperties}>
                  <Link href={`/collection/${it.slug}`} className="citem-thumb" aria-label={it.name}>
                    <PieceRender glyph={it.glyph} metalGrad={it.metalGrad} gemHex={it.gemHex} className="obj" />
                  </Link>
                  <div className="citem-info">
                    <span className="citem-dir"><span className="sa-deva">{it.deva}</span> {it.deity} · {it.dirName}</span>
                    <Link href={`/collection/${it.slug}`} className="citem-name serif">{it.name}</Link>
                    {it.spec && <div className="citem-spec">{it.spec}</div>}
                    <div className="citem-unit">
                      {formatMoney(it.unitMinor, "INR")} each
                      {it.quantity >= it.stock && <span className="citem-stock-low"> · max in stock</span>}
                    </div>
                  </div>
                  <div className="citem-side">
                    <span className="citem-total">{formatMoney(it.lineMinor, "INR")}</span>
                    <form action={updateQuantity} className="citem-qtyform">
                      <input type="hidden" name="productId" value={it.productId} />
                      <div className="qty-stepper">
                        <button name="quantity" value={it.quantity - 1} aria-label="Decrease quantity">−</button>
                        <span>{it.quantity}</span>
                        <button name="quantity" value={it.quantity + 1} aria-label="Increase quantity" disabled={it.quantity >= it.stock}>+</button>
                      </div>
                      <button name="quantity" value={0} className="citem-remove" aria-label={`Remove ${it.name}`}>Remove</button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
            <Link href="/collection" className="cart-continue">← Continue shopping</Link>
          </div>

          {/* Summary */}
          <aside className="cart-summary">
            <h2>Order summary</h2>

            <div className="cart-ship">
              {remaining > 0 ? (
                <div className="cart-ship-text">Add <b>{formatMoney(remaining, "INR")}</b> for free shipping</div>
              ) : (
                <div className="cart-ship-text done">✓ You&apos;ve unlocked free shipping</div>
              )}
              <div className="cart-ship-bar"><span className="cart-ship-fill" style={{ width: `${shipPct}%` }} /></div>
            </div>

            <div className="csum-row"><span>Subtotal</span><span className="v">{formatMoney(subtotal, "INR")}</span></div>
            <div className="csum-row"><span>Shipping</span><span className="v">{remaining > 0 ? "Calculated at checkout" : "Free"}</span></div>
            <div className="csum-row csum-total"><span>Total</span><span className="v">{formatMoney(subtotal, "INR")}</span></div>

            <Link href="/checkout" className="cart-checkout">Proceed to checkout</Link>

            <div className="cart-trust">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>Certified metal &amp; gemstone, per piece</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>Secure payment by UPI</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>7-day easy returns</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
