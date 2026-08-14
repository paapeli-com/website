import { useEffect, useState } from "react";

/** Minimal dark/light theme toggle persisted to localStorage, shared across every solution the host mounts. */
export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("paapeli_theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("paapeli_theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
