import type { CSSProperties, ReactNode } from 'react';

import './Banner.scss';
import { buildClassName } from '../../util';

export type BannerType =
  | 'default'
  | 'logo-button'
  | 'newsletter'
  | 'icon-link'
  | 'heading-description';

export type BannerProps = {
  type?: BannerType;
  /** Bold heading — used by `heading-description` type. */
  title?: ReactNode;
  /** Main text / body content. For `newsletter`, pass the entire form here. */
  children?: ReactNode;
  /**
   * Leading icon or logo.
   * - `default`      → small decorative icon shown left of text.
   * - `logo-button`  → logo shown before the vertical divider.
   * Pass `false` to suppress the default icon on `default` type.
   */
  icon?: ReactNode | false;
  /** Primary CTA slot — a `<Button>` or any element. */
  action?: ReactNode;
  /** Secondary CTA slot (e.g. "Learn more") — used by `heading-description`. */
  secondaryAction?: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ─────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MegaphoneIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2.5 6H5.5L11 3V13L5.5 10H2.5C2.5 10 2 10 2 9.5V6.5C2 6 2.5 6 2.5 6Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 10L6 13H7.5L7.5 10"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M13 5.5C13.8 6.3 13.8 9.7 13 10.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Banner: React.FC<BannerProps> = ({
  type = 'default',
  title,
  children,
  icon,
  action,
  secondaryAction,
  onClose,
  closeAriaLabel = 'Dismiss',
  id,
  className,
  style,
}) => {
  const fullClassName = buildClassName('Banner', `Banner--${type}`, className);

  const closeBtn = onClose ? (
    <button
      type="button"
      className="Banner__close"
      aria-label={closeAriaLabel}
      onClick={onClose}
    >
      <CloseIcon />
    </button>
  ) : null;

  // ── Default ──────────────────────────────────────────────────────────────────
  if (type === 'default') {
    const showIcon = icon !== false;
    const renderedIcon = icon ?? <MegaphoneIcon />;

    return (
      <div id={id} role="banner" className={fullClassName} style={style}>
        <div className="Banner__content">
          {showIcon && (
            <span className="Banner__icon-wrap" aria-hidden="true">
              {renderedIcon}
            </span>
          )}
          <span className="Banner__text">{children}</span>
        </div>
        {closeBtn}
      </div>
    );
  }

  // ── Logo + Button ─────────────────────────────────────────────────────────────
  if (type === 'logo-button') {
    return (
      <div id={id} role="banner" className={fullClassName} style={style}>
        {icon !== false && (
          <>
            <span className="Banner__logo" aria-hidden="true">
              {icon}
            </span>
            <span className="Banner__divider" aria-hidden="true" />
          </>
        )}
        <span className="Banner__text">{children}</span>
        {action && <div className="Banner__action">{action}</div>}
        {closeBtn}
      </div>
    );
  }

  // ── Newsletter ────────────────────────────────────────────────────────────────
  if (type === 'newsletter') {
    return (
      <div id={id} role="banner" className={fullClassName} style={style}>
        <div className="Banner__content">{children}</div>
        {closeBtn}
      </div>
    );
  }

  // ── Icon & Link ───────────────────────────────────────────────────────────────
  if (type === 'icon-link') {
    return (
      <div id={id} role="banner" className={fullClassName} style={style}>
        <div className="Banner__content">
          <span className="Banner__dot" aria-hidden="true" />
          <span className="Banner__text">{children}</span>
        </div>
        {closeBtn}
      </div>
    );
  }

  // ── Heading & Description ─────────────────────────────────────────────────────
  return (
    <div id={id} role="banner" className={fullClassName} style={style}>
      <div className="Banner__body">
        {title && <h4 className="Banner__title">{title}</h4>}
        {children && <p className="Banner__description">{children}</p>}
      </div>
      {(secondaryAction || action) && (
        <div className="Banner__actions">
          {secondaryAction}
          {action}
        </div>
      )}
      {closeBtn}
    </div>
  );
};

export default Banner;
