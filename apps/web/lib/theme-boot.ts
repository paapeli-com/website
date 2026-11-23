/* The part of the theme the server layout needs. It lives apart from
   lib/theme.ts because that module is client-only (it uses React state),
   and a server component importing from it would get a client reference
   instead of this string. */

/** Where the choice is kept: the same key the panel uses. */
export const THEME_KEY = "paapeli_theme";

/**
 * Runs in <head> before the first paint, so a reader who chose dark
 * never sees the light page flash first. A string because it has to be
 * inlined into the served HTML.
 */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
