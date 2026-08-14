import { ReactNode } from "react";
import { isAuthenticated, goToLogin } from "@paapeli/brand/session";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

/* Gate on the shared, product-agnostic session (set at /login). If there's
   no valid session, bounce to the host login (outside any product base). */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    goToLogin();
    return null;
  }
  return <>{children}</>;
};
