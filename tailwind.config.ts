import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E7",
        parchment: "#FFF9F0",
        ink: "#3E2E23",
        "ink-soft": "#8A7566",
        tomato: "#E0532F",
        "tomato-deep": "#C23F20",
        crust: "#E8A94B",
        dough: "#F6D998",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        warm: "0 10px 30px -12px rgba(62, 46, 35, 0.18)",
        chip: "0 2px 8px -2px rgba(62, 46, 35, 0.15)",
        sheet: "0 -10px 40px -12px rgba(62, 46, 35, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
