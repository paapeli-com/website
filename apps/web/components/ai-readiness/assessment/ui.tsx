import { Check, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { appSteps } from './content';

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <p className="mb-2 text-[11.5px] text-[var(--ai-dim)]">{label}</p>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'پیشرفت'}
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--ai-surface-3)]"
      >
        {/* Grows from the right: the flow reads right-to-left. */}
        <div
          className="app-progress ml-auto h-full rounded-full bg-[var(--ai-green)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

const PERSIAN_DIGITS = ['۱', '۲', '۳', '۴', '۵'];

/**
 * The three app stages. Renders as a rail on desktop (right-hand column in
 * RTL) and collapses to a compact horizontal strip on mobile.
 */
export function AssessmentStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="مراحل ارزیابی">
      {/* Desktop rail */}
      <ol className="hidden lg:block">
        {appSteps.map((step, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'active' : 'todo';
          return (
            <li key={step.title} className="relative flex gap-3 pb-8 last:pb-0">
              {i < appSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-[var(--ai-border)]"
                />
              ) : null}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors ${
                  state === 'done'
                    ? 'border-[var(--ai-green)] bg-[var(--ai-green)] text-[#05100c]'
                    : state === 'active'
                      ? 'border-[var(--ai-green)] bg-[var(--ai-green-tint)] text-[var(--ai-green)]'
                      : 'border-[var(--ai-border)] bg-[var(--ai-bg)] text-[var(--ai-dim)]'
                }`}
              >
                {state === 'done' ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  PERSIAN_DIGITS[i]
                )}
              </span>

              <span className="pt-1">
                <span
                  className={`block text-[13px] font-semibold ${
                    state === 'todo' ? 'text-[var(--ai-dim)]' : 'text-[var(--ai-text)]'
                  }`}
                >
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-[var(--ai-dim)]">
                  {step.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile strip */}
      <ol className="flex items-center gap-2 lg:hidden">
        {appSteps.map((step, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'active' : 'todo';
          return (
            <li key={step.title} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  state === 'done'
                    ? 'border-[var(--ai-green)] bg-[var(--ai-green)] text-[#05100c]'
                    : state === 'active'
                      ? 'border-[var(--ai-green)] bg-[var(--ai-green-tint)] text-[var(--ai-green)]'
                      : 'border-[var(--ai-border)] text-[var(--ai-dim)]'
                }`}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : PERSIAN_DIGITS[i]}
              </span>
              {i < appSteps.length - 1 ? (
                <span aria-hidden="true" className="h-px flex-1 bg-[var(--ai-border)]" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The confidentiality line that sits under the rail. */
export function ConfidentialityNote() {
  return (
    <p className="flex items-start gap-2 text-[11.5px] leading-[1.85] text-[var(--ai-dim)]">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ai-green)]" />
      پاسخ‌های شما محرمانه است.
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Selectable option                                                   */
/* ------------------------------------------------------------------ */

/**
 * One choice in an intake question. A real <button> so keyboard navigation,
 * focus rings and Enter come for free; `aria-pressed` carries the selection
 * to assistive tech. Min height 44px for comfortable touch targets.
 */
export function OptionCard({
  label,
  icon: Icon,
  selected,
  onSelect,
  layout = 'grid',
}: {
  label: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  layout?: 'grid' | 'inline';
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`app-option relative flex min-h-[44px] items-center rounded-xl border px-4 text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] ${
        layout === 'grid' ? 'flex-col justify-center gap-2 py-4 text-center' : 'gap-2.5 py-3'
      } ${
        selected
          ? 'border-[var(--ai-green)] bg-[var(--ai-green-tint)] text-[var(--ai-text)]'
          : 'border-[var(--ai-border)] bg-[var(--ai-surface)] text-[var(--ai-muted)] hover:border-[var(--ai-green-hover)] hover:text-[var(--ai-text)]'
      }`}
    >
      {Icon ? (
        <Icon
          className={`h-5 w-5 shrink-0 ${selected ? 'text-[var(--ai-green)]' : 'text-[var(--ai-muted)]'}`}
          strokeWidth={1.6}
        />
      ) : null}
      <span className={layout === 'grid' ? '' : 'flex-1 text-right'}>{label}</span>

      {selected ? (
        <span
          aria-hidden="true"
          className="app-check absolute left-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ai-green)]"
        >
          <Check className="h-2.5 w-2.5 text-[#05100c]" strokeWidth={4} />
        </span>
      ) : null}
    </button>
  );
}
