import type { Config } from "tailwindcss";
import { paapeliPreset } from "@paapeli/brand/preset";

/* Theme (colors, radius, fonts, animations) comes from the shared      */
/* Paapeli preset — the single source of truth. This file only declares */
/* this app's content sources. Design output is unchanged.              */
export default {
  presets: [paapeliPreset],
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
} satisfies Config;
