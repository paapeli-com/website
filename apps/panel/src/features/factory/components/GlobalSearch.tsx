import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Box, MapPin, Bell, AlertTriangle, Clock } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";

interface ResultItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  path: string;
  group: "Devices" | "Locations" | "Alarms" | "AI Assets";
}

const ALL: ResultItem[] = [
  { id: "d1", title: "Pump P101", subtitle: "DEV-101 · Pump", icon: Box, path: "/devices", group: "Devices" },
  { id: "d2", title: "Compressor C3", subtitle: "DEV-205 · Compressor", icon: Box, path: "/devices", group: "Devices" },
  { id: "d3", title: "Motor M12", subtitle: "DEV-322 · Motor", icon: Box, path: "/devices", group: "Devices" },
  { id: "l1", title: "Qazvin > Factory A > Sulfonation > Line 1", subtitle: "Production line", icon: MapPin, path: "/locations", group: "Locations" },
  { id: "l2", title: "Qazvin > Factory B > Processing > Line 2", subtitle: "Production line", icon: MapPin, path: "/locations", group: "Locations" },
  { id: "a1", title: "High Temperature Alarm", subtitle: "Active · Critical", icon: AlertTriangle, path: "/alarms", group: "Alarms" },
  { id: "a2", title: "Device Offline", subtitle: "Rule", icon: Bell, path: "/alarms", group: "Alarms" },
  { id: "ai1", title: "Pump P101 — failure predicted", subtitle: "RUL 3 days", icon: AlertTriangle, path: "/aiot/forecast-failures", group: "AI Assets" },
  { id: "ai2", title: "Furnace Fan F2 — risk medium", subtitle: "RUL 18 days", icon: AlertTriangle, path: "/aiot/forecast-failures", group: "AI Assets" },
];

const GROUP_ORDER: ResultItem["group"][] = ["Devices", "Locations", "Alarms", "AI Assets"];

const DICT = {
  en: {
    search: "Search",
    startTyping: "Start typing to search devices, locations and alarms.",
    recent: "Recent Searches",
    noResults: (q: string) => `No results for “${q}”.`,
    Devices: "Devices",
    Locations: "Locations",
    Alarms: "Alarms",
    "AI Assets": "AI Assets",
  },
  fa: {
    search: "جستجو",
    startTyping: "برای جستجوی دستگاه‌ها، مکان‌ها و ... شروع به تایپ کنید.",
    recent: "جستجوهای اخیر",
    noResults: (q: string) => `نتیجه‌ای برای «${q}» یافت نشد.`,
    Devices: "دستگاه‌ها",
    Locations: "مکان‌ها",
    Alarms: "هشدارها",
    "AI Assets": "دارایی‌های هوشمند",
  },
  ar: {
    search: "بحث",
    startTyping: "ابدأ بالكتابة للبحث عن الأجهزة والمواقع والتنبيهات.",
    recent: "عمليات البحث الأخيرة",
    noResults: (q: string) => `لا توجد نتائج لـ "${q}".`,
    Devices: "الأجهزة",
    Locations: "المواقع",
    Alarms: "التنبيهات",
    "AI Assets": "أصول الذكاء الاصطناعي",
  },
} as const;

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const { isRTL, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const d = DICT[language as keyof typeof DICT] ?? DICT.en;
  const localeFont = language === "fa" || language === "ar" ? "text-[15px]" : "text-sm";
  const localeResultFont = language === "fa" || language === "ar" ? "text-[15px]" : "text-sm";
  const localeSubFont = language === "fa" || language === "ar" ? "text-[12px]" : "text-[11px]";
  const localeSectionFont = language === "fa" || language === "ar" ? "text-[12px]" : "text-[10px]";

  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("paapeli-recent-search") || "[]");
      if (Array.isArray(r)) setRecent(r.slice(0, 5));
    } catch {}
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as ResultItem[];
    return ALL.filter(
      (r) => r.title.toLowerCase().includes(q) || (r.subtitle?.toLowerCase().includes(q) ?? false),
    ).slice(0, 12);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<ResultItem["group"], ResultItem[]>();
    filtered.forEach((r) => {
      const arr = map.get(r.group) || [];
      arr.push(r);
      map.set(r.group, arr);
    });
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  const handleSelect = (item: ResultItem) => {
    const next = [item.title, ...recent.filter((r) => r !== item.title)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem("paapeli-recent-search", JSON.stringify(next)); } catch {}
    setOpen(false);
    setQuery("");
    navigate(lp(item.path));
  };

  const handleRecent = (term: string) => {
    setQuery(term);
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className="relative w-[280px] sm:w-[320px]">
      <Search
        className={`pointer-events-none absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]`}
      />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={d.search}
        className={`w-full h-10 ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"} ${localeFont} font-normal text-foreground placeholder:text-[#9CA3AF] placeholder:font-normal bg-[#F8F9FB] dark:bg-muted/40 border border-[#E5E7EB] dark:border-border rounded-xl outline-none transition-colors hover:border-[#CBD5E1] focus:border-primary focus:ring-2 focus:ring-primary/20`}
      />

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] start-0 w-[360px] max-w-[90vw] bg-popover text-popover-foreground border border-border rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className={`max-h-[420px] overflow-y-auto ${localeFont}`}>
            {query.trim() === "" && (
              <>
                {recent.length > 0 ? (
                  <Section title={d.recent}>
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRecent(r)}
                        className={`w-full flex items-center gap-2 px-3 py-2 ${localeFont} hover:bg-muted text-start`}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{r}</span>
                      </button>
                    ))}
                  </Section>
                ) : (
                  <div className={`px-3 py-6 text-center ${language === "en" ? "text-xs" : "text-sm"} text-muted-foreground`}>
                    {d.startTyping}
                  </div>
                )}
              </>
            )}

            {query.trim() !== "" && grouped.length === 0 && (
              <div className={`px-3 py-6 text-center ${language === "en" ? "text-xs" : "text-sm"} text-muted-foreground`}>
                {d.noResults(query)}
              </div>
            )}

            {grouped.map(({ group, items }) => (
              <Section key={group} title={d[group]}>
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => handleSelect(it)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 ${localeFont} hover:bg-muted text-start`}
                  >
                    <it.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{it.title}</div>
                      {it.subtitle && (
                        <div className={`${localeSubFont} text-muted-foreground truncate`}>{it.subtitle}</div>
                      )}
                    </div>
                  </button>
                ))}
              </Section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-1.5">
    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </div>
    <div>{children}</div>
  </div>
);
