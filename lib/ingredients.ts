import type {
  IngredientCategory,
  IngredientDef,
  PizzaSize,
  SizeDef,
} from "@/types/pizza";

/** MVP flat pricing: every ingredient costs exactly 1 GEL. */
export const INGREDIENT_PRICE = 1;
export const CURRENCY_SYMBOL = "₾";

/** Pizza sizes: the dough price scales with the pie. */
export const SIZES: SizeDef[] = [
  { id: "small", label: "Small", short: "S", basePrice: 5, scale: 0.76 },
  { id: "medium", label: "Medium", short: "M", basePrice: 7, scale: 0.88 },
  { id: "large", label: "Large", short: "L", basePrice: 9, scale: 1 },
];

export function getSize(id: PizzaSize): SizeDef {
  // SIZES covers every PizzaSize, so the lookup can't miss.
  return SIZES.find((s) => s.id === id) ?? SIZES[1];
}

/**
 * Strict stacking order. Nothing renders outside this system —
 * a drizzle can never end up underneath an olive.
 */
export const Z_INDEX: Record<"base" | IngredientCategory, number> = {
  base: 10,
  sauce: 20,
  cheese: 30,
  meat: 40, // flat meats
  veggie: 50, // bulky veggies (olives, mushrooms…)
  drizzle: 60,
};

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  sauce: "Sauce",
  cheese: "Cheese",
  meat: "Meats",
  veggie: "Veggies",
  drizzle: "Drizzle",
};

export const CATEGORY_ORDER: IngredientCategory[] = [
  "sauce",
  "cheese",
  "meat",
  "veggie",
  "drizzle",
];

export const INGREDIENTS: IngredientDef[] = [
  // Sauces — one at a time; picking a new one swaps it.
  { id: "tomato-sauce", name: "Tomato Sauce", category: "sauce", mode: "layer", price: INGREDIENT_PRICE, emoji: "🍅" },
  { id: "white-sauce", name: "White Sauce", category: "sauce", mode: "layer", price: INGREDIENT_PRICE, emoji: "🥛" },
  // Cheese
  { id: "mozzarella", name: "Mozzarella", category: "cheese", mode: "layer", price: INGREDIENT_PRICE, emoji: "🧀" },
  // Flat meats
  { id: "pepperoni", name: "Pepperoni", category: "meat", mode: "topping", price: INGREDIENT_PRICE, emoji: "🔴" },
  { id: "bacon", name: "Bacon", category: "meat", mode: "topping", price: INGREDIENT_PRICE, emoji: "🥓" },
  { id: "ham", name: "Ham", category: "meat", mode: "topping", price: INGREDIENT_PRICE, emoji: "🍖" },
  // Bulky veggies
  { id: "olive", name: "Olives", category: "veggie", mode: "topping", price: INGREDIENT_PRICE, emoji: "🫒" },
  { id: "mushroom", name: "Mushrooms", category: "veggie", mode: "topping", price: INGREDIENT_PRICE, emoji: "🍄" },
  { id: "bell-pepper", name: "Bell Pepper", category: "veggie", mode: "topping", price: INGREDIENT_PRICE, emoji: "🫑" },
  { id: "red-onion", name: "Red Onion", category: "veggie", mode: "topping", price: INGREDIENT_PRICE, emoji: "🧅" },
  { id: "basil", name: "Basil", category: "veggie", mode: "topping", price: INGREDIENT_PRICE, emoji: "🌿" },
  // Drizzles
  { id: "hot-honey", name: "Hot Honey", category: "drizzle", mode: "layer", price: INGREDIENT_PRICE, emoji: "🍯" },
  { id: "ranch", name: "Ranch Drizzle", category: "drizzle", mode: "layer", price: INGREDIENT_PRICE, emoji: "💧" },
];

export function getIngredient(id: string): IngredientDef | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}

export function formatPrice(amount: number): string {
  return `${amount} ${CURRENCY_SYMBOL}`;
}
