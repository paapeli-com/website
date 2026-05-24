import type { CSSProperties, ReactNode } from 'react';

import './Pagination.scss';
import { buildClassName } from '../../util/buildClassName.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaginationVariant =
  | 'default'         // chevron-left + numbers + chevron-right (joined)
  | 'text-buttons'    // Previous + numbers + Next (joined)
  | 'two-buttons'     // ← Previous and Next → pills (separated)
  | 'helper-text'     // "Showing X to Y of N entries" + Prev/Next
  | 'arrows';         // <  X of Y  >  (joined)

export type PaginationProps = {
  /** 1-indexed current page. */
  currentPage: number;
  /** Total page count. */
  totalPages: number;
  /** Fires when the user navigates to a different page. */
  onPageChange: (page: number) => void;

  /** Layout variant. Default `default`. */
  variant?: PaginationVariant;

  // Used by the `helper-text` variant to render the "Showing X to Y of N" line.
  totalItems?: number;
  pageSize?: number;
  /** Override the default helper text. Receives `{ from, to, total }`. */
  helperText?: ReactNode | ((info: { from: number; to: number; total: number }) => ReactNode);

  /** Number of pages on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Number of pages always shown at each end. Default 1. */
  boundaryCount?: number;

  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 4l-4 4 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Page list with ellipsis ─────────────────────────────────────────────────

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

function buildPageList(
  current: number,
  total: number,
  siblingCount: number,
  boundaryCount: number,
): PageItem[] {
  const totalSlots = boundaryCount * 2 + siblingCount * 2 + 3;
  if (total <= totalSlots) return range(1, total);

  const leftSibling  = Math.max(current - siblingCount, boundaryCount + 2);
  const rightSibling = Math.min(current + siblingCount, total - boundaryCount - 1);

  const startPages = range(1, boundaryCount);
  const endPages   = range(total - boundaryCount + 1, total);

  const showLeftEllipsis  = leftSibling > boundaryCount + 1;
  const showRightEllipsis = rightSibling < total - boundaryCount;

  return [
    ...startPages,
    ...(showLeftEllipsis ? ['ellipsis-left' as const] : range(boundaryCount + 1, leftSibling - 1)),
    ...range(leftSibling, rightSibling),
    ...(showRightEllipsis ? ['ellipsis-right' as const] : range(rightSibling + 1, total - boundaryCount)),
    ...endPages,
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'default',
  totalItems,
  pageSize,
  helperText,
  siblingCount = 1,
  boundaryCount = 1,
  ariaLabel = 'Pagination',
  className,
  style,
}) => {
  const safeTotal = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);
  const isFirst = safeCurrent <= 1;
  const isLast  = safeCurrent >= safeTotal;

  const goTo = (p: number) => {
    const clamped = Math.min(Math.max(1, p), safeTotal);
    if (clamped !== safeCurrent) onPageChange(clamped);
  };

  // ── Variants ─────────────────────────────────────────────────────────────

  if (variant === 'two-buttons') {
    return (
      <nav
        aria-label={ariaLabel}
        className={buildClassName('Pagination', 'Pagination--two-buttons', className)}
        style={style}
      >
        <button
          type="button"
          className="Pagination__pill"
          onClick={() => goTo(safeCurrent - 1)}
          disabled={isFirst}
          aria-label="Previous page"
        >
          <ChevronLeft />
          <span>Previous</span>
        </button>
        <button
          type="button"
          className="Pagination__pill"
          onClick={() => goTo(safeCurrent + 1)}
          disabled={isLast}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight />
        </button>
      </nav>
    );
  }

  if (variant === 'helper-text') {
    const ps = pageSize ?? 10;
    const total = totalItems ?? safeTotal * ps;
    const from = (safeCurrent - 1) * ps + 1;
    const to = Math.min(safeCurrent * ps, total);

    const txt =
      typeof helperText === 'function'
        ? helperText({ from, to, total })
        : helperText ?? (
            <>
              Showing <strong>{from}</strong> to <strong>{to}</strong> of{' '}
              <strong>{total}</strong> Entries
            </>
          );

    return (
      <nav
        aria-label={ariaLabel}
        className={buildClassName('Pagination', 'Pagination--helper-text', className)}
        style={style}
      >
        <div className="Pagination__helper">{txt}</div>
        <div className="Pagination__group">
          <button
            type="button"
            className="Pagination__btn"
            onClick={() => goTo(safeCurrent - 1)}
            disabled={isFirst}
            aria-label="Previous page"
          >
            Prev
          </button>
          <button
            type="button"
            className="Pagination__btn"
            onClick={() => goTo(safeCurrent + 1)}
            disabled={isLast}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </nav>
    );
  }

  if (variant === 'arrows') {
    return (
      <nav
        aria-label={ariaLabel}
        className={buildClassName('Pagination', 'Pagination--arrows', className)}
        style={style}
      >
        <div className="Pagination__group">
          <button
            type="button"
            className="Pagination__btn Pagination__btn--icon"
            onClick={() => goTo(safeCurrent - 1)}
            disabled={isFirst}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>
          <span className="Pagination__btn Pagination__btn--label">
            {safeCurrent} of {safeTotal}
          </span>
          <button
            type="button"
            className="Pagination__btn Pagination__btn--icon"
            onClick={() => goTo(safeCurrent + 1)}
            disabled={isLast}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>
      </nav>
    );
  }

  // ── default + text-buttons ───────────────────────────────────────────────

  const isText = variant === 'text-buttons';
  const pages = buildPageList(safeCurrent, safeTotal, siblingCount, boundaryCount);

  return (
    <nav
      aria-label={ariaLabel}
      className={buildClassName(
        'Pagination',
        `Pagination--${variant}`,
        className,
      )}
      style={style}
    >
      <div className="Pagination__group">
        <button
          type="button"
          className={buildClassName(
            'Pagination__btn',
            !isText && 'Pagination__btn--icon',
          )}
          onClick={() => goTo(safeCurrent - 1)}
          disabled={isFirst}
          aria-label="Previous page"
        >
          {isText ? 'Previous' : <ChevronLeft />}
        </button>

        {pages.map((p, i) => {
          if (p === 'ellipsis-left' || p === 'ellipsis-right') {
            return (
              <span
                key={`${p}-${i}`}
                className="Pagination__btn Pagination__btn--ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            );
          }
          const active = p === safeCurrent;
          return (
            <button
              key={p}
              type="button"
              className={buildClassName(
                'Pagination__btn',
                active && 'Pagination__btn--active',
              )}
              onClick={() => goTo(p)}
              aria-current={active ? 'page' : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          className={buildClassName(
            'Pagination__btn',
            !isText && 'Pagination__btn--icon',
          )}
          onClick={() => goTo(safeCurrent + 1)}
          disabled={isLast}
          aria-label="Next page"
        >
          {isText ? 'Next' : <ChevronRight />}
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
