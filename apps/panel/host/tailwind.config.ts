import type { Config } from "tailwindcss";
import { paapeliPreset } from "@paapeli/brand/preset";

// Absolute content paths (relative to this config) so Tailwind scans the
// right files regardless of CWD.
const dir = __dirname.replace(/\\/g, "/");

/* Colors, radius, fonts and animations come from the shared preset. */
export default {
  presets: [paapeliPreset],
  content: [`${dir}/index.html`, `${dir}/src/**/*.{ts,tsx}`],
} satisfies Config;
