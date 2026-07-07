"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  CartOrder,
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

/** How long after placing an order it can still be cancelled. */
export const CANCEL_WINDOW_MS = 10 * 60 * 1000;

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

/** Price of a pizza from its size + ingredient count. */
function priceOf(size: PizzaSize, count: number): number {
  return getSize(size).basePrice + count * INGREDIENT_PRICE;
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
  /** Finished pizzas waiting in the current order. */
  savedPizzas: SavedPizza[];
  /** Grand total across saved pizzas + the current one (when it counts). */
  totalPrice: number;
  /** True when there's something worth checking out. */
  canCheckout: boolean;
  /** Placed orders sitting in the cart. */
  cart: CartOrder[];
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
  /** Pulls a saved pizza back onto the canvas to edit it. */
  editSavedPizza: (pizzaId: string) => void;
  /** Moves the whole current order into the cart. Returns it, or null. */
  placeOrder: () => CartOrder | null;
  /** Cancels a cart order — only within CANCEL_WINDOW_MS of placing it. */
  cancelCartOrder: (orderId: string) => void;
  buildOrderPayload: () => OrderPayload;
}

export function usePizzaBuilder(): PizzaBuilderApi {
  const [selectedIngredients, setSelectedIngredients] = useState<
    PlacedIngredient[]
  >([]);
  const [size, setSize] = useState<PizzaSize>("medium");
  const [savedPizzas, setSavedPizzas] = useState<SavedPizza[]>([]);
  const [cart, setCart] = useState<CartOrder[]>([]);

  const addIngredient = useCallback(
    (def: IngredientDef, x: number, y: number): boolean => {
      let changed = false;
      setSelectedIngredients((prev) => {
        if (def.mode === "layer") {
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

          // Sauce toggles: tapping the sauce that's already on takes it off,
          // tapping again puts it back — on/off/on/off…
          if (def.category === "sauce") {
            changed = true;
            if (prev.some((p) => p.ingredientId === def.id)) {
              return prev.filter((p) => p.ingredientId !== def.id);
            }
            // A different sauce simply replaces the current one.
            return [...prev.filter((p) => p.category !== "sauce"), placed];
          }

          // Drizzles toggle the same way, but stack independently — you can
          // have hot honey and ranch at once; each tap adds or removes its own.
          if (def.category === "drizzle") {
            changed = true;
            if (prev.some((p) => p.ingredientId === def.id)) {
              return prev.filter((p) => p.ingredientId !== def.id);
            }
            return [...prev, placed];
          }

          // Other layers: same id is a no-op…
          if (prev.some((p) => p.ingredientId === def.id)) return prev;
          changed = true;
          // …cheese still swaps within its category.
          if (def.category === "cheese") {
            return [...prev.filter((p) => p.category !== "cheese"), placed];
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

  const canCheckout =
    savedPizzas.length > 0 || selectedIngredients.length > 0;

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

  /**
   * Re-open a saved pizza on the canvas. If the canvas already holds an
   * unsaved pizza, it's parked into the order first so nothing is lost.
   */
  const editSavedPizza = useCallback(
    (pizzaId: string) => {
      const target = savedPizzas.find((p) => p.pizzaId === pizzaId);
      if (!target) return;
      setSavedPizzas((prev) => {
        const without = prev.filter((p) => p.pizzaId !== pizzaId);
        if (selectedIngredients.length > 0) {
          return [
            ...without,
            {
              pizzaId: makeId(),
              size,
              basePrice: getSize(size).basePrice,
              ingredients: selectedIngredients,
              price: priceOf(size, selectedIngredients.length),
            },
          ];
        }
        return without;
      });
      setSelectedIngredients(target.ingredients);
      setSize(target.size);
    },
    [savedPizzas, selectedIngredients, size]
  );

  /** Snapshot of every pizza in the current order (saved + on-canvas). */
  const collectPizzas = useCallback((): SavedPizza[] => {
    return [
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
  }, [
    savedPizzas,
    currentCounts,
    size,
    currentBasePrice,
    selectedIngredients,
    currentPrice,
  ]);

  const placeOrder = useCallback((): CartOrder | null => {
    if (!canCheckout) return null;
    const order: CartOrder = {
      orderId: makeId(),
      pizzas: collectPizzas(),
      totalPrice,
      placedAt: Date.now(),
    };
    setCart((prev) => [order, ...prev]);
    // Start a clean order for the next round.
    setSavedPizzas([]);
    setSelectedIngredients([]);
    return order;
  }, [canCheckout, collectPizzas, totalPrice]);

  const cancelCartOrder = useCallback((orderId: string) => {
    setCart((prev) =>
      prev.filter(
        (o) =>
          // Keep everything except the matching order still inside its window.
          !(o.orderId === orderId && Date.now() - o.placedAt < CANCEL_WINDOW_MS)
      )
    );
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

  const buildOrderPayload = useCallback(
    (): OrderPayload => ({
      pizzas: collectPizzas(),
      totalPrice,
      currency: "GEL",
      createdAt: new Date().toISOString(),
    }),
    [collectPizzas, totalPrice]
  );

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
    canCheckout,
    cart,
    addIngredient,
    removeInstance,
    removeOne,
    moveInstance,
    clearCurrent,
    saveCurrentPizza,
    removeSavedPizza,
    editSavedPizza,
    placeOrder,
    cancelCartOrder,
    buildOrderPayload,
  };
}
