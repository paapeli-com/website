import Link from 'next/link';
import { BrandLockup } from './Logos';
import { Container, PrimaryButton } from './primitives';
import { aiLinks } from './links';

export type NavItem = { label: string; href: string };

/** Shared navbar for every sub-page, so the toolbar reads the same wherever
 *  you are. First entry renders rightmost in RTL. */
export const subPageNav: NavItem[] = [
  { label: 'صفحه اصلی', href: aiLinks.landing },
  { label: 'مطالعه گزارش', href: aiLinks.report },
  { label: 'روش‌شناسی', href: aiLinks.methodologyPage },
  { label: 'درباره ارزیابی', href: aiLinks.aboutPage },
];

/** Same four entries on the landing page, with one difference: "روش‌شناسی"
 *  scrolls down to the summary section instead of navigating away — the full
 *  write-up stays behind that section's own "مشاهده روش‌شناسی" button. */
export const landingNav: NavItem[] = subPageNav.map((item) =>
  item.href === aiLinks.methodologyPage
    ? { ...item, href: aiLinks.methodologyAnchor }
    : item,
);

export function AiHeader({
  navItems = landingNav,
  brandHref = aiLinks.landing,
  ctaHref = aiLinks.startAssessment,
  activeHref,
  showCta = true,
}: {
  navItems?: NavItem[];
  brandHref?: string;
  ctaHref?: string;
  /** Href of the page currently open; that entry gets the underline. */
  activeHref?: string;
  /** Hidden inside the assessment app: the user is already in the flow, and
   *  the step's own primary action should be the only call to action. */
  showCta?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ai-border-soft)] bg-[var(--ai-bg-blur)] backdrop-blur-md">
      <Container>
        <div className="flex h-[68px] items-center justify-between gap-6">
          <Link href={brandHref} aria-label="Paapeli × Rayka">
            <BrandLockup />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const isActive = activeHref !== undefined && item.href === activeHref;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-[22px] text-[13.5px] transition-colors ${
                    isActive
                      ? 'text-[var(--ai-text)] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[var(--ai-green)]'
                      : 'text-[var(--ai-muted)] hover:text-[var(--ai-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {showCta ? (
            <PrimaryButton href={ctaHref} size="sm" tone="orange">
              شروع ارزیابی
            </PrimaryButton>
          ) : (
            // Keeps the nav optically centred once the button is gone.
            <span aria-hidden="true" className="hidden w-[7.5rem] md:block" />
          )}
        </div>
      </Container>
    </header>
  );
}
