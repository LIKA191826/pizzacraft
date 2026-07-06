import type { IngredientDef } from "@/types/pizza";

/**
 * The visual identity of an ingredient, shared between the tray chip and
 * the on-pizza topping. Pepperoni gets a hand-drawn SVG (there is no
 * pepperoni emoji, and a red dot has no soul); everything else is emoji.
 */
export function IngredientVisual({
  def,
  size = 32,
}: {
  def: IngredientDef;
  size?: number;
}) {
  if (def.id === "pepperoni") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        aria-hidden
        className="drop-shadow-sm"
      >
        <circle cx="20" cy="20" r="18" fill="#C4402F" stroke="#9E2F22" strokeWidth="2.5" />
        <circle cx="14" cy="15" r="2.2" fill="#A83326" />
        <circle cx="26" cy="13" r="1.8" fill="#A83326" />
        <circle cx="22" cy="24" r="2.6" fill="#A83326" />
        <circle cx="13" cy="26" r="1.6" fill="#A83326" />
        <circle cx="28" cy="27" r="1.9" fill="#A83326" />
      </svg>
    );
  }

  if (def.id === "white-sauce") {
    return (
      <span
        aria-hidden
        className="inline-block rounded-full border border-ink/10 bg-[#F2E8D5] shadow-inner"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
    );
  }

  if (def.id === "ranch") {
    return (
      <span
        aria-hidden
        className="inline-block rounded-full border border-ink/10 bg-[#F7F3E8] shadow-inner"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-block select-none leading-none"
      style={{ fontSize: size * 0.85 }}
    >
      {def.emoji}
    </span>
  );
}
