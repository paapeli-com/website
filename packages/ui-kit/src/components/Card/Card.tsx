import type {
  AriaRole,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from 'react';

import './Card.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type CardProps = {
  children?: ReactNode;

  /** Override the default 24px padding. Pass `0` for image-flush layouts. */
  padding?: number | string;
  /** Hide the subtle drop shadow. */
  flat?: boolean;
  /** Hide the border. */
  borderless?: boolean;

  // Pass-throughs for clickable / semantic cards
  onClick?: MouseEventHandler<HTMLDivElement>;
  role?: AriaRole;
  tabIndex?: number;
  ariaLabel?: string;

  id?: string;
  className?: string;
  style?: CSSProperties;
};

const Card: React.FC<CardProps> = ({
  children,
  padding,
  flat,
  borderless,
  onClick,
  role,
  tabIndex,
  ariaLabel,
  id,
  className,
  style,
}) => {
  const fullClassName = buildClassName(
    'Card',
    flat && 'Card--flat',
    borderless && 'Card--borderless',
    onClick && 'Card--interactive',
    className,
  );

  const cssPadding =
    padding === undefined
      ? undefined
      : typeof padding === 'number'
        ? `${padding}px`
        : padding;

  return (
    <div
      id={id}
      className={fullClassName}
      style={{ ...(cssPadding !== undefined && { padding: cssPadding }), ...style }}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

export default Card;
