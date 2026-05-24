import type { CSSProperties, MouseEvent as ReactMouseEvent, RefObject } from 'react';
import { useRef, useState } from 'react';

import RippleEffect from '../RippleEffect/RippleEffect';
import Spinner from '../Spinner/Spinner';

import './Button.scss';
import { NoneToVoidFunction } from '../../types';
import { useLastCallback } from '../../hooks';
import { buildClassName, IS_TOUCH_ENV } from '../../util';

export type ButtonColor =
  | 'brand'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'dark';

export type ButtonSize = 'xs' | 'sm' | 'base' | 'l' | 'xl';

export type ButtonProps = {
  ref?: RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  size?: ButtonSize;
  color?: ButtonColor;
  outline?: boolean;
  iconOnly?: boolean;
  withIcon?: boolean;
  id?: string;
  className?: string;
  fluid?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  ariaControls?: string;
  hasPopup?: boolean;
  href?: string;
  download?: string;
  disabled?: boolean;
  nonInteractive?: boolean;
  allowDisabledClick?: boolean;
  noFastClick?: boolean;
  ripple?: boolean;
  tabIndex?: number;
  isRtl?: boolean;
  isActive?: boolean;
  shouldStopPropagation?: boolean;
  style?: CSSProperties;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onContextMenu?: (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseEnter?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: NoneToVoidFunction;
  onFocus?: NoneToVoidFunction;
  onTransitionEnd?: NoneToVoidFunction;
};

const CLICKED_TIMEOUT = 400;

const Button: React.FC<ButtonProps> = ({
  ref,
  type = 'button',
  id,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  children,
  size = 'base',
  color = 'brand',
  outline,
  iconOnly,
  withIcon,
  className,
  fluid,
  isActive,
  isLoading,
  onTransitionEnd,
  ariaLabel,
  ariaControls,
  hasPopup,
  href,
  download,
  disabled,
  nonInteractive,
  allowDisabledClick,
  noFastClick = color === 'danger',
  ripple,
  tabIndex,
  isRtl,
  shouldStopPropagation,
  style,
}) => {
  let elementRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  if (ref) {
    elementRef = ref;
  }

  const [isClicked, setIsClicked] = useState(false);

  const isNotInteractive = disabled || nonInteractive;

  const fullClassName = buildClassName(
    'Button',
    className,
    `size-${size}`,
    `color-${color}`,
    outline && 'outline',
    fluid && 'fluid',
    iconOnly && 'icon-only',
    withIcon && 'with-icon',
    isActive && 'active',
    isNotInteractive && 'disabled',
    nonInteractive && 'non-interactive',
    allowDisabledClick && 'click-allowed',
    isLoading && 'loading',
    ripple && 'has-ripple',
    isClicked && 'clicked',
  );

  const handleClick = useLastCallback((e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    if ((allowDisabledClick || !isNotInteractive) && onClick) {
      onClick(e);
    }

    if (shouldStopPropagation) e.stopPropagation();

    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, CLICKED_TIMEOUT);
  });

  if (href) {
    return (
      <a
        ref={elementRef as RefObject<HTMLAnchorElement>}
        id={id}
        className={fullClassName}
        href={href}
        title={ariaLabel}
        download={download}
        tabIndex={tabIndex}
        dir={isRtl ? 'rtl' : undefined}
        aria-label={ariaLabel}
        aria-controls={ariaControls}
        style={style}
        onTransitionEnd={onTransitionEnd}
        target="_blank"
        rel="noreferrer"
      >
        {children}
        {!isNotInteractive && ripple && <RippleEffect />}
      </a>
    );
  }

  return (
    <button
      ref={elementRef as RefObject<HTMLButtonElement>}
      id={id}
      type={type}
      className={fullClassName}
      onClick={IS_TOUCH_ENV || noFastClick ? handleClick : handleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter && !isNotInteractive ? onMouseEnter : undefined}
      onMouseLeave={onMouseLeave && !isNotInteractive ? onMouseLeave : undefined}
      onTransitionEnd={onTransitionEnd}
      onFocus={onFocus && !isNotInteractive ? onFocus : undefined}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-haspopup={hasPopup}
      title={ariaLabel}
      tabIndex={tabIndex}
      dir={isRtl ? 'rtl' : undefined}
      style={style}
      disabled={disabled && !allowDisabledClick}
    >
      {isLoading ? (
        <span className="Button__loading">
          <span className="Button__label-hidden">{children}</span>
          <Spinner size="small" color={outline ? 'current' : 'white'} track={false} />
        </span>
      ) : (
        children
      )}
      {!isNotInteractive && ripple && <RippleEffect />}
    </button>
  );
};

export default Button;
