"use client";

import { useEffect, useState } from "react";

import { THEME_KEY as KEY } from "@/lib/theme-boot";

/* ------------------------------------------------------------------ */
/* Dark/light theme, as the panel has it (packages/brand/theme.ts):    */
/* the `dark` class on <html>, light by default, the choice kept under */
/* the same "paapeli_theme" key. The site cannot import the panel's    */
/* module (it is not a dependency of this app), so this is its twin.   */
/* The <head> script that applies a saved choice before first paint is */
/* in lib/theme-boot.ts.                                               */
/* ------------------------------------------------------------------ */

function readDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useTheme() {
  /* Starts light on the server and on the first client render alike, so
     hydration agrees; the effect below then picks up what the boot
     script already put on <html>. */
  const [dark, setDark] = useState(false);

  useEffect(() => setDark(readDark()), []);

  const toggle = () => {
    const next = !readDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* private mode: the class still applies for this visit */
    }
    setDark(next);
  };

  return { dark, toggle };
}
