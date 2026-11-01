import type { ReactNode } from "react";
import type { WidgetLang } from "./types";

/* The sample pictures of the process-diagram widget, drawn here in SVG so they
   take the theme's colours and can move. Each is one scene on a 400×300 canvas.
   A scene is a sample until pictures can be uploaded; adding one is a function
   here, an entry in SCENES, and a value in the definition's `scene` enum. */

export interface SceneState {
  /** Rotating parts turn and fluid flows. Off in the picker's thumbnails. */
  running: boolean;
  /** Tank fill, 0 to 1. */
  level: number;
  /** Height of the moving part, 0 to 1. */
  travel: number;
}

const INK = "hsl(var(--foreground))";
const LINE = "hsl(var(--muted-foreground))";
const STEEL = "hsl(var(--muted-foreground) / 0.45)";
const PANEL = "hsl(var(--muted))";
const FLUID = "#0077B6";
const MUD = "#b7791f";

const MOTION_CSS = `
@keyframes pp-spin { to { transform: rotate(360deg) } }
@keyframes pp-flow { to { stroke-dashoffset: -24 } }
.pp-spin { transform-box: fill-box; transform-origin: center; animation: pp-spin 2.4s linear infinite }
.pp-spin-fast { transform-box: fill-box; transform-origin: center; animation: pp-spin 1s linear infinite }
.pp-flow { animation: pp-flow 1s linear infinite }
@media (prefers-reduced-motion: reduce) { .pp-spin, .pp-spin-fast, .pp-flow { animation: none } }
`;

const Spinner = ({ running, fast, children }: { running: boolean; fast?: boolean; children: ReactNode }) => (
  <g className={running ? (fast ? "pp-spin-fast" : "pp-spin") : undefined}>{children}</g>
);

/** A pipe with dashes that travel along it while the process runs. */
const Pipe = ({ d, running, color = FLUID }: { d: string; running: boolean; color?: string }) => (
  <>
    <path d={d} fill="none" stroke={PANEL} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeDasharray="8 4" className={running ? "pp-flow" : undefined} opacity={running ? 1 : 0.45} />
  </>
);

const Rotor = ({ cx, cy, r, running, fast }: { cx: number; cy: number; r: number; running: boolean; fast?: boolean }) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
    <Spinner running={running} fast={fast}>
      <circle cx={cx} cy={cy} r={r - 2} fill="none" />
      {[0, 60, 120].map((a) => (
        <line key={a} x1={cx - r + 3} y1={cy} x2={cx + r - 3} y2={cy} stroke={INK} strokeWidth={2} strokeLinecap="round" transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
    </Spinner>
    <circle cx={cx} cy={cy} r={2.5} fill={INK} />
  </>
);

const Tank = ({ x, y, w, h, level, color }: { x: number; y: number; w: number; h: number; level: number; color: string }) => {
  const fill = Math.max(0, Math.min(1, level)) * (h - 4);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <rect x={x + 2} y={y + h - 2 - fill} width={w - 4} height={fill} rx={6} fill={color} opacity={0.75} style={{ transition: "y .7s, height .7s" }} />
      {[0.25, 0.5, 0.75].map((m) => <line key={m} x1={x + w - 12} x2={x + w - 3} y1={y + h * m} y2={y + h * m} stroke={INK} strokeWidth={1} opacity={0.5} />)}
    </>
  );
};

function DrillingRig({ running, level, travel }: SceneState) {
  const block = 62 + (1 - travel) * 92;
  return (
    <>
      <rect x={0} y={232} width={400} height={68} fill={PANEL} />
      <path d="M0 232H400" stroke={LINE} strokeWidth={1.5} />
      {/* The wellbore under the rig floor. */}
      <rect x={152} y={232} width={16} height={68} fill="hsl(var(--background))" stroke={LINE} />
      <Pipe d="M160 232V296" running={running} color={MUD} />

      {/* Mast: a tapering tower seen from the side. */}
      <path d="M118 214L142 30H178L202 214" fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => {
        const t = 30 + i * 46;
        const b = t + 46;
        const lt = 142 - ((t - 30) / 184) * 24;
        const lb = 142 - ((b - 30) / 184) * 24;
        const rt = 178 + ((t - 30) / 184) * 24;
        const rb = 178 + ((b - 30) / 184) * 24;
        return <path key={i} d={`M${lt} ${t}L${rb} ${b}M${rt} ${t}L${lb} ${b}M${lb} ${b}H${rb}`} stroke={LINE} strokeWidth={1} />;
      })}
      <rect x={104} y={214} width={112} height={10} fill={STEEL} stroke={LINE} />
      <rect x={118} y={224} width={84} height={8} fill={STEEL} />

      {/* Crown, line and travelling block. */}
      <Rotor cx={160} cy={24} r={13} running={running} />
      <line x1={160} y1={37} x2={160} y2={block} stroke={INK} strokeWidth={1.5} />
      <g style={{ transition: "transform .7s", transform: `translateY(${block}px)` }}>
        <rect x={150} y={0} width={20} height={14} rx={3} fill={FLUID} />
        <path d="M160 14v6a6 6 0 1 1-6 6" fill="none" stroke={INK} strokeWidth={2} />
      </g>
      <line x1={160} y1={block + 28} x2={160} y2={214} stroke={LINE} strokeWidth={3} />

      {/* Rotary table on the floor. */}
      <ellipse cx={160} cy={213} rx={22} ry={6} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="6 6" className={running ? "pp-flow" : undefined} />

      {/* Mud line, pump and tank. */}
      <Pipe d="M300 222H232V206H176" running={running} />
      <Rotor cx={300} cy={208} r={20} running={running} fast />
      <rect x={278} y={228} width={44} height={5} fill={STEEL} />
      <Tank x={336} y={170} w={52} h={62} level={level} color={MUD} />
    </>
  );
}

function BlowoutPreventer({ running }: SceneState) {
  const ram = (y: number) => (
    <>
      <rect x={96} y={y} width={208} height={32} rx={4} fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      <rect x={64} y={y + 7} width={34} height={18} rx={3} fill={PANEL} stroke={LINE} />
      <rect x={302} y={y + 7} width={34} height={18} rx={3} fill={PANEL} stroke={LINE} />
      <rect x={178} y={y + 2} width={44} height={28} fill="hsl(var(--background))" stroke={LINE} />
    </>
  );
  return (
    <>
      <rect x={0} y={266} width={400} height={34} fill={PANEL} />
      <path d="M0 266H400" stroke={LINE} strokeWidth={1.5} />
      {/* Annular on top, two ram pairs, the wellhead below. */}
      <path d="M140 26H260L284 70H116Z" fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      {ram(78)}
      {ram(120)}
      <rect x={140} y={160} width={120} height={40} rx={4} fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      <rect x={126} y={200} width={148} height={10} fill={LINE} />
      <rect x={170} y={210} width={60} height={56} fill={STEEL} stroke={LINE} />
      <Pipe d="M200 300V0" running={running} color={MUD} />
      {/* Choke and kill lines either side. */}
      <Pipe d="M260 180H372V254" running={running} />
      <Pipe d="M140 180H28V254" running={running} />
      <circle cx={372} cy={258} r={7} fill={PANEL} stroke={LINE} />
      <circle cx={28} cy={258} r={7} fill={PANEL} stroke={LINE} />
    </>
  );
}

function MudCircuit({ running, level }: SceneState) {
  return (
    <>
      <Tank x={18} y={150} w={92} h={120} level={level} color={MUD} />
      <Tank x={150} y={150} w={92} h={120} level={level} color={MUD} />
      <Pipe d="M110 210H150" running={running} color={MUD} />
      <Pipe d="M242 240H304" running={running} color={MUD} />
      <Rotor cx={326} cy={240} r={22} running={running} fast />
      <rect x={302} y={264} width={48} height={6} fill={STEEL} />
      {/* Out to the well along the top and back through the shaker. */}
      <Pipe d="M326 218V40H64V118" running={running} color={MUD} />
      <path d="M36 118H92L84 150H44Z" fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      <path d="M44 128H84M48 138H80" stroke={INK} strokeWidth={1} />
      <rect x={176} y={22} width={44} height={36} rx={4} fill={PANEL} stroke={LINE} />
      <path d="M198 22V58M176 40H220" stroke={LINE} />
    </>
  );
}

function DrillBit({ running }: SceneState) {
  return (
    <>
      <rect x={0} y={0} width={400} height={300} fill={PANEL} />
      <path d="M0 60L70 40L150 72L250 44L330 70L400 48M0 150L80 170L170 142L260 168L400 140M0 236L90 214L190 244L300 216L400 240" fill="none" stroke={LINE} strokeWidth={1} opacity={0.5} />
      <rect x={136} y={0} width={128} height={300} fill="hsl(var(--background))" />
      <rect x={186} y={0} width={28} height={118} fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      <path d="M174 118H226L238 164H162Z" fill={STEEL} stroke={LINE} strokeWidth={1.5} />
      <Pipe d="M200 0V150" running={running} color={MUD} />
      <Rotor cx={162} cy={192} r={26} running={running} fast />
      <Rotor cx={238} cy={192} r={26} running={running} fast />
      <Rotor cx={200} cy={224} r={22} running={running} fast />
      {/* Mud returning up the annulus. */}
      <Pipe d="M150 150V0" running={running} />
      <Pipe d="M250 150V0" running={running} />
    </>
  );
}

function Drawworks({ running, travel }: SceneState) {
  return (
    <>
      <rect x={0} y={250} width={400} height={50} fill={PANEL} />
      <path d="M0 250H400" stroke={LINE} strokeWidth={1.5} />
      <rect x={40} y={232} width={320} height={18} fill={STEEL} stroke={LINE} />
      {/* Motor, gearbox and drum on one skid. */}
      <rect x={50} y={150} width={84} height={82} rx={8} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={62 + i * 14} x2={62 + i * 14} y1={160} y2={222} stroke={LINE} />)}
      <rect x={134} y={170} width={36} height={42} fill={STEEL} stroke={LINE} />
      <Rotor cx={250} cy={176} r={56} running={running} />
      {/* The line leaves the drum for the mast. */}
      <Pipe d="M250 120L340 24" running={running} color={INK} />
      <Rotor cx={348} cy={20} r={12} running={running} />
      <line x1={360} y1={20} x2={360} y2={40 + (1 - travel) * 170} stroke={INK} strokeWidth={1.5} />
      <rect x={351} y={40 + (1 - travel) * 170} width={18} height={12} rx={2} fill={FLUID} style={{ transition: "y .7s" }} />
    </>
  );
}

export const SCENES = {
  "drilling-rig": { draw: DrillingRig, label: { en: "Drilling rig", ar: "حفارة", fa: "دکل حفاری" } },
  "blowout-preventer": { draw: BlowoutPreventer, label: { en: "Blowout preventer", ar: "مانع الانفجار", fa: "فوران‌گیر (BOP)" } },
  "mud-circuit": { draw: MudCircuit, label: { en: "Mud circuit", ar: "دورة الطين", fa: "مدار گل حفاری" } },
  "drill-bit": { draw: DrillBit, label: { en: "Drill bit", ar: "رأس الحفر", fa: "مته" } },
  drawworks: { draw: Drawworks, label: { en: "Drawworks", ar: "المرفاع", fa: "وینچ اصلی" } },
} as const satisfies Record<string, { draw: (s: SceneState) => JSX.Element; label: Record<WidgetLang, string> }>;

export type SceneName = keyof typeof SCENES;
export const isScene = (name: unknown): name is SceneName => typeof name === "string" && name in SCENES;

/** A scene as an SVG that fills its box. */
export function Scene({ name, title, ...state }: SceneState & { name: SceneName; title?: string }) {
  const Draw = SCENES[name].draw;
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={title}>
      <style>{MOTION_CSS}</style>
      <Draw {...state} />
    </svg>
  );
}
