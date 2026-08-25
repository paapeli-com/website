import { ReactNode } from "react";
import { isAuthenticated, goToLogin } from "@paapeli/brand/session";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/factory/store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

/* Gate on the shared, product-agnostic session (set at /login). If there's
   no valid session, bounce to the host login (outside any product base).

   Every panel page routes through here (public marketing pages don't), so
   this also carries the page padding that used to come from the old
   PanelLayout shell — the host's own layout (apps/panel/host) renders its
   <main> edge-to-edge and leaves padding to each remote, the same way
   track/cloud-management's pages already pad themselves. */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    goToLogin();
    return null;
  }
  return <div className="p-4 lg:p-6">{children}</div>;
};
