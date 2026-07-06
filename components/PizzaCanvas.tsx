"use client";

import { CSSProperties, RefObject } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import type { PlacedIngredient } from "@/types/pizza";
import { Z_INDEX, getIngredient } from "@/lib/ingredients";
import { IngredientVisual } from "./IngredientVisual";
import { LayerVisual } from "./PizzaVisuals";

interface PizzaCanvasProps {
  canvasRef: RefObject<HTMLDivElement>;
  ingredients: PlacedIngredient[];
  /** Visual scale of the selected size (Large = 1). */
  sizeScale: number;
  onMove: (instanceId: string, x: number, y: number) => void;
  onRemove: (instanceId: string) => void;
}

/**
 * The interactive pizza. A square, position-relative stage:
 * - full-pie "layer" ingredients (sauce/cheese/drizzle) render as overlays
 * - "topping" ingredients render at their stored relative x/y with their
 *   frozen random rotation, draggable to reposition, drag-off-pie to remove.
 * Strict stacking: base 10 → sauce 20 → cheese 30 → meats 40 → veggies 50 → drizzle 60.
 */
export default function PizzaCanvas({
  canvasRef,
  ingredients,
  sizeScale,
  onMove,
  onRemove,
}: PizzaCanvasProps) {
  const layers = ingredients.filter((i) => i.mode === "layer");
  const toppings = ingredients.filter((i) => i.mode === "topping");
  const isEmpty = ingredients.length === 0;

  return (
    <div
      ref={canvasRef}
      // Real width change (not a transform) so drag/drop math stays exact;
      // the CSS transition makes S→M→L feel like the dough is stretched.
      // `isolate` traps the internal z-stack (10-65) so toppings can never
      // paint over overlays like the mobile order view.
      className="relative isolate aspect-square w-[calc(min(88vw,50dvh,540px)*var(--pizza-scale))] select-none transition-[width] duration-300 ease-out md:w-[calc(min(46vw,72dvh,600px)*var(--pizza-scale))]"
      style={{ "--pizza-scale": sizeScale } as CSSProperties}
    >
      {/* Soft table shadow */}
      <div className="absolute inset-x-[8%] bottom-[2%] h-[8%] rounded-[50%] bg-ink/10 blur-xl" />

      {/* Crust */}
      <div
        className="absolute inset-0 rounded-full bg-crust shadow-warm"
        style={{ zIndex: Z_INDEX.base }}
      >
        {/* Dough */}
        <div className="absolute inset-[7%] rounded-full bg-dough shadow-[inset_0_4px_14px_rgba(62,46,35,0.12)]" />
      </div>

      {/* Full-pie layers */}
      <AnimatePresence>
        {layers.map((layer) => (
          <motion.div
            key={layer.instanceId}
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: Z_INDEX[layer.category] }}
            initial={{ scale: 0.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.55, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <LayerVisual ingredientId={layer.ingredientId} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Discrete toppings */}
      <AnimatePresence>
        {toppings.map((topping) => (
          <PlacedTopping
            key={topping.instanceId}
            item={topping}
            canvasRef={canvasRef}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>

      {/* Empty-state hint */}
      <AnimatePresence>
        {isEmpty && (
          <motion.p
            className="pointer-events-none absolute inset-0 z-[70] flex items-center justify-center px-[18%] text-center text-sm font-semibold text-ink-soft md:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            Drag an ingredient onto the dough to start your pizza
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlacedToppingProps {
  item: PlacedIngredient;
  canvasRef: RefObject<HTMLDivElement>;
  onMove: (instanceId: string, x: number, y: number) => void;
  onRemove: (instanceId: string) => void;
}

/**
 * One physical piece on the pie. It lands with an overshooting spring
 * (the "plop"), can be nudged around, and sliding it off the pizza
 * throws it away — taking something off should cost a deliberate gesture.
 */
function PlacedTopping({ item, canvasRef, onMove, onRemove }: PlacedToppingProps) {
  // Drag offsets live in motion values so we can read the final delta
  // and fold it back into the stored relative coordinates on release.
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const def = getIngredient(item.ingredientId);
  if (!def) return null;

  return (
    <motion.div
      className="absolute h-11 w-11 cursor-grab touch-none active:cursor-grabbing"
      style={{
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        zIndex: Z_INDEX[item.category],
        x: dragX,
        y: dragY,
      }}
      initial={{ scale: 1.9, opacity: 0, rotate: item.rotation }}
      animate={{ scale: 1, opacity: 1, rotate: item.rotation }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.25, zIndex: 65 }}
      onDragEnd={() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const relX = item.x + dragX.get() / rect.width;
        const relY = item.y + dragY.get() / rect.height;
        dragX.set(0);
        dragY.set(0);
        // Past the crust edge = tossed off the pizza.
        if (Math.hypot(relX - 0.5, relY - 0.5) > 0.48) {
          onRemove(item.instanceId);
        } else {
          onMove(item.instanceId, relX, relY);
        }
      }}
    >
      {/* Center the visual on the stored coordinate; framer owns the
          outer transform, so centering lives on this inner element. */}
      <div className="flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <IngredientVisual def={def} size={38} />
      </div>
    </motion.div>
  );
}
