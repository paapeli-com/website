import type { CSSProperties, ReactNode } from 'react';

import './Toast.scss';
import { buildClassName } from '../../util/buildClassName.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastColor =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type ToastProps = {
  /** Bold title text. */
  title?: ReactNode;
  /** Description / body. */
  children?: ReactNode;

  /** Theme — controls background, border, title color, and the iconShape color. */
  color?: ToastColor;

  /** Leading icon. */
  icon?: ReactNode;
  /** Wrap the icon in a soft tinted square (matches "Icon shape & …" variants). */
  iconShape?: boolean;
  /**
   * Override the icon-shape color when the toast itself is `default`.
   * Defaults to `brand` on default toasts; matches the toast color otherwise.
   */
  iconColor?: Exclude<ToastColor, 'default'>;
  /** Render a 1px vertical divider between the icon and the content. */
  iconDivider?: boolean;

  /** Avatar slot — typically a circular image. Mutually exclusive with `icon`. */
  avatar?: ReactNode;
  /** Larger illustration slot (rendered to the left of the content). */
  illustration?: ReactNode;

  /** Optional header bar above the body (e.g. "New notification"). */
  header?: ReactNode;
  /** Subtle metadata line under the description (timestamp etc.). */
  meta?: ReactNode;

  /** Footer action buttons row. */
  actions?: ReactNode;

  /** Progress bar (0–100). Renders below the description. */
  progress?: number;

  /** Show close button. The handler fires when clicked. */
  onClose?: () => void;
  closeAriaLabel?: string;

  /** Forwarded to the wrapper. Defaults to `polite`. */
  ariaLive?: 'polite' | 'assertive' | 'off';
  /** Wrapper role. Defaults to `status`. */
  role?: 'status' | 'alert';

  id?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 3l8 8M11 3l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── Component ───────────────────────────────────────────────────────────────

const Toast: React.FC<ToastProps> = ({
  title,
  children,
  color = 'default',
  icon,
  iconShape,
  iconColor,
  iconDivider,
  avatar,
  illustration,
  header,
  meta,
  actions,
  progress,
  onClose,
  closeAriaLabel = 'Dismiss',
  ariaLive = 'polite',
  role = 'status',
  id,
  className,
  style,
}) => {
  // For default (white) toasts, the icon-shape can stand out via its own color.
  // For themed toasts, icon-shape reuses the toast color unless explicitly overridden.
  const effectiveIconColor: Exclude<ToastColor, 'default'> =
    iconColor ?? (color !== 'default' ? color : 'brand');

  const wrapperClassName = buildClassName(
    'Toast',
    `Toast--${color}`,
    Boolean(header) && 'Toast--with-header',
    className,
  );

  // Pick which left visual to render (avatar > illustration > icon)
  const hasAvatar = avatar !== undefined;
  const hasIllustration = !hasAvatar && illustration !== undefined;
  const hasIcon = !hasAvatar && !hasIllustration && icon !== undefined;

  const leadingVisual = hasAvatar ? (
    <span className="Toast__avatar">{avatar}</span>
  ) : hasIllustration ? (
    <span className="Toast__illustration">{illustration}</span>
  ) : hasIcon ? (
    iconShape ? (
      <span
        className={buildClassName(
          'Toast__icon-shape',
          `Toast__icon-shape--${effectiveIconColor}`,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
    ) : (
      <span className="Toast__icon" aria-hidden="true">
        {icon}
      </span>
    )
  ) : null;

  return (
    <div
      id={id}
      role={role}
      aria-live={ariaLive}
      className={wrapperClassName}
      style={style}
    >
      {header && <div className="Toast__header">{header}</div>}

      <div className="Toast__body">
        {leadingVisual}
        {iconDivider && <span className="Toast__divider" aria-hidden="true" />}

        <div className="Toast__content">
          {title && <div className="Toast__title">{title}</div>}
          {children !== undefined && children !== null && children !== false && (
            <div className="Toast__description">{children}</div>
          )}
          {meta && <div className="Toast__meta">{meta}</div>}

          {progress !== undefined && (
            <div className="Toast__progress">
              <div className="Toast__progress-track">
                <div
                  className="Toast__progress-fill"
                  style={{ width: `${clamp(progress, 0, 100)}%` }}
                />
              </div>
              <span className="Toast__progress-label">{Math.round(progress)}%</span>
            </div>
          )}

          {actions && <div className="Toast__actions">{actions}</div>}
        </div>

        {onClose && (
          <button
            type="button"
            className="Toast__close"
            onClick={onClose}
            aria-label={closeAriaLabel}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
