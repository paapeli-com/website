import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, Send, SlidersHorizontal } from "lucide-react";
import { useDevices } from "@/features/track/contexts/DeviceContext";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { GEOFENCES } from "@/features/track/data/mockData";
import { LeafletMap } from "@/features/track/components/map/LeafletMap";
import { TypeFilter, TypeFilterValue } from "@/features/track/components/TypeFilter";
import { CommandDrawer } from "@/features/track/components/CommandDrawer";
import { Battery, Signal, StatusPill, TypeAvatar } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { NoData } from "@/features/track/components/NoData";
import { cn } from "@/shared/lib/utils";

export default function LiveMap() {
  const { devices, selectedId, setSelectedId, selected } = useDevices();
  const { t, num, relTime, label } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TypeFilterValue>("all");
  const [cmdOpen, setCmdOpen] = useState(false);

  const list = useMemo(() => devices.filter((d) => filter === "all" || d.type === filter), [devices, filter]);
  const online = devices.filter((d) => d.status === "online").length;
  const shown = filter === "all" ? devices : list;

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("liveMap")}</h1>
          <p className="text-sm text-muted-foreground">
            {num(online)} {t("onlineDevices")} · {num(devices.length)} {t("deviceCountUnit")}
          </p>
        </div>
        <TypeFilter value={filter} onChange={setFilter} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Device list */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">{t("devices")}</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {list.length === 0 && <NoData size="sm" />}
            {list.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors",
                  d.id === selectedId ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                <TypeAvatar type={d.type} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{label(d.subtitle)} · {relTime(d.updatedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={d.status} />
                  <Battery level={d.battery} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map + status card */}
        <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border">
          <LeafletMap
            devices={shown}
            selectedId={selectedId}
            onSelect={setSelectedId}
            geofences={GEOFENCES}
            className="absolute inset-0 h-full w-full"
          />

          {/* Selected-device card (floating over the map) */}
          {selected && (
          <div className="absolute bottom-3 z-[1000] w-72 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur ltr:left-3 rtl:right-3">

            <div className="flex items-center gap-3">
              <TypeAvatar type={selected.type} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{selected.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusPill status={selected.status} />
                  <span className="text-xs text-muted-foreground">{relTime(selected.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("battery")}</span>
                <Battery level={selected.battery} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("signal")}</span>
                <Signal bars={selected.signal} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("accuracy")}</span>
                <span className="font-medium">{selected.positioning}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{selected.type === "vehicle" ? t("speed") : t("type")}</span>
                <span className="font-medium">
                  {selected.type === "vehicle" ? `${num(selected.speedKmh)} km/h` : label(selected.subtitle)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="flex-1 truncate">{selected.address}</span>
              <button className="shrink-0 font-medium text-primary hover:underline">{t("viewAddress")}</button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => setCmdOpen(true)}>
                <Send className="size-4" />
                {t("commands")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/devices/${selected.id}`)}>
                {t("viewDetails")}
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
          )}

          {/* Nothing to plot: say so over the empty map rather than leaving it blank. */}
          {devices.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
              <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-6 shadow-xl backdrop-blur">
                <NoData />
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <CommandDrawer open={cmdOpen} onClose={() => setCmdOpen(false)} device={selected} />}
    </div>
  );
}
