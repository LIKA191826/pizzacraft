/**
 * Core domain types for PizzaCraft.
 * Everything the UI renders and everything Firestore receives flows
 * through these interfaces — keep them the single source of truth.
 */

export type IngredientCategory =
  | "sauce"
  | "cheese"
  | "meat"
  | "veggie"
  | "drizzle";

/**
 * How an ingredient applies to the pizza:
 * - "layer": covers the whole pie (sauce, cheese, drizzle). One per id.
 * - "topping": a discrete piece placed at the drop coordinates.
 */
export type ApplicationMode = "layer" | "topping";

export type PizzaSize = "small" | "medium" | "large";

/** A pizza size option: its own base (dough) price and visual scale. */
export interface SizeDef {
  id: PizzaSize;
  label: string;
  /** Short form for the segmented control. */
  short: string;
  /** Dough price in GEL — replaces the old flat base price. */
  basePrice: number;
  /** Visual scale of the canvas relative to Large (1). */
  scale: number;
}

/** A catalog entry — what the tray offers. */
export interface IngredientDef {
  id: string;
  name: string;
  category: IngredientCategory;
  mode: ApplicationMode;
  /** Flat MVP price in GEL. */
  price: number;
  /** Emoji used for the tray chip and (for toppings) the on-pizza visual. */
  emoji: string;
}

/**
 * An ingredient the user has placed on the pizza.
 * x/y are RELATIVE coordinates (0..1) against the square canvas so the
 * composition survives any resize, size change, or breakpoint change.
 */
export interface PlacedIngredient {
  /** Unique per placement — one pizza can hold three pepperonis. */
  instanceId: string;
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  mode: ApplicationMode;
  price: number;
  /** 0..1, relative to canvas width. Layers ignore this (rendered full-pie). */
  x: number;
  /** 0..1, relative to canvas height. */
  y: number;
  /** Degrees, randomised -15..15 at drop time for the hand-made look. */
  rotation: number;
}

/** One line of the receipt: placements grouped by ingredient. */
export interface ReceiptLine {
  ingredientId: string;
  name: string;
  count: number;
  unitPrice: number;
  subtotal: number;
}

/** A finished pizza in the order — also the shape Firestore receives. */
export interface SavedPizza {
  pizzaId: string;
  size: PizzaSize;
  basePrice: number;
  ingredients: PlacedIngredient[];
  /** basePrice + ingredients.length × ingredient price. */
  price: number;
}

/** The exact payload pushed to Firestore on checkout. */
export interface OrderPayload {
  pizzas: SavedPizza[];
  totalPrice: number;
  currency: "GEL";
  createdAt: string; // ISO-8601
}

export type CheckoutStatus = "idle" | "submitting" | "success" | "error";

export interface SubmitResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}
