"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  IngredientDef,
  OrderPayload,
  PizzaSize,
  PlacedIngredient,
  ReceiptLine,
  SavedPizza,
} from "@/types/pizza";
import { INGREDIENT_PRICE, getSize } from "@/lib/ingredients";

/** Toppings must land inside the sauce area — 0.36 canvas-widths from center. */
const MAX_TOPPING_RADIUS = 0.36;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${performance.now().toFixed(0)}`;
}

/** -15..15 degrees so every drop looks hand-placed, never machine-aligned. */
function randomRotation(): number {
  return Math.round(Math.random() * 30 - 15);
}

/**
 * If a topping is dropped on the crust or just off the pie, pull it back
 * to the nearest point inside the edible zone — the "snap" half of the
 * tactile feedback loop.
 */
function clampToPizza(x: number, y: number): { x: number; y: number } {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const dist = Math.hypot(dx, dy);
  if (dist <= MAX_TOPPING_RADIUS) return { x, y };
  const scale = MAX_TOPPING_RADIUS / dist;
  return { x: 0.5 + dx * scale, y: 0.5 + dy * scale };
}

export interface PizzaBuilderApi {
  /** The pizza currently on the canvas. */
  selectedIngredients: PlacedIngredient[];
  receiptLines: ReceiptLine[];
  size: PizzaSize;
  setSize: (size: PizzaSize) => void;
  /** Dough price of the current size. */
  currentBasePrice: number;
  /** Current pizza: dough + ingredients. */
  currentPrice: number;
  /**
   * Whether the current pizza participates in the order total. An untouched
   * dough right after "save & next" shouldn't inflate the bill.
   */
  currentCounts: boolean;
  /** 1-based position of the pizza being built. */
  currentPizzaNumber: number;
  /** Finished pizzas waiting in the order. */
  savedPizzas: SavedPizza[];
  /** Grand total across saved pizzas + the current one (when it counts). */
  totalPrice: number;
  /** Returns true if the drop resulted in a change (drives haptics/pulse). */
  addIngredient: (def: IngredientDef, x: number, y: number) => boolean;
  removeInstance: (instanceId: string) => void;
  /** Removes the most recently placed instance of an ingredient (receipt "−"). */
  removeOne: (ingredientId: string) => void;
  moveInstance: (instanceId: string, x: number, y: number) => void;
  /** Clears the canvas ("Start over" — current pizza only). */
  clearCurrent: () => void;
  /** Locks the current pizza into the order and starts a fresh dough. */
  saveCurrentPizza: () => boolean;
  removeSavedPizza: (pizzaId: string) => void;
  /** Wipes the whole order (after a successful checkout). */
  resetOrder: () => void;
  buildOrderPayload: () => OrderPayload;
}

export function usePizzaBuilder(): PizzaBuilderApi {
  const [selectedIngredients, setSelectedIngredients] = useState<
    PlacedIngredient[]
  >([]);
  const [size, setSize] = useState<PizzaSize>("medium");
  const [savedPizzas, setSavedPizzas] = useState<SavedPizza[]>([]);

  const addIngredient = useCallback(
    (def: IngredientDef, x: number, y: number): boolean => {
      let changed = false;
      setSelectedIngredients((prev) => {
        if (def.mode === "layer") {
          // Same layer twice is a no-op…
          if (prev.some((p) => p.ingredientId === def.id)) return prev;
          changed = true;
          const placed: PlacedIngredient = {
            instanceId: makeId(),
            ingredientId: def.id,
            name: def.name,
            category: def.category,
            mode: def.mode,
            price: def.price,
            x: 0.5,
            y: 0.5,
            rotation: 0,
          };
          // …but a second sauce or cheese swaps out the old one.
          if (def.category === "sauce" || def.category === "cheese") {
            return [...prev.filter((p) => p.category !== def.category), placed];
          }
          return [...prev, placed];
        }

        changed = true;
        const { x: cx, y: cy } = clampToPizza(x, y);
        return [
          ...prev,
          {
            instanceId: makeId(),
            ingredientId: def.id,
            name: def.name,
            category: def.category,
            mode: def.mode,
            price: def.price,
            x: cx,
            y: cy,
            rotation: randomRotation(),
          },
        ];
      });
      return changed;
    },
    []
  );

  const removeInstance = useCallback((instanceId: string) => {
    setSelectedIngredients((prev) =>
      prev.filter((p) => p.instanceId !== instanceId)
    );
  }, []);

  const removeOne = useCallback((ingredientId: string) => {
    setSelectedIngredients((prev) => {
      const lastIndex = prev
        .map((p) => p.ingredientId)
        .lastIndexOf(ingredientId);
      if (lastIndex === -1) return prev;
      return prev.filter((_, i) => i !== lastIndex);
    });
  }, []);

  const moveInstance = useCallback(
    (instanceId: string, x: number, y: number) => {
      const { x: cx, y: cy } = clampToPizza(x, y);
      setSelectedIngredients((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId ? { ...p, x: cx, y: cy } : p
        )
      );
    },
    []
  );

  const clearCurrent = useCallback(() => setSelectedIngredients([]), []);

  const currentBasePrice = getSize(size).basePrice;

  /** MVP pricing engine: size base + 1 GEL per placed ingredient. */
  const currentPrice = useMemo(
    () => currentBasePrice + selectedIngredients.length * INGREDIENT_PRICE,
    [currentBasePrice, selectedIngredients]
  );

  const currentCounts =
    savedPizzas.length === 0 || selectedIngredients.length > 0;

  const totalPrice = useMemo(
    () =>
      savedPizzas.reduce((sum, p) => sum + p.price, 0) +
      (currentCounts ? currentPrice : 0),
    [savedPizzas, currentCounts, currentPrice]
  );

  const saveCurrentPizza = useCallback((): boolean => {
    if (selectedIngredients.length === 0) return false;
    setSavedPizzas((prev) => [
      ...prev,
      {
        pizzaId: makeId(),
        size,
        basePrice: currentBasePrice,
        ingredients: selectedIngredients,
        price: currentPrice,
      },
    ]);
    setSelectedIngredients([]);
    return true;
  }, [selectedIngredients, size, currentBasePrice, currentPrice]);

  const removeSavedPizza = useCallback((pizzaId: string) => {
    setSavedPizzas((prev) => prev.filter((p) => p.pizzaId !== pizzaId));
  }, []);

  const resetOrder = useCallback(() => {
    setSavedPizzas([]);
    setSelectedIngredients([]);
  }, []);

  /** Receipt lines for the CURRENT pizza, grouped by ingredient. */
  const receiptLines = useMemo<ReceiptLine[]>(() => {
    const lines = new Map<string, ReceiptLine>();
    for (const p of selectedIngredients) {
      const line = lines.get(p.ingredientId);
      if (line) {
        line.count += 1;
        line.subtotal += p.price;
      } else {
        lines.set(p.ingredientId, {
          ingredientId: p.ingredientId,
          name: p.name,
          count: 1,
          unitPrice: p.price,
          subtotal: p.price,
        });
      }
    }
    return Array.from(lines.values());
  }, [selectedIngredients]);

  const buildOrderPayload = useCallback((): OrderPayload => {
    const pizzas: SavedPizza[] = [
      ...savedPizzas,
      ...(currentCounts
        ? [
            {
              pizzaId: makeId(),
              size,
              basePrice: currentBasePrice,
              ingredients: selectedIngredients,
              price: currentPrice,
            },
          ]
        : []),
    ];
    return {
      pizzas,
      totalPrice,
      currency: "GEL",
      createdAt: new Date().toISOString(),
    };
  }, [
    savedPizzas,
    currentCounts,
    size,
    currentBasePrice,
    selectedIngredients,
    currentPrice,
    totalPrice,
  ]);

  return {
    selectedIngredients,
    receiptLines,
    size,
    setSize,
    currentBasePrice,
    currentPrice,
    currentCounts,
    currentPizzaNumber: savedPizzas.length + 1,
    savedPizzas,
    totalPrice,
    addIngredient,
    removeInstance,
    removeOne,
    moveInstance,
    clearCurrent,
    saveCurrentPizza,
    removeSavedPizza,
    resetOrder,
    buildOrderPayload,
  };
}
