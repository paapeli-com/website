import type { ReactNode } from 'react';
import { vazirmatn } from '@/app/fonts';

import '../theme.css';
import { AiHeader, subPageNav } from '../AiHeader';
import { AiFooter } from '../AiFooter';
import { aiLinks } from '../links';

/**
 * Wrapper shared by every screen of the assessment entry flow.
 *
 * It reuses the site's own header and footer rather than a stripped-down app
 * chrome, so the toolbar stays identical across the whole product. See the
 * landing page for why the wrapper carries `lang="fa-IR"` rather than `fa`.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      lang="fa-IR"
      dir="rtl"
      className={`ai-readiness flex min-h-screen flex-col ${vazirmatn.className}`}
      style={{ ['--ai-font' as string]: vazirmatn.style.fontFamily }}
    >
      <noscript>
        <style>{`.ai-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <AiHeader navItems={subPageNav} activeHref={aiLinks.startAssessment} showCta={false} />

      <main className="flex-1">{children}</main>

      <AiFooter />
    </div>
  );
}
