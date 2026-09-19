import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useGetDeviceActivitiesQuery, type DeviceActivityResponse } from "@paapeli/api";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/track/components/ui/card";
import { Button } from "@/features/track/components/ui/button";

/* A device's activity feed, laid out like Smart Factory's Events tab
 * (factory/pages/panel/DeviceDetails.tsx): a Time / Activity / Triggered by
 * table under a search box and an Export button. Unlike there, both work —
 * search filters the loaded page, Export downloads it as CSV. */

const PAGE_SIZE = 50;

/* Server-rendered and untranslated; the enum is the fallback. */
const activityLabel = (a: DeviceActivityResponse) => a.description || a.type.replace(/_/g, " ").toLowerCase();
const actorLabel = (a: DeviceActivityResponse) => a.actorName || a.actorType;

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function downloadCsv(events: DeviceActivityResponse[], deviceName: string) {
  const lines = [
    ["time", "type", "activity", "triggered_by"],
    ...events.map((e) => [e.occurredAt, e.type, activityLabel(e), actorLabel(e)]),
  ].map((row) => row.map(csvCell).join(","));
  // BOM so Excel reads Persian/Arabic descriptions as UTF-8.
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deviceName.replace(/[^\w.-]+/g, "_") || "device"}-events.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const th = "h-12 px-4 text-start align-middle font-medium text-muted-foreground";
const td = "p-4 align-middle text-start";

export function DeviceEvents({
  workspaceId,
  deviceId,
  deviceName,
}: {
  workspaceId: string | null;
  deviceId: string;
  deviceName: string;
}) {
  const { t, relTime } = useLanguage();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetDeviceActivitiesQuery(workspaceId ?? "", PRODUCT_KEY, deviceId, 0, PAGE_SIZE);
  const events = data?.data ?? [];

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [activityLabel(e), e.type, actorLabel(e)].some((s) => s.toLowerCase().includes(q)),
    );
  }, [events, search]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t("activityHistory")}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchEvents")}
              className="h-9 w-56 max-w-[50vw] rounded-lg border border-border bg-card ps-8 pe-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <Button variant="outline" size="sm" disabled={shown.length === 0} onClick={() => downloadCsv(shown, deviceName)}>
            <Download className="size-4" />
            {t("export")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b border-border">
                <th className={th}>{t("time")}</th>
                <th className={th}>{t("activity")}</th>
                <th className={th}>{t("triggeredBy")}</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, r) => (
                  <tr key={r} aria-hidden="true" className="border-b border-border">
                    {[0, 1, 2].map((c) => (
                      <td key={c} className={td}>
                        <div className={`h-3.5 animate-pulse rounded bg-muted ${c === 1 ? "w-40" : "w-20"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`${td} text-center text-muted-foreground`}>
                    {events.length === 0 ? t("noActivityYet") : t("noMatchingEvents")}
                  </td>
                </tr>
              ) : (
                shown.map((e) => (
                  <tr key={e.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className={`${td} whitespace-nowrap text-muted-foreground`} title={new Date(e.occurredAt).toLocaleString()}>
                      {relTime(e.occurredAt)}
                    </td>
                    <td className={td}>{activityLabel(e)}</td>
                    <td className={`${td} text-muted-foreground`}>{actorLabel(e)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
