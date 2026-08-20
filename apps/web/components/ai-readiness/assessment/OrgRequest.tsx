import Link from 'next/link';
import { ArrowRight, Lock, Users } from 'lucide-react';

import { Container } from '../primitives';
import { Reveal } from '../Reveal';
import { aiLinks } from '../links';
import { orgRequestFields, orgRequestPoints } from './content';
import { AssessmentStepper, ConfidentialityNote } from './ui';
import { CancelAssessment } from './CancelAssessment';

const fieldClass =
  'h-11 w-full rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-3.5 text-[13px] text-[var(--ai-text)] placeholder:text-[var(--ai-dim)] focus:border-[var(--ai-orange-soft)] focus:outline-none';

/**
 * Where the organisational tier leads. Deliberately a short contact request,
 * not a checkout: this tier is scoped in conversation, not bought.
 */
export function OrgRequest() {
  return (
    <Container className="py-8 md:py-10">
      {/* See ModeSelection: `items-start` is what gives the sticky rail room
          to travel. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_248px] lg:items-start lg:gap-12">
        <div className="order-2 lg:order-1">
          <Reveal className="app-enter">
            <Link
              href={aiLinks.startAssessment}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ai-dim)] transition-colors hover:text-[var(--ai-text)]"
            >
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              بازگشت به انتخاب نوع ارزیابی
            </Link>

            <h1 className="mt-5 text-[26px] font-bold leading-[1.5] text-[var(--ai-text)] sm:text-[32px]">
              درخواست ارزیابی سازمانی
            </h1>
            <p className="mt-4 max-w-[44rem] text-[14px] leading-[2.1] text-[var(--ai-muted)]">
              ارزیابی سازمانی با هماهنگی تیم ما انجام می‌شود. اطلاعات تماس خود را بگذارید تا برای
              تعیین دامنه کار و زمان‌بندی با شما تماس بگیریم.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Reveal delay={80}>
              <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-7">
                {/*
                  UI only: no endpoint yet, so the button is a plain button
                  rather than a submit that would post these fields into the
                  URL. Wire it to an API route and switch to type="submit".
                */}
                <form className="space-y-3">
                  {orgRequestFields.map((f) => (
                    <div key={f.name}>
                      <label htmlFor={`org-${f.name}`} className="sr-only">
                        {f.label}
                      </label>
                      <input
                        id={`org-${f.name}`}
                        name={f.name}
                        type={f.type}
                        autoComplete={f.autoComplete}
                        placeholder={f.label}
                        required
                        className={fieldClass}
                      />
                    </div>
                  ))}

                  <div>
                    <label htmlFor="org-note" className="sr-only">
                      توضیح کوتاه
                    </label>
                    <textarea
                      id="org-note"
                      name="note"
                      rows={3}
                      placeholder="توضیح کوتاه درباره هدف ارزیابی (اختیاری)"
                      className="w-full rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-3.5 py-3 text-[13px] leading-[1.9] text-[var(--ai-text)] placeholder:text-[var(--ai-dim)] focus:border-[var(--ai-orange-soft)] focus:outline-none"
                    />
                  </div>

                  <p className="flex items-start gap-2 pt-1 text-[11.5px] leading-[1.85] text-[var(--ai-dim)]">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ai-orange-soft)]" />
                    اطلاعات شما محرمانه است و فقط برای هماهنگی این ارزیابی استفاده می‌شود.
                  </p>

                  <button
                    type="button"
                    className="mt-2 inline-flex h-[50px] min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--ai-orange)] text-[14px] font-semibold text-[#1a0d00] transition-colors hover:bg-[var(--ai-orange-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)]"
                  >
                    <Users className="h-4 w-4" strokeWidth={2} />
                    ارسال درخواست
                  </button>
                </form>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="h-full rounded-2xl border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] p-6">
                <h2 className="text-[15px] font-bold text-[var(--ai-text)]">
                  بعد از ارسال درخواست چه اتفاقی می‌افتد؟
                </h2>
                <ul className="mt-5 space-y-4">
                  {orgRequestPoints.map((p) => (
                    <li key={p.label} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ai-orange-line)] bg-[var(--ai-bg-soft)]">
                        <p.icon
                          className="h-4 w-4 text-[var(--ai-orange-soft)]"
                          strokeWidth={1.7}
                        />
                      </span>
                      <span className="pt-1.5 text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">
                        {p.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-3 lg:p-5">
            <p className="mb-5 hidden text-[12px] font-semibold text-[var(--ai-orange-soft)] lg:block">
              مسیر سازمانی
            </p>
            <AssessmentStepper current={2} />
            <div className="mt-6 hidden border-t border-[var(--ai-border-soft)] pt-4 lg:block">
              <ConfidentialityNote />
            </div>
          </div>

          <CancelAssessment className="mt-4 w-full" />
        </aside>
      </div>
    </Container>
  );
}
