import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';

import './Breadcrumb.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type BreadcrumbVariant = 'default' | 'background';

export type BreadcrumbItem = {
  /** Stable id, used as React key. Falls back to the index if omitted. */
  id?: string;
  label: ReactNode;
  /** Leading icon (or any element) shown before the label. */
  icon?: ReactNode;
  /** Renders the item as a pill (rounded surface with border + bg). */
  pill?: boolean;
  /** Marks the item as the active/current crumb (different text color). */
  active?: boolean;
  /** Renders a trailing chevron-down indicator (treats the crumb as a menu trigger). */
  dropdown?: boolean;
  /** Renders the crumb as an `<a>` with this href. */
  href?: string;
  /** Click handler. When set without href, the crumb is a `<button>`. */
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
  /** Optional element appended after the label (e.g. a `<Badge>`). */
  badge?: ReactNode;
  /** Hides the chevron separator that follows this item. */
  hideSeparator?: boolean;
  ariaLabel?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  variant?: BreadcrumbVariant;
  /** Custom node used as the separator. Defaults to a chevron-right icon. */
  separator?: ReactNode;
  /** Adds back/forward arrow buttons before the crumbs. */
  withGroupButtons?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  backDisabled?: boolean;
  forwardDisabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const ChevronRightIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronLeftIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 4l-4 4 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Item ────────────────────────────────────────────────────────────────────

type ItemProps = {
  item: BreadcrumbItem;
  isLast: boolean;
};

const BreadcrumbItemView: React.FC<ItemProps> = ({ item, isLast }) => {
  const isActive = item.active ?? isLast;
  const interactive = Boolean(item.href || item.onClick);

  const itemClassName = buildClassName(
    'Breadcrumb__item',
    item.pill && 'Breadcrumb__item--pill',
    isActive && 'Breadcrumb__item--active',
    interactive && 'Breadcrumb__item--interactive',
    item.dropdown && 'Breadcrumb__item--has-dropdown',
  );

  const inner = (
    <>
      {item.icon && (
        <span className="Breadcrumb__item-icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="Breadcrumb__item-label">{item.label}</span>
      {item.badge && <span className="Breadcrumb__item-badge">{item.badge}</span>}
      {item.dropdown && (
        <span className="Breadcrumb__item-dropdown" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      )}
    </>
  );

  const ariaCurrent = isActive ? 'page' : undefined;

  if (item.href) {
    return (
      <a
        className={itemClassName}
        href={item.href}
        aria-current={ariaCurrent}
        aria-label={item.ariaLabel}
        aria-haspopup={item.dropdown || undefined}
        onClick={item.onClick}
      >
        {inner}
      </a>
    );
  }

  if (item.onClick || item.dropdown) {
    return (
      <button
        type="button"
        className={itemClassName}
        aria-current={ariaCurrent}
        aria-label={item.ariaLabel}
        aria-haspopup={item.dropdown || undefined}
        onClick={item.onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={itemClassName} aria-current={ariaCurrent} aria-label={item.ariaLabel}>
      {inner}
    </span>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  variant = 'default',
  separator,
  withGroupButtons,
  onBack,
  onForward,
  backDisabled,
  forwardDisabled,
  ariaLabel = 'Breadcrumb',
  id,
  className,
  style,
}) => {
  const fullClassName = buildClassName(
    'Breadcrumb',
    `Breadcrumb--${variant}`,
    withGroupButtons && 'Breadcrumb--with-group-buttons',
    className,
  );

  const sep = separator ?? <ChevronRightIcon />;

  return (
    <nav id={id} className={fullClassName} style={style} aria-label={ariaLabel}>
      {withGroupButtons && (
        <div className="Breadcrumb__group" role="group" aria-label="History navigation">
          <button
            type="button"
            className="Breadcrumb__group-btn"
            onClick={onBack}
            disabled={backDisabled}
            aria-label="Go back"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="Breadcrumb__group-btn"
            onClick={onForward}
            disabled={forwardDisabled}
            aria-label="Go forward"
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}

      <ol className="Breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const showSeparator = !isLast && !item.hideSeparator;

          return (
            <li key={item.id ?? index} className="Breadcrumb__list-item">
              <BreadcrumbItemView item={item} isLast={isLast} />
              {showSeparator && (
                <span className="Breadcrumb__separator" aria-hidden="true">
                  {sep}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
