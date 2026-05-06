import type { CSSProperties } from 'react';

import './Spinner.scss';
import { buildClassName } from '../../util';

export type SpinnerSize = 'xs' | 'small' | 'medium' | 'base' | 'large';

/**
 * Preset color names map to design-system tokens via CSS custom properties.
 * Pass any CSS color string for a custom hue.
 */
export type SpinnerColor =
  | 'brand'
  | 'white'
  | 'current'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | (string & {});

export type SpinnerProps = {
  size?: SpinnerSize;
  color?: SpinnerColor;
  /** Show the muted background track. Defaults to true. */
  track?: boolean;
  /** Override stroke width in px. Defaults are size-derived. */
  strokeWidth?: number;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const SIZE_PX: Record<SpinnerSize, number> = {
  xs:     12,
  small:  24,
  medium: 50,
  base:   75,
  large:  100,
};

// Stroke widths sampled from the Figma reference (~size / 12, rounded).
const STROKE_PX: Record<SpinnerSize, number> = {
  xs:     1.25,
  small:  2,
  medium: 4,
  base:   6,
  large:  8,
};

// Map preset names to a CSS color expression. Anything else is passed through.
const PRESET_COLORS: Record<string, string> = {
  brand:   '#ff7900',
  white:   '#ffffff',
  current: 'currentColor',
  success: '#007a55',
  danger:  '#c70036',
  warning: '#ff5a1f',
  info:    '#1447e6',
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'brand',
  track = true,
  strokeWidth,
  ariaLabel = 'Loading',
  className,
  style,
}) => {
  const px = SIZE_PX[size];
  const stroke = strokeWidth ?? STROKE_PX[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // ~28% arc — matches the Figma quarter-ish spinner glyph.
  const dash = circumference * 0.28;

  const resolvedColor = PRESET_COLORS[color as string] ?? color;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={buildClassName('Spinner', `Spinner--${size}`, className)}
      style={{
        '--spinner-color': resolvedColor,
        width: px,
        height: px,
        ...style,
      } as CSSProperties}
    >
      <svg
        className="Spinner__svg"
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        aria-hidden="true"
      >
        {track && (
          <circle
            className="Spinner__track"
            cx={px / 2}
            cy={px / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
          />
        )}
        <circle
          className="Spinner__indicator"
          cx={px / 2}
          cy={px / 2}
          r={radius}
          stroke="var(--spinner-color)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
    </span>
  );
};

export default Spinner;
