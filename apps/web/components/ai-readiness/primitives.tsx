import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1180px] px-5 sm:px-8 ${className ?? ''}`}>{children}</div>
  );
}

/** The small outlined capsule that labels each section. */
export function SectionPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--ai-green)]">
      {children}
    </span>
  );
}

/**
 * Pill + heading + optional lead paragraph, centred — repeated by every
 * section. `id` is what the parent <section> points its aria-labelledby at,
 * so the heading names its own region for assistive tech and for search
 * engines reading the outline.
 */
export function SectionHeading({
  id,
  pill,
  title,
  lead,
}: {
  id: string;
  pill: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <Reveal className="flex flex-col items-center text-center">
      <SectionPill>{pill}</SectionPill>
      <h2
        id={id}
        className="mt-5 text-[26px] font-bold leading-[1.5] text-[var(--ai-text)] sm:text-[32px] md:text-[38px]"
      >
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 max-w-[46rem] text-[14.5px] leading-[2] text-[var(--ai-muted)]">{lead}</p>
      ) : null}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)]';

/**
 * `tone="orange"` paints the button in Paapeli orange. It is reserved for the
 * persistent navbar CTA — the one action that should stay distinct from the
 * green in-page CTAs it scrolls past.
 */
export function PrimaryButton({
  href,
  children,
  size = 'md',
  tone = 'green',
  trailingIcon = true,
  className,
}: {
  href: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'green' | 'orange';
  /** Set false when the caller supplies its own leading icon instead. */
  trailingIcon?: boolean;
  className?: string;
}) {
  const sizing =
    size === 'sm' ? 'h-9 px-4 text-[13px]' : size === 'lg' ? 'h-[52px] px-8' : 'h-[46px] px-6';

  const palette =
    tone === 'orange'
      ? 'bg-[var(--ai-orange)] text-[#1a0d00] hover:bg-[var(--ai-orange-hover)] focus-visible:ring-[var(--ai-orange)]'
      : 'bg-[var(--ai-green-btn)] text-white hover:bg-[var(--ai-green-btn-hover)]';

  return (
    <Link href={href} className={`${buttonBase} ${sizing} ${palette} ${className ?? ''}`}>
      {children}
      {trailingIcon ? <ChevronLeft className="h-4 w-4" strokeWidth={2.5} /> : null}
    </Link>
  );
}

export function GhostButton({
  href,
  children,
  size = 'md',
  trailingIcon = true,
}: {
  href: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  trailingIcon?: boolean;
}) {
  const sizing = size === 'lg' ? 'h-[52px] px-8' : 'h-[46px] px-6';

  return (
    <Link
      href={href}
      className={`${buttonBase} ${sizing} border border-[var(--ai-border)] bg-[var(--ai-surface)] text-[var(--ai-text)] hover:border-[var(--ai-green-hover)] hover:bg-[var(--ai-surface-2)]`}
    >
      {children}
      {trailingIcon ? (
        <ChevronLeft className="h-4 w-4 text-[var(--ai-muted)]" strokeWidth={2.5} />
      ) : null}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Score primitives                                                    */
/* ------------------------------------------------------------------ */

export type Dimension = { label: string; value: number };

/** One `label — bar — value` row. Label sits at the start (right in RTL). */
export function ScoreBar({ label, value }: Dimension) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[5.5rem] shrink-0 text-[11.5px] text-[var(--ai-muted)]">{label}</span>
      <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-[var(--ai-surface-3)]">
        <span
          className="block h-full rounded-full bg-[var(--ai-green)]"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-left text-[12px] font-semibold tabular-nums text-[var(--ai-text)]">
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Radar chart                                                         */
/* ------------------------------------------------------------------ */

const CENTER = 100;
const RADIUS = 62;

/** Point on the i-th of `count` axes, at `ratio` (0–1) of the full radius. */
function axisPoint(index: number, count: number, ratio: number, radius = RADIUS) {
  const angle = ((-90 + (360 / count) * index) * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(angle) * radius * ratio,
    y: CENTER + Math.sin(angle) * radius * ratio,
  };
}

function polygon(count: number, ratio: number) {
  return Array.from({ length: count }, (_, i) => {
    const { x, y } = axisPoint(i, count, ratio);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/**
 * Pentagon radar plotting one score per dimension. Hand-rolled rather than
 * pulled from recharts: it is static, needs no client JS, and this way the
 * grid weight matches the rest of the card exactly.
 */
export function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const count = dimensions.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const shape = dimensions
    .map((d, i) => {
      const { x, y } = axisPoint(i, count, d.value / 100);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      {rings.map((r) => (
        <polygon
          key={r}
          points={polygon(count, r)}
          fill="none"
          stroke="var(--ai-border)"
          strokeWidth="1"
        />
      ))}

      {dimensions.map((_, i) => {
        const { x, y } = axisPoint(i, count, 1);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--ai-border)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={shape}
        fill="var(--ai-green)"
        fillOpacity="0.18"
        stroke="var(--ai-green)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Outer-ring markers: the ceiling each axis is scored against. */}
      {dimensions.map((d, i) => {
        const { x, y } = axisPoint(i, count, 1);
        return (
          <circle
            key={`ceiling-${d.label}`}
            cx={x}
            cy={y}
            r="1.9"
            fill="var(--ai-orange)"
            fillOpacity="0.5"
            className="ai-dot-soft"
            style={{ animationDelay: `${i * 320}ms` }}
          />
        );
      })}

      {/* Scored vertices — the only orange inside the chart, breathing so the
          shape reads as a live measurement rather than a static diagram. */}
      {dimensions.map((d, i) => {
        const { x, y } = axisPoint(i, count, d.value / 100);
        return (
          <circle
            key={d.label}
            cx={x}
            cy={y}
            r="2.8"
            fill="var(--ai-orange)"
            className="ai-dot"
            style={{ animationDelay: `${i * 240}ms` }}
          />
        );
      })}

      {dimensions.map((d, i) => {
        const { x, y } = axisPoint(i, count, 1, RADIUS + 20);
        // Always centre the label on its axis: `start`/`end` would flip with
        // the inherited RTL direction, and at this radius every label still
        // fits inside the 200-unit box.
        return (
          <text
            key={d.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ai-dim)"
            fontSize="8.5"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
