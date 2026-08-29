import { createRoot } from "react-dom/client";
import { setApiBaseUrl } from "@paapeli/api";
import { PAAPELI_API_BASE_URL } from "@/shared/config";
import LoginPage from "./LoginPage";
import "@/index.css";

/* /login is its own Vite entry (see vite.config.ts rollupOptions.input), so
   none of src/app/App.tsx runs here — including its setApiBaseUrl call. The
   base URL has to be set again for this bundle or every request would go to
   the page's own origin. No auth token is set on purpose: nobody is signed in
   on this page yet. */
setApiBaseUrl(PAAPELI_API_BASE_URL);

createRoot(document.getElementById("root")!).render(<LoginPage />);
