/* One hover and selected treatment for every menu that drops out of the
 * header.
 *
 * The product switcher and the create menu already shared it: a transparent
 * border that turns brand-coloured over a faintly tinted background, and a
 * selected row that keeps both. The language, wallet and account menus each
 * used `hover:bg-muted` instead, so three of the six menus in the same header
 * highlighted differently from the other three. It lives here now, so there is
 * one answer rather than five copies of one.
 *
 * `menuRowBase` carries the shape, `menuRowIdle` and `menuRowSelected` the
 * state. A row that is nothing but a label keeps the border transparent so it
 * does not jump by a pixel when it lights up.
 */

export const menuRowBase =
  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm transition-colors";

export const menuRowIdle =
  "border-transparent text-foreground hover:border-primary/30 hover:bg-primary/5";

export const menuRowSelected = "border-primary/40 bg-primary/10 font-semibold text-foreground";

/** The same treatment for a row that destroys something, in its own colour. */
export const menuRowDanger =
  "border-transparent text-destructive hover:border-destructive/30 hover:bg-destructive/5";
