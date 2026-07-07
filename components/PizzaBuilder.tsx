"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CheckoutStatus, IngredientDef } from "@/types/pizza";
import { usePizzaBuilder } from "@/hooks/usePizzaBuilder";
import { submitOrder } from "@/lib/firebase";
import { SIZES, formatPrice, getSize } from "@/lib/ingredients";
import PizzaCanvas from "./PizzaCanvas";
import IngredientTray from "./IngredientTray";
import Receipt from "./Receipt";
import BottomSheet from "./BottomSheet";
import Cart from "./Cart";
import { AnimatedPrice } from "./AnimatedPrice";

/**
 * Top-level orchestrator. Owns the builder state, the canvas ref used for
 * drop hit-testing, and the responsive shell:
 *
 *   mobile  — stacked: header (total pill) / size picker + canvas / bottom
 *             sheet; the receipt opens as a full-screen order view so it
 *             never half-covers the pizza
 *   tablet  — 2 columns: tray | canvas over receipt
 *   desktop — 3 columns: tray | canvas | receipt
 */
export default function PizzaBuilder() {
  const builder = usePizzaBuilder();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [mobileReceiptOpen, setMobileReceiptOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  /**
   * Tray chips report their release point in PAGE coordinates
   * (framer's info.point); convert to canvas-relative 0..1 and add.
   */
  const handleTrayDrop = useCallback(
    (def: IngredientDef, point: { x: number; y: number }): boolean => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      const x = (point.x - window.scrollX - rect.left) / rect.width;
      const y = (point.y - window.scrollY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return false;
      return builder.addIngredient(def, x, y);
    },
    [builder.addIngredient] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Tap-to-add: scatter near the center so stacks don't pile on one pixel. */
  const handleQuickAdd = useCallback(
    (def: IngredientDef) => {
      const jitter = () => 0.5 + (Math.random() - 0.5) * 0.4;
      builder.addIngredient(def, jitter(), jitter());
    },
    [builder.addIngredient] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleCheckout = useCallback(async () => {
    // Move the whole order into the cart first (this also clears the builder),
    // then record it to Firestore. The cart keeps it locally for 10 minutes so
    // it can still be cancelled.
    const order = builder.placeOrder();
    if (!order) return;
    setMobileReceiptOpen(false);
    setStatus("submitting");
    const result = await submitOrder({
      pizzas: order.pizzas,
      totalPrice: order.totalPrice,
      currency: "GEL",
      createdAt: new Date(order.placedAt).toISOString(),
    });
    setStatus(result.ok ? "success" : "error");
    setCartOpen(true);
    if (result.ok) {
      setTimeout(() => setStatus("idle"), 4000);
    }
  }, [builder.placeOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const receipt = (
    <Receipt builder={builder} status={status} onCheckout={handleCheckout} />
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 md:px-6">
        <h1 className="text-lg font-extrabold tracking-tight md:text-xl">
          🍕 PizzaCraft
        </h1>

        <div className="flex items-center gap-2">
          {/* Mobile: total pill — opens the full-screen order view */}
          <button
            className="flex min-h-11 items-center gap-2 rounded-full bg-parchment px-4 shadow-chip ring-1 ring-ink/5 md:hidden"
            onClick={() => setMobileReceiptOpen(true)}
            aria-expanded={mobileReceiptOpen}
            aria-label="Open your order"
          >
            <AnimatedPrice
              value={builder.totalPrice}
              className="text-base font-extrabold tabular-nums"
            />
            <span className="text-xs text-ink-soft">▾</span>
          </button>

          {/* Cart — placed orders live here (all breakpoints) */}
          <button
            className="relative flex min-h-11 items-center gap-1.5 rounded-full bg-parchment px-4 shadow-chip ring-1 ring-ink/5"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${builder.cart.length} orders`}
          >
            <span className="text-base">🛒</span>
            <span className="hidden text-sm font-extrabold sm:inline">Cart</span>
            {builder.cart.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tomato px-1 text-xs font-extrabold text-parchment">
                {builder.cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile: full-screen order view — solid, nothing peeks from behind */}
      <AnimatePresence>
        {mobileReceiptOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-cream px-3 pb-3 pt-16 md:hidden"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
          >
            <button
              aria-label="Back to the pizza"
              onClick={() => setMobileReceiptOpen(false)}
              className="absolute right-4 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-parchment text-lg shadow-chip ring-1 ring-ink/5"
            >
              ✕
            </button>
            <div className="min-h-0 flex-1">{receipt}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive body grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)_auto] md:p-5 lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:grid-rows-1">
        {/* Left panel: ingredients (tablet + desktop) */}
        <aside className="hidden min-h-0 rounded-3xl bg-parchment/70 p-4 shadow-warm ring-1 ring-ink/5 md:row-span-2 md:block lg:row-span-1">
          <IngredientTray onDrop={handleTrayDrop} onQuickAdd={handleQuickAdd} />
        </aside>

        {/* Center: size picker + the pizza — room for the sheet's peek on mobile */}
        <main className="flex min-h-0 flex-col items-center justify-center gap-3 pb-40 md:gap-4 md:pb-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-ink-soft">
              Pizza {builder.currentPizzaNumber}
            </span>
            <SizeSelector
              value={builder.size}
              onChange={builder.setSize}
            />
          </div>

          <PizzaCanvas
            canvasRef={canvasRef}
            ingredients={builder.selectedIngredients}
            sizeScale={getSize(builder.size).scale}
            onMove={builder.moveInstance}
            onRemove={builder.removeInstance}
          />
        </main>

        {/* Receipt: below the canvas on tablet, right column on desktop */}
        <section className="hidden min-h-0 md:col-start-2 md:block md:max-h-[38dvh] lg:col-start-3 lg:row-start-1 lg:max-h-none">
          {receipt}
        </section>
      </div>

      {/* Mobile: swipeable ingredient drawer */}
      <BottomSheet>
        <IngredientTray onDrop={handleTrayDrop} onQuickAdd={handleQuickAdd} />
      </BottomSheet>

      {/* Cart overlay — placed orders + 10-minute cancellation */}
      <Cart
        open={cartOpen}
        orders={builder.cart}
        onClose={() => setCartOpen(false)}
        onCancel={builder.cancelCartOrder}
      />
    </div>
  );
}

/** S / M / L segmented control — dough price shown under each letter. */
function SizeSelector({
  value,
  onChange,
}: {
  value: (typeof SIZES)[number]["id"];
  onChange: (size: (typeof SIZES)[number]["id"]) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pizza size"
      className="flex gap-1 rounded-2xl bg-ink/5 p-1"
    >
      {SIZES.map((sizeDef) => {
        const active = sizeDef.id === value;
        return (
          <button
            key={sizeDef.id}
            role="radio"
            aria-checked={active}
            aria-label={`${sizeDef.label}, dough ${formatPrice(sizeDef.basePrice)}`}
            onClick={() => onChange(sizeDef.id)}
            className={`relative min-h-11 rounded-xl px-3.5 transition-colors ${
              active ? "text-parchment" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="size-tab"
                className="absolute inset-0 rounded-xl bg-tomato"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative flex flex-col leading-tight">
              <span className="text-sm font-extrabold">{sizeDef.short}</span>
              <span className="text-[10px] font-bold opacity-80">
                {formatPrice(sizeDef.basePrice)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
