import type { CSSProperties, ReactNode } from 'react';

import './Badge.scss';
import Spinner, { type SpinnerColor } from '../Spinner/Spinner';
import { buildClassName } from '../../util';

export type BadgeColor =
  | 'gray'
  | 'white'
  | 'brand'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info';

export type BadgeSize = 'sm' | 'lg';

export type BadgeType =
  | 'default'
  | 'avatar'
  | 'dot'
  | 'loader'
  | 'secondary-text';

export type BadgeProps = {
  color?: BadgeColor;
  size?: BadgeSize;
  type?: BadgeType;
  children: ReactNode;
  /** Slot used by `type="secondary-text"`. */
  secondaryText?: ReactNode;
  /** Slot used by `type="avatar"` — typically an <img> or initials node. */
  avatar?: ReactNode;
  /** Override the leading icon for `type="default"`. Pass `false` to hide. */
  icon?: ReactNode | false;
  /** Square icon-only badge. */
  iconOnly?: boolean;
  /** Square text/number-only badge (e.g. notification counts). */
  textOnly?: boolean;
  /** When set, renders a trailing close button. */
  onClose?: () => void;
  closeAriaLabel?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const InfoIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="8" cy="5.25" r="0.7" fill="currentColor" />
  </svg>
);

const CloseIcon = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

// Map BadgeColor → SpinnerColor preset so the loader picks up the same accent
// hue used by the rest of the badge.
const SPINNER_COLOR_BY_BADGE: Record<BadgeColor, SpinnerColor> = {
  gray:    'current',
  white:   'current',
  brand:   'brand',
  danger:  'danger',
  warning: 'warning',
  success: 'success',
  info:    'info',
};

// ─── Component ───────────────────────────────────────────────────────────────

const Badge: React.FC<BadgeProps> = ({
  color = 'gray',
  size = 'sm',
  type = 'default',
  children,
  secondaryText,
  avatar,
  icon,
  iconOnly,
  textOnly,
  onClose,
  closeAriaLabel = 'Remove',
  id,
  className,
  style,
}) => {
  const fullClassName = buildClassName(
    'Badge',
    `Badge--${color}`,
    `Badge--${size}`,
    !iconOnly && !textOnly && `Badge--${type}`,
    iconOnly && 'Badge--icon-only',
    textOnly && 'Badge--text-only',
    className,
  );

  // ── Square: icon-only ──────────────────────────────────────────────────────
  if (iconOnly) {
    return (
      <span id={id} className={fullClassName} style={style}>
        <span className="Badge__icon-wrap">{icon ?? <InfoIcon size={size === 'lg' ? 14 : 12} />}</span>
      </span>
    );
  }

  // ── Square: number/text-only ───────────────────────────────────────────────
  if (textOnly) {
    return (
      <span id={id} className={fullClassName} style={style}>
        <span className="Badge__text-only">{children}</span>
      </span>
    );
  }

  // ── Pill: leading element by `type` ────────────────────────────────────────
  let leading: ReactNode = null;

  if (type === 'avatar') {
    leading = <span className="Badge__avatar">{avatar}</span>;
  } else if (type === 'dot') {
    leading = <span className="Badge__dot" aria-hidden="true" />;
  } else if (type === 'loader') {
    leading = (
      <span className="Badge__loader">
        <Spinner
          size="xs"
          color={SPINNER_COLOR_BY_BADGE[color]}
          strokeWidth={size === 'lg' ? 1.5 : 1.25}
          ariaLabel="Loading"
        />
      </span>
    );
  } else if (type === 'default' && icon !== false) {
    leading = <span className="Badge__icon-wrap">{icon ?? <InfoIcon size={size === 'lg' ? 14 : 12} />}</span>;
  }

  return (
    <span id={id} className={fullClassName} style={style}>
      {leading}
      <span className="Badge__label">{children}</span>
      {type === 'secondary-text' && secondaryText !== undefined && (
        <>
          <span className="Badge__divider" aria-hidden="true" />
          <span className="Badge__secondary">{secondaryText}</span>
        </>
      )}
      {onClose && (
        <button
          type="button"
          className="Badge__close"
          aria-label={closeAriaLabel}
          onClick={onClose}
        >
          <CloseIcon size={size === 'lg' ? 12 : 10} />
        </button>
      )}
    </span>
  );
};

export default Badge;
