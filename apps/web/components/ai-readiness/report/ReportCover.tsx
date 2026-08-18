import { BrandLockup } from '../Logos';
import { IRAN_PATH } from '../iran';
import { report } from './content';

/** Bar heights for the skyline under the map. Fixed, not random — a random
 *  walk would differ between server and client render. */
const BARS = [18, 32, 24, 46, 30, 58, 38, 68, 44, 80, 52, 64, 36, 48, 26, 34, 20];

/** Dots picked to sit inside the silhouette; these are the orange ones that
 *  twinkle over the green dot-field. */
const HOTSPOTS = [
  { x: 34, y: 34 },
  { x: 58, y: 46 },
  { x: 45, y: 62 },
  { x: 72, y: 58 },
  { x: 26, y: 44 },
];

/**
 * The report cover, built as HTML + SVG rather than a flat image so the
 * Persian type stays crisp and selectable and the artwork can animate.
 *
 * All motion is CSS keyframes in theme.css: no JS, no client component, and
 * it stops completely under `prefers-reduced-motion: reduce`.
 */
export function ReportCover() {
  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      {/* Glow pooling under the book. */}
      <div className="rc-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="rc-book relative aspect-[3/4] overflow-hidden rounded-l-xl rounded-r-sm border border-[var(--ai-border)] bg-[image:linear-gradient(155deg,#0e1a16_0%,#0a1310_55%,#0d1a15_100%)] shadow-[0_36px_80px_-32px_rgba(0,0,0,0.95)]">
        {/* Spine: books in an RTL cover mock open from the right. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-3 bg-[image:linear-gradient(90deg,rgba(0,0,0,0.55),transparent)]"
        />
        {/* Light sweeping across the board. */}
        <div className="rc-sheen pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative flex h-full flex-col px-6 py-7">
          <p className="flex items-center gap-2 text-[11px] text-[var(--ai-muted)]">
            <span className="h-px w-6 bg-[var(--ai-green)]" />
            گزارش جامع
          </p>

          <h2 className="mt-2 text-[19px] font-bold leading-[1.7] text-white">
            وضعیت هوش مصنوعی در ایران
          </h2>

          <p className="mt-2 text-[10.5px] leading-[1.9] text-[var(--ai-dim)]">
            {report.subtitle}
          </p>

          {/* Dotted map over an analytics skyline. */}
          <div className="relative mt-4 flex-1">
            <svg viewBox="0 0 100 118" className="h-full w-full" aria-hidden="true">
              <defs>
                <pattern id="rc-dots" width="3.6" height="3.6" patternUnits="userSpaceOnUse">
                  <circle cx="1.8" cy="1.8" r="0.72" fill="var(--ai-green)" />
                </pattern>
                <clipPath id="rc-iran">
                  <path d={IRAN_PATH} />
                </clipPath>
                <linearGradient id="rc-bar" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--ai-green)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--ai-green)" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g clipPath="url(#rc-iran)" opacity="0.85">
                <rect x="0" y="0" width="100" height="100" fill="url(#rc-dots)" />
              </g>

              {/* A handful of nodes light up inside the country. */}
              {HOTSPOTS.map((p, i) => (
                <circle
                  key={`${p.x}-${p.y}`}
                  cx={p.x}
                  cy={p.y}
                  r="1.5"
                  fill="var(--ai-orange)"
                  className="rc-hot"
                  style={{ animationDelay: `${i * 620}ms` }}
                />
              ))}

              {/* Skyline: the data underneath the map. */}
              <g>
                {BARS.map((h, i) => (
                  <rect
                    key={i}
                    x={i * 5.9 + 1}
                    y={118 - h * 0.24}
                    width="3.1"
                    height={h * 0.24}
                    rx="1"
                    fill="url(#rc-bar)"
                    className="rc-bar"
                    style={{ animationDelay: `${i * 110}ms` }}
                  />
                ))}
              </g>
            </svg>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-[var(--ai-border-soft)] pt-4">
            <BrandLockup className="scale-[0.78] origin-right" />
            <span className="text-[10.5px] text-[var(--ai-dim)]">شماره {report.number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
