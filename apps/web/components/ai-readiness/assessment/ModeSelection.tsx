'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

import { Container } from '../primitives';
import { Reveal } from '../Reveal';
import { aiLinks } from '../links';
import { modes, trustPoints } from './content';
import { AssessmentStepper, ConfidentialityNote } from './ui';
import { CancelAssessment } from './CancelAssessment';
import { loadIntake, saveIntake, type AssessmentMode } from './state';

export function ModeSelection() {
  const router = useRouter();
  const [selected, setSelected] = useState<AssessmentMode | null>(null);

  // Restore a previous choice so going back from the intake keeps the card lit.
  useEffect(() => {
    setSelected(loadIntake().mode);
  }, []);

  const choose = (mode: AssessmentMode) => {
    setSelected(mode);
    saveIntake({ ...loadIntake(), mode });
  };

  const isOrg = selected === 'org';

  const advance = () => {
    if (!selected) return;
    router.push(isOrg ? aiLinks.orgRequest : aiLinks.intake);
  };

  const ctaLabel = isOrg ? 'درخواست ارزیابی سازمانی' : 'ادامه';

  const ctaClass = `app-cta inline-flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] ${
    isOrg
      ? 'bg-[var(--ai-orange)] text-[#1a0d00] hover:bg-[var(--ai-orange-hover)] focus-visible:ring-[var(--ai-orange)]'
      : 'bg-[var(--ai-green-btn)] text-white hover:bg-[var(--ai-green-btn-hover)] focus-visible:ring-[var(--ai-green)]'
  } ${selected ? 'opacity-100' : 'cursor-not-allowed opacity-50'}`;

  return (
    /* Bottom padding on mobile clears the fixed action bar. */
    <Container className="py-8 pb-32 md:py-10 lg:pb-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_248px] lg:gap-12">
        {/* ---- Main column ---- */}
        <div className="order-2 lg:order-1">
          <Reveal className="app-enter">
            <h1 className="text-[23px] font-bold leading-[1.5] text-[var(--ai-text)] sm:text-[28px] md:text-[31px]">
              ارزیابی مناسب خود را انتخاب کنید
            </h1>
            <p className="mt-3 max-w-[46rem] text-[13.5px] leading-[2] text-[var(--ai-muted)]">
              میزان زمانی که در اختیار دارید و عمق تحلیلی که نیاز دارید را انتخاب کنید. مسیر
              ارزیابی بر اساس انتخاب شما شخصی‌سازی می‌شود.
            </p>
          </Reveal>

          {/* Cards run right-to-left: free and fastest first. */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {modes.map((mode, i) => {
              const isSelected = selected === mode.id;
              const orange = mode.tone === 'orange';
              return (
                <Reveal key={mode.id} delay={i * 80} className="h-full">
                  <button
                    type="button"
                    onClick={() => choose(mode.id)}
                    aria-pressed={isSelected}
                    className={`app-mode group relative flex h-full w-full flex-col rounded-2xl border bg-[var(--ai-surface)] p-5 text-right transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] ${
                      isSelected
                        ? orange
                          ? 'border-[var(--ai-orange)] focus-visible:ring-[var(--ai-orange)] app-mode-selected-orange'
                          : 'border-[var(--ai-green)] focus-visible:ring-[var(--ai-green)] app-mode-selected'
                        : 'border-[var(--ai-border)] hover:border-[var(--ai-green-hover)] focus-visible:ring-[var(--ai-green)]'
                    }`}
                  >
                    {mode.recommended ? (
                      <span className="absolute -top-2.5 right-5 rounded-full border border-[var(--ai-green)] bg-[var(--ai-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--ai-green)]">
                        پیشنهادی
                      </span>
                    ) : null}

                    {isSelected ? (
                      <span
                        aria-hidden="true"
                        className={`app-check absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full ${
                          orange ? 'bg-[var(--ai-orange)]' : 'bg-[var(--ai-green)]'
                        }`}
                      >
                        <Check className="h-3 w-3 text-[#05100c]" strokeWidth={4} />
                      </span>
                    ) : null}

                    <mode.icon
                      className={`h-6 w-6 ${orange ? 'text-[var(--ai-orange-soft)]' : 'text-[var(--ai-green)]'}`}
                      strokeWidth={1.6}
                    />

                    <h2 className="mt-3 text-[16.5px] font-bold text-[var(--ai-text)]">
                      {mode.title}
                    </h2>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          orange
                            ? 'border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] text-[var(--ai-orange-soft)]'
                            : 'border-[var(--ai-green-line)] bg-[var(--ai-green-tint)] text-[var(--ai-green)]'
                        }`}
                      >
                        {mode.badge}
                      </span>
                      <span className="rounded-full border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-2 py-0.5 text-[10px] text-[var(--ai-muted)]">
                        {mode.time}
                      </span>
                    </div>

                    <p className="mt-3 text-[12px] leading-[1.9] text-[var(--ai-muted)]">
                      {mode.description}
                    </p>

                    <ul className="mt-3.5 space-y-2">
                      {mode.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check
                            aria-hidden="true"
                            className={`mt-1 h-3 w-3 shrink-0 ${orange ? 'text-[var(--ai-orange-soft)]' : 'text-[var(--ai-green)]'}`}
                            strokeWidth={3}
                          />
                          <span className="text-[11.5px] leading-[1.8] text-[var(--ai-muted)]">
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {mode.note ? (
                      <p className="mt-3 text-[10.5px] leading-[1.8] text-[var(--ai-dim)]">
                        {mode.note}
                      </p>
                    ) : null}

                    <span className="mt-4 flex-1" />

                    <span
                      className={`flex h-10 w-full items-center justify-center rounded-xl text-[12.5px] font-semibold transition-colors ${
                        isSelected
                          ? orange
                            ? 'bg-[var(--ai-orange)] text-[#1a0d00]'
                            : 'bg-[var(--ai-green-btn)] text-white'
                          : 'border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] text-[var(--ai-text)] group-hover:border-[var(--ai-green-hover)]'
                      }`}
                    >
                      {mode.cta}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* Reassurance strip — one compact row rather than stacked blocks. */}
          <Reveal
            delay={160}
            className="mt-4 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-4"
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((t) => (
                <li key={t.title} className="flex items-start gap-2.5">
                  <t.icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ai-green)]"
                    strokeWidth={1.7}
                  />
                  <div>
                    <p className="text-[12px] font-bold text-[var(--ai-text)]">{t.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-[1.75] text-[var(--ai-muted)]">
                      {t.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* ---- Rail (right in RTL) ---- */}
        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-5">
              <p className="mb-5 text-[12px] font-semibold text-[var(--ai-green)]">شروع ارزیابی</p>
              <AssessmentStepper current={1} />
              <div className="mt-6 border-t border-[var(--ai-border-soft)] pt-4">
                <ConfidentialityNote />
              </div>
            </div>

            {/* Actions sit under the rail card, outside it — always in view on
                desktop because the whole column is sticky. */}
            <div className="mt-4 hidden lg:block">
              <button type="button" onClick={advance} disabled={!selected} className={ctaClass}>
                {ctaLabel}
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>

              <CancelAssessment className="mt-2.5 w-full" />

              <p className="mt-3 text-center text-[11px] leading-[1.8] text-[var(--ai-dim)]">
                {isOrg
                  ? 'در مرحله بعد یک فرم کوتاه برای هماهنگی تکمیل می‌کنید.'
                  : 'در مرحله بعد فقط چند اطلاعات کوتاه درباره سازمان شما می‌پرسیم.'}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile: the same actions as a fixed bar, so the primary action is
          never below the fold. Only one of the two is ever displayed. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ai-border)] bg-[var(--ai-bg-blur)] px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <CancelAssessment />
          <button type="button" onClick={advance} disabled={!selected} className={ctaClass}>
            {ctaLabel}
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Container>
  );
}
