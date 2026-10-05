import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WorkspaceAlarmItem } from "@paapeli/api";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { fmtDateTime } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import { matchAlarms } from "./sources";
import type { WidgetLang, WidgetRenderProps } from "./types";

const T = {
  noSource: { en: "Choose which alarms to list in the widget settings", ar: "اختر الإنذارات المراد عرضها في إعدادات العنصر", fa: "در تنظیمات ویجت مشخص کنید کدام هشدارها فهرست شوند" },
  none: { en: "No matching alarms", ar: "لا توجد إنذارات مطابقة", fa: "هشداری مطابق این فیلتر نیست" },
  failed: { en: "Couldn't load alarms", ar: "تعذر تحميل الإنذارات", fa: "بارگذاری هشدارها ممکن نشد" },
  alarm: { en: "Alarm", ar: "الإنذار", fa: "هشدار" },
  severity: { en: "Severity", ar: "الشدة", fa: "شدت" },
  device: { en: "Device", ar: "الجهاز", fa: "دستگاه" },
  status: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  time: { en: "Raised", ar: "وقت الحدوث", fa: "زمان" },
};

export const SEVERITY_LABEL: Record<string, Record<WidgetLang, string>> = {
  CRITICAL: { en: "Critical", ar: "حرج", fa: "بحرانی" },
  MAJOR: { en: "Major", ar: "رئيسي", fa: "مهم" },
  MINOR: { en: "Minor", ar: "ثانوي", fa: "جزئی" },
  WARNING: { en: "Warning", ar: "تحذير", fa: "هشدار" },
  INDETERMINATE: { en: "Indeterminate", ar: "غير محدد", fa: "نامشخص" },
};
export const STATUS_LABEL: Record<string, Record<WidgetLang, string>> = {
  ACTIVE_UNACK: { en: "Active, unacknowledged", ar: "نشط، غير مؤكد", fa: "فعال، تأییدنشده" },
  ACTIVE_ACK: { en: "Active, acknowledged", ar: "نشط، مؤكد", fa: "فعال، تأییدشده" },
  CLEARED_UNACK: { en: "Cleared, unacknowledged", ar: "منتهٍ، غير مؤكد", fa: "برطرف‌شده، تأییدنشده" },
  CLEARED_ACK: { en: "Cleared, acknowledged", ar: "منتهٍ، مؤكد", fa: "برطرف‌شده، تأییدشده" },
};
const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  MAJOR: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  MINOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  WARNING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  INDETERMINATE: "bg-muted text-muted-foreground",
};

type Options = { pageSize?: number; showDevice?: boolean };

/**
 * The "alarm-list" widget: the alarms its one alarmQuery source matches,
 * newest first. The alarm endpoint does not filter, so the matching is done
 * here over the most recent alarms (see matchAlarms).
 */
export function AlarmListWidget({ widget, dataSources, window: [, refreshedAt], timeZone, lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const item = widget.data[0];
  const source = item ? dataSources[item.source] : undefined;
  const [page, setPage] = useState(0);

  const query = useQuery({
    // The window's end moves on every dashboard refresh; keying on it re-reads then.
    queryKey: ["alarmList", workspaceId, PRODUCT_KEY, source, refreshedAt],
    queryFn: async () => (source?.type === "alarmQuery" ? matchAlarms(workspaceId, source) : []),
    enabled: !!workspaceId && source?.type === "alarmQuery",
    // Keep the last list on screen while it refreshes.
    placeholderData: (prev: WorkspaceAlarmItem[] | undefined) => prev,
  });

  if (source?.type !== "alarmQuery") return <Hint>{T.noSource[lang]}</Hint>;
  const alarms = query.data ?? [];
  if (query.isError && alarms.length === 0) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(query.error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }
  if (alarms.length === 0) return <Hint>{query.isLoading ? "" : T.none[lang]}</Hint>;

  const pageSize = Math.min(50, Math.max(5, Number(options.pageSize) || 10));
  const pages = Math.max(1, Math.ceil(alarms.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = alarms.slice(current * pageSize, (current + 1) * pageSize);
  const showDevice = options.showDevice ?? true;

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-2 py-1.5 text-start font-medium">{T.severity[lang]}</th>
              <th className="px-2 py-1.5 text-start font-medium">{T.alarm[lang]}</th>
              {showDevice && <th className="px-2 py-1.5 text-start font-medium">{T.device[lang]}</th>}
              <th className="px-2 py-1.5 text-start font-medium">{T.status[lang]}</th>
              <th className="px-2 py-1.5 text-start font-medium">{T.time[lang]}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0">
                <td className="px-2 py-1.5">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${SEVERITY_TONE[a.severity] ?? SEVERITY_TONE.INDETERMINATE}`}>
                    {SEVERITY_LABEL[a.severity]?.[lang] ?? a.severity}
                  </span>
                </td>
                <td className="max-w-[14rem] truncate px-2 py-1.5 font-medium text-foreground">{a.alarmName}</td>
                {showDevice && <td className="max-w-[10rem] truncate px-2 py-1.5 text-muted-foreground">{a.deviceName || "—"}</td>}
                <td className="px-2 py-1.5 text-muted-foreground">{STATUS_LABEL[a.status]?.[lang] ?? a.status}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                  <span dir="ltr">{fmtDateTime(Date.parse(a.createdAt), timeZone)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div dir="ltr" className="flex shrink-0 items-center justify-end gap-2 pt-1.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">{current + 1} / {pages}</span>
          <button type="button" className="rounded p-0.5 hover:bg-muted disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-0.5 hover:bg-muted disabled:opacity-40" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
