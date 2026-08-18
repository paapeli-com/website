import { heroDimensions } from './content';

/* Radar geometry, matching the landing page's scorecard chart. */
const CENTER = 100;
const RADIUS = 40;
const SAMPLE = [78, 62, 71, 58, 66];

function axisPoint(index: number, ratio: number, radius = RADIUS) {
  const angle = ((-90 + 72 * index) * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(angle) * radius * ratio,
    y: CENTER + Math.sin(angle) * radius * ratio,
  };
}

const ring = (ratio: number) =>
  SAMPLE.map((_, i) => {
    const { x, y } = axisPoint(i, ratio);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

const shape = SAMPLE.map((v, i) => {
  const { x, y } = axisPoint(i, v / 100);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(' ');

/** One isometric plate: a rhombus with a thin extruded side. */
function Plate({ y, width, className }: { y: number; width: number; className?: string }) {
  const h = width * 0.42;
  const d = 9;
  return (
    <g className={className}>
      <path
        d={`M${CENTER} ${y - h} L${CENTER + width} ${y} L${CENTER} ${y + h} L${CENTER - width} ${y} Z`}
        fill="var(--ai-green)"
        fillOpacity="0.05"
        stroke="var(--ai-green)"
        strokeOpacity="0.42"
        strokeWidth="1.1"
      />
      <path
        d={`M${CENTER - width} ${y} L${CENTER} ${y + h} L${CENTER} ${y + h + d} L${CENTER - width} ${y + d} Z`}
        fill="var(--ai-green)"
        fillOpacity="0.07"
        stroke="var(--ai-green)"
        strokeOpacity="0.22"
        strokeWidth="0.9"
      />
      <path
        d={`M${CENTER + width} ${y} L${CENTER} ${y + h} L${CENTER} ${y + h + d} L${CENTER + width} ${y + d} Z`}
        fill="var(--ai-green)"
        fillOpacity="0.03"
        stroke="var(--ai-green)"
        strokeOpacity="0.22"
        strokeWidth="0.9"
      />
    </g>
  );
}

/**
 * The hero illustration: four isometric layers rising into a radar chart,
 * wired across to the seven axes the model scores.
 *
 * Everything moves on CSS keyframes declared in theme.css — no JS, no
 * client component, and the whole thing stops under
 * `prefers-reduced-motion: reduce`.
 */
export function MethodologyVisual() {
  return (
    <div className="mv relative overflow-hidden rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] p-5 sm:p-6">
      {/* Faint grid + glow behind the stack. */}
      <div className="mv-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative grid items-center gap-5 sm:grid-cols-[auto_1fr]">
        {/* The seven axes. First in DOM → right-hand column in RTL. */}
        <ul className="order-2 space-y-1 sm:order-1">
          {heroDimensions.map((d, i) => (
            <li
              key={d.label}
              className="mv-row flex items-center gap-2.5 rounded-lg px-2.5 py-[7px]"
              style={{ animationDelay: `${i * 160}ms` }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)]">
                <d.icon className="h-[15px] w-[15px] text-[var(--ai-green)]" strokeWidth={1.6} />
              </span>
              <span className="text-[12.5px] text-[var(--ai-text)]">{d.label}</span>
            </li>
          ))}
        </ul>

        <svg
          viewBox="0 0 200 300"
          className="order-1 mx-auto w-full max-w-[240px] sm:order-2"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="mv-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--ai-green)" stopOpacity="0.34" />
              <stop offset="100%" stopColor="var(--ai-green)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stack, bottom plate first so upper plates paint over it. */}
          <Plate y={252} width={74} className="mv-plate mv-plate-4" />
          <Plate y={218} width={68} className="mv-plate mv-plate-3" />
          <Plate y={184} width={62} className="mv-plate mv-plate-2" />
          <Plate y={150} width={56} className="mv-plate mv-plate-1" />

          {/* Beam linking the stack to the chart above it. */}
          <line
            x1={CENTER}
            y1="150"
            x2={CENTER}
            y2="118"
            stroke="var(--ai-green)"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="3 4"
            className="mv-beam"
          />

          {/* Radar panel. */}
          <g className="mv-chart">
            <circle cx={CENTER} cy={CENTER} r="58" fill="url(#mv-core)" />
            <rect
              x="34"
              y="34"
              width="132"
              height="132"
              rx="10"
              fill="var(--ai-surface)"
              fillOpacity="0.55"
              stroke="var(--ai-green)"
              strokeOpacity="0.28"
              strokeWidth="1"
            />

            {[0.34, 0.67, 1].map((r) => (
              <polygon
                key={r}
                points={ring(r)}
                fill="none"
                stroke="var(--ai-green)"
                strokeOpacity="0.22"
                strokeWidth="0.8"
              />
            ))}

            {SAMPLE.map((_, i) => {
              const { x, y } = axisPoint(i, 1);
              return (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke="var(--ai-green)"
                  strokeOpacity="0.2"
                  strokeWidth="0.8"
                />
              );
            })}

            <polygon
              points={shape}
              fill="var(--ai-green)"
              fillOpacity="0.2"
              stroke="var(--ai-green)"
              strokeWidth="1.6"
              strokeLinejoin="round"
              className="mv-shape"
            />

            {/* Outer-ring markers: the ceiling each axis is scored against. */}
            {SAMPLE.map((_, i) => {
              const { x, y } = axisPoint(i, 1);
              return (
                <circle
                  key={`v${i}`}
                  cx={x}
                  cy={y}
                  r="1.7"
                  fill="var(--ai-orange)"
                  fillOpacity="0.5"
                  className="ai-dot-soft"
                  style={{ animationDelay: `${i * 320}ms` }}
                />
              );
            })}

            {/* Scored vertices — the only orange inside the chart, pulsing so
                the shape reads as live rather than a static diagram. */}
            {SAMPLE.map((v, i) => {
              const { x, y } = axisPoint(i, v / 100);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2.6"
                  fill="var(--ai-orange)"
                  className="ai-dot"
                  style={{ animationDelay: `${i * 240}ms` }}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
