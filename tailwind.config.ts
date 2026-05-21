import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        green: "var(--green)",
        pink: "var(--pink)",
        blue: "var(--blue)",
        gold: "var(--gold)",
        coral: "var(--coral)"
      },
      borderRadius: {
        werkles: "var(--radius)"
      },
      boxShadow: {
        werkles: "var(--shadow)"
      }
    }
  },
  plugins: []
};

export default config;
