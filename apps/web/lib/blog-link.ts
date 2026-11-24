/* ------------------------------------------------------------------ */
/* The documentation and the blog share one host of their own, and that */
/* site carries its own locale prefix: English sits at the root while   */
/* Persian and Arabic sit under /fa and /ar. So a visitor reading the   */
/* Persian marketing site lands on the Persian docs and the Persian     */
/* blog, not on the English ones.                                       */
/*                                                                      */
/* It is another origin, so link to it with a plain <a> (or a <Link>    */
/* that knows to open external hrefs in a new tab).                     */
/* ------------------------------------------------------------------ */

export const DOCS_URL = "https://docs.paapeli.com";

/**
 * A page on the docs host, in the language the visitor is reading.
 * `path` is that page's address on the English site, leading slash and
 * all; every locale shares the same paths under its own prefix.
 */
export const docsHref = (language: string, path = "/") =>
  language === "en" ? `${DOCS_URL}${path}` : `${DOCS_URL}/${language}${path}`;

/**
 * Rewrite a docs-host URL written for English into the reader's
 * language, and leave every other href alone.
 *
 * Menus and footers are built from plain link tables, which can only
 * hold one spelling of an address. They hold the English one and pass
 * it through here at render time, so a docs, SDK, guide or blog link
 * follows the language the rest of the page is in.
 */
export const localizeDocsUrl = (language: string, href: string) =>
  href.startsWith(DOCS_URL)
    ? docsHref(language, href.slice(DOCS_URL.length) || "/")
    : href;

/** The English blog, as the link tables spell it. */
export const BLOG_URL = `${DOCS_URL}/blog`;

/** The blog on the docs host, in the language the visitor is reading. */
export const blogHref = (language: string) => docsHref(language, "/blog");

/**
 * A single blog post, in the reader's language. `slug` is the post's
 * Docusaurus slug, which is the same string in every locale — only the
 * locale prefix in front of it changes.
 */
export const blogPostHref = (language: string, slug: string) =>
  docsHref(language, `/blog/${slug}`);

/** The BRICS 2026 gold medal in AI post, linked from the landing hero and featured in its blog strip. */
export const BRICS_2026_POST = "paapeli-brics-2026-gold-medal-ai";
