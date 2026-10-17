import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BellRing, Clock, CheckCircle2, MapPin, Cpu, ListOrdered, Hourglass, type LucideIcon } from "lucide-react";
import { useGetAlarmAnalyticsQuery, type AlarmAnalytics } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { AXIS_TEXT, TOOLTIP_STYLE, compactNumber, useBoxSize } from "@/features/factory/components/dashboard/widgets/chartKit";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { cn } from "@/shared/lib/utils";

/* Alarm analytics, every figure aggregated by the gateway
 * (GET /alarms/{ws}/{pk}/analytics). The page asks for one window and gets a
 * fixed-size answer back, however many alarms the workspace holds.
 *
 * Severity is ordered, so it is drawn as one red ramp, darker for more severe
 * (lighter on the dark theme), validated as an ordinal ramp against both card
 * surfaces. ThingsBoard's five severities fold into the four the alarm list
 * shows: WARNING and INDETERMINATE are both "low". Single-series lists (rules,
 * devices, locations, ages) carry one colour and print their values. */

type Lang = "en" | "ar" | "fa";

const D: Record<string, Record<Lang, string>> = {
  range24h: { en: "24 hours", ar: "٢٤ ساعة", fa: "۲۴ ساعت" },
  range7d: { en: "7 days", ar: "٧ أيام", fa: "۷ روز" },
  range30d: { en: "30 days", ar: "٣٠ يومًا", fa: "۳۰ روز" },
  range90d: { en: "90 days", ar: "٩٠ يومًا", fa: "۹۰ روز" },
  alarmsRaised: { en: "Alarms raised", ar: "الإنذارات المُطلقة", fa: "هشدارهای ایجادشده" },
  criticalSub: { en: "{n} critical", ar: "{n} حرجة", fa: "{n} بحرانی" },
  openNow: { en: "Open now", ar: "مفتوحة الآن", fa: "باز در حال حاضر" },
  unackSub: { en: "{n} not acknowledged", ar: "{n} غير مُقرّ بها", fa: "{n} تأییدنشده" },
  mtta: { en: "Mean time to acknowledge", ar: "متوسط وقت الإقرار", fa: "میانگین زمان تا تأیید" },
  mttaSub: { en: "Across {n} acknowledged", ar: "من {n} إنذار مُقرّ به", fa: "از {n} هشدار تأییدشده" },
  mttr: { en: "Mean time to clear", ar: "متوسط وقت المسح", fa: "میانگین زمان تا رفع" },
  mttrSub: { en: "Across {n} cleared", ar: "من {n} إنذار ممسوح", fa: "از {n} هشدار رفع‌شده" },
  noAckYet: { en: "No acknowledgements in this range", ar: "لا إقرارات في هذا النطاق", fa: "در این بازه تأییدی ثبت نشده" },
  noClearYet: { en: "No clears in this range", ar: "لا مسح في هذا النطاق", fa: "در این بازه رفعی ثبت نشده" },
  overTime: { en: "Alarms over time", ar: "الإنذارات عبر الزمن", fa: "هشدارها در طول زمان" },
  bySeverity: { en: "By severity", ar: "حسب الخطورة", fa: "بر اساس شدت" },
  openByAge: { en: "Open alarms by age", ar: "عمر الإنذارات المفتوحة", fa: "سن هشدارهای باز" },
  openByAgeNote: { en: "Every alarm not cleared yet, whatever the range", ar: "كل إنذار لم يُمسح بعد، أيًا كان النطاق", fa: "همه‌ی هشدارهای رفع‌نشده، مستقل از بازه" },
  age1h: { en: "Under 1 hour", ar: "أقل من ساعة", fa: "کمتر از ۱ ساعت" },
  age1d: { en: "1 to 24 hours", ar: "من ساعة إلى ٢٤ ساعة", fa: "۱ تا ۲۴ ساعت" },
  age1w: { en: "1 to 7 days", ar: "من يوم إلى ٧ أيام", fa: "۱ تا ۷ روز" },
  ageOld: { en: "Over 7 days", ar: "أكثر من ٧ أيام", fa: "بیش از ۷ روز" },
  topRules: { en: "Noisiest rules", ar: "أكثر القواعد إطلاقًا", fa: "پرتکرارترین قانون‌ها" },
  topRulesNote: { en: "A rule that fires this often may need a better threshold", ar: "قاعدة تنطلق بهذا التكرار قد تحتاج عتبة أفضل", fa: "قانونی که این‌قدر فعال می‌شود احتمالا آستانه‌ی بهتری لازم دارد" },
  devicesSub: { en: "{n} devices", ar: "{n} أجهزة", fa: "{n} دستگاه" },
  topDevices: { en: "Most problematic devices", ar: "أكثر الأجهزة مشاكل", fa: "پرمشکل‌ترین دستگاه‌ها" },
  byLocation: { en: "By location", ar: "حسب الموقع", fa: "بر اساس مکان" },
  noLocation: { en: "No location", ar: "بلا موقع", fa: "بدون مکان" },
  removedDevice: { en: "Removed device", ar: "جهاز محذوف", fa: "دستگاه حذف‌شده" },
  total: { en: "Total", ar: "الإجمالي", fa: "مجموع" },
  noAlarmsInRange: { en: "No alarms in this range", ar: "لا إنذارات في هذا النطاق", fa: "در این بازه هشداری نیست" },
  nothingOpen: { en: "No open alarms", ar: "لا إنذارات مفتوحة", fa: "هشدار بازی وجود ندارد" },
  critical: { en: "Critical", ar: "حرجة", fa: "بحرانی" },
  high: { en: "High", ar: "عالية", fa: "بالا" },
  medium: { en: "Medium", ar: "متوسطة", fa: "متوسط" },
  low: { en: "Low", ar: "منخفضة", fa: "پایین" },
  sec: { en: "s", ar: " ثانية", fa: " ثانیه" },
  min: { en: "m", ar: " دقيقة", fa: " دقیقه" },
  hour: { en: "h", ar: " ساعة", fa: " ساعت" },
  day: { en: "d", ar: " يوم", fa: " روز" },
};

const RANGES = [
  { key: "range24h", hours: 24 },
  { key: "range7d", hours: 24 * 7 },
  { key: "range30d", hours: 24 * 30 },
  { key: "range90d", hours: 24 * 90 },
] as const;

type Level = "critical" | "high" | "medium" | "low";
/** Most severe first: legend and tooltip order. The stack draws it reversed. */
const LEVELS: Level[] = ["critical", "high", "medium", "low"];
const LEVEL_OF: Record<string, Level> = {
  CRITICAL: "critical",
  MAJOR: "high",
  MINOR: "medium",
  WARNING: "low",
  INDETERMINATE: "low",
};
const levelOf = (severity: string): Level => LEVEL_OF[severity?.toUpperCase()] ?? "low";
const LEVEL_FILL: Record<Level, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

const LOCALE: Record<Lang, string> = { en: "en-US", ar: "ar", fa: "fa-IR" };

/* The browser's zone, so a day bucket is the viewer's day. */
const viewerZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
})();

export const AlertAnalytics = () => {
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language as Lang;
  const tr = (k: keyof typeof D, n?: number) =>
    n === undefined ? D[k][lang] : D[k][lang].replace("{n}", formatNumber(n));
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [rangeHours, setRangeHours] = useState<number>(24 * 7);

  /* The window ends at the start of the next minute, so the query key holds
     still for a minute instead of changing on every render. */
  const params = useMemo(() => {
    const to = new Date(Math.ceil(Date.now() / 60_000) * 60_000);
    const from = new Date(to.getTime() - rangeHours * 3_600_000);
    return { from: from.toISOString(), to: to.toISOString(), timeZone: viewerZone, limit: 8 };
  }, [rangeHours]);
  const query = useGetAlarmAnalyticsQuery(workspaceId ?? "", PRODUCT_KEY, params);
  const data = query.data;

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds == null) return null;
    const s = Math.round(seconds);
    const part = (n: number, unit: keyof typeof D) => `${formatNumber(n)}${tr(unit)}`;
    if (s < 60) return part(s, "sec");
    const m = Math.floor(s / 60);
    if (m < 60) return part(m, "min");
    const h = Math.floor(m / 60);
    if (h < 24) return m % 60 ? `${part(h, "hour")} ${part(m % 60, "min")}` : part(h, "hour");
    const d = Math.floor(h / 24);
    return h % 24 ? `${part(d, "day")} ${part(h % 24, "hour")}` : part(d, "day");
  };

  if (query.isError && !data) return <LoadFailed onRetry={() => void query.refetch()} />;

  const s = data?.summary;
  const open = data?.openAlarms;
  // A null value is still loading; an empty measure shows NoDataValue.
  const kpis: { label: string; value: React.ReactNode; sub: string; icon: LucideIcon }[] = [
    { label: tr("alarmsRaised"), value: s ? formatNumber(s.total) : null, sub: s ? tr("criticalSub", s.critical) : "", icon: AlertTriangle },
    { label: tr("openNow"), value: open ? formatNumber(open.total) : null, sub: open ? tr("unackSub", open.unacknowledged) : "", icon: BellRing },
    {
      label: tr("mtta"),
      value: s ? formatDuration(s.mttaSeconds) ?? <NoDataValue /> : null,
      sub: s ? (s.mttaSeconds == null ? tr("noAckYet") : tr("mttaSub", s.acknowledged)) : "",
      icon: Clock,
    },
    {
      label: tr("mttr"),
      value: s ? formatDuration(s.mttrSeconds) ?? <NoDataValue /> : null,
      sub: s ? (s.mttrSeconds == null ? tr("noClearYet") : tr("mttrSub", s.cleared)) : "",
      icon: CheckCircle2,
    },
  ];

  const levelCounts = (data?.bySeverity ?? []).reduce<Record<Level, number>>(
    (acc, row) => ({ ...acc, [levelOf(row.severity)]: acc[levelOf(row.severity)] + row.count }),
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  return (
    <div className="alarm-analytics space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        .alarm-analytics { --sev-critical: #8a1a12; --sev-high: #b42318; --sev-medium: #d9503a; --sev-low: #e88a72; }
        .dark .alarm-analytics { --sev-critical: #f8ab95; --sev-high: #ec7258; --sev-medium: #cc4a34; --sev-low: #a33a2c; }
      `}</style>

      {/* Range: one row above everything it filters. */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" className="inline-flex rounded-lg border bg-card p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="radio"
              aria-checked={rangeHours === r.hours}
              onClick={() => setRangeHours(r.hours)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                rangeHours === r.hours ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tr(r.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <k.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs truncate">{k.label}</span>
              </div>
              {k.value === null ? (
                <Skeleton className="h-8 w-20 my-0.5" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{k.sub || " "}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* A new range keeps the old figures up, dimmed, until its own arrive. */}
      <div className={cn("grid lg:grid-cols-3 gap-6 transition-opacity", query.isFetching && data && "opacity-60")}>
        <Panel title={tr("overTime")} className="lg:col-span-2" loading={!data}>
          {data && (data.summary.total === 0
            ? <Empty text={tr("noAlarmsInRange")} />
            : <Timeline data={data} lang={lang} isRTL={isRTL} levelLabel={(l) => tr(l)} totalLabel={tr("total")} formatNumber={formatNumber} />)}
        </Panel>

        <Panel title={tr("bySeverity")} loading={!data}>
          {data && (data.summary.total === 0
            ? <Empty text={tr("noAlarmsInRange")} />
            : (
              <RankList
                rows={LEVELS.map((l) => ({
                  key: l,
                  label: tr(l),
                  value: levelCounts[l],
                  sub: `${formatNumber(Math.round((levelCounts[l] / data.summary.total) * 100))}%`,
                  color: LEVEL_FILL[l],
                }))}
                formatNumber={formatNumber}
              />
            ))}
        </Panel>

        <Panel title={tr("openByAge")} note={tr("openByAgeNote")} icon={Hourglass} loading={!data}>
          {data && (data.openAlarms.total === 0
            ? <Empty text={tr("nothingOpen")} />
            : (
              <RankList
                rows={[
                  { key: "1h", label: tr("age1h"), value: data.openAlarms.underOneHour },
                  { key: "1d", label: tr("age1d"), value: data.openAlarms.oneHourToOneDay },
                  { key: "1w", label: tr("age1w"), value: data.openAlarms.oneDayToOneWeek },
                  { key: "old", label: tr("ageOld"), value: data.openAlarms.overOneWeek },
                ]}
                formatNumber={formatNumber}
              />
            ))}
        </Panel>

        <Panel title={tr("topRules")} note={tr("topRulesNote")} icon={ListOrdered} className="lg:col-span-2" loading={!data}>
          {data && (data.topRules.length === 0
            ? <Empty text={tr("noAlarmsInRange")} />
            : (
              <RankList
                rows={data.topRules.map((r) => ({
                  key: r.alarmName,
                  label: r.alarmName,
                  value: r.count,
                  sub: tr("devicesSub", r.deviceCount),
                }))}
                formatNumber={formatNumber}
              />
            ))}
        </Panel>

        <Panel title={tr("topDevices")} icon={Cpu} className="lg:col-span-2" loading={!data}>
          {data && (data.topDevices.length === 0
            ? <Empty text={tr("noAlarmsInRange")} />
            : (
              <RankList
                rows={data.topDevices.map((d, i) => ({
                  key: d.deviceId ?? `removed-${i}`,
                  label: d.deviceName ?? tr("removedDevice"),
                  value: d.count,
                  sub: d.criticalCount ? tr("criticalSub", d.criticalCount) : undefined,
                  onClick: d.deviceId ? () => navigate(localizedPath(`/devices/${d.deviceId}`, language)) : undefined,
                }))}
                formatNumber={formatNumber}
              />
            ))}
        </Panel>

        <Panel title={tr("byLocation")} icon={MapPin} loading={!data}>
          {data && (data.byLocation.length === 0
            ? <Empty text={tr("noAlarmsInRange")} />
            : (
              <RankList
                rows={data.byLocation.map((l) => ({
                  key: l.assetId ?? "none",
                  label: l.assetName ?? tr("noLocation"),
                  value: l.count,
                }))}
                formatNumber={formatNumber}
              />
            ))}
        </Panel>
      </div>
    </div>
  );
};

const Panel = ({ title, note, icon: Icon, className, loading, children }: {
  title: string;
  note?: string;
  icon?: LucideIcon;
  className?: string;
  loading: boolean;
  children?: React.ReactNode;
}) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {title}
      </CardTitle>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      ) : children}
    </CardContent>
  </Card>
);

const Empty = ({ text }: { text: string }) => (
  <div className="h-[200px] flex items-center justify-center"><NoData message={text} /></div>
);

type RankRow = { key: string; label: string; value: number; sub?: string; color?: string; onClick?: () => void };

/* A ranked list with an inline bar: the value is printed, the bar shows it
   against the largest row, and the label never has to fit inside a mark. */
const RankList = ({ rows, formatNumber }: { rows: RankRow[]; formatNumber: (n: number) => string }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-foreground" title={r.label}>{r.label}</span>
              <span className="shrink-0 tabular-nums">
                {r.sub && <span className="me-2 text-xs text-muted-foreground">{r.sub}</span>}
                <span className="font-medium text-foreground">{formatNumber(r.value)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? "hsl(var(--primary))" }}
              />
            </div>
          </>
        );
        return (
          <li key={r.key}>
            {r.onClick ? (
              <button onClick={r.onClick} className="block w-full text-start rounded-md -mx-1 px-1 py-0.5 hover:bg-muted/50 transition-colors">
                {body}
              </button>
            ) : body}
          </li>
        );
      })}
    </ul>
  );
};

const Timeline = ({ data, lang, isRTL, levelLabel, totalLabel, formatNumber }: {
  data: AlarmAnalytics;
  lang: Lang;
  isRTL: boolean;
  levelLabel: (l: Level) => string;
  totalLabel: string;
  formatNumber: (n: number) => string;
}) => {
  const [ref, size] = useBoxSize<HTMLDivElement>();

  const { points, tick, title } = useMemo(() => {
    const opts = { timeZone: data.timeZone };
    const tickFmt = new Intl.DateTimeFormat(LOCALE[lang], data.bucket === "HOUR"
      ? { ...opts, hour: "2-digit", minute: "2-digit" }
      : { ...opts, month: "short", day: "numeric" });
    const titleFmt = new Intl.DateTimeFormat(LOCALE[lang], data.bucket === "HOUR"
      ? { ...opts, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { ...opts, weekday: data.bucket === "DAY" ? "short" : undefined, year: "numeric", month: "short", day: "numeric" });
    return {
      points: data.timeline.map((p) => {
        const row: Record<Level, number> = { critical: 0, high: 0, medium: 0, low: 0 };
        Object.entries(p.bySeverity).forEach(([sev, n]) => { row[levelOf(sev)] += n; });
        return { start: p.start, total: p.total, ...row };
      }),
      tick: (iso: string) => tickFmt.format(new Date(iso)),
      title: (iso: string) => titleFmt.format(new Date(iso)),
    };
  }, [data, lang]);

  return (
    <div>
      {/* Legend: always present, most severe first. */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {LEVELS.map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LEVEL_FILL[l] }} />
            {levelLabel(l)}
          </span>
        ))}
      </div>
      <div ref={ref} className="h-[240px] w-full">
        {size && (
          <BarChart width={size.width} height={size.height} data={points} barCategoryGap="20%" margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
            <XAxis
              dataKey="start"
              tickFormatter={tick}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              minTickGap={24}
              reversed={isRTL}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={false}
              width={36}
              orientation={isRTL ? "right" : "left"}
              tickFormatter={(v: number) => compactNumber.format(v)}
            />
            <RTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={({ active, payload }) => {
                const p = active && payload?.[0]?.payload as (typeof points)[number] | undefined;
                if (!p) return null;
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
                    <div className="mb-1 font-medium text-foreground">{title(p.start)}</div>
                    {LEVELS.filter((l) => p[l] > 0).map((l) => (
                      <div key={l} className="flex items-center justify-between gap-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm" style={{ background: LEVEL_FILL[l] }} />
                          {levelLabel(l)}
                        </span>
                        <span className="tabular-nums text-foreground">{formatNumber(p[l])}</span>
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between gap-4 border-t pt-1 text-foreground">
                      <span>{totalLabel}</span>
                      <span className="tabular-nums font-medium">{formatNumber(p.total)}</span>
                    </div>
                  </div>
                );
              }}
            />
            {/* Most severe at the baseline, where its height reads truest. A
                surface-coloured stroke keeps a gap between stacked segments. */}
            {LEVELS.map((l) => (
              <Bar
                key={l}
                dataKey={l}
                stackId="severity"
                fill={LEVEL_FILL[l]}
                stroke="hsl(var(--card))"
                strokeWidth={1}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </div>
    </div>
  );
};
