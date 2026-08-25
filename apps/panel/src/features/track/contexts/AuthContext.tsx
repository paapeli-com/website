import React, { createContext, useContext, useState } from "react";

/* Mock auth. Any credentials sign you in; token is kept in localStorage. */
/* Later this is swapped for the real gateway/Cognito flow used by panel. */

type User = { email: string };

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    // Demo/preview mode: `?demo` auto-signs-in (used by screenshots and the
    // landing-page preview). Harmless for real use.
    if (window.location.search.includes("demo")) return { email: "demo@paapeli.com" };
    const raw = window.localStorage.getItem("track_user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const login = async (email: string) => {
    const u = { email };
    window.localStorage.setItem("track_user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    window.localStorage.removeItem("track_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
