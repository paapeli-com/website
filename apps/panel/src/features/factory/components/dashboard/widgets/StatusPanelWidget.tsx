import { Lock, TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import { useLatestReadings } from "./useLatestReadings";
import type { WidgetRenderProps } from "./types";

const T = {
  noBinding: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  failed: { en: "Couldn't load the state", ar: "تعذر تحميل الحالة", fa: "بارگذاری وضعیت ممکن نشد" },
  on: { en: "On", ar: "تشغيل", fa: "روشن" },
  off: { en: "Off", ar: "إيقاف", fa: "خاموش" },
  displayOnly: {
    en: "Data is for display only and cannot be changed, for security reasons.",
    ar: "البيانات للعرض فقط ولا يمكن تغييرها لأسباب أمنية.",
    fa: "داده‌ها فقط برای نمایش هستند و به دلایل امنیتی قابل تغییر نیستند.",
  },
};

/** On, off, or null when the reading says neither. */
const stateOf = (raw: unknown): boolean | null => {
  if (typeof raw === "boolean") return raw;
  const n = toNumber(raw);
  if (n !== null) return n > 0;
  const text = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (text === "true" || text === "on") return true;
  if (text === "false" || text === "off") return false;
  return null;
};

/**
 * The "status-panel" widget: the state of equipment, one row per binding. It
 * looks like a switch but is display only: nothing here sends a command, and
 * it says so. Controlling safety equipment from a web dashboard is left out on
 * purpose.
 */
export function StatusPanelWidget({ widget, dataSources, window: [, refreshedAt], lang }: WidgetRenderProps) {
  const { values, bound, failed, error } = useLatestReadings(widget, dataSources, refreshedAt);

  if (!bound) return <Hint>{T.noBinding[lang]}</Hint>;
  if (failed && values.every((v) => v === undefined)) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-2">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {widget.data.map((item, i) => {
          const state = stateOf(values[i]);
          const chip = (lit: boolean, text: string, color: string) => (
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${lit ? `${color} text-white` : "text-muted-foreground"}`}>{text}</span>
          );
          return (
            <li key={`${item.source}-${item.key}-${i}`} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-foreground">{item.label?.trim() || item.key}</span>
              <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5" aria-label={state === null ? "—" : state ? T.on[lang] : T.off[lang]}>
                {chip(state === true, T.on[lang], "bg-emerald-600")}
                {chip(state === false, T.off[lang], "bg-slate-500")}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="flex shrink-0 items-start gap-1.5 border-t border-border pt-1.5 text-[10px] leading-4 text-muted-foreground">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" />{T.displayOnly[lang]}
      </p>
    </div>
  );
}
