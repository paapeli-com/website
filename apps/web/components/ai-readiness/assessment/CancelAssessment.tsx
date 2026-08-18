'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { aiLinks } from '../links';

/**
 * "انصراف" with an in-page confirmation.
 *
 * Deliberately not `window.confirm`: that draws a browser chrome dialog,
 * which breaks the application feel the flow is trying to hold. This is a
 * real modal — Escape closes it, the backdrop closes it, focus moves in on
 * open and returns to the trigger on close.
 */
export function CancelAssessment({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);

    // Stop the page behind the modal from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 text-[13px] text-[var(--ai-muted)] transition-colors hover:border-[var(--ai-orange-line)] hover:text-[var(--ai-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-orange-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)] ${className ?? ''}`}
      >
        انصراف
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-body"
            onClick={(e) => e.stopPropagation()}
            className="app-enter w-full max-w-[26rem] rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 text-right shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="cancel-title" className="text-[17px] font-bold text-[var(--ai-text)]">
                از ارزیابی خارج می‌شوید؟
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="بستن"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ai-border)] text-[var(--ai-muted)] transition-colors hover:text-[var(--ai-text)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <p
              id="cancel-body"
              className="mt-3 text-[13px] leading-[2] text-[var(--ai-muted)]"
            >
              آیا مطمئن هستید؟ با خروج از ارزیابی، پاسخ‌هایی که تا اینجا ثبت کرده‌اید نگه داشته
              نمی‌شود.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                ref={confirmRef}
                type="button"
                onClick={() => router.push(aiLinks.landing)}
                className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[var(--ai-orange)] text-[13.5px] font-semibold text-[#1a0d00] transition-colors hover:bg-[var(--ai-orange-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-surface)]"
              >
                بله، خارج می‌شوم
              </button>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] text-[13.5px] text-[var(--ai-text)] transition-colors hover:border-[var(--ai-green-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-surface)]"
              >
                ادامه ارزیابی
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
