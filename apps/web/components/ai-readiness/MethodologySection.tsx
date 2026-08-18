import { Container, GhostButton, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiLinks, aiSections } from './links';
import { referenceFirms } from './content';

/**
 * Simplified Iran silhouette, traced from the national border at low
 * resolution — enough to read as a map badge at 28px. Outlined in Paapeli
 * orange: the one mark on the page that stands for "made for here".
 */
function IranOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="ایران">
      <path
        d="M5.2 5.4 L23.3 15.5 L38.9 21.6 L51.8 19.6 L64.8 10.8 L88.1 21.6 L87.6 42.6 L92.2 60.1 L91.2 96.6 L67.4 89.9 L57 88.5 L44 83.1 L31.1 69.6 L20.7 66.2 L10.4 45.9 L7.8 25.7 Z"
        fill="var(--ai-orange)"
        fillOpacity="0.14"
        stroke="var(--ai-orange)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MethodologySection() {
  return (
    <section
      id={aiSections.methodology}
      aria-labelledby="methodology-heading"
      className="py-12 md:py-16"
    >
      <Container>
        <SectionHeading
          id="methodology-heading"
          pill="روش‌شناسی"
          title="ارزیابی مبتنی بر پژوهش، نه یک آزمون اینترنتی"
          lead="چارچوب ارزیابی با مرور مدل‌ها و پژوهش‌های معتبر جهانی و با درنظرگرفتن واقعیت سازمان‌های ایرانی تدوین شده است."
        />

        <Reveal className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-4">
            <IranOutline className="h-7 w-7 shrink-0" />
            <p className="text-[12.5px] leading-[1.8] text-[var(--ai-muted)]">
              بومی‌سازی برای
              <br />
              سازمان‌های ایرانی
            </p>
          </div>

          <ul className="grid flex-1 grid-cols-2 divide-[color:var(--ai-border)] overflow-hidden rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-x-reverse">
            {referenceFirms.map((firm) => (
              <li
                key={firm}
                className="flex items-center justify-center px-4 py-5 text-[15px] font-semibold tracking-tight text-[var(--ai-muted)]"
              >
                {firm}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-8 flex justify-center" delay={120}>
          <GhostButton href={aiLinks.methodologyPage}>مشاهده روش‌شناسی</GhostButton>
        </Reveal>
      </Container>
    </section>
  );
}
