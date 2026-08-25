'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

import { Container } from '../primitives';
import { aiLinks } from '../links';
import {
  aiStages,
  industries,
  intakeSteps,
  modes,
  orgSizes,
  roles,
} from './content';
import { AssessmentStepper, ConfidentialityNote, OptionCard, ProgressBar } from './ui';
import { CancelAssessment } from './CancelAssessment';
import {
  emptyIntake,
  isIntakeComplete,
  loadIntake,
  saveIntake,
  type IntakeState,
} from './state';

const PERSIAN = ['۱', '۲', '۳', '۴', '۵'];
const TOTAL = intakeSteps.length;

/** Look a stored id back up to its human label, for the summary. */
function labelOf(list: { id: string; label: string }[], id: string | null) {
  return list.find((o) => o.id === id)?.label ?? '-';
}

export function IntakeFlow() {
  const router = useRouter();
  const [state, setState] = useState<IntakeState>(emptyIntake);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  /** Bumped on every step change to retrigger the enter animation. */
  const [motionKey, setMotionKey] = useState(0);

  // Rehydrate, and resume at the first unanswered question.
  //
  // The first render deliberately uses the empty state rather than waiting for
  // sessionStorage: that is the correct screen for a first-time visitor, it
  // matches what the server rendered (so hydration stays clean), and it means
  // the page never ships as a blank div. Returning visitors jump forward on
  // the next frame.
  useEffect(() => {
    const stored = loadIntake();
    setState(stored);
    const firstGap = [stored.industry, stored.size, stored.role, stored.aiStage].findIndex(
      (v) => !v,
    );
    setStep(firstGap === -1 ? TOTAL - 1 : firstGap);
  }, []);

  const update = useCallback((patch: Partial<IntakeState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveIntake(next);
      return next;
    });
  }, []);

  const current = intakeSteps[step];

  const answered = useMemo(() => {
    switch (current.key) {
      case 'industry':
        return Boolean(state.industry);
      case 'size':
        return Boolean(state.size);
      case 'role':
        return Boolean(state.role);
      case 'aiStage':
        return Boolean(state.aiStage);
      case 'orgName':
        return true; // optional
    }
  }, [current.key, state]);

  const go = (delta: number) => {
    const next = step + delta;
    if (next < 0) {
      router.push(aiLinks.startAssessment);
      return;
    }
    if (next >= TOTAL) {
      setDone(true);
      setMotionKey((k) => k + 1);
      return;
    }
    setStep(next);
    setMotionKey((k) => k + 1);
  };

  /** Selecting an answer advances automatically — except on the free-text
   *  final step, where the user needs to finish typing first. */
  const pick = (patch: Partial<IntakeState>) => {
    update(patch);
    window.setTimeout(() => go(1), 180);
  };

  const selectedMode = modes.find((m) => m.id === state.mode);
  const progress = done ? 100 : ((step + (answered ? 1 : 0)) / TOTAL) * 100;

  return (
    <Container className="py-8 md:py-10">
      {/* See ModeSelection: `items-start` is what gives the sticky rail room
          to travel. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_248px] lg:items-start lg:gap-12">
        <div className="order-2 lg:order-1">
          {done ? (
            /* ---------------- Summary ---------------- */
            <div key={motionKey} className="app-enter">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)] px-4 py-1.5 text-[12.5px] text-[var(--ai-green)]">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                ارزیابی شما آماده است
              </span>

              <h1 className="mt-6 text-[26px] font-bold leading-[1.5] text-[var(--ai-text)] sm:text-[32px]">
                همه چیز آماده است
              </h1>
              <p className="mt-4 max-w-[42rem] text-[14px] leading-[2.1] text-[var(--ai-muted)]">
                بر اساس پاسخ‌های شما، مسیر ارزیابی شخصی‌سازی شد. هر زمان خواستید می‌توانید به مراحل
                قبل برگردید و پاسخ‌ها را تغییر دهید.
              </p>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-border)] sm:grid-cols-2">
                {[
                  { label: 'نوع ارزیابی', value: selectedMode?.title ?? '-' },
                  { label: 'صنعت', value: labelOf(industries, state.industry) },
                  { label: 'اندازه سازمان', value: labelOf(orgSizes, state.size) },
                  { label: 'نقش شما', value: labelOf(roles, state.role) },
                  { label: 'وضعیت فعلی AI', value: labelOf(aiStages, state.aiStage) },
                  ...(state.orgName.trim()
                    ? [{ label: 'نام سازمان', value: state.orgName.trim() }]
                    : []),
                ].map((row) => (
                  <div key={row.label} className="bg-[var(--ai-surface)] px-5 py-4">
                    <dt className="text-[11.5px] text-[var(--ai-dim)]">{row.label}</dt>
                    <dd className="mt-1 text-[13.5px] font-semibold text-[var(--ai-text)]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
                {/*
                  The question experience is a separate screen that has not been
                  built yet. Point this at its route once it exists — nothing
                  else in the flow needs to change.
                */}
                <button
                  type="button"
                  className="inline-flex h-[52px] min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ai-green-btn)] text-[14.5px] font-semibold text-white transition-colors hover:bg-[var(--ai-green-btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] sm:max-w-[280px]"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                  شروع ارزیابی
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setStep(TOTAL - 1);
                    setMotionKey((k) => k + 1);
                  }}
                  className="inline-flex h-[52px] min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-6 text-[13.5px] text-[var(--ai-text)] transition-colors hover:border-[var(--ai-green-hover)]"
                >
                  <ArrowRight className="h-4 w-4 text-[var(--ai-muted)]" strokeWidth={2.5} />
                  ویرایش پاسخ‌ها
                </button>
              </div>
            </div>
          ) : (
            /* ---------------- One question at a time ---------------- */
            <div>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-[22px] font-bold leading-[1.6] text-[var(--ai-text)] sm:text-[27px]">
                  برای شخصی‌سازی ارزیابی، کمی از سازمان شما بدانیم
                </h1>
                <span className="shrink-0 rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] px-3 py-1.5 text-[11.5px] text-[var(--ai-muted)]">
                  مرحله {PERSIAN[step]} از {PERSIAN[TOTAL - 1]}
                </span>
              </div>

              <div className="mt-5">
                <ProgressBar value={progress} />
              </div>

              <div
                key={motionKey}
                className="app-slide mt-8 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-7"
              >
                <h2 className="text-[16px] font-bold text-[var(--ai-text)]">{current.question}</h2>
                <p className="mt-2 text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">
                  {current.hint}
                </p>

                <div className="mt-6">
                  {current.key === 'industry' ? (
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {industries.map((o) => (
                        <OptionCard
                          key={o.id}
                          label={o.label}
                          icon={o.icon}
                          selected={state.industry === o.id}
                          onSelect={() => pick({ industry: o.id })}
                        />
                      ))}
                    </div>
                  ) : null}

                  {current.key === 'size' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {orgSizes.map((o) => (
                        <OptionCard
                          key={o.id}
                          label={o.label}
                          selected={state.size === o.id}
                          onSelect={() => pick({ size: o.id })}
                          layout="inline"
                        />
                      ))}
                    </div>
                  ) : null}

                  {current.key === 'role' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {roles.map((o) => (
                        <OptionCard
                          key={o.id}
                          label={o.label}
                          icon={o.icon}
                          selected={state.role === o.id}
                          onSelect={() => pick({ role: o.id })}
                          layout="inline"
                        />
                      ))}
                    </div>
                  ) : null}

                  {current.key === 'aiStage' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {aiStages.map((o) => (
                        <OptionCard
                          key={o.id}
                          label={o.label}
                          selected={state.aiStage === o.id}
                          onSelect={() => pick({ aiStage: o.id })}
                          layout="inline"
                        />
                      ))}
                    </div>
                  ) : null}

                  {current.key === 'orgName' ? (
                    <div>
                      <label
                        htmlFor="intake-org"
                        className="mb-2 block text-[12px] text-[var(--ai-dim)]"
                      >
                        نام سازمان <span className="text-[var(--ai-orange-soft)]">(اختیاری)</span>
                      </label>
                      <input
                        id="intake-org"
                        value={state.orgName}
                        onChange={(e) => update({ orgName: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            go(1);
                          }
                        }}
                        autoComplete="organization"
                        placeholder="نام سازمان خود را وارد کنید"
                        className="h-12 w-full rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-4 text-[13.5px] text-[var(--ai-text)] placeholder:text-[var(--ai-dim)] focus:border-[var(--ai-green)] focus:outline-none"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 text-[13px] text-[var(--ai-muted)] transition-colors hover:border-[var(--ai-green-hover)] hover:text-[var(--ai-text)]"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    بازگشت
                  </button>
                  {/* The rail is desktop-only, so mobile gets its own exit. */}
                  <CancelAssessment className="lg:hidden" />
                </div>

                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={!answered}
                  className={`app-cta inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl bg-[var(--ai-green-btn)] px-7 text-[13.5px] font-semibold text-white transition-all duration-300 hover:bg-[var(--ai-green-btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] ${
                    answered ? 'opacity-100' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {step === TOTAL - 1 ? 'مشاهده خلاصه' : 'ادامه'}
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <p className="mt-4 text-center text-[11.5px] text-[var(--ai-dim)]">
                کمتر از یک دقیقه دیگر تا شروع ارزیابی
              </p>
            </div>
          )}
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-3 lg:p-5">
            <p className="mb-5 hidden text-[12px] font-semibold text-[var(--ai-green)] lg:block">
              {done ? 'آماده شروع' : 'اطلاعات سازمان'}
            </p>
            <AssessmentStepper current={done ? 3 : 2} />
            <div className="mt-6 hidden border-t border-[var(--ai-border-soft)] pt-4 lg:block">
              <ConfidentialityNote />
            </div>
            {isIntakeComplete(state) && !done ? (
              <button
                type="button"
                onClick={() => {
                  setDone(true);
                  setMotionKey((k) => k + 1);
                }}
                className="mt-4 hidden w-full rounded-lg border border-[var(--ai-border)] px-3 py-2 text-[11.5px] text-[var(--ai-muted)] transition-colors hover:border-[var(--ai-green-hover)] hover:text-[var(--ai-text)] lg:block"
              >
                رفتن به خلاصه
              </button>
            ) : null}
          </div>

          {/* Leaving the flow stays available at every step, outside the
              rail card, matching the mode-selection screen. */}
          <CancelAssessment className="mt-4 hidden w-full lg:inline-flex" />
        </aside>
      </div>
    </Container>
  );
}
