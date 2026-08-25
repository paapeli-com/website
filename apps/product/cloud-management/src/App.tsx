import { BrowserRouter } from "react-router-dom";
import RemoteApp from "./RemoteApp";

/* Standalone entry point (pnpm --filter cloud-management dev/build/preview)
   — wraps RemoteApp, the federation-exposed component, in its own router
   so the app is still independently runnable outside the host shell
   (without header/sidebar chrome, which lives in apps/panel/host). */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <RemoteApp />
    </BrowserRouter>
  );
}
