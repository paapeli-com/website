import { TriangleAlert, Unplug } from "lucide-react";
import { apiErrorMessage, apiProblem } from "@/shared/lib/apiError";
import { Hint } from "./chartKit";
import type { WidgetLang } from "./types";

const T = {
  failed: { en: "Couldn't load the value", ar: "تعذر تحميل القيمة", fa: "بارگذاری مقدار ممکن نشد" },
  gone: {
    en: "This device is no longer in the workspace. Pick another one in the widget settings.",
    ar: "هذا الجهاز لم يعد في مساحة العمل. اختر جهازًا آخر في إعدادات العنصر.",
    fa: "این دستگاه دیگر در فضای کاری نیست. در تنظیمات ویجت دستگاه دیگری انتخاب کنید.",
  },
};

/**
 * What a single-value widget shows when its reading could not be fetched.
 *
 * A widget outlives the device it was bound to: delete the device and the
 * dashboard still asks for its telemetry, which the gateway refuses with 403
 * or 404. That is not a fault to flag in red but a binding to update, so it
 * says so plainly. Anything else is a real failure and keeps the warning.
 */
export function LoadFailed({ error, lang }: { error: unknown; lang: WidgetLang }) {
  const { status } = apiProblem(error);
  if (status === 403 || status === 404) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5">
          <Unplug className="h-3.5 w-3.5 shrink-0" />{T.gone[lang]}
        </span>
      </Hint>
    );
  }
  return (
    <Hint>
      <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(error, T.failed[lang])}>
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
      </span>
    </Hint>
  );
}
