import type { Config } from "tailwindcss";
import { paapeliPreset } from "@paapeli/brand/preset";

// Absolute content paths (relative to this config) so Tailwind scans the
// right files regardless of CWD (standalone or embedded in the host).
const dir = __dirname.replace(/\\/g, "/");

/* Theme (colors, radius, fonts, animations) comes from the shared preset. */
export default {
  presets: [paapeliPreset],
  darkMode: ["class"],
  content: [
    `${dir}/pages/**/*.{ts,tsx}`,
    `${dir}/components/**/*.{ts,tsx}`,
    `${dir}/app/**/*.{ts,tsx}`,
    `${dir}/src/**/*.{ts,tsx}`,
  ],
  prefix: "",
} satisfies Config;
