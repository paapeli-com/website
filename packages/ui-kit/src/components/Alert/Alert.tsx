import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';

import './Alert.scss';
import Badge, { type BadgeColor } from '../Badge/Badge';
import { buildClassName } from '../../util';

export type AlertColor = 'success' | 'danger' | 'warning' | 'info' | 'default';

export type AlertType = 'default' | 'complex' | 'small' | 'border-top';

export type AlertProps = {
  type?: AlertType;
  color?: AlertColor;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode | false;
  action?: ReactNode;
  badge?: ReactNode;
  trailing?: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
  id?: string;
  className?: string;
  role?: 'alert' | 'status' | 'alertdialog';
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────
// Small set of icons used across alert variants. Inlined to avoid pulling in
// an icon font for a single component.

const InfoIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    className="Alert__icon"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 9.25v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
  </svg>
);

const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// AlertColor → BadgeColor (1:1 — Badge gained `info` for parity).
const BADGE_COLOR_BY_ALERT: Record<AlertColor, BadgeColor> = {
  success: 'success',
  danger:  'danger',
  warning: 'warning',
  info:    'info',
  default: 'gray',
};

const ChevronRightIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 3l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

const Alert: React.FC<AlertProps> = ({
  type = 'default',
  color = 'info',
  title,
  children,
  icon,
  action,
  badge,
  trailing,
  onClose,
  closeAriaLabel = 'Dismiss',
  id,
  className,
  role = 'alert',
  style,
}) => {
  const fullClassName = buildClassName(
    'Alert',
    `Alert--${type}`,
    `Alert--${color}`,
    className,
  );

  const showIcon = icon !== false && type !== 'small';
  const renderedIcon = icon ?? <InfoIcon size={type === 'complex' ? 20 : 18} />;

  // ── Small (pill) layout ────────────────────────────────────────────────────
  if (type === 'small') {
    // Auto-wrap primitive `badge` content in a <Badge> coloured to match the
    // alert. Pass a ReactElement directly to retain full control.
    const renderedBadge = isValidElement(badge)
      ? badge
      : badge !== undefined && badge !== null && badge !== false
        ? <Badge size="sm" color={BADGE_COLOR_BY_ALERT[color]}>{badge}</Badge>
        : null;

    return (
      <div id={id} role={role} className={fullClassName} style={style}>
        {renderedBadge}
        <span className="Alert__message">{children}</span>
        <span className="Alert__trailing">
          {trailing ?? <ChevronRightIcon />}
        </span>
      </div>
    );
  }

  // ── Complex (block w/ heading + body + action) ─────────────────────────────
  if (type === 'complex') {
    return (
      <div id={id} role={role} className={fullClassName} style={style}>
        <div className="Alert__header">
          {showIcon && <span className="Alert__icon-wrap">{renderedIcon}</span>}
          {title && <h4 className="Alert__title">{title}</h4>}
          {onClose && (
            <button
              type="button"
              className="Alert__close"
              aria-label={closeAriaLabel}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <div className="Alert__body">{children}</div>
        {action && <div className="Alert__actions">{action}</div>}
      </div>
    );
  }

  // ── Default + Border-top (single-line w/ optional close) ───────────────────
  return (
    <div id={id} role={role} className={fullClassName} style={style}>
      {showIcon && <span className="Alert__icon-wrap">{renderedIcon}</span>}
      <span className="Alert__message">
        {title && <strong className="Alert__title-inline">{title} </strong>}
        {children}
      </span>
      {trailing}
      {onClose && (
        <button
          type="button"
          className="Alert__close"
          aria-label={closeAriaLabel}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default Alert;
