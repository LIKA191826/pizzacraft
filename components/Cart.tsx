"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CartOrder } from "@/types/pizza";
import { CANCEL_WINDOW_MS } from "@/hooks/usePizzaBuilder";
import { formatPrice, getSize } from "@/lib/ingredients";
import { MiniPizza } from "./PizzaVisuals";

interface CartProps {
  open: boolean;
  orders: CartOrder[];
  onClose: () => void;
  onCancel: (orderId: string) => void;
}

/** mm:ss left in the cancellation window, clamped at zero. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The cart: a separate overlay of placed orders. Each order can be cancelled
 * only within CANCEL_WINDOW_MS (10 min) of being placed — a live countdown
 * ticks down and, once it hits zero, the order locks in as confirmed.
 */
export default function Cart({ open, orders, onClose, onCancel }: CartProps) {
  // A once-a-second clock so every countdown re-renders while the cart is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end bg-ink/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className="flex h-full w-full max-w-md flex-col bg-cream p-5 shadow-sheet"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">
                🛒 Cart
                {orders.length > 0 && (
                  <span className="ml-2 text-sm font-bold text-ink-soft">
                    {orders.length}{" "}
                    {orders.length === 1 ? "order" : "orders"}
                  </span>
                )}
              </h2>
              <button
                aria-label="Close cart"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment text-lg shadow-chip ring-1 ring-ink/5"
              >
                ✕
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="mb-2 text-4xl">🍕</span>
                <p className="font-bold text-ink-soft">Your cart is empty</p>
                <p className="text-sm text-ink-soft/80">
                  Build a pizza and hit Checkout to place an order.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {orders.map((order, i) => {
                    const remaining =
                      CANCEL_WINDOW_MS - (now - order.placedAt);
                    const cancellable = remaining > 0;
                    const pizzaCount = order.pizzas.length;
                    return (
                      <motion.li
                        key={order.orderId}
                        layout
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="rounded-2xl bg-parchment p-4 shadow-chip ring-1 ring-ink/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold">
                            Order #{orders.length - i}
                          </span>
                          <span className="text-lg font-extrabold tabular-nums">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </div>
                        <p className="mb-2 text-xs font-semibold text-ink-soft">
                          {pizzaCount} {pizzaCount === 1 ? "pizza" : "pizzas"}
                        </p>

                        {/* Thumbnails of every pizza in the order */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          {order.pizzas.map((pizza) => (
                            <div
                              key={pizza.pizzaId}
                              className="flex flex-col items-center gap-1"
                            >
                              <MiniPizza ingredients={pizza.ingredients} size={44} />
                              <span className="text-[10px] font-bold text-ink-soft">
                                {getSize(pizza.size).short}
                              </span>
                            </div>
                          ))}
                        </div>

                        {cancellable ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ink-soft">
                              Cancel window:{" "}
                              <span className="tabular-nums text-tomato">
                                {formatRemaining(remaining)}
                              </span>
                            </span>
                            <button
                              onClick={() => onCancel(order.orderId)}
                              className="min-h-10 rounded-xl bg-tomato/10 px-3 text-sm font-extrabold text-tomato transition-colors hover:bg-tomato hover:text-parchment"
                            >
                              Cancel order
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-700">
                            <span>✓</span>
                            <span>Confirmed — in the oven</span>
                          </div>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
