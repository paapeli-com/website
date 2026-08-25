/* ------------------------------------------------------------------ */
/* Smooth in-page scrolling for the home page's own anchors.          */
/*                                                                    */
/* The browser's native smooth scroll covers the distance from the    */
/* hero to a section far below it in a couple of frames, which reads  */
/* as a jump. This eases the same trip over roughly a second so the   */
/* sections in between register as you pass them.                     */
/* ------------------------------------------------------------------ */

/** Anchor on the home page's "How Paapeli works" section. */
export const HOW_IT_WORKS_ID = "how-it-works";

/** The navbar floats over the page, so stop short of the section's top edge. */
const NAV_OFFSET = 72;

/** easeInOutCubic: slow to leave, slow to arrive, quick in the middle. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Stops whatever glide is running, so a second click cannot fight the first. */
let stopRunningGlide: (() => void) | null = null;

/**
 * Glides the window to `id`, easing over a duration that grows with the
 * distance. Any wheel, touch or key input hands control straight back to
 * the reader. Returns false when the section is not on this page, so the
 * caller can let the plain anchor jump do its job.
 */
export function glideToSection(id: string): boolean {
  const section = document.getElementById(id);
  if (!section) return false;

  stopRunningGlide?.();
  const start = window.scrollY;
  /* offsetTop rather than the bounding rect: sections are still holding a
     reveal transform when the click lands, and that would shift the target. */
  let top = 0;
  for (let node: HTMLElement | null = section; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  const distance = top - NAV_OFFSET - start;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, start + distance);
    return true;
  }

  /* Long trips take longer, but never long enough to feel like waiting. */
  const duration = Math.min(1100, Math.max(500, Math.abs(distance) * 0.45));
  let startedAt: number | null = null;
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
  };
  const listening = ["wheel", "touchstart", "keydown"] as const;
  for (const type of listening) window.addEventListener(type, cancel, { passive: true });
  const stopListening = () => {
    for (const type of listening) window.removeEventListener(type, cancel);
    if (stopRunningGlide === cancel) stopRunningGlide = null;
  };
  stopRunningGlide = cancel;

  const step = (now: number) => {
    if (cancelled) return stopListening();
    if (startedAt === null) startedAt = now;
    const t = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else stopListening();
  };

  requestAnimationFrame(step);
  return true;
}
