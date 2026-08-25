/* ------------------------------------------------------------------ */
/* Every "book a demo", "contact sales" and "talk to an expert" on the */
/* site lands on the same page. Callers pass the slug of the page they */
/* are on so the form can show, quietly, where the visitor came from.  */
/* ------------------------------------------------------------------ */

export const CONTACT_PATH = "/contact";

/**
 * Locale-prefixed link to the contact page. `from` is the source page's
 * slug (a feature slug, an industry slug, or one of the ids in
 * SOURCE_NAMES on the contact page); leave it off where there is nothing
 * useful to say.
 */
export const contactHref = (language: string, from?: string) =>
  `/${language}${CONTACT_PATH}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
