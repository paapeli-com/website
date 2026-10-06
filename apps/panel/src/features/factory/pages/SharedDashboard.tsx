import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Link2Off, Loader2 } from "lucide-react";
import {
  setShareToken,
  sharedDashboardService,
  useListWidgetDefinitionsQuery,
  type DashboardWidget,
  type WidgetDefinition,
} from "@paapeli/api";
import { overrideActiveWorkspaceId } from "@paapeli/brand/workspace";
import { LanguageProvider } from "@/features/factory/contexts/LanguageContext";
import { TooltipProvider } from "@/features/factory/components/ui/tooltip";
import { Card } from "@/features/factory/components/ui/card";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useIsMobile } from "@/features/factory/hooks/use-mobile";
import {
  DEFAULT_DASHBOARD_SETTINGS,
  isoDurationToMs,
  resolveTimeZone,
  timeWindowMs,
} from "@/features/factory/lib/dashboardSettings";
import { DESKTOP_COLS, definitionFor, normalizeDefinition } from "@/features/factory/lib/dashboardDefinition";
import { fmtDateTime } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { WidgetBody } from "@/features/factory/components/dashboard/widgets";
import { isRTLLanguage, setAppLanguage, useAppLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";

const T = {
  loading: { en: "Loading dashboard…", ar: "جارٍ تحميل اللوحة…", fa: "در حال بارگذاری داشبورد…" },
  readOnly: { en: "Shared view, read-only", ar: "عرض مشترك، للقراءة فقط", fa: "نمای اشتراکی، فقط مشاهده" },
  expires: { en: "This link works until", ar: "هذا الرابط يعمل حتى", fa: "این لینک تا این زمان کار می‌کند:" },
  goneTitle: { en: "This link is no longer available", ar: "هذا الرابط لم يعد متاحًا", fa: "این لینک دیگر در دسترس نیست" },
  goneDesc: {
    en: "It has expired or was revoked. Ask whoever sent it to you for a new one.",
    ar: "انتهت صلاحيته أو تم إلغاؤه. اطلب رابطًا جديدًا ممن أرسله إليك.",
    fa: "لینک منقضی یا لغو شده است. از فرستنده بخواهید لینک تازه‌ای برایتان بفرستد.",
  },
  empty: { en: "This dashboard has no widgets yet.", ar: "لا توجد عناصر في هذه اللوحة بعد.", fa: "این داشبورد هنوز ویجتی ندارد." },
};

const ROW_H = 84;
const GAP = 12;
/** A shared view refreshes on its own, since nobody is there to press refresh. */
const MIN_REFRESH_MS = 30_000;
const DEFAULT_REFRESH_MS = 60_000;
/* The widgets ask for "the active workspace"; a link has none, and the API
   client replaces the scope with the link's token anyway. */
const SHARED_WORKSPACE = "shared";

const colLeft = (x: number) => `calc((100% - ${GAP * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS} * ${x} + ${GAP * x}px)`;
const colWidth = (w: number) => `calc((100% - ${GAP * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS} * ${w} + ${GAP * (w - 1)}px)`;
const rowTop = (y: number) => `${y * (ROW_H + GAP)}px`;
const rowHeight = (h: number) => `${h * ROW_H + GAP * (h - 1)}px`;

const LANGS: AppLanguage[] = ["en", "fa", "ar"];

function SharedDashboardView({ token }: { token: string }) {
  const lang = useAppLanguage();
  const rtl = isRTLLanguage(lang);
  const tt = (k: keyof typeof T) => T[k][lang] ?? T[k].en;
  const isMobile = useIsMobile();

  const dashboard = useQuery({
    queryKey: ["sharedDashboard", token],
    queryFn: () => sharedDashboardService.open(token),
    retry: false,
  });
  const defs = useListWidgetDefinitionsQuery(SHARED_WORKSPACE, PRODUCT_KEY, dashboard.isSuccess).data;
  const definition = useMemo(
    () => (dashboard.data ? normalizeDefinition(dashboard.data.definition) : null),
    [dashboard.data],
  );

  const settings = definition?.settings ?? DEFAULT_DASHBOARD_SETTINGS;
  const span = isoDurationToMs(settings.timeWindow.last) ?? 3_600_000;
  const timeZone = resolveTimeZone(settings.timeZone);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const every = Math.max(isoDurationToMs(settings.refreshInterval) ?? DEFAULT_REFRESH_MS, MIN_REFRESH_MS);
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [settings.refreshInterval]);

  useEffect(() => {
    if (dashboard.data?.name) document.title = dashboard.data.name;
  }, [dashboard.data?.name]);

  if (dashboard.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />{tt("loading")}
      </div>
    );
  }
  if (!dashboard.data || !definition) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Link2Off className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">{tt("goneTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{tt("goneDesc")}</p>
      </div>
    );
  }

  const windowFor = (w: DashboardWidget, def: WidgetDefinition | undefined): [number, number] => {
    const own = w.timeWindow && def?.capabilities?.supportsTimeWindow !== false ? timeWindowMs(w.timeWindow) : span;
    return [now - own, now];
  };

  const card = (w: DashboardWidget, style: React.CSSProperties) => {
    const def = definitionFor(defs, w);
    return (
      <Card key={w.id} style={style} className="flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-3 py-1.5">
          <span className="block truncate text-sm font-medium text-foreground">{w.title}</span>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-3">
          {defs ? (
            <WidgetBody
              widget={w}
              definition={def}
              dataSources={definition.dataSources}
              window={windowFor(w, def)}
              timeZone={timeZone}
              lang={lang}
            />
          ) : (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          )}
        </div>
      </Card>
    );
  };

  const desktop = definition.layouts.desktop;
  const rows = Math.max(1, ...Object.values(desktop).map((r) => r.y + r.h));
  const mobileOrder = [...definition.widgets].sort(
    (a, b) => (definition.layouts.mobile[a.id]?.y ?? 0) - (definition.layouts.mobile[b.id]?.y ?? 0),
  );

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="min-w-0 truncate text-lg font-bold text-foreground">{dashboard.data.name}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{tt("readOnly")}</span>
            <span>
              {tt("expires")} <span dir="ltr">{fmtDateTime(Date.parse(dashboard.data.expiresAt), timeZone)}</span>
            </span>
          </div>
        </div>
        {dashboard.data.description && (
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.data.description}</p>
        )}
      </header>

      <main className="p-4 lg:p-6">
        {definition.widgets.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">{tt("empty")}</p>
        ) : isMobile ? (
          <div className="flex flex-col" style={{ gap: GAP }}>
            {mobileOrder.map((w) =>
              card(w, { position: "relative", height: rowHeight(definition.layouts.mobile[w.id]?.h ?? 4) }),
            )}
          </div>
        ) : (
          <div className="relative w-full" style={{ minHeight: `${rows * (ROW_H + GAP)}px` }}>
            {definition.widgets.map((w) => {
              const r = desktop[w.id];
              if (!r) return null;
              return card(w, {
                position: "absolute",
                insetInlineStart: colLeft(r.x),
                top: rowTop(r.y),
                width: colWidth(r.w),
                height: rowHeight(r.h),
              });
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * A dashboard opened through a share link: no session, no shell, nothing to
 * edit. The page puts the API client in share mode before anything is
 * fetched, so the same widgets that draw a signed-in dashboard read through
 * the link instead.
 */
export default function SharedDashboard() {
  const { token = "" } = useParams<{ token: string }>();
  const [search] = useSearchParams();
  // Before the first render of anything that fetches: an initializer runs once, synchronously.
  useState(() => {
    setShareToken(token);
    overrideActiveWorkspaceId(SHARED_WORKSPACE);
    // The sender's language, when the link carries it.
    const lang = search.get("lang") as AppLanguage | null;
    if (lang && LANGS.includes(lang)) setAppLanguage(lang);
  });

  return (
    <LanguageProvider>
      <TooltipProvider>
        <SharedDashboardView token={token} />
      </TooltipProvider>
    </LanguageProvider>
  );
}
