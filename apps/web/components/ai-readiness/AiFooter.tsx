import Link from 'next/link';
import { BrandLockup } from './Logos';
import { Container } from './primitives';
import { aiLinks } from './links';

const footerLinks = [
  { label: 'مطالعه گزارش', href: aiLinks.report },
  { label: 'روش‌شناسی', href: aiLinks.methodologyPage },
  { label: 'درباره ارزیابی', href: aiLinks.aboutPage },
];

export function AiFooter() {
  return (
    <footer className="border-t border-[var(--ai-border-soft)] py-8">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandLockup />
            <p className="mt-3 text-[12px] text-[var(--ai-dim)]">
              © ۱۴۰۵، تمامی حقوق محفوظ است.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[12.5px] text-[var(--ai-muted)] transition-colors hover:text-[var(--ai-text)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
