import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/shared/lib/toast";
import { History, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { dashboardVersionService, useListWorkspaceMembersQuery, type DashboardResponse } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { fmtDateTime } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { apiErrorMessage } from "@/shared/lib/apiError";
import type { WidgetLang } from "./widgets/types";

const T = {
  title: { en: "Version history", ar: "سجل النسخ", fa: "تاریخچه نسخه‌ها" },
  desc: {
    en: "Every save is kept, newest first (the last 50). Restoring brings back a version's widgets and layout; the dashboard keeps its name.",
    ar: "يُحفظ كل حفظ، الأحدث أولاً (آخر 50). الاستعادة تعيد عناصر وتخطيط النسخة، وتحتفظ اللوحة باسمها.",
    fa: "هر ذخیره نگه داشته می‌شود، جدیدترین بالا (۵۰ مورد آخر). بازگردانی، ویجت‌ها و چیدمان آن نسخه را برمی‌گرداند و نام داشبورد تغییر نمی‌کند.",
  },
  current: { en: "Current", ar: "الحالية", fa: "فعلی" },
  version: { en: "Version", ar: "النسخة", fa: "نسخه" },
  widgets: { en: "widgets", ar: "عناصر", fa: "ویجت" },
  by: { en: "by", ar: "بواسطة", fa: "توسط" },
  unknownAuthor: { en: "before history was kept", ar: "قبل حفظ السجل", fa: "پیش از ثبت تاریخچه" },
  restore: { en: "Restore", ar: "استعادة", fa: "بازگردانی" },
  confirm: { en: "Restore this version?", ar: "استعادة هذه النسخة؟", fa: "این نسخه بازگردانده شود؟" },
  yes: { en: "Yes, restore", ar: "نعم، استعادة", fa: "بله، بازگردان" },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },
  restored: { en: "Version restored", ar: "تمت استعادة النسخة", fa: "نسخه بازگردانده شد" },
  restoreFailed: { en: "Couldn't restore this version", ar: "تعذرت استعادة هذه النسخة", fa: "بازگردانی این نسخه ممکن نشد" },
  stale: {
    en: "The dashboard was saved by someone else meanwhile. Reload it and try again.",
    ar: "تم حفظ اللوحة من قبل شخص آخر في هذه الأثناء. أعد تحميلها وحاول مجددًا.",
    fa: "در این فاصله داشبورد توسط شخص دیگری ذخیره شده است. آن را دوباره بارگذاری و تلاش کنید.",
  },
  unsaved: {
    en: "Save or discard your changes before restoring a version.",
    ar: "احفظ تغييراتك أو تجاهلها قبل استعادة نسخة.",
    fa: "پیش از بازگردانی یک نسخه، تغییرات خود را ذخیره یا لغو کنید.",
  },
  loadFailed: { en: "Couldn't load the history", ar: "تعذر تحميل السجل", fa: "بارگذاری تاریخچه ممکن نشد" },
  retry: { en: "Try again", ar: "حاول مرة أخرى", fa: "تلاش دوباره" },
};
const tr = (k: keyof typeof T, lang: WidgetLang) => T[k][lang] ?? T[k].en;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: DashboardResponse;
  /** Unsaved edits on the canvas: a restore would throw them away without asking. */
  dirty: boolean;
  timeZone: string;
  lang: WidgetLang;
  rtl: boolean;
  /** Called after a restore, with the dashboard as it is now. */
  onRestored: () => void;
}

/**
 * The saved versions of a dashboard, from GET .../{dashboardId}/versions, with
 * a restore for each one that is not the current state. A restore sends the
 * dashboard's present record version, so it cannot silently overwrite a save
 * someone else made in the meantime.
 */
export function DashboardHistorySheet({ open, onOpenChange, dashboard, dirty, timeZone, lang, rtl, onRestored }: Props) {
  const workspaceId = useWorkspaceId() ?? "";
  const [confirming, setConfirming] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  const versions = useQuery({
    // Keyed on the record version: a save or a restore changes the list.
    queryKey: ["dashboardVersions", workspaceId, currentProductKey(), dashboard.id, dashboard.recordVersion],
    queryFn: () => dashboardVersionService.list(workspaceId, currentProductKey(), dashboard.id, 1, 50),
    enabled: open && !!workspaceId,
  });
  // Who saved a version is a user id; the roster turns it into a name.
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100, open);
  const nameOf = (userId: string | null | undefined) => {
    if (!userId) return tr("unknownAuthor", lang);
    const m = members.data?.data.find((x) => x.userId === userId);
    return m?.displayName?.trim() || m?.email || "";
  };

  const restore = async (recordVersion: number) => {
    setRestoring(true);
    try {
      await dashboardVersionService.restore(workspaceId, currentProductKey(), dashboard.id, recordVersion, dashboard.recordVersion);
      toast.success(tr("restored", lang));
      setConfirming(null);
      onRestored();
      onOpenChange(false);
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? tr("stale", lang) : apiErrorMessage(e, tr("restoreFailed", lang)));
    } finally {
      setRestoring(false);
    }
  };

  const rows = versions.data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setConfirming(null); onOpenChange(o); }}>
      <SheetContent side={rtl ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto" dir={rtl ? "rtl" : "ltr"} data-uniform-type>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><History className="h-4 w-4" />{tr("title", lang)}</SheetTitle>
          <SheetDescription>{tr("desc", lang)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 py-4">
          {dirty && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{tr("unsaved", lang)}
            </div>
          )}

          {versions.isLoading && (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          )}
          {versions.isError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{apiErrorMessage(versions.error, tr("loadFailed", lang))}</p>
              <Button variant="outline" size="sm" onClick={() => void versions.refetch()}>{tr("retry", lang)}</Button>
            </div>
          )}

          {rows.map((v) => (
            <div key={v.recordVersion} className={`rounded-md border p-3 ${v.current ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{tr("version", lang)} <span dir="ltr" className="tabular-nums">{v.recordVersion + 1}</span></span>
                    {v.current && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">{tr("current", lang)}</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span dir="ltr">{fmtDateTime(Date.parse(v.savedAt), timeZone)}</span>
                    <span className="mx-1.5">·</span>
                    <span dir="ltr" className="tabular-nums">{v.widgetCount}</span> {tr("widgets", lang)}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {v.savedByUserId ? `${tr("by", lang)} ${nameOf(v.savedByUserId)}` : nameOf(null)}
                  </div>
                </div>
                {!v.current && confirming !== v.recordVersion && (
                  <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" disabled={dirty || restoring} onClick={() => setConfirming(v.recordVersion)}>
                    <RotateCcw className="h-3.5 w-3.5" />{tr("restore", lang)}
                  </Button>
                )}
              </div>
              {confirming === v.recordVersion && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs text-foreground">{tr("confirm", lang)}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="ghost" size="sm" className="h-8" disabled={restoring} onClick={() => setConfirming(null)}>{tr("cancel", lang)}</Button>
                    <Button size="sm" className="h-8 gap-1.5" disabled={restoring} onClick={() => void restore(v.recordVersion)}>
                      {restoring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{tr("yes", lang)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
