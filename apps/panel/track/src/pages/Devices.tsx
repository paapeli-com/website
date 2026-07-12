import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Plus } from "lucide-react";
import { useDevices } from "@/contexts/DeviceContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Battery, Signal, StatusPill, TypeAvatar } from "@/components/DeviceBits";
import { Button } from "@/components/ui/button";
import {
  DevicesToolbar,
  PosFilter,
  SortKey,
  StatusFilter,
  TypeFilterV,
} from "@/components/DevicesToolbar";

export default function Devices() {
  const { devices } = useDevices();
  const { t, num, relTime, label } = useLanguage();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [fStatus, setFStatus] = useState<StatusFilter>("all");
  const [fType, setFType] = useState<TypeFilterV>("all");
  const [fPos, setFPos] = useState<PosFilter>("all");

  const list = useMemo(() => {
    let r = devices.slice();
    if (fType !== "all") r = r.filter((d) => d.type === fType);
    if (fStatus !== "all") r = r.filter((d) => d.status === fStatus);
    if (fPos !== "all") r = r.filter((d) => d.positioning === fPos);
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.subtitle.toLowerCase().includes(q),
      );
    }
    r.sort((a, b) => {
      if (sort === "nameAsc") return a.name.localeCompare(b.name);
      if (sort === "nameDesc") return b.name.localeCompare(a.name);
      if (sort === "status") return a.status === b.status ? 0 : a.status === "online" ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return r;
  }, [devices, fType, fStatus, fPos, search, sort]);

  const clearFilters = () => {
    setFStatus("all");
    setFType("all");
    setFPos("all");
  };

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("devices")}</h1>
          <p className="text-sm text-muted-foreground">{num(list.length)} {t("deviceCountUnit")}</p>
        </div>
        <Button size="sm" onClick={() => toast.success(t("addDevice"), { description: t("comingSoon") })}>
          <Plus className="size-4" />
          {t("addDevice")}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4">
        <DevicesToolbar
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          fStatus={fStatus}
          setFStatus={setFStatus}
          fType={fType}
          setFType={setFType}
          fPos={fPos}
          setFPos={setFPos}
          onClear={clearFilters}
          onRefresh={() => toast(t("refresh"))}
        />
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
        {list.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">—</div>
        ) : (
          list.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/devices/${d.id}`)}
              className="flex w-full flex-col gap-3 border-b border-border p-4 text-start transition-colors last:border-0 hover:bg-muted lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4 lg:px-5"
            >
              <div className="flex items-center gap-3">
                <TypeAvatar type={d.type} size={40} />
                <div>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.model}</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{label(d.subtitle)}</span>
              <span><StatusPill status={d.status} /></span>
              <span className="flex items-center gap-2"><Battery level={d.battery} /><Signal bars={d.signal} /></span>
              <span className="text-sm text-muted-foreground">{relTime(d.updatedAt)}</span>
              <ChevronRight className="hidden size-4 text-muted-foreground rtl:rotate-180 lg:block" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
