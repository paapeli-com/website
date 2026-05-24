import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import { useState } from 'react';

import './BottomNav.scss';
import { buildClassName } from '../../util/buildClassName.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BottomNavVariant =
  | 'default'          // icons + labels, no dividers
  | 'bordered'         // icons + labels, vertical divider between cells
  | 'action-button'    // icon-only pill nav with a circular accent button in the center
  | 'pagination'       // icon-only nav with a centered page selector
  | 'segment-controls';// stacked segmented toggle above an icon-only nav row

export type BottomNavItem = {
  id: string;
  icon?: ReactNode;
  label?: ReactNode;
  /** Render as `<a href>` instead of `<button>`. */
  href?: string;
  /** Marks the item visually active. Auto-derived from `activeId` if omitted. */
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
};

export type BottomNavSegment = {
  id: string;
  label: ReactNode;
};

export type BottomNavActionButton = {
  icon: ReactNode;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  variant?: BottomNavVariant;

  /** Controlled active item id. */
  activeId?: string;
  /** Initial active item id (uncontrolled). */
  defaultActiveId?: string;
  onItemChange?: (id: string, item: BottomNavItem) => void;

  // ── action-button variant ──────────────────────────────────────────
  /** Center action button rendered between the two halves of `items`. */
  actionButton?: BottomNavActionButton;

  // ── pagination variant ─────────────────────────────────────────────
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  // ── segment-controls variant ───────────────────────────────────────
  segments?: BottomNavSegment[];
  activeSegmentId?: string;
  defaultActiveSegmentId?: string;
  onSegmentChange?: (id: string, segment: BottomNavSegment) => void;

  ariaLabel?: string;
  id?: string;
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

// ─── Item view ───────────────────────────────────────────────────────────────

type ItemViewProps = {
  item: BottomNavItem;
  activeId?: string;
  onLeafClick: (item: BottomNavItem, e: ReactMouseEvent<HTMLElement>) => void;
  showLabel: boolean;
};

const ItemView: React.FC<ItemViewProps> = ({
  item,
  activeId,
  onLeafClick,
  showLabel,
}) => {
  const isActive = item.active ?? activeId === item.id;

  const itemClassName = buildClassName(
    'BottomNav__item',
    isActive && 'BottomNav__item--active',
    item.disabled && 'BottomNav__item--disabled',
  );

  const handleClick = (e: ReactMouseEvent<HTMLElement>) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    onLeafClick(item, e);
    item.onClick?.(e);
  };

  const inner = (
    <>
      {item.icon && (
        <span className="BottomNav__item-icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      {showLabel && item.label !== undefined && (
        <span className="BottomNav__item-label">{item.label}</span>
      )}
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        className={itemClassName}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={item.disabled || undefined}
        onClick={handleClick}
        title={
          !showLabel && typeof item.label === 'string' ? item.label : undefined
        }
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={itemClassName}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={item.disabled || undefined}
      disabled={item.disabled}
      onClick={handleClick}
      title={
        !showLabel && typeof item.label === 'string' ? item.label : undefined
      }
    >
      {inner}
    </button>
  );
};

// ─── BottomNav ───────────────────────────────────────────────────────────────

const BottomNav: React.FC<BottomNavProps> = ({
  items,
  variant = 'default',
  activeId: controlledActive,
  defaultActiveId,
  onItemChange,
  actionButton,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  segments,
  activeSegmentId: controlledSegment,
  defaultActiveSegmentId,
  onSegmentChange,
  ariaLabel = 'Bottom navigation',
  id,
  className,
  style,
}) => {
  const [internalActive, setInternalActive] = useState<string | undefined>(
    defaultActiveId,
  );
  const isActiveControlled = controlledActive !== undefined;
  const activeId = isActiveControlled ? controlledActive : internalActive;

  const [internalSegment, setInternalSegment] = useState<string | undefined>(
    defaultActiveSegmentId ?? segments?.[0]?.id,
  );
  const isSegmentControlled = controlledSegment !== undefined;
  const activeSegment = isSegmentControlled ? controlledSegment : internalSegment;

  const handleLeafClick = (
    item: BottomNavItem,
    _e: ReactMouseEvent<HTMLElement>,
  ) => {
    if (!isActiveControlled) setInternalActive(item.id);
    onItemChange?.(item.id, item);
  };

  const handleSegmentClick = (seg: BottomNavSegment) => {
    if (!isSegmentControlled) setInternalSegment(seg.id);
    onSegmentChange?.(seg.id, seg);
  };

  const showLabel = variant === 'default' || variant === 'bordered';

  // ── action-button variant ────────────────────────────────────────────
  if (variant === 'action-button') {
    const middle = Math.floor(items.length / 2);
    const left = items.slice(0, middle);
    const right = items.slice(middle);

    return (
      <nav
        id={id}
        aria-label={ariaLabel}
        className={buildClassName(
          'BottomNav',
          'BottomNav--action-button',
          className,
        )}
        style={style}
      >
        {left.map((item) => (
          <ItemView
            key={item.id}
            item={item}
            activeId={activeId}
            onLeafClick={handleLeafClick}
            showLabel={false}
          />
        ))}

        {actionButton && (
          <button
            type="button"
            className="BottomNav__action"
            onClick={actionButton.onClick}
            disabled={actionButton.disabled}
            aria-label={actionButton.ariaLabel}
          >
            <span className="BottomNav__action-icon" aria-hidden="true">
              {actionButton.icon}
            </span>
          </button>
        )}

        {right.map((item) => (
          <ItemView
            key={item.id}
            item={item}
            activeId={activeId}
            onLeafClick={handleLeafClick}
            showLabel={false}
          />
        ))}
      </nav>
    );
  }

  // ── pagination variant ───────────────────────────────────────────────
  if (variant === 'pagination') {
    const middle = Math.floor(items.length / 2);
    const left = items.slice(0, middle);
    const right = items.slice(middle);

    const safeTotal = Math.max(1, totalPages);
    const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);
    const isFirst = safeCurrent <= 1;
    const isLast = safeCurrent >= safeTotal;

    const goTo = (p: number) => {
      const clamped = Math.min(Math.max(1, p), safeTotal);
      if (clamped !== safeCurrent) onPageChange?.(clamped);
    };

    return (
      <nav
        id={id}
        aria-label={ariaLabel}
        className={buildClassName(
          'BottomNav',
          'BottomNav--pagination',
          className,
        )}
        style={style}
      >
        {left.map((item) => (
          <ItemView
            key={item.id}
            item={item}
            activeId={activeId}
            onLeafClick={handleLeafClick}
            showLabel={false}
          />
        ))}

        <div className="BottomNav__pager">
          <button
            type="button"
            className="BottomNav__pager-btn"
            onClick={() => goTo(safeCurrent - 1)}
            disabled={isFirst}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>
          <span className="BottomNav__pager-label">
            {safeCurrent} of {safeTotal}
          </span>
          <button
            type="button"
            className="BottomNav__pager-btn"
            onClick={() => goTo(safeCurrent + 1)}
            disabled={isLast}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>

        {right.map((item) => (
          <ItemView
            key={item.id}
            item={item}
            activeId={activeId}
            onLeafClick={handleLeafClick}
            showLabel={false}
          />
        ))}
      </nav>
    );
  }

  // ── segment-controls variant ─────────────────────────────────────────
  if (variant === 'segment-controls') {
    return (
      <nav
        id={id}
        aria-label={ariaLabel}
        className={buildClassName(
          'BottomNav',
          'BottomNav--segment-controls',
          className,
        )}
        style={style}
      >
        {segments && segments.length > 0 && (
          <div className="BottomNav__segments" role="tablist">
            {segments.map((seg) => {
              const isActive = activeSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  role="tab"
                  className={buildClassName(
                    'BottomNav__segment',
                    isActive && 'BottomNav__segment--active',
                  )}
                  aria-selected={isActive}
                  onClick={() => handleSegmentClick(seg)}
                >
                  {seg.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="BottomNav__row">
          {items.map((item) => (
            <ItemView
              key={item.id}
              item={item}
              activeId={activeId}
              onLeafClick={handleLeafClick}
              showLabel={false}
            />
          ))}
        </div>
      </nav>
    );
  }

  // ── default + bordered ───────────────────────────────────────────────
  return (
    <nav
      id={id}
      aria-label={ariaLabel}
      className={buildClassName(
        'BottomNav',
        `BottomNav--${variant}`,
        className,
      )}
      style={style}
    >
      {items.map((item) => (
        <ItemView
          key={item.id}
          item={item}
          activeId={activeId}
          onLeafClick={handleLeafClick}
          showLabel={showLabel}
        />
      ))}
    </nav>
  );
};

export default BottomNav;
