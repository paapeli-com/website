import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Bot, ClipboardList, Lightbulb, MapPin, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { AiAnomaly, AiTrend } from "@paapeli/api";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { ListToolbar } from "@/features/factory/components/panel/ListToolbar";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useAiAnomalies, useAiTrends } from "@/features/factory/hooks/useAi";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { useGreenhouses } from "../hooks";
import { metricOfKey, useProductDevices, type EnvMetric } from "../operations";
import { IssueRow, KpiTiles, PlaceGroups, usePlaces, type PlacedItem } from "../components/PlaceGroups";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

type Kind = "all" | "anomaly" | "trend";

const OPEN = new Set(["OPEN", "ACKNOWLEDGED", "INVESTIGATING"]);
const UNITS: Record<EnvMetric, string> = { TEMPERATURE: "°C", HUMIDITY: "%", SUBSTRATE_MOISTURE: "%", CO2: " ppm", VPD: " kPa" };

/**
 * The AI's findings for a grower: unusual readings and lasting trends, said
 * in plain words, under the greenhouse and zone they are in, with what to
 * check. The anomaly and trend pages behind them stay one click away.
 */
export default function GreenhouseInsights() {
  const { g, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const greenhouses = useGreenhouses();
  const houses = useMemo(() => greenhouses.data ?? [], [greenhouses.data]);
  const devices = useProductDevices();
  const places = usePlaces(houses, devices.data ?? []);
  const anomalies = useAiAnomalies();
  const trends = useAiTrends();

  const [search, setSearch] = useState("");
  const [houseId, setHouseId] = useState("all");
  const [kind, setKind] = useState<Kind>("all");

  const metricName = (key: string) => {
    const m = metricOfKey(key);
    return m ? g(`metric_${m}` as GreenhouseTextKey) : key;
  };
  const value = (key: string, v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "";
    const m = metricOfKey(key);
    return `${formatNumber(Math.round(v * 10) / 10)}${m ? UNITS[m] : ""}`;
  };
  const advice = (key: string, direction: "up" | "down") => {
    const m = metricOfKey(key);
    if (m === "SUBSTRATE_MOISTURE" || m === "HUMIDITY" || m === "TEMPERATURE") return g(`advice_${m}_${direction}` as GreenhouseTextKey);
    return "";
  };
  const workOrder = (title: string, assetId?: string | null, deviceId?: string) =>
    navigate(lp(`/work-orders/new?${new URLSearchParams({ title, priority: "Medium", ...(assetId ? { assetId } : {}), ...(deviceId ? { deviceId } : {}) }).toString()}`));

  const anomalyItem = (a: AiAnomaly) => {
    const place = places.of(a.assetId, a.deviceId);
    const title = g(`anomaly_${a.kind}` as GreenhouseTextKey, { metric: metricName(a.key), value: value(a.key, a.peakValue) });
    const usual = a.expectedValue != null && a.kind !== "PATTERN" ? g("usuallyAround", { value: value(a.key, a.expectedValue) }) : "";
    const tip =
      a.kind === "FLATLINE"
        ? g("advice_FLATLINE")
        : a.kind === "SPIKE" || a.kind === "LEVEL_SHIFT" || a.kind === "DRIFT"
          ? advice(a.key, a.expectedValue != null && a.peakValue < a.expectedValue ? "down" : "up")
          : a.kind === "DROP"
            ? advice(a.key, "down")
            : "";
    const high = a.severity === "Critical" || a.severity === "High";
    return {
      key: `a${a.id}`,
      kind: "anomaly" as const,
      place,
      rank: high ? 3 : 2,
      text: `${title} ${a.deviceName} ${place?.houseName ?? ""} ${place?.zoneName ?? ""}`,
      node: (
        <IssueRow
          icon={Activity}
          tone={high ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "bg-violet-50 text-violet-600 dark:bg-violet-950/30"}
          title={title}
          sub={[usual, a.deviceName].filter(Boolean).join(" · ")}
          at={a.detectedAt}
          onOpen={() => navigate(lp(`/aiot/detect-anomalies/${a.id}`))}
          actions={<RowActions tip={tip} onWork={() => workOrder(place?.zoneName ? `${place.zoneName}: ${title}` : title, place?.zoneId, a.deviceId)} />}
        />
      ),
    };
  };

  const trendItem = (t: AiTrend) => {
    const place = places.of(t.assetId, t.deviceId);
    const up = t.direction === "Increasing";
    const title = g(up ? "trendUp" : "trendDown", {
      metric: metricName(t.key),
      window: g(`window_${t.window}` as GreenhouseTextKey),
      from: value(t.key, t.baseline),
      to: value(t.key, t.current),
    });
    return {
      key: `t${t.id}`,
      kind: "trend" as const,
      place,
      rank: 1,
      text: `${title} ${t.deviceName} ${place?.houseName ?? ""} ${place?.zoneName ?? ""}`,
      node: (
        <IssueRow
          icon={up ? TrendingUp : TrendingDown}
          tone="bg-sky-50 text-sky-600 dark:bg-sky-950/30"
          title={title}
          sub={t.deviceName}
          at={t.computedAt}
          onOpen={() => navigate(lp(`/aiot/analyze-trends/${t.id}`))}
          actions={<RowActions tip={advice(t.key, up ? "up" : "down")} onWork={() => workOrder(place?.zoneName ? `${place.zoneName}: ${title}` : title, place?.zoneId, t.deviceId)} />}
        />
      ),
    };
  };

  const openAnomalies = (anomalies.data ?? []).filter((a) => OPEN.has(a.status));
  const moving = (trends.data ?? []).filter((t) => t.direction !== "Stable");
  const items: (PlacedItem & { kind: Exclude<Kind, "all">; text: string })[] = [...openAnomalies.map(anomalyItem), ...moving.map(trendItem)];

  const q = search.trim().toLowerCase();
  const shown = items.filter((i) => (kind === "all" || i.kind === kind) && (houseId === "all" || i.place?.houseId === houseId) && (!q || i.text.toLowerCase().includes(q)));
  const zones = new Set(items.map((i) => i.place?.zoneId).filter(Boolean));
  const loading = anomalies.isLoading || trends.isLoading || greenhouses.isLoading;

  return (
    <UniformPage>
      <div className="space-y-4">
        <div>
          <PageHeader
            title={g("insights")}
            count={loading ? null : items.length}
            actions={
              <Button variant="outline" className="h-10 gap-2" onClick={() => navigate(lp("/aiot/co-pilot"))}>
                <Bot className="h-4 w-4" /> {g("askCopilot")}
              </Button>
            }
          />
          <p className="-mt-2 mb-2 text-sm text-muted-foreground">{g("insightsSubtitle")}</p>
        </div>

        <KpiTiles
          tiles={[
            { key: "unusual", label: g("kpiUnusual"), value: anomalies.data ? formatNumber(openAnomalies.length) : "…", icon: Activity, tone: "from-violet-50 dark:from-violet-950/20", accent: "text-violet-500" },
            { key: "rising", label: g("kpiRising"), value: trends.data ? formatNumber(moving.filter((t) => t.direction === "Increasing").length) : "…", icon: TrendingUp, tone: "from-sky-50 dark:from-sky-950/20", accent: "text-sky-500" },
            { key: "falling", label: g("kpiFalling"), value: trends.data ? formatNumber(moving.filter((t) => t.direction === "Decreasing").length) : "…", icon: TrendingDown, tone: "from-amber-50 dark:from-amber-950/20", accent: "text-amber-500" },
            { key: "zones", label: g("kpiZonesAffected"), value: formatNumber(zones.size), icon: MapPin, tone: "from-emerald-50 dark:from-emerald-950/20", accent: "text-emerald-600" },
          ]}
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <ListToolbar
              search={{ value: search, onChange: setSearch, placeholder: g("searchInsights") }}
              onRefresh={() => {
                void anomalies.refetch();
                void trends.refetch();
              }}
              isRefreshing={anomalies.isFetching || trends.isFetching}
              filter={{
                fields: [
                  {
                    key: "greenhouse",
                    label: g("greenhouseCol"),
                    value: houseId,
                    onChange: setHouseId,
                    options: [{ value: "all", label: g("allGreenhouses") }, ...houses.map((h) => ({ value: h.id, label: h.name }))],
                  },
                  {
                    key: "kind",
                    label: g("insightKind"),
                    value: kind,
                    onChange: (v) => setKind(v as Kind),
                    options: [
                      { value: "all", label: g("all") },
                      { value: "anomaly", label: g("kind_anomaly") },
                      { value: "trend", label: g("kind_trend") },
                    ],
                  },
                ],
                activeCount: (houseId !== "all" ? 1 : 0) + (kind !== "all" ? 1 : 0),
                onClear: () => {
                  setHouseId("all");
                  setKind("all");
                },
              }}
            />

            {anomalies.isError && trends.isError ? (
              <LoadFailed onRetry={() => void anomalies.refetch()} />
            ) : loading ? (
              <div className="space-y-3" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-xl border p-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/30">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </span>
                <p className="max-w-md text-sm text-muted-foreground">{items.length ? g("noMatch") : g("noInsights")}</p>
              </div>
            ) : (
              <PlaceGroups items={shown} houses={houses} />
            )}
          </CardContent>
        </Card>
      </div>
    </UniformPage>
  );
}

function RowActions({ tip, onWork }: { tip: string; onWork: () => void }) {
  const { g } = useGreenhouseText();
  return (
    <>
      {tip && (
        <span className="inline-flex max-w-xs items-start gap-1 text-xs text-muted-foreground">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {tip}
        </span>
      )}
      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onWork}>
        <ClipboardList className="h-3.5 w-3.5" /> {g("createWorkOrder")}
      </Button>
    </>
  );
}
