"use client";

import { Bell, History, MapPin, Radar, Settings, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LiveMapVisual } from "./visuals";

/* ------------------------------------------------------------------ */
/* Animated preview of the Track web panel, shown on the landing so a  */
/* visitor can see the product "in use". Self-contained (no iframe,    */
/* no dev server): a browser-window frame around a mini sidebar, the   */
/* animated live map, and a cursor that loops to suggest interaction.  */
/* ------------------------------------------------------------------ */

const NAV = [
  { icon: MapPin, key: "map", active: true },
  { icon: Smartphone, key: "devices", active: false },
  { icon: Radar, key: "zones", active: false },
  { icon: History, key: "playback", active: false },
  { icon: Bell, key: "alerts", active: false },
  { icon: Settings, key: "settings", active: false },
] as const;

const COPY = {
  en: {
    heading: "One simple panel for the whole family",
    body: "Watch pets, kids, and vehicles on a single live map, with safe zones, history, and alerts. The same experience your customers get, ready to white-label.",
    nav: { map: "Live Map", devices: "Devices", zones: "Safe Zones", playback: "Playback", alerts: "Alerts", settings: "Settings" },
    status: "Buddy · Home zone",
    meta: "Online · 82% · 8 m",
  },
  fa: {
    heading: "یک پنل ساده برای کل خانواده",
    body: "حیوان خانگی، کودک و خودرو را روی یک نقشهٔ زنده ببینید، با محدودهٔ امن، تاریخچه و هشدار. همان تجربه‌ای که مشتریان شما می‌گیرند، آماده برای عرضه با برند خودتان.",
    nav: { map: "نقشهٔ زنده", devices: "دستگاه‌ها", zones: "محدوده‌های امن", playback: "بازپخش مسیر", alerts: "هشدارها", settings: "تنظیمات" },
    status: "باکی · محدودهٔ خانه",
    meta: "آنلاین · ۸۲٪ · ۸ متر",
  },
  ar: {
    heading: "لوحة واحدة بسيطة للعائلة كلها",
    body: "تابع الحيوانات الأليفة والأطفال والمركبات على خريطة مباشرة واحدة، مع المناطق الآمنة والسجل والتنبيهات. التجربة نفسها التي يحصل عليها عملاؤك، جاهزة لتحمل علامتك التجارية.",
    nav: { map: "الخريطة المباشرة", devices: "الأجهزة", zones: "المناطق الآمنة", playback: "إعادة التشغيل", alerts: "التنبيهات", settings: "الإعدادات" },
    status: "بادي · منطقة المنزل",
    meta: "متصل · 82% · 8 م",
  },
};

const CURSOR_CSS = `
@keyframes pp-cursor {
  0%   { transform: translate(0px, 0px); }
  25%  { transform: translate(180px, 60px); }
  45%  { transform: translate(120px, 150px); }
  70%  { transform: translate(240px, 120px); }
  100% { transform: translate(0px, 0px); }
}
@keyframes pp-click {
  0%, 60%, 100% { transform: scale(0); opacity: 0; }
  24%, 26% { transform: scale(1); opacity: .5; }
}
`;

export function PanelPreview() {
  const { language } = useLanguage();
  const copy = COPY[language];

  return (
    <section className="flex w-full flex-col items-center gap-10 bg-[#fafafa] px-6 py-14 sm:gap-12 sm:py-20">
      <div className="flex w-full max-w-[768px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{copy.heading}</h2>
        <p className="text-lg text-muted-foreground">{copy.body}</p>
      </div>

      <div className="relative w-full max-w-[1024px]">
        <style>{CURSOR_CSS}</style>

        {/* Browser window frame */}
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0px_20px_40px_-12px_rgba(29,41,61,0.25)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-green-500" />
              app.paapeli.com/track
            </div>
          </div>

          {/* App body */}
          <div className="flex h-[300px] sm:h-[420px]">
            {/* Mini sidebar */}
            <div className="hidden w-48 shrink-0 flex-col border-r border-[#e5e7eb] bg-white p-3 sm:flex">
              <div className="mb-4 flex items-center gap-2 px-1">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">P</span>
                <span className="text-sm font-semibold text-foreground">Paapeli Track</span>
              </div>
              {NAV.map(({ icon: Icon, key, active }) => (
                <div
                  key={key}
                  className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {copy.nav[key]}
                </div>
              ))}
            </div>

            {/* Map area */}
            <div className="relative min-w-0 flex-1 p-3">
              <LiveMapVisual className="h-full w-full" />

              {/* Floating status card */}
              <div className="absolute bottom-6 z-20 w-56 rounded-xl border border-[#e5e7eb] bg-white/95 p-3 shadow-lg backdrop-blur ltr:left-6 rtl:right-6">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">🐶</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{copy.status}</p>
                    <p className="text-[10px] text-muted-foreground">{copy.meta}</p>
                  </div>
                </div>
              </div>

              {/* Looping cursor + click ripple */}
              <div className="pointer-events-none absolute left-[38%] top-[30%] z-30" style={{ animation: "pp-cursor 7s ease-in-out infinite" }}>
                <span className="absolute -inset-2 rounded-full bg-primary/40" style={{ animation: "pp-click 7s ease-in-out infinite" }} />
                <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow">
                  <path d="M5 3l6 16 2-6 6-2z" fill="white" stroke="#1e2939" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
