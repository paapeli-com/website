/* ------------------------------------------------------------------ */
/* The blog lives with the documentation, on its own host, and that    */
/* site carries its own locale prefix: English sits at the root while  */
/* Persian and Arabic sit under /fa and /ar. So a visitor reading the  */
/* Persian marketing site lands on the Persian blog.                   */
/*                                                                     */
/* It is another origin, so link to it with a plain <a> (or a <Link>   */
/* that knows to open external hrefs in a new tab).                    */
/* ------------------------------------------------------------------ */

const DOCS_URL = "https://docs.paapeli.com";

/**
 * The English blog, which is also how the blog is spelled in the link
 * tables that menus and footers are built from; those tables are plain
 * data, so they carry this and get resolved per language at render time.
 */
export const BLOG_URL = `${DOCS_URL}/blog`;

/** The blog on the docs host, in the language the visitor is reading. */
export const blogHref = (language: string) =>
  language === "en" ? BLOG_URL : `${DOCS_URL}/${language}/blog`;
