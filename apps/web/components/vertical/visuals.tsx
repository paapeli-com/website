"use client";

import { Baby, Car, Dog, MapPin, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Reusable hero / showcase visuals for the vertical landing template. */
/* These are self-contained SVG graphics — no external assets needed — */
/* styled with the brand's orange primary. Swap any of them for real   */
/* renders or photography later without touching the page structure.   */
/* ------------------------------------------------------------------ */

type Pin = { icon: LucideIcon; label: string; top: string; left: string; tint: string; delay: string };

const MAP_PINS: Pin[] = [
  { icon: Dog, label: "Buddy", top: "34%", left: "30%", tint: "bg-primary", delay: "0s" },
  { icon: Baby, label: "Mia", top: "58%", left: "58%", tint: "bg-[#0088b3]", delay: "0.6s" },
  { icon: Car, label: "Car", top: "26%", left: "70%", tint: "bg-[#1e2939]", delay: "1.2s" },
];

/* Route the traveling GPS dot follows (pet → car). */
const ROUTE_PATH = "M180 165 C 250 210 300 250 360 265 S 420 130 425 128";

/* Scoped keyframes for the live-map animations. Names are prefixed to  */
/* avoid any collision with global styles.                              */
const MAP_ANIM_CSS = `
@keyframes lm-dash { to { stroke-dashoffset: -1000; } }
@keyframes lm-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes lm-breathe { 0%, 100% { opacity: .7; } 50% { opacity: 1; } }
`;

/* A stylised, animated "live map" with a geofence, a route trail, a    */
/* traveling GPS dot, a radar sweep and floating pin markers.           */
const MAP_COPY = {
  en: { live: "Live tracking", status: "Buddy is inside the Home zone", meta: "Updated 12 seconds ago · 8 m accuracy", safe: "Safe" },
  fa: { live: "ردیابی زنده", status: "باکی داخل محدودهٔ خانه است", meta: "۱۲ ثانیه پیش به‌روز شد · دقت ۸ متر", safe: "امن" },
  ar: { live: "تتبّع مباشر", status: "بادي داخل منطقة المنزل", meta: "تم التحديث قبل 12 ثانية · دقة 8 م", safe: "آمن" },
};

export function LiveMapVisual({ className }: { className?: string }) {
  const { language } = useLanguage();
  const copy = MAP_COPY[language];

  return (
    <div
      className={cn(
        "relative aspect-[600/470] w-full overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1),0px_4px_6px_-4px_rgba(29,41,61,0.1)]",
        className,
      )}
    >
      <style>{MAP_ANIM_CSS}</style>

      <svg
        viewBox="0 0 600 470"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <rect width="600" height="470" fill="#f6f7f9" />
        <rect x="40" y="60" width="150" height="110" rx="14" fill="#eef3ee" />
        <rect x="410" y="300" width="150" height="120" rx="14" fill="#eef3ee" />
        <rect x="250" y="200" width="120" height="90" rx="12" fill="#eef1f5" />
        <path
          d="M-20 360 C 120 320 180 420 320 380 S 520 300 620 340"
          fill="none"
          stroke="#dbeafe"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <g stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round">
          <line x1="0" y1="120" x2="600" y2="120" />
          <line x1="0" y1="250" x2="600" y2="250" />
          <line x1="0" y1="400" x2="600" y2="400" />
          <line x1="120" y1="0" x2="120" y2="470" />
          <line x1="300" y1="0" x2="300" y2="470" />
          <line x1="460" y1="0" x2="460" y2="470" />
        </g>
        <g stroke="#eceef1" strokeWidth="4" strokeLinecap="round">
          <line x1="0" y1="185" x2="600" y2="185" />
          <line x1="0" y1="325" x2="600" y2="325" />
          <line x1="210" y1="0" x2="210" y2="470" />
          <line x1="380" y1="0" x2="380" y2="470" />
        </g>

        {/* Radar sweep expanding from the geofence centre */}
        <circle cx="185" cy="175" fill="none" stroke="hsl(28 100% 50%)" strokeWidth="2">
          <animate attributeName="r" values="12;98" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Geofence — flowing dashes + gentle breathing opacity */}
        <circle
          cx="185"
          cy="175"
          r="98"
          fill="hsl(28 100% 50% / 0.08)"
          stroke="hsl(28 100% 50%)"
          strokeWidth="2.5"
          strokeDasharray="7 7"
          style={{ animation: "lm-dash 12s linear infinite, lm-breathe 3s ease-in-out infinite" }}
        />

        {/* Route trail — dashes flowing from pet to car */}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="hsl(28 100% 50%)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="3 9"
          opacity="0.7"
          style={{ animation: "lm-dash 1.6s linear infinite" }}
        />

        {/* Traveling GPS dot moving along the route */}
        <g>
          <circle r="7" fill="#fff" />
          <circle r="4.5" fill="hsl(28 100% 50%)" />
          <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear" path={ROUTE_PATH} />
        </g>
      </svg>

      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/70" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        {copy.live}
      </div>

      {MAP_PINS.map(({ icon: Icon, label, top, left, tint, delay }) => (
        <div key={label} className="absolute -translate-x-1/2 -translate-y-full" style={{ top, left }}>
          <div
            className="flex flex-col items-center"
            style={{ animation: "lm-float 3s ease-in-out infinite", animationDelay: delay }}
          >
            <span
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full text-white shadow-[0px_4px_10px_rgba(29,41,61,0.25)] ring-2 ring-white",
                tint,
              )}
            >
              {/* Pulsing radar ring behind each marker */}
              <span
                className={cn("absolute inset-0 rounded-full opacity-50 motion-safe:animate-ping", tint)}
                style={{ animationDelay: delay }}
              />
              <Icon className="relative size-[18px]" />
            </span>
            <span className="-mt-0.5 size-2 rotate-45 rounded-[2px] bg-white ring-1 ring-[#e5e7eb]" />
          </div>
        </div>
      ))}

      <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white/95 p-3 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] backdrop-blur">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fff6ef]">
          <MapPin className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{copy.status}</p>
          <p className="truncate text-xs text-muted-foreground">{copy.meta}</p>
        </div>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{copy.safe}</span>
      </div>
    </div>
  );
}

/* A generic, brand-styled "orbit" graphic for verticals that don't    */
/* ship a bespoke visual. Concentric rings around a central icon with   */
/* small orbiting nodes.                                                */
export function OrbitVisual({
  icon: Icon,
  nodes = [],
  className,
}: {
  icon: LucideIcon;
  nodes?: LucideIcon[];
  className?: string;
}) {
  const positions = [
    { top: "8%", left: "50%" },
    { top: "50%", left: "92%" },
    { top: "92%", left: "50%" },
    { top: "50%", left: "8%" },
  ];
  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-gradient-to-br from-[#fff7f0] to-white shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1),0px_4px_6px_-4px_rgba(29,41,61,0.1)]",
        className,
      )}
    >
      <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(28 100% 50% / 0.18)" />
            <stop offset="100%" stopColor="hsl(28 100% 50% / 0)" />
          </radialGradient>
        </defs>
        <rect width="520" height="520" fill="url(#orbit-glow)" />
        {[90, 150, 210].map((r) => (
          <circle key={r} cx="260" cy="260" r={r} fill="none" stroke="#f0d8c2" strokeWidth="1.5" strokeDasharray="4 8" />
        ))}
      </svg>

      {/* central icon */}
      <span className="absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[0px_12px_30px_rgba(213,99,0,0.35)]">
        <Icon className="size-11" strokeWidth={1.5} />
      </span>

      {/* orbiting nodes */}
      {nodes.slice(0, 4).map((NodeIcon, i) => (
        <span
          key={i}
          className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-primary shadow-[0px_4px_10px_rgba(29,41,61,0.12)]"
          style={positions[i]}
        >
          <NodeIcon className="size-6" />
        </span>
      ))}
    </div>
  );
}
