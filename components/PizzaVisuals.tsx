"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PlacedIngredient } from "@/types/pizza";
import { Z_INDEX, getIngredient } from "@/lib/ingredients";
import { IngredientVisual } from "./IngredientVisual";

/**
 * Shared pizza painting: how each full-pie layer draws itself, plus the
 * MiniPizza used by the receipt. The big interactive canvas and the tiny
 * receipt preview must always look like the same pizza.
 */

/** Blob radii keep the layer edges organic, not machine-cut. */
export function LayerVisual({ ingredientId }: { ingredientId: string }) {
  switch (ingredientId) {
    case "tomato-sauce":
      return (
        <div
          className="absolute inset-[11%] opacity-95"
          style={{
            background: "radial-gradient(circle at 45% 40%, #E0532F 0%, #C23F20 85%)",
            borderRadius: "48% 52% 50% 50% / 51% 49% 52% 48%",
          }}
        />
      );
    case "white-sauce":
      return (
        <div
          className="absolute inset-[11%] opacity-95"
          style={{
            background: "radial-gradient(circle at 45% 40%, #F6EEDC 0%, #EBDCC0 85%)",
            borderRadius: "50% 50% 48% 52% / 49% 51% 50% 50%",
          }}
        />
      );
    case "mozzarella":
      return (
        <div
          className="absolute inset-[13%] opacity-90"
          style={{
            background: "radial-gradient(circle at 50% 45%, #FADF7C 0%, #F3C94E 90%)",
            borderRadius: "52% 48% 50% 50% / 50% 50% 47% 53%",
          }}
        />
      );
    case "hot-honey":
      return <DrizzleSwirl color="#E8A13C" />;
    case "ranch":
      return <DrizzleSwirl color="#F7F3E8" />;
    default: {
      // Unknown layer — fall back to its chip emoji, centered.
      const def = getIngredient(ingredientId);
      return def ? (
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          {def.emoji}
        </div>
      ) : null;
    }
  }
}

export function DrizzleSwirl({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-[14%] h-[72%] w-[72%]">
      <path
        d="M14,28 Q30,17 46,28 T78,28 M10,50 Q28,38 47,50 T88,50 M16,72 Q32,60 50,72 T82,72"
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * A live, non-interactive thumbnail of a pizza. Ingredients pop in and out
 * in sync with the canvas — the receipt shows the pizza, not just the bill.
 * `isolate` keeps the internal z-index stack from fighting the receipt UI.
 */
export function MiniPizza({
  ingredients,
  size = 56,
}: {
  ingredients: PlacedIngredient[];
  size?: number;
}) {
  const layers = ingredients.filter((i) => i.mode === "layer");
  const toppings = ingredients.filter((i) => i.mode === "topping");

  return (
    <div
      aria-hidden
      className="relative isolate shrink-0 rounded-full bg-crust shadow-chip"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-[8%] rounded-full bg-dough" />

      <AnimatePresence>
        {layers.map((layer) => (
          <motion.div
            key={layer.instanceId}
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: Z_INDEX[layer.category] }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <LayerVisual ingredientId={layer.ingredientId} />
          </motion.div>
        ))}

        {toppings.map((topping) => {
          const def = getIngredient(topping.ingredientId);
          if (!def) return null;
          return (
            <motion.span
              key={topping.instanceId}
              className="pointer-events-none absolute"
              style={{
                left: `${topping.x * 100}%`,
                top: `${topping.y * 100}%`,
                zIndex: Z_INDEX[topping.category],
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  transform: `translate(-50%, -50%) rotate(${topping.rotation}deg)`,
                }}
              >
                <IngredientVisual def={def} size={size * 0.22} />
              </span>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
