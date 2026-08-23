import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";

// Point Tailwind at THIS app's config explicitly so it resolves correctly
// regardless of CWD.
const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [tailwindcss(path.join(dir, "tailwind.config.ts")), autoprefixer()],
};
