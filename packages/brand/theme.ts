import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Shared dark/light theme.                                            */
/* The panel is a single document: the host shell and every federated  */
/* remote toggle the SAME `dark` class on <html>. They therefore have   */
/* to agree on where the preference is stored, or the last component    */
/* to run its effect wins and the two disagree (the host used           */
/* "paapeli_theme" while GPS Tracking used "track_theme", so toggling    */
/* from that remote's Settings page was silently reverted by the        */
/* header on the next render/reload).                                   */
/* ------------------------------------------------------------------ */

const KEY = "paapeli_theme";

/** Read the stored preference without subscribing to it. */
export function isDarkTheme(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "dark";
}

/** Apply a preference to the document and persist it. */
export function setDarkTheme(dark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  try {
    window.localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {
    /* private mode / storage disabled — the class still applied */
  }
}

/**
 * Dark/light toggle shared across the host shell and every solution.
 *
 * Also listens for `storage` so a toggle in one bundle (e.g. the host
 * header) keeps in-sync with the same hook in another (e.g. a remote's
 * settings page) — they are separate module instances in separate
 * bundles and have no other way to observe each other.
 */
export function useTheme() {
  const [dark, setDark] = useState<boolean>(isDarkTheme);

  useEffect(() => setDarkTheme(dark), [dark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setDark(e.newValue === "dark");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { dark, toggle: () => setDark((d) => !d) };
}
