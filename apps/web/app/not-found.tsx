import Link from 'next/link';

import './globals.css';
import { poppins } from './fonts';

/* ------------------------------------------------------------------ */
/* The 404 for an address that matched nothing at all.                 */
/*                                                                     */
/* The root layout lives at app/[lang]/layout.tsx so that <html lang>  */
/* can name the language, which means a global not-found has no layout */
/* above it and has to bring its own document. Anything under a locale */
/* uses app/[lang]/not-found.tsx and keeps the site's chrome.          */
/* ------------------------------------------------------------------ */

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <html lang="en" dir="ltr" className={poppins.variable}>
      <body className={poppins.className}>
        <main className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-5xl font-bold text-[#101828]">404</p>
            <p className="text-lg text-[#4a5565]">
              We could not find the page you were looking for.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#ff7900] px-5 text-sm font-medium text-white transition-colors hover:bg-[#e66d00]"
            >
              Back to Paapeli
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
