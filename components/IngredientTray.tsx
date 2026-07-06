"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IngredientCategory, IngredientDef } from "@/types/pizza";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  INGREDIENTS,
  formatPrice,
} from "@/lib/ingredients";
import { IngredientVisual } from "./IngredientVisual";

export type DropHandler = (
  def: IngredientDef,
  point: { x: number; y: number }
) => boolean;

interface IngredientTrayProps {
  /** Called with page coordinates when a chip is released; returns true on a hit. */
  onDrop: DropHandler;
  /** Tap-to-add fallback (accessibility + speed): places near the center. */
  onQuickAdd: (def: IngredientDef) => void;
}

/**
 * The ingredient selector: category tabs + a grid of draggable chips.
 * Rendered inside the left panel (md+) and inside the bottom sheet (mobile).
 * Each tab holds at most five chips, so the grid never needs to scroll —
 * which means no overflow container ever clips a chip mid-drag.
 */
export default function IngredientTray({ onDrop, onQuickAdd }: IngredientTrayProps) {
  const [activeCategory, setActiveCategory] =
    useState<IngredientCategory>("sauce");

  const visible = INGREDIENTS.filter((i) => i.category === activeCategory);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="Ingredient categories"
        className="flex gap-1 rounded-2xl bg-ink/5 p-1"
      >
        {CATEGORY_ORDER.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              className={`relative min-h-11 flex-1 rounded-xl px-1 text-[13px] font-bold transition-colors ${
                active ? "text-parchment" : "text-ink-soft hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tray-tab"
                  className="absolute inset-0 rounded-xl bg-tomato"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{CATEGORY_LABELS[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Chips — overflow-visible on purpose: chips must fly out of the tray. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          className="grid grid-cols-2 content-start gap-2 overflow-visible md:grid-cols-1 lg:grid-cols-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {visible.map((def) => (
            <IngredientChip
              key={def.id}
              def={def}
              onDrop={onDrop}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <p className="mt-auto hidden pt-2 text-xs text-ink-soft md:block">
        Drag an ingredient onto the pizza — or tap it to add.
      </p>
    </div>
  );
}

function IngredientChip({
  def,
  onDrop,
  onQuickAdd,
}: {
  def: IngredientDef;
  onDrop: DropHandler;
  onQuickAdd: (def: IngredientDef) => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Add ${def.name}, ${formatPrice(def.price)}`}
      // touch-none is what keeps mobile from scrolling the page instead
      // of dragging the chip. Non-negotiable for touch drag.
      className="flex min-h-12 cursor-grab touch-none select-none items-center gap-2.5 rounded-2xl bg-parchment px-3 py-2 text-left shadow-chip ring-1 ring-ink/5 active:cursor-grabbing"
      drag
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.2}
      whileDrag={{ scale: 1.15, zIndex: 100, boxShadow: "0 12px 28px -8px rgba(62,46,35,0.35)" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onDragEnd={(_e, info) => {
        const hit = onDrop(def, info.point);
        if (hit && typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            /* haptics are a bonus, never an error */
          }
        }
      }}
      // Framer only fires onTap when the gesture never became a drag,
      // so tap-to-add and drag-to-place coexist on the same element.
      onTap={() => onQuickAdd(def)}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
        <IngredientVisual def={def} size={30} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold">{def.name}</span>
        <span className="text-xs font-semibold text-ink-soft">
          {formatPrice(def.price)}
        </span>
      </span>
    </motion.button>
  );
}
