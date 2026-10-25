import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import AccountSettings from "./pages/AccountSettings";
import { SHOW_UNRELEASED_PRODUCTS } from "@/shared/config";

/* Home — the account's front door at /Home, mounted by the shell like any
   other feature (see src/app/features.ts for the chunk boundary). It has no
   workspace product of its own: it lists every product on the account, so it
   must render whether or not any of them is subscribed. */
export default function HomeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* The account's own settings. Anything that belongs to the person
          rather than to a workspace or a product sits under /Home, so this is
          /Home/account-settings and not a page of Smart Factory's, which is
          where it used to live. */}
      <Route path="/account-settings" element={<AccountSettings />} />
      {/* Each product family's page: the header switcher's family headings
          and Home's section labels open these. */}
      <Route path="/aiot" element={<Home category="aiot" />} />
      {/* AI Infra is staging only; on production /Home/ai-infra falls to
          the catch-all below and lands on /Home. */}
      {SHOW_UNRELEASED_PRODUCTS && <Route path="/ai-infra" element={<Home category="ai" />} />}
      {/* Nothing else sits below /Home; anything deeper is a stale link. */}
      <Route path="*" element={<Navigate to="/Home" replace />} />
    </Routes>
  );
}
