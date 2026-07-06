# 🍕 PizzaCraft

An interactive build-your-own-pizza app. Pick a size, drag ingredients onto the dough, save the pizza and start the next one — the whole order checks out to Firestore at once.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Firebase

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Firebase is optional — without `.env.local` the checkout logs the typed order payload to the browser console instead of writing to Firestore. To go live, copy `.env.local.example` to `.env.local` and fill in your Firebase web-app credentials (orders land in the `orders` collection).

## How it's put together

| Piece | File | Notes |
| --- | --- | --- |
| Domain types | `types/pizza.ts` | `IngredientDef`, `PlacedIngredient`, `OrderPayload` — the Firestore contract |
| Catalog + pricing constants | `lib/ingredients.ts` | Flat MVP pricing: every ingredient 1 ₾; dough by size — S 5 ₾ / M 7 ₾ / L 9 ₾. Z-index stacking map lives here |
| State + pricing engine | `hooks/usePizzaBuilder.ts` | Per-pizza `useMemo` price: `sizeBase + count × 1`; grand total sums saved pizzas + the one on the canvas. Save/remove pizzas, receipt grouping, payload builder |
| Shared pizza painting | `components/PizzaVisuals.tsx` | Layer visuals + `MiniPizza`, the live thumbnail in the receipt |
| Interactive canvas | `components/PizzaCanvas.tsx` | Relative 0..1 coordinates, random −15°..15° rotation, drag-off-pie to remove |
| Ingredient tray | `components/IngredientTray.tsx` | Draggable chips (`touch-none` for mobile), tap-to-add fallback |
| Receipt | `components/Receipt.tsx` | AnimatePresence line items, spring-ticking total |
| Mobile drawer | `components/BottomSheet.tsx` | Swipeable snap points, handle-only drag |
| Shell / layout | `components/PizzaBuilder.tsx` | 1-col mobile → 2-col tablet → 3-col desktop |

### Design decisions worth knowing

- **Stacking is law:** base 10 → sauce 20 → cheese 30 → meats 40 → veggies 50 → drizzle 60. A drizzle can never render under an olive.
- **Layers vs toppings:** sauces/cheese/drizzles cover the whole pie (one each; a second sauce swaps the first). Toppings are discrete pieces stored at their drop point.
- **Coordinates are relative** (0..1), so a pizza built on a phone re-renders identically on a desktop.
- **Removal costs a gesture** — slide a topping off the pie, or use the − button on its receipt line. Ownership should be easy to build and deliberate to undo.
