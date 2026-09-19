/* Decoration, and nothing else: the topographic contour pattern in
   public/topo.svg with a fade over it, so the lines only read in the lower
   half and stay out of the way behind whatever sits at the top of the page.
 *
 * Shared so Home and the dashboard canvas draw the same lines from the same
 * file rather than two drifting copies.
 *
 * `anchor` picks what the layers are pinned to:
 *   - "viewport" (Home): fixed, so the pattern holds still while the page
 *     scrolls and fills the empty space on a tall monitor. Home has no
 *     sidebar, so covering the viewport covers only Home.
 *   - "container" (dashboard canvas): absolute within the nearest positioned
 *     ancestor. Fixed would paint over the sidebar, which is a static flex
 *     item and therefore sits *below* a positioned z-0 layer in the painting
 *     order — the lines would run across the nav.
 *
 * Both layers are pointer-events: none, so they never take a click, and they
 * sit at z-0 under content that should be given z-1.
 *
 * The fade is mixed from the theme's own --background rather than a literal
 * page colour, so the top of the gradient is whatever the page already is, in
 * either theme.
 */
export function TopoBackdrop({ anchor = "viewport" }: { anchor?: "viewport" | "container" }) {
  const position = anchor === "viewport" ? ("fixed" as const) : ("absolute" as const);

  return (
    <>
      <div
        aria-hidden
        style={{
          position,
          inset: 0,
          background: "url(/topo.svg) center bottom / cover no-repeat",
          opacity: 0.4,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position,
          inset: 0,
          background:
            "linear-gradient(hsl(var(--background)) 0%, hsl(var(--background) / 0.72) 38%, hsl(var(--background) / 0) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}

export default TopoBackdrop;
