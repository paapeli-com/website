import { BarChart3 } from 'lucide-react';
import { heroInputs, heroOutcomes } from './content';

/** Regular hexagon inscribed in a 100×100 box, flat-top. */
const HEX = '50,4 91,27 91,73 50,96 9,73 9,27';

/**
 * Hero diagram: four organisational inputs converge on a single "Impact"
 * core, which resolves into four outcomes.
 *
 * The flow is deliberately left-to-right — it is a process diagram, not
 * prose — so the frame is `dir="ltr"` while every Persian label inside stays
 * RTL. All motion is CSS keyframes in theme.css: no JS, no client component,
 * and it stops completely under `prefers-reduced-motion: reduce`.
 */
export function AboutVisual() {
  return (
    <div
      dir="ltr"
      className="av relative overflow-hidden rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-4 py-6 sm:px-6"
    >
      <div className="av-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Connector layer sits behind the cards and spans the whole frame. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Inputs → core. */}
        {[52, 108, 164, 220].map((y, i) => (
          <path
            key={`in-${y}`}
            d={`M172 ${y} C 205 ${y}, 205 130, 236 130`}
            fill="none"
            stroke="var(--ai-green)"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            className="av-flow"
            style={{ animationDelay: `${i * 260}ms` }}
          />
        ))}

        {/* Core → outcomes. */}
        {[46, 102, 158, 214].map((y, i) => (
          <path
            key={`out-${y}`}
            d={`M300 130 C 330 130, 330 ${y}, 356 ${y}`}
            fill="none"
            stroke="var(--ai-orange)"
            strokeOpacity="0.34"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            className="av-flow"
            style={{ animationDelay: `${400 + i * 260}ms` }}
          />
        ))}
      </svg>

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 sm:gap-4">
        {/* Inputs */}
        <ul className="space-y-2">
          {heroInputs.map((input, i) => (
            <li
              key={input.label}
              dir="rtl"
              className="av-card flex items-center gap-2 rounded-xl border border-[var(--ai-green-line)] bg-[var(--ai-surface)] px-2.5 py-2"
              style={{ animationDelay: `${i * 300}ms` }}
            >
              <input.icon
                className="h-[15px] w-[15px] shrink-0 text-[var(--ai-green)]"
                strokeWidth={1.7}
              />
              <span className="text-[10.5px] leading-[1.5] text-[var(--ai-text)]">
                {input.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Impact core */}
        <div className="av-core relative h-[104px] w-[104px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <radialGradient id="av-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--ai-green)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--ai-green)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#av-glow)" />
            <polygon
              points={HEX}
              fill="var(--ai-green)"
              fillOpacity="0.1"
              stroke="var(--ai-green)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <polygon
              points={HEX}
              fill="none"
              stroke="var(--ai-orange)"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeLinejoin="round"
              className="av-halo"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <BarChart3 className="h-4 w-4 text-[var(--ai-green)]" strokeWidth={1.8} />
            <span className="text-[10.5px] font-semibold text-[var(--ai-text)]">Impact</span>
          </div>
        </div>

        {/* Outcomes */}
        <ul className="space-y-2">
          {heroOutcomes.map((label, i) => (
            <li
              key={label}
              className="av-chip rounded-lg border border-[var(--ai-orange-line)] bg-[var(--ai-surface)] px-2.5 py-1.5 text-center text-[10px] font-medium text-[var(--ai-text)]"
              style={{ animationDelay: `${i * 300 + 500}ms` }}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
