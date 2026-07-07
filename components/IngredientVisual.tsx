import type { IngredientDef } from "@/types/pizza";

/**
 * The visual identity of an ingredient, shared between the tray chip and
 * the on-pizza topping. Pepperoni, diced onion, and diced bell pepper get
 * hand-drawn SVGs (their emoji show a whole, uncut vegetable); everything
 * else is emoji.
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

  if (def.id === "red-onion") {
    // Diced red onion — scattered purple slivers with pale inner layers.
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="drop-shadow-sm">
        <g fill="none" strokeLinecap="round">
          <path d="M8 15 Q12 9 18 12" stroke="#9B5FB5" strokeWidth="3.4" />
          <path d="M8.7 15.4 Q12.2 10.4 17.2 12.6" stroke="#EBDCF2" strokeWidth="1.1" />
          <path d="M24 9 Q30 12 29 18" stroke="#B07AC8" strokeWidth="3.4" />
          <path d="M24.5 9.8 Q29 12.3 28.4 17" stroke="#EBDCF2" strokeWidth="1.1" />
          <path d="M9 27 Q13 21 20 24" stroke="#8E52A8" strokeWidth="3.4" />
          <path d="M9.7 27.2 Q13.3 22 18.9 24.2" stroke="#EBDCF2" strokeWidth="1.1" />
          <path d="M23 28 Q30 26 31 31" stroke="#A96FC0" strokeWidth="3.4" />
        </g>
      </svg>
    );
  }

  if (def.id === "bell-pepper") {
    // Diced bell pepper — small green chunks in a couple of shades.
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="drop-shadow-sm">
        <g stroke="#3F7A28" strokeWidth="0.8">
          <rect x="8" y="10" width="9" height="7.5" rx="2.5" fill="#5FA83F" transform="rotate(-12 12.5 13.7)" />
          <rect x="22" y="9" width="8" height="8" rx="2.5" fill="#72C24C" transform="rotate(10 26 13)" />
          <rect x="10" y="22" width="8" height="7" rx="2.5" fill="#68B444" transform="rotate(8 14 25.5)" />
          <rect x="22" y="23" width="9" height="7" rx="2.5" fill="#579C38" transform="rotate(-9 26.5 26.5)" />
        </g>
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
