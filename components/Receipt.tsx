"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CheckoutStatus } from "@/types/pizza";
import type { PizzaBuilderApi } from "@/hooks/usePizzaBuilder";
import { formatPrice, getSize } from "@/lib/ingredients";
import { AnimatedPrice } from "./AnimatedPrice";
import { MiniPizza } from "./PizzaVisuals";

interface ReceiptProps {
  builder: PizzaBuilderApi;
  status: CheckoutStatus;
  onCheckout: () => void;
}

/**
 * The dynamic receipt. The header holds a live MiniPizza between the title
 * and "Start over" — ingredients pop onto the thumbnail exactly as they
 * land on the canvas, so nothing has to hover over the real pizza to show
 * you what you built. Below: the current pizza's lines, the saved pizzas
 * of the order, and one grand total.
 */
export default function Receipt({ builder, status, onCheckout }: ReceiptProps) {
  const {
    selectedIngredients,
    receiptLines,
    size,
    currentBasePrice,
    currentCounts,
    currentPizzaNumber,
    savedPizzas,
    totalPrice,
    canCheckout,
    removeOne,
    clearCurrent,
    saveCurrentPizza,
    removeSavedPizza,
    editSavedPizza,
  } = builder;

  const sizeDef = getSize(size);
  const hasIngredients = selectedIngredients.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl bg-parchment p-5 shadow-warm ring-1 ring-ink/5">
      {/* Header: current pizza — live thumbnail — start over */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight">
            Pizza {currentPizzaNumber}
          </h2>
          <p className="text-xs font-semibold text-ink-soft">{sizeDef.label}</p>
        </div>

        <MiniPizza ingredients={selectedIngredients} size={56} />

        <button
          onClick={clearCurrent}
          disabled={!hasIngredients}
          className="min-h-11 rounded-lg px-2 text-xs font-bold text-ink-soft transition-colors hover:text-tomato disabled:opacity-40"
        >
          Start over
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {/* Current pizza lines */}
        {currentCounts ? (
          <ul>
            <li className="flex items-center justify-between border-b border-dashed border-ink/10 py-2.5 text-sm">
              <span className="font-semibold">{sizeDef.label} Dough</span>
              <span className="font-bold">{formatPrice(currentBasePrice)}</span>
            </li>

            <AnimatePresence initial={false}>
              {receiptLines.map((line) => (
                <motion.li
                  key={line.ingredientId}
                  layout
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 24, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="overflow-hidden border-b border-dashed border-ink/10 text-sm"
                >
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                      <span className="truncate">{line.name}</span>
                      {line.count > 1 && (
                        // Re-keying on count re-triggers the pop every time
                        // another one lands on the pie.
                        <motion.span
                          key={line.count}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          className="shrink-0 rounded-full bg-tomato/10 px-1.5 text-xs font-extrabold text-tomato"
                        >
                          ×{line.count}
                        </motion.span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-bold">{formatPrice(line.subtotal)}</span>
                      <button
                        aria-label={`Remove one ${line.name}`}
                        onClick={() => removeOne(line.ingredientId)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition-colors hover:bg-tomato hover:text-parchment"
                      >
                        −
                      </button>
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="border-b border-dashed border-ink/10 py-3 text-xs font-semibold text-ink-soft">
            A fresh dough is waiting — add an ingredient to put Pizza{" "}
            {currentPizzaNumber} in the order.
          </p>
        )}

        {/* Lock this pizza, start the next one */}
        <motion.button
          onClick={() => saveCurrentPizza()}
          disabled={!hasIngredients}
          whileTap={{ scale: 0.97 }}
          className="mt-3 min-h-11 w-full rounded-2xl border-2 border-dashed border-tomato/40 text-sm font-extrabold text-tomato transition-colors hover:border-tomato hover:bg-tomato/5 disabled:opacity-40"
        >
          ＋ Save &amp; start next pizza
        </motion.button>

        {/* Saved pizzas already in the order */}
        {savedPizzas.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
              In your order
            </h3>
            <AnimatePresence initial={false}>
              {savedPizzas.map((pizza, i) => (
                <motion.div
                  key={pizza.pizzaId}
                  layout
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 24, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="overflow-hidden border-b border-dashed border-ink/10"
                >
                  <div className="flex items-center gap-2.5 py-2">
                    {/* Tap the pizza to pull it back onto the canvas and edit. */}
                    <button
                      onClick={() => editSavedPizza(pizza.pizzaId)}
                      aria-label={`Edit pizza ${i + 1}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl text-left transition-colors hover:bg-ink/5"
                    >
                      <MiniPizza ingredients={pizza.ingredients} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          Pizza {i + 1} · {getSize(pizza.size).label}
                        </p>
                        <p className="text-xs font-semibold text-ink-soft">
                          {pizza.ingredients.length}{" "}
                          {pizza.ingredients.length === 1
                            ? "ingredient"
                            : "ingredients"}
                          <span className="ml-1 text-tomato">· Edit ✏️</span>
                        </p>
                      </div>
                    </button>
                    <span className="shrink-0 text-sm font-bold">
                      {formatPrice(pizza.price)}
                    </span>
                    <button
                      aria-label={`Remove pizza ${i + 1} from order`}
                      onClick={() => removeSavedPizza(pizza.pizzaId)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs text-ink-soft transition-colors hover:bg-tomato hover:text-parchment"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-sm font-bold text-ink-soft">
          Total
          {savedPizzas.length > 0 &&
            (() => {
              const count = savedPizzas.length + (currentCounts ? 1 : 0);
              return (
                <span className="font-semibold text-ink-soft/70">
                  {" "}
                  · {count} {count === 1 ? "pizza" : "pizzas"}
                </span>
              );
            })()}
        </span>
        <AnimatedPrice
          value={totalPrice}
          className="text-2xl font-extrabold tabular-nums"
        />
      </div>

      <motion.button
        onClick={onCheckout}
        disabled={status === "submitting" || !canCheckout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="mt-3 min-h-12 w-full rounded-2xl bg-tomato text-base font-extrabold text-parchment shadow-warm transition-colors hover:bg-tomato-deep disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Checkout"}
      </motion.button>

      <div aria-live="polite" className="min-h-5 pt-2 text-center text-xs font-bold">
        {status === "success" && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-700"
          >
            Added to cart 🛒 — 10 min to cancel.
          </motion.span>
        )}
        {status === "error" && (
          <span className="text-tomato">
            Couldn&apos;t send the order. Please try again.
          </span>
        )}
      </div>
    </div>
  );
}
