import type { CSSProperties, ReactNode } from 'react';

import './Skeleton.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type SkeletonVariant = 'rect' | 'circle' | 'image';

export type SkeletonProps = {
  variant?: SkeletonVariant;
  /** Width — `number` is interpreted as px, otherwise passed through. */
  width?: number | string;
  /** Height — same handling as width. */
  height?: number | string;
  /** Shorthand for circle: sets both width and height. */
  size?: number | string;
  /** Override border-radius. Numbers are px. */
  rounded?: number | string;
  /** Disable the pulse animation. Defaults to `true`. */
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCss(v?: number | string): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

const ImageIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className="Skeleton__image-icon"
  >
    <path
      d="M6 22l5.5-6 4 4 4-5L26 22H6z"
      fill="currentColor"
      fillOpacity="0.85"
    />
    <circle cx="22" cy="11" r="2" fill="currentColor" fillOpacity="0.85" />
  </svg>
);

// ─── Skeleton primitive ──────────────────────────────────────────────────────

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  size,
  rounded,
  animate = true,
  className,
  style,
}) => {
  const fullClassName = buildClassName(
    'Skeleton',
    `Skeleton--${variant}`,
    animate && 'Skeleton--animate',
    className,
  );

  const dimensions: CSSProperties = {};
  const w = variant === 'circle' ? (size ?? width) : width;
  const h = variant === 'circle' ? (size ?? height) : height;

  const cssW = toCss(w);
  const cssH = toCss(h);
  if (cssW) dimensions.width = cssW;
  if (cssH) dimensions.height = cssH;
  if (rounded !== undefined) dimensions.borderRadius = toCss(rounded);

  return (
    <span
      className={fullClassName}
      aria-hidden="true"
      style={{ ...dimensions, ...style }}
    >
      {variant === 'image' && <ImageIcon />}
    </span>
  );
};

export default Skeleton;

// ─── Shared layout wrapper ───────────────────────────────────────────────────

type LayoutWrapperProps = {
  type: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

const Layout: React.FC<LayoutWrapperProps> = ({
  type,
  children,
  className,
  style,
  ariaLabel = 'Loading',
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-label={ariaLabel}
    className={buildClassName('SkeletonLayout', `SkeletonLayout--${type}`, className)}
    style={style}
  >
    {children}
  </div>
);

// ─── Layouts (mirror the six Figma variants pixel-for-pixel) ─────────────────

export type SkeletonLayoutProps = {
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
  ariaLabel?: string;
};

// Card + Image · 384×241
export const SkeletonCardImage: React.FC<SkeletonLayoutProps> = ({
  animate, className, style, ariaLabel,
}) => (
  <Layout type="card-image" className={className} style={style} ariaLabel={ariaLabel}>
    <Skeleton variant="image" width="100%" height={144} animate={animate} />
    <div className="SkeletonLayout__lines">
      <Skeleton width="50%"  height={8} animate={animate} />
      <Skeleton width="92%"  height={8} animate={animate} />
      <Skeleton width="62%"  height={8} animate={animate} />
    </div>
    <div className="SkeletonLayout__avatar-row">
      <Skeleton variant="circle" size={20} animate={animate} />
      <Skeleton width={92} height={6} animate={animate} />
      <Skeleton width={56} height={6} animate={animate} />
    </div>
  </Layout>
);

// Image + Text · 600×180
export const SkeletonImageText: React.FC<SkeletonLayoutProps> = ({
  animate, className, style, ariaLabel,
}) => (
  <Layout type="image-text" className={className} style={style} ariaLabel={ariaLabel}>
    <Skeleton variant="image" width={216} height={180} animate={animate} />
    <div className="SkeletonLayout__lines">
      <Skeleton width="60%" height={8} animate={animate} />
      <Skeleton width="92%" height={8} animate={animate} />
      <Skeleton width="80%" height={8} animate={animate} />
      <Skeleton width="70%" height={8} animate={animate} />
      <Skeleton width="55%" height={8} animate={animate} />
    </div>
  </Layout>
);

// Text · 640×96
export const SkeletonText: React.FC<SkeletonLayoutProps> = ({
  animate, className, style, ariaLabel,
}) => (
  <Layout type="text" className={className} style={style} ariaLabel={ariaLabel}>
    <Skeleton width="80%" height={10} animate={animate} />
    <Skeleton width="50%" height={10} animate={animate} />
    <div className="SkeletonLayout__avatar-row">
      <Skeleton variant="circle" size={20} animate={animate} />
      <Skeleton width={64} height={6} animate={animate} />
      <Skeleton width={36} height={6} animate={animate} />
    </div>
  </Layout>
);

// Simple text · 640×116 — paragraph with mixed-width segments
export const SkeletonSimpleText: React.FC<SkeletonLayoutProps> = ({
  animate, className, style, ariaLabel,
}) => (
  <Layout type="simple-text" className={className} style={style} ariaLabel={ariaLabel}>
    <Skeleton width="100%" height={8} animate={animate} />
    <Skeleton width="55%"  height={8} animate={animate} />
    <div className="SkeletonLayout__inline">
      <Skeleton width="22%" height={8} animate={animate} />
      <Skeleton width="20%" height={8} animate={animate} />
      <Skeleton width="18%" height={8} animate={animate} />
    </div>
    <Skeleton width="92%" height={8} animate={animate} />
    <Skeleton width="48%" height={8} animate={animate} />
    <div className="SkeletonLayout__inline">
      <Skeleton width="20%" height={8} animate={animate} />
      <Skeleton width="22%" height={8} animate={animate} />
      <Skeleton width="18%" height={8} animate={animate} />
    </div>
    <Skeleton width="44%" height={8} animate={animate} />
  </Layout>
);

// List · 300×200
export type SkeletonListProps = SkeletonLayoutProps & { rows?: number };

export const SkeletonList: React.FC<SkeletonListProps> = ({
  rows = 5, animate, className, style, ariaLabel,
}) => (
  <Layout type="list" className={className} style={style} ariaLabel={ariaLabel}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="SkeletonLayout__list-row">
        <div className="SkeletonLayout__list-row-text">
          <Skeleton width="60%" height={8} animate={animate} />
          <Skeleton width="35%" height={6} animate={animate} />
        </div>
        <Skeleton width={12} height={6} animate={animate} />
      </div>
    ))}
  </Layout>
);

// Widget · 300×309
export type SkeletonWidgetProps = SkeletonLayoutProps & { bars?: number };

export const SkeletonWidget: React.FC<SkeletonWidgetProps> = ({
  bars = 7, animate, className, style, ariaLabel,
}) => (
  <Layout type="widget" className={className} style={style} ariaLabel={ariaLabel}>
    <div className="SkeletonLayout__widget-header">
      <Skeleton width="35%" height={8} animate={animate} />
      <Skeleton width="22%" height={6} animate={animate} />
    </div>
    <div className="SkeletonLayout__widget-bars">
      {Array.from({ length: bars }, (_, i) => (
        <Skeleton
          key={i}
          width={20}
          height="100%"
          rounded={6}
          animate={animate}
          className="SkeletonLayout__widget-bar"
        />
      ))}
    </div>
  </Layout>
);
