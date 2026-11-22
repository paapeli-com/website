import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Warehouse } from "lucide-react";
import type { CropCycle, DeviceResponse, Greenhouse } from "@paapeli/api";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { formatDateTime } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "./CropIcon";
import { useGreenhouseText } from "../i18n";

/* Smart Greenhouse's alarm, insight and work pages all answer "where": every
   item is placed in a greenhouse and a zone (a bed counts as its zone), and
   shown under them, with what grows there. */

export interface Place {
  houseId: string;
  houseName: string;
  /** Null for something on the greenhouse itself. */
  zoneId: string | null;
  zoneName: string;
  cycle: CropCycle | null;
}

/** Where each device and each location of the product is. */
export function usePlaces(houses: Greenhouse[], devices: DeviceResponse[]) {
  return useMemo(() => {
    const byAsset = new Map<string, Place>();
    houses.forEach((house) => {
      byAsset.set(house.id, { houseId: house.id, houseName: house.name, zoneId: null, zoneName: "", cycle: null });
      house.zones.forEach((zone) => {
        const place = { houseId: house.id, houseName: house.name, zoneId: zone.id, zoneName: zone.name, cycle: zone.cycle ?? null };
        byAsset.set(zone.id, place);
        zone.beds.forEach((bed) => byAsset.set(bed.id, { ...place, cycle: bed.cycle ?? zone.cycle ?? null }));
      });
    });
    const byDevice = new Map<string, Place>();
    devices.forEach((d) => {
      const place = byAsset.get(d.assetId);
      if (place) byDevice.set(d.id, place);
    });
    const of = (assetId?: string | null, deviceId?: string | null): Place | null =>
      (assetId && byAsset.get(assetId)) || (deviceId && byDevice.get(deviceId)) || null;
    return { byAsset, byDevice, of };
  }, [houses, devices]);
}

export interface PlacedItem {
  key: string;
  place: Place | null;
  /** Higher comes first within a zone. */
  rank?: number;
  node: ReactNode;
}

/** Items grouped by greenhouse, then zone; a greenhouse with more to look at comes first. */
export function PlaceGroups({ items, houses }: { items: PlacedItem[]; houses: Greenhouse[] }) {
  const { g, named, language, isRTL, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const Go = isRTL ? ChevronLeft : ChevronRight;

  const groups = useMemo(() => {
    const byHouse = new Map<string, { name: string; zones: Map<string, { name: string; cycle: CropCycle | null; items: PlacedItem[] }> }>();
    const order = (id: string | null, name: string) => {
      const key = id ?? "";
      if (!byHouse.has(key)) byHouse.set(key, { name, zones: new Map() });
      return byHouse.get(key)!;
    };
    items.forEach((item) => {
      const house = order(item.place?.houseId ?? null, item.place?.houseName ?? g("otherPlaces"));
      const zoneKey = item.place?.zoneId ?? "";
      if (!house.zones.has(zoneKey)) {
        house.zones.set(zoneKey, {
          name: item.place ? (item.place.zoneId ? item.place.zoneName : g("greenhouseWide")) : "",
          cycle: item.place?.cycle ?? null,
          items: [],
        });
      }
      house.zones.get(zoneKey)!.items.push(item);
    });
    const houseOrder = new Map(houses.map((h, i) => [h.id, i]));
    return [...byHouse.entries()]
      .map(([id, house]) => ({
        id,
        name: house.name,
        count: [...house.zones.values()].reduce((n, z) => n + z.items.length, 0),
        zones: [...house.zones.entries()]
          .map(([zoneId, zone]) => ({ zoneId, ...zone, items: [...zone.items].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0)) }))
          .sort((a, b) => (a.zoneId === "" ? 1 : 0) - (b.zoneId === "" ? 1 : 0) || a.name.localeCompare(b.name, language)),
      }))
      .sort((a, b) => (a.id === "" ? 1 : 0) - (b.id === "" ? 1 : 0) || b.count - a.count || (houseOrder.get(a.id) ?? 0) - (houseOrder.get(b.id) ?? 0));
  }, [items, houses, g, language]);

  return (
    <div className="space-y-4">
      {groups.map((house) => (
        <section key={house.id || "other"} className="rounded-xl border bg-card">
          <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Warehouse className="h-4 w-4 shrink-0 text-primary" />
              <h2 className="truncate font-semibold">{house.name}</h2>
              <span className="rounded-full bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">{formatNumber(house.count)}</span>
            </div>
            {house.id && (
              <button
                type="button"
                onClick={() => navigate(localizedPath(`/greenhouses/${house.id}`, language))}
                className="inline-flex shrink-0 items-center gap-0.5 text-xs text-primary hover:underline"
              >
                {g("openGreenhouse")} <Go className="h-3.5 w-3.5" />
              </button>
            )}
          </header>
          <div className="divide-y">
            {house.zones.map((zone) => (
              <div key={zone.zoneId || "house"} className="px-4 py-3">
                {zone.name && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">{zone.name}</span>
                    {zone.cycle && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CropIcon icon={zone.cycle.crop.icon} className="h-3.5 w-3.5" />
                        {named(zone.cycle.crop.names, zone.cycle.crop.name)} · {named(zone.cycle.stage.names, zone.cycle.stage.name)}
                      </span>
                    )}
                  </div>
                )}
                <ul className="space-y-1.5">
                  {zone.items.map((item) => (
                    <li key={item.key}>{item.node}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** One thing to look at: what it is, a line under it, when, and what can be done. */
export function IssueRow({
  icon: Icon,
  tone,
  title,
  sub,
  at,
  actions,
  onOpen,
  muted,
}: {
  icon: typeof Warehouse;
  tone: string;
  title: ReactNode;
  sub?: ReactNode;
  at?: string | number | null;
  actions?: ReactNode;
  onOpen?: () => void;
  muted?: boolean;
}) {
  const { language } = useGreenhouseText();
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center", muted && "opacity-70")}>
      <button type="button" onClick={onOpen} disabled={!onOpen} className="flex min-w-0 flex-1 items-start gap-2.5 text-start disabled:cursor-default">
        <span className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md", tone)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          {(sub || at) && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {sub}
              {sub && at ? " · " : ""}
              {at ? formatDateTime(at, language) : ""}
            </span>
          )}
        </span>
      </button>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">{actions}</div>}
    </div>
  );
}

export interface KpiTile {
  key: string;
  label: string;
  value: string;
  icon: typeof Warehouse;
  tone: string;
  accent: string;
}

/** The KPI row the greenhouses page uses, for the pages that sit beside it. */
export function KpiTiles({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((k) => (
        <div key={k.key} className={`rounded-lg border bg-card bg-gradient-to-br px-3 py-2.5 ${k.tone} to-transparent`}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-muted-foreground">{k.label}</span>
            <k.icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
          </div>
          <div className="mt-1 text-xl font-bold leading-none tabular-nums">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
