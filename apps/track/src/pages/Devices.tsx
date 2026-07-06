import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Plus } from "lucide-react";
import { useDevices } from "@/contexts/DeviceContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { TypeFilter, TypeFilterValue } from "@/components/TypeFilter";
import { Battery, Signal, StatusPill, TypeAvatar } from "@/components/DeviceBits";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export default function Devices() {
  const { devices } = useDevices();
  const { t, num } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TypeFilterValue>("all");

  const list = useMemo(() => devices.filter((d) => filter === "all" || d.type === filter), [devices, filter]);

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("devices")}</h1>
          <p className="text-sm text-muted-foreground">{num(list.length)} {t("devices").toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <TypeFilter value={filter} onChange={setFilter} />
          <Button size="sm" onClick={() => toast.success(t("addDevice"), { description: t("comingSoon") })}>
            <Plus className="size-4" />
            {t("addDevice")}
          </Button>
        </div>
      </div>

      {/* Table on lg, cards on mobile */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
          <span>{t("deviceName")}</span>
          <span>{t("type")}</span>
          <span>{t("status")}</span>
          <span>{t("battery")}</span>
          <span>{t("updated")}</span>
          <span className="w-8" />
        </div>
        {list.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(`/devices/${d.id}`)}
            className="flex w-full flex-col gap-3 border-b border-border p-4 text-start transition-colors last:border-0 hover:bg-secondary lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4 lg:px-5"
          >
            <div className="flex items-center gap-3">
              <TypeAvatar type={d.type} size={40} />
              <div>
                <p className="text-sm font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.model}</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{d.subtitle}</span>
            <span><StatusPill status={d.status} /></span>
            <span className="flex items-center gap-2"><Battery level={d.battery} /><Signal bars={d.signal} /></span>
            <span className="text-sm text-muted-foreground">{timeAgo(d.updatedAt)}</span>
            <ChevronRight className="hidden size-4 text-muted-foreground rtl:rotate-180 lg:block" />
          </button>
        ))}
      </div>
    </div>
  );
}
