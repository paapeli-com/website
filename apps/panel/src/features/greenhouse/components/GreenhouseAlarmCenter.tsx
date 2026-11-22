import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, Cpu, Sprout, Warehouse, WifiOff } from "lucide-react";
import { currentProductKey } from "@/features/factory/lib/product";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { alarmRuleName } from "@/features/factory/i18n/solutionText";
import { ListToolbar } from "@/features/factory/components/panel/ListToolbar";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { useAlarmActions } from "@/shared/hooks/useAlarmActions";
import { isUnacknowledged, needsAttention } from "@/shared/lib/alarmStatus";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useGreenhouses, useGreenhouseWorkspace } from "../hooks";
import { useEnvironment, useGreenhouseOps, useProductAlarms, useProductDevices } from "../operations";
import { evaluate } from "../evaluation";
import { useFindingText } from "./FindingText";
import { IssueRow, KpiTiles, PlaceGroups, usePlaces, type Place, type PlacedItem } from "./PlaceGroups";
import { useGreenhouseText } from "../i18n";

type IssueType = "all" | "range" | "alarm" | "offline";

/** Readings are checked for this many sensors across the product at once. */
const SENSORS_READ = 60;

/**
 * Smart Greenhouse's alarm center: everything that needs a grower now, under
 * the greenhouse and zone it is in. A zone outside its crop's target (read
 * live), the platform's active alarms, and sensors that went quiet.
 */
export function GreenhouseAlarmCenter() {
  const { g, language, formatNumber, named } = useGreenhouseText();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const describe = useFindingText();
  const { workspaceId } = useGreenhouseWorkspace();
  const greenhouses = useGreenhouses();
  const houses = useMemo(() => greenhouses.data ?? [], [greenhouses.data]);
  const devices = useProductDevices();
  const alarms = useProductAlarms();
  const { byHouse } = useGreenhouseOps(houses);
  const allDevices = useMemo(() => devices.data ?? [], [devices.data]);
  const placedDevices = useMemo(() => houses.flatMap((h) => byHouse.get(h.id)?.devices ?? []), [houses, byHouse]);
  const env = useEnvironment(placedDevices, placedDevices.length > 0, SENSORS_READ);
  const places = usePlaces(houses, allDevices);
  const actions = useAlarmActions(workspaceId, currentProductKey());

  const [search, setSearch] = useState("");
  const [houseId, setHouseId] = useState("all");
  const [type, setType] = useState<IssueType>("all");

  const findings = useMemo(() => houses.flatMap((h) => evaluate(h, byHouse.get(h.id), env.readings).map((f) => ({ house: h, f }))), [houses, byHouse, env.readings]);
  const active = useMemo(() => (alarms.data ?? []).filter((a) => needsAttention(a.status)), [alarms.data]);
  const offline = useMemo(() => allDevices.filter((d) => !d.active), [allDevices]);

  const workOrder = (q: Record<string, string>) => navigate(lp(`/work-orders/new?${new URLSearchParams({ priority: "High", ...q }).toString()}`));
  const placeText = (p: Place | null) => (p ? [p.houseName, p.zoneName].filter(Boolean).join(" › ") : "");
  const cropText = (p: Place | null) => (p?.cycle ? named(p.cycle.crop.names, p.cycle.crop.name) : "");

  const acknowledge = async (alarmId: string, deviceId: string) => {
    try {
      await actions.run("ack", alarmId, deviceId);
      toast.success(g("acknowledgedToast"));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("acknowledge")));
    }
  };

  const items: (PlacedItem & { type: Exclude<IssueType, "all">; text: string })[] = [
    ...findings.map(({ house, f }) => {
      const place: Place = { houseId: house.id, houseName: house.name, zoneId: f.zoneId, zoneName: f.zoneName, cycle: f.cycle };
      const text = describe(f);
      return {
        key: `f${f.zoneId}${f.metric}`,
        type: "range" as const,
        text: `${text} ${placeText(place)} ${cropText(place)}`,
        place,
        rank: 3,
        node: (
          <IssueRow
            icon={AlertTriangle}
            tone="bg-orange-50 text-orange-600 dark:bg-orange-950/30"
            title={text}
            sub={g("liveReading")}
            actions={
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => workOrder({ title: text, assetId: f.zoneId, location: f.zoneName })}>
                <ClipboardList className="h-3.5 w-3.5" /> {g("createWorkOrder")}
              </Button>
            }
          />
        ),
      };
    }),
    ...active.map((a) => {
      const place = places.of(a.assetId, a.deviceId);
      const name = alarmRuleName(a.alarmName, language);
      const critical = /CRITICAL|MAJOR/i.test(a.severity);
      return {
        key: `a${a.id}`,
        type: "alarm" as const,
        text: `${name} ${a.deviceName ?? ""} ${placeText(place)} ${cropText(place)}`,
        place,
        rank: critical ? 4 : 2,
        node: (
          <IssueRow
            icon={Bell}
            tone={critical ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "bg-amber-50 text-amber-600 dark:bg-amber-950/30"}
            title={name}
            sub={a.deviceName}
            at={a.createdAt}
            muted={!isUnacknowledged(a.status)}
            onOpen={() => navigate(lp(`/devices/${a.deviceId}`))}
            actions={
              <>
                {isUnacknowledged(a.status) ? (
                  <Button size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" disabled={actions.busyId === a.id} onClick={() => acknowledge(a.id, a.deviceId)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {g("acknowledge")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() =>
                    workOrder({
                      title: [name, place?.zoneName || a.deviceName].filter(Boolean).join(": "),
                      alarmId: a.id,
                      deviceId: a.deviceId,
                      ...(place?.zoneId ? { assetId: place.zoneId } : {}),
                      location: placeText(place),
                    })
                  }
                >
                  <ClipboardList className="h-3.5 w-3.5" /> {g("createWorkOrder")}
                </Button>
              </>
            }
          />
        ),
      };
    }),
    ...offline.map((d) => {
      const place = places.of(d.assetId, d.id);
      return {
        key: `d${d.id}`,
        type: "offline" as const,
        text: `${d.name} ${placeText(place)}`,
        place,
        rank: 1,
        node: (
          <IssueRow
            icon={WifiOff}
            tone="bg-slate-100 text-slate-600 dark:bg-slate-800"
            title={g("deviceOffline", { name: d.name })}
            sub={d.type}
            onOpen={() => navigate(lp(`/devices/${d.id}`))}
            actions={
              <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => navigate(lp(`/devices/${d.id}`))}>
                <Cpu className="h-3.5 w-3.5" /> {g("openDevice")}
              </Button>
            }
          />
        ),
      };
    }),
  ];

  const q = search.trim().toLowerCase();
  const shown = items.filter(
    (i) => (type === "all" || i.type === type) && (houseId === "all" || i.place?.houseId === houseId) && (!q || i.text.toLowerCase().includes(q)),
  );

  const loading = greenhouses.isLoading || devices.isLoading || alarms.isLoading;
  const housesWithIssues = new Set(items.filter((i) => i.type !== "offline").map((i) => i.place?.houseId).filter(Boolean));

  return (
    <div className="space-y-4">
      <KpiTiles
        tiles={[
          { key: "alarms", label: g("kpiActiveAlarms"), value: alarms.data ? formatNumber(active.length) : "…", icon: Bell, tone: "from-red-50 dark:from-red-950/20", accent: "text-red-500" },
          { key: "range", label: g("kpiOutOfRange"), value: formatNumber(new Set(findings.map((x) => x.f.zoneId)).size), icon: AlertTriangle, tone: "from-orange-50 dark:from-orange-950/20", accent: "text-orange-500" },
          { key: "offline", label: g("kpiOffline"), value: devices.data ? formatNumber(offline.length) : "…", icon: WifiOff, tone: "from-slate-100 dark:from-slate-800/40", accent: "text-slate-500" },
          { key: "houses", label: g("kpiHousesAttention"), value: formatNumber(housesWithIssues.size), icon: Warehouse, tone: "from-amber-50 dark:from-amber-950/20", accent: "text-amber-500" },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: g("searchAlarms") }}
            onRefresh={() => {
              void alarms.refetch();
              void devices.refetch();
            }}
            isRefreshing={alarms.isFetching}
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
                  key: "type",
                  label: g("issueType"),
                  value: type,
                  onChange: (v) => setType(v as IssueType),
                  options: [
                    { value: "all", label: g("all") },
                    { value: "range", label: g("type_range") },
                    { value: "alarm", label: g("type_alarm") },
                    { value: "offline", label: g("type_offline") },
                  ],
                },
              ],
              activeCount: (houseId !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0),
              onClear: () => {
                setHouseId("all");
                setType("all");
              },
            }}
          />

          {loading ? (
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
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                <Sprout className="h-6 w-6 text-emerald-600" />
              </span>
              <p className="max-w-md text-sm text-muted-foreground">{items.length ? g("noMatch") : g("allClear")}</p>
            </div>
          ) : (
            <PlaceGroups items={shown} houses={houses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
