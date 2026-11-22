import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Bug, CalendarClock, ClipboardList, Droplets, FlaskConical, List, Plus, ShoppingBasket, Thermometer, Cpu, AlertOctagon, Sprout } from "lucide-react";
import type { WorkOrderResponse } from "@paapeli/api";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { ListToolbar } from "@/features/factory/components/panel/ListToolbar";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { useGreenhouses } from "../hooks";
import { useOpenWorkOrders, useProductDevices } from "../operations";
import { IssueRow, KpiTiles, PlaceGroups, usePlaces, type PlacedItem } from "../components/PlaceGroups";
import { READY_ROUNDS } from "../workOrderTemplates";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

type Due = "overdue" | "today" | "upcoming" | "none";

const ROUND_ICONS: Record<string, typeof Droplets> = {
  irrigation: Droplets,
  scouting: Bug,
  climate: Thermometer,
  nutrients: FlaskConical,
  harvest: ShoppingBasket,
  sensors: Cpu,
};

const PRIORITY_TONE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  MEDIUM: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  LOW: "bg-muted text-muted-foreground",
};

function dueOf(order: WorkOrderResponse, now = new Date()): Due {
  if (!order.dueAt) return "none";
  const due = new Date(order.dueAt);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  if (due < now) return "overdue";
  return due < end ? "today" : "upcoming";
}

const DUE_RANK: Record<Due, number> = { overdue: 4, today: 3, upcoming: 2, none: 1 };

/**
 * A grower's work: the usual rounds one click away, and every open work order
 * under the greenhouse and zone it is for, late ones first. The full work
 * order list stays a click away for everything else.
 */
export default function GreenhouseWork() {
  const { g, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);
  const greenhouses = useGreenhouses();
  const houses = useMemo(() => greenhouses.data ?? [], [greenhouses.data]);
  const devices = useProductDevices();
  const places = usePlaces(houses, devices.data ?? []);
  const orders = useOpenWorkOrders();

  const [search, setSearch] = useState("");
  const [houseId, setHouseId] = useState("all");
  const [due, setDue] = useState<Due | "all">("all");

  const startRound = (title: string) => navigate(lp(`/work-orders/new?${new URLSearchParams({ title, priority: "Medium" }).toString()}`));

  const items: (PlacedItem & { due: Due; text: string })[] = (orders.data ?? []).map((o) => {
    const place = places.of(o.assetId, o.deviceId);
    const d = dueOf(o);
    return {
      key: o.id,
      place,
      due: d,
      rank: DUE_RANK[d] * 10 + ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[o.priority] ?? 0),
      text: `${o.title} ${o.subjectLabel ?? ""} ${o.locationLabel ?? ""} ${place?.houseName ?? ""} ${place?.zoneName ?? ""}`,
      node: (
        <IssueRow
          icon={d === "overdue" ? AlertOctagon : o.alarmId ? Bell : ClipboardList}
          tone={d === "overdue" ? "bg-red-50 text-red-600 dark:bg-red-950/30" : d === "today" ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30" : "bg-sky-50 text-sky-600 dark:bg-sky-950/30"}
          title={o.title}
          sub={
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-1.5 text-[10px] font-medium", PRIORITY_TONE[o.priority])}>{g(`priority_${o.priority}` as GreenhouseTextKey)}</span>
              <span>{g(`wo_${o.status}` as GreenhouseTextKey)}</span>
              {o.dueAt && <span className={cn(d === "overdue" && "text-red-600")}>{g("dueOn", { date: formatDate(o.dueAt, language) })}</span>}
              {!place && o.locationLabel && <span>{o.locationLabel}</span>}
            </span>
          }
          onOpen={() => navigate(lp(`/work-orders/${o.id}`))}
        />
      ),
    };
  });

  const q = search.trim().toLowerCase();
  const shown = items.filter((i) => (due === "all" || i.due === due) && (houseId === "all" || i.place?.houseId === houseId) && (!q || i.text.toLowerCase().includes(q)));
  const count = (d: Due) => items.filter((i) => i.due === d).length;

  return (
    <UniformPage>
      <div className="space-y-4">
        <div>
          <PageHeader
            title={g("workTitle")}
            count={orders.data ? items.length : null}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="h-10 gap-2" onClick={() => navigate(lp("/work-orders"))}>
                  <List className="h-4 w-4" /> {g("allWorkOrders")}
                </Button>
                <Button className="h-10 gap-2 bg-primary px-5 text-primary-foreground hover:bg-primary/90" onClick={() => navigate(lp("/work-orders/new"))}>
                  <Plus className="h-4 w-4" /> {g("newWorkOrder")}
                </Button>
              </div>
            }
          />
          <p className="-mt-2 mb-2 text-sm text-muted-foreground">{g("workSubtitle")}</p>
        </div>

        <KpiTiles
          tiles={[
            { key: "open", label: g("kpiOpenWork"), value: orders.data ? formatNumber(items.length) : "…", icon: ClipboardList, tone: "from-sky-50 dark:from-sky-950/20", accent: "text-sky-500" },
            { key: "overdue", label: g("due_overdue"), value: orders.data ? formatNumber(count("overdue")) : "…", icon: AlertOctagon, tone: "from-red-50 dark:from-red-950/20", accent: "text-red-500" },
            { key: "today", label: g("due_today"), value: orders.data ? formatNumber(count("today")) : "…", icon: CalendarClock, tone: "from-orange-50 dark:from-orange-950/20", accent: "text-primary" },
            { key: "alarms", label: g("kpiFromAlarms"), value: orders.data ? formatNumber((orders.data ?? []).filter((o) => o.alarmId).length) : "…", icon: Bell, tone: "from-amber-50 dark:from-amber-950/20", accent: "text-amber-500" },
          ]}
        />

        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sprout className="h-4 w-4 text-primary" /> {g("quickStart")}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {READY_ROUNDS.map((r) => {
                const Icon = ROUND_ICONS[r.key] ?? ClipboardList;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => startRound(r.name[language])}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-start text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                      <Icon className="h-4 w-4 text-emerald-600" />
                    </span>
                    <span className="leading-tight">{r.name[language]}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <ListToolbar
              search={{ value: search, onChange: setSearch, placeholder: g("searchWork") }}
              onRefresh={() => void orders.refetch()}
              isRefreshing={orders.isFetching}
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
                    key: "due",
                    label: g("dueLabel"),
                    value: due,
                    onChange: (v) => setDue(v as Due | "all"),
                    options: [
                      { value: "all", label: g("all") },
                      { value: "overdue", label: g("due_overdue") },
                      { value: "today", label: g("due_today") },
                      { value: "upcoming", label: g("due_upcoming") },
                      { value: "none", label: g("due_none") },
                    ],
                  },
                ],
                activeCount: (houseId !== "all" ? 1 : 0) + (due !== "all" ? 1 : 0),
                onClear: () => {
                  setHouseId("all");
                  setDue("all");
                },
              }}
            />

            {orders.isError ? (
              <LoadFailed onRetry={() => void orders.refetch()} />
            ) : orders.isLoading || greenhouses.isLoading ? (
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
                <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                <p className="max-w-md text-sm text-muted-foreground">{items.length ? g("noMatch") : g("noOpenWork")}</p>
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
