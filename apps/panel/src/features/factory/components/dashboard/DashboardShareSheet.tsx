import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/lib/toast";
import { Check, Copy, Link2, Loader2, TriangleAlert } from "lucide-react";
import { dashboardShareService, type DashboardResponse, type DashboardShareLink } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { fmtDateTime } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { apiErrorMessage } from "@/shared/lib/apiError";
import type { WidgetLang } from "./widgets/types";

const T = {
  title: { en: "Share by link", ar: "مشاركة برابط", fa: "اشتراک‌گذاری با لینک" },
  desc: {
    en: "Anyone with the link sees this dashboard, read-only, without an account. Device names are hidden. Every link expires, and you can revoke it sooner.",
    ar: "كل من يملك الرابط يرى هذه اللوحة للقراءة فقط ودون حساب. أسماء الأجهزة مخفية. كل رابط تنتهي صلاحيته، ويمكنك إلغاؤه قبل ذلك.",
    fa: "هر کسی که لینک را داشته باشد این داشبورد را فقط برای مشاهده و بدون حساب کاربری می‌بیند. نام دستگاه‌ها پنهان است. هر لینک منقضی می‌شود و می‌توانید زودتر هم آن را لغو کنید.",
  },
  expiresIn: { en: "Expires in", ar: "تنتهي الصلاحية خلال", fa: "انقضا پس از" },
  h24: { en: "1 day", ar: "يوم واحد", fa: "۱ روز" },
  h48: { en: "2 days", ar: "يومان", fa: "۲ روز" },
  h168: { en: "7 days", ar: "7 أيام", fa: "۷ روز" },
  h720: { en: "30 days", ar: "30 يومًا", fa: "۳۰ روز" },
  create: { en: "Create link", ar: "إنشاء رابط", fa: "ساخت لینک" },
  created: { en: "Link created", ar: "تم إنشاء الرابط", fa: "لینک ساخته شد" },
  createFailed: { en: "Couldn't create the link", ar: "تعذر إنشاء الرابط", fa: "ساخت لینک ممکن نشد" },
  once: {
    en: "Copy it now. For your security it is shown only this once; a lost link is replaced with a new one.",
    ar: "انسخه الآن. لأمانك يُعرض هذه المرة فقط؛ الرابط المفقود يُستبدل برابط جديد.",
    fa: "همین حالا کپی کنید. برای امنیت، لینک فقط همین یک بار نمایش داده می‌شود؛ اگر گم شد لینک تازه بسازید.",
  },
  copy: { en: "Copy", ar: "نسخ", fa: "کپی" },
  copied: { en: "Copied", ar: "تم النسخ", fa: "کپی شد" },
  copyFailed: { en: "Couldn't copy. Select the link and copy it by hand.", ar: "تعذر النسخ. حدّد الرابط وانسخه يدويًا.", fa: "کپی نشد. لینک را انتخاب و دستی کپی کنید." },
  links: { en: "Links for this dashboard", ar: "روابط هذه اللوحة", fa: "لینک‌های این داشبورد" },
  none: { en: "No link has been made yet.", ar: "لم يُنشأ أي رابط بعد.", fa: "هنوز لینکی ساخته نشده است." },
  active: { en: "Active", ar: "نشط", fa: "فعال" },
  expired: { en: "Expired", ar: "منتهي", fa: "منقضی" },
  revoked: { en: "Revoked", ar: "ملغى", fa: "لغوشده" },
  madeAt: { en: "Made", ar: "أُنشئ", fa: "ساخته‌شده" },
  until: { en: "until", ar: "حتى", fa: "تا" },
  revoke: { en: "Revoke", ar: "إلغاء", fa: "لغو" },
  revokeDone: { en: "Link revoked", ar: "تم إلغاء الرابط", fa: "لینک لغو شد" },
  revokeFailed: { en: "Couldn't revoke the link", ar: "تعذر إلغاء الرابط", fa: "لغو لینک ممکن نشد" },
  loadFailed: { en: "Couldn't load the links", ar: "تعذر تحميل الروابط", fa: "بارگذاری لینک‌ها ممکن نشد" },
  retry: { en: "Try again", ar: "حاول مرة أخرى", fa: "تلاش دوباره" },
};
const tr = (k: keyof typeof T, lang: WidgetLang) => T[k][lang] ?? T[k].en;

const DURATIONS = [24, 48, 168, 720] as const;
const DEFAULT_HOURS = 48;

/** Where a share link's token opens, on this panel. */
export const sharedDashboardUrl = (token: string, lang: WidgetLang) =>
  `${window.location.origin}/share/d/${token}?lang=${lang}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: DashboardResponse;
  timeZone: string;
  lang: WidgetLang;
  rtl: boolean;
}

/**
 * Share links of a dashboard: make one, see the ones made, revoke any. The
 * gateway keeps only a link's hash, so its address can be copied only from
 * the answer to making it, which this sheet shows until it is closed.
 */
export function DashboardShareSheet({ open, onOpenChange, dashboard, timeZone, lang, rtl }: Props) {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<number>(DEFAULT_HOURS);
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<DashboardShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const queryKey = ["dashboardShareLinks", workspaceId, currentProductKey(), dashboard.id];
  const links = useQuery({
    queryKey,
    queryFn: () => dashboardShareService.list(workspaceId, currentProductKey(), dashboard.id),
    enabled: open && !!workspaceId,
  });

  const create = async () => {
    setCreating(true);
    try {
      const link = await dashboardShareService.create(workspaceId, currentProductKey(), dashboard.id, hours);
      setFresh(link);
      setCopied(false);
      toast.success(tr("created", lang));
      await queryClient.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(apiErrorMessage(e, tr("createFailed", lang)));
    } finally {
      setCreating(false);
    }
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(sharedDashboardUrl(token, lang));
      setCopied(true);
    } catch {
      toast.error(tr("copyFailed", lang));
    }
  };

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await dashboardShareService.revoke(workspaceId, currentProductKey(), dashboard.id, id);
      if (fresh?.id === id) setFresh(null);
      toast.success(tr("revokeDone", lang));
      await queryClient.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(apiErrorMessage(e, tr("revokeFailed", lang)));
    } finally {
      setRevoking(null);
    }
  };

  const stateOf = (link: DashboardShareLink) => (link.revokedAt ? "revoked" : link.active ? "active" : "expired");

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        // The address of a new link is gone once the sheet closes.
        if (!o) setFresh(null);
        onOpenChange(o);
      }}
    >
      <SheetContent side={rtl ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto" dir={rtl ? "rtl" : "ltr"}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" />{tr("title", lang)}</SheetTitle>
          <SheetDescription>{tr("desc", lang)}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex items-end gap-2">
          <div className="flex-1">
            <div className="mb-1 text-xs text-muted-foreground">{tr("expiresIn", lang)}</div>
            <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{tr(`h${h}` as keyof typeof T, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="h-9 gap-2" onClick={create} disabled={creating || !workspaceId}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {tr("create", lang)}
          </Button>
        </div>

        {fresh?.token && (
          <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                dir="ltr"
                value={sharedDashboardUrl(fresh.token, lang)}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground"
              />
              <Button variant="outline" className="h-9 gap-1.5" onClick={() => copy(fresh.token!)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {tr(copied ? "copied" : "copy", lang)}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{tr("once", lang)}</p>
          </div>
        )}

        <div className="mt-6 text-sm font-medium text-foreground">{tr("links", lang)}</div>
        <div className="mt-2 space-y-2">
          {links.isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {links.isError && (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <TriangleAlert className="h-4 w-4" />
              {apiErrorMessage(links.error, tr("loadFailed", lang))}
              <Button variant="outline" size="sm" onClick={() => links.refetch()}>{tr("retry", lang)}</Button>
            </div>
          )}
          {links.data?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{tr("none", lang)}</p>}
          {links.data?.map((link) => {
            const state = stateOf(link);
            return (
              <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <Badge variant={state === "active" ? "default" : "outline"} className="text-[10px]">{tr(state, lang)}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {tr("madeAt", lang)} {fmtDateTime(Date.parse(link.createdAt), timeZone)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tr("until", lang)} {fmtDateTime(Date.parse(link.revokedAt ?? link.expiresAt), timeZone)}
                  </div>
                </div>
                {state === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => revoke(link.id)}
                    disabled={revoking === link.id}
                  >
                    {revoking === link.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("revoke", lang)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
