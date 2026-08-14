import { BrowserRouter } from "react-router-dom";
import RemoteApp from "./RemoteApp";

/* Standalone entry point (pnpm --filter factory dev/build/preview) — wraps
   RemoteApp, the federation-exposed component, in its own router so the
   app is still independently runnable outside the host shell (without
   header/sidebar chrome, which now lives in apps/panel/host). */
const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
    <RemoteApp />
  </BrowserRouter>
);

export default App;
