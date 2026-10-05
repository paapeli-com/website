import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { telemetryService, type TelemetryPoint } from "@paapeli/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint } from "./chartKit";
import type { WidgetRenderProps } from "./types";

const T = {
  noColumns: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  queryUnsupported: { en: "Device-query sources aren't available yet", ar: "مصادر استعلام الأجهزة غير متاحة بعد", fa: "منبع «جستجوی دستگاه» هنوز در دسترس نیست" },
  device: { en: "Device", ar: "الجهاز", fa: "دستگاه" },
  status: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  online: { en: "Online", ar: "متصل", fa: "آنلاین" },
  offline: { en: "Offline", ar: "غير متصل", fa: "آفلاین" },
};

type Options = { showStatus?: boolean; pageSize?: number; sortBy?: "name" | "status" };

const numberFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

/**
 * The "device-table" widget: one row per bound device, one column per bound
 * telemetry key, each cell the key's latest value from
 * GET /telemetry/{ws}/{pk}/devices/{deviceId}/latest (one request per device,
 * asking for every column at once). A key a device has never reported reads
 * as a dash.
 */
export function DeviceTableWidget({ widget, dataSources, lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const { items } = useDevices();
  const [page, setPage] = useState(0);

  const columns = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; unit: string }>();
    widget.data.forEach((d) => {
      if (d.key && !seen.has(d.key)) seen.set(d.key, { key: d.key, label: d.label?.trim() || d.key, unit: d.unit?.trim() || "" });
    });
    return [...seen.values()];
  }, [widget.data]);

  const deviceIds = useMemo(() => {
    const ids = new Set<string>();
    widget.data.forEach((d) => {
      const s = dataSources[d.source];
      if (s?.type === "device") ids.add(s.deviceId);
    });
    return [...ids];
  }, [widget.data, dataSources]);

  const keys = columns.map((c) => c.key);
  const results = useQueries({
    queries: deviceIds.map((deviceId) => ({
      queryKey: ["telemetryLatest", workspaceId, PRODUCT_KEY, deviceId, keys.join(",")],
      queryFn: () => telemetryService.getLatest(workspaceId, PRODUCT_KEY, deviceId, keys),
      enabled: !!workspaceId && keys.length > 0,
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: Record<string, TelemetryPoint[]> }>;

  if (columns.length === 0) return <Hint>{T.noColumns[lang]}</Hint>;
  if (deviceIds.length === 0) return <Hint>{T.queryUnsupported[lang]}</Hint>;

  const known = new Map(items.map((d) => [d.id, d]));
  const rows = deviceIds
    .map((id, i) => {
      const device = known.get(id);
      return { id, name: device?.label || device?.name || id, active: device?.active === true, latest: results[i]?.data };
    })
    .sort((a, b) => (options.sortBy === "status" ? Number(b.active) - Number(a.active) : 0) || a.name.localeCompare(b.name));

  const pageSize = Math.min(100, Math.max(5, Number(options.pageSize) || 10));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * pageSize, (current + 1) * pageSize);
  const showStatus = options.showStatus ?? true;

  const cell = (row: (typeof rows)[number], key: string) => {
    const raw = row.latest?.[key]?.[0]?.value;
    if (raw === undefined || raw === null || raw === "") return "—";
    const n = toNumber(raw);
    return n === null ? String(raw) : numberFormat.format(n);
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-2 py-1.5 text-start font-medium">{T.device[lang]}</th>
              {showStatus && <th className="px-2 py-1.5 text-start font-medium">{T.status[lang]}</th>}
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-1.5 text-start font-medium">
                  {c.label}{c.unit && <span className="ms-1 font-normal opacity-70">({c.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="max-w-[12rem] truncate px-2 py-1.5 font-medium text-foreground">{row.name}</td>
                {showStatus && (
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className={`size-1.5 rounded-full ${row.active ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                      {row.active ? T.online[lang] : T.offline[lang]}
                    </span>
                  </td>
                )}
                {columns.map((c) => (
                  /* Aligned with its heading. The direction goes on the number
                     alone: a dir on the cell would pull the whole cell to the
                     left edge and out from under the column title. */
                  <td key={c.key} className="px-2 py-1.5 text-start text-foreground">
                    <span dir="ltr" className="tabular-nums">{cell(row, c.key)}</span>
                  </td>
                ))}
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
