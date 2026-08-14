import { useState } from "react";
import { toast } from "sonner";
import { Plus, Radar } from "lucide-react";
import { DEVICES, GEOFENCES } from "@/data/mockData";
import { Geofence } from "@/data/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { LeafletMap } from "@/components/map/LeafletMap";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Geofences() {
  const { t, num } = useLanguage();
  const [zones, setZones] = useState<Geofence[]>(GEOFENCES);

  const toggle = (id: string) =>
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, active: !z.active } : z)));

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("geofences")}</h1>
          <p className="text-sm text-muted-foreground">{t("safeZonesDesc")}</p>
        </div>
        <Button size="sm" onClick={() => toast.success(t("addZone"), { description: t("comingSoon") })}>
          <Plus className="size-4" />
          {t("addZone")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <LeafletMap devices={DEVICES} geofences={zones} className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border" />

        <div className="flex flex-col gap-3">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Radar className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{z.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("radius")} {num(z.radius * 20)} m · {num(z.deviceIds.length)} {t("devices").toLowerCase()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Switch checked={z.active} onChange={() => toggle(z.id)} />
                <span className="text-[10px] text-muted-foreground">{t("enterExit")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
