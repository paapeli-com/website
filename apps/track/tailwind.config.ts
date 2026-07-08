import type { Config } from "tailwindcss";
import { paapeliPreset } from "@paapeli/brand/preset";

/* Colors, radius, fonts and animations come from the shared preset so  */
/* every product stays visually identical. This file only declares the  */
/* content sources for this app.                                        */
export default {
  presets: [paapeliPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
} satisfies Config;
