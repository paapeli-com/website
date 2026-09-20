import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, ChevronRight, Cpu, Plus } from "lucide-react";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { useTrackers } from "@/features/track/lib/useTrackers";
import { StatusPill } from "@/features/track/components/DeviceBits";
import { Button } from "@/features/track/components/ui/button";
import { NoData } from "@/features/track/components/NoData";
import {
  DevicesToolbar,
  SortKey,
  StatusFilter,
  TypeFilterV,
  ViewMode,
} from "@/features/track/components/DevicesToolbar";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { cn } from "@/shared/lib/utils";
import { trackPath } from "@/features/track/lib/trackPath";
import { trackerIconOf } from "@/features/track/lib/trackerIcons";

function TrackerAvatar({ size = 40 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
      style={{ width: size, height: size }}
    >
      <Cpu className="size-1/2" />
    </span>
  );
}

export default function Devices() {
  const { trackers, total, load, noWorkspace, isFetching, refetch } = useTrackers();
  const { t, num, relTime } = useLanguage();
  const navigate = useNavigate();
  const pageLoad = usePageLoad({
    loading: load.loading || noWorkspace,
    failed: load.failed,
    onRetry: refetch,
  });

  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [fStatus, setFStatus] = useState<StatusFilter>("all");
  const [fType, setFType] = useState<TypeFilterV>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Only the types actually present, so the filter never offers an empty result.
  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of trackers) if (!seen.has(d.type)) seen.set(d.type, d.typeLabel);
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [trackers]);

  const list = useMemo(() => {
    let r = trackers.slice();
    if (fType !== "all") r = r.filter((d) => d.type === fType);
    if (fStatus !== "all") r = r.filter((d) => d.status === fStatus);
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.label.toLowerCase().includes(q) ||
          d.typeLabel.toLowerCase().includes(q),
      );
    }
    r.sort((a, b) => {
      if (sort === "nameAsc") return a.name.localeCompare(b.name);
      if (sort === "nameDesc") return b.name.localeCompare(a.name);
      if (sort === "status") return a.status === b.status ? 0 : a.status === "online" ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return r;
  }, [trackers, fType, fStatus, search, sort]);

  const clearFilters = () => {
    setFStatus("all");
    setFType("all");
  };

  const isOpen = (k: string) => !collapsed[k];
  const toggle = (k: string) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));

  const groups = typeOptions
    .map((o) => ({ key: o.value, label: o.label, items: list.filter((d) => d.type === o.value) }))
    .filter((g) => g.items.length > 0);

  if (pageLoad.status === "loading") return <PageSkeleton />;
  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("devices")}</h1>
          <p className="text-sm text-muted-foreground">{num(list.length)} {t("deviceCountUnit")}</p>
        </div>
        <Button size="sm" onClick={() => navigate(trackPath("/devices/new"))}>
          <Plus className="size-4" />
          {t("addDevice")}
        </Button>
      </div>

      <div className="mb-4">
        <DevicesToolbar
          view={view}
          setView={setView}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          fStatus={fStatus}
          setFStatus={setFStatus}
          fType={fType}
          setFType={setFType}
          typeOptions={typeOptions}
          onClear={clearFilters}
          onRefresh={() => void refetch()}
        />
      </div>

      {total > trackers.length && (
        <p className="mb-3 text-xs text-muted-foreground">
          {t("showingFirstDevices").replace("{shown}", num(trackers.length)).replace("{total}", num(total))}
        </p>
      )}

      <div className={cn("transition-opacity", isFetching && "opacity-60")}>
        {/* -------- Tree view -------- */}
        {view === "tree" ? (
          <div className="rounded-2xl border border-border bg-card p-2">
            {/* Root */}
            <button onClick={() => toggle("root")} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted">
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", isOpen("root") && "rotate-90")} />
              <Boxes className="size-4 text-primary" />
              <span className="text-sm font-semibold">{t("allDevices")}</span>
              <span className="text-xs text-muted-foreground">({num(list.length)})</span>
            </button>

            {isOpen("root") && groups.length === 0 && <NoData size="sm" />}

            {isOpen("root") &&
              groups.map((g) => (
                <div key={g.key} className="border-border ltr:ml-4 ltr:border-l ltr:pl-1 rtl:mr-4 rtl:border-r rtl:pr-1">
                  {/* Group — one per device type */}
                  <button onClick={() => toggle(g.key)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-muted">
                    <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", isOpen(g.key) && "rotate-90")} />
                    <TrackerAvatar size={24} />
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className="text-xs text-muted-foreground">({num(g.items.length)})</span>
                  </button>

                  {/* Devices */}
                  {isOpen(g.key) && (
                    <div className="border-border ltr:ml-4 ltr:border-l ltr:pl-1 rtl:mr-4 rtl:border-r rtl:pr-1">
                      {g.items.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => navigate(trackPath(`/devices/${d.id}`))}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-muted"
                        >
                          <TrackerAvatar size={28} />
                          <div className="min-w-0 flex-1">
                            <p dir="auto" className="truncate text-sm font-medium">{d.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{d.protocol} · {relTime(d.updatedAt)}</p>
                          </div>
                          <StatusPill status={d.status} />
                          <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          /* -------- Table view -------- */
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
              <span>{t("deviceName")}</span>
              <span>{t("deviceType")}</span>
              <span>{t("status")}</span>
              <span>{t("protocol")}</span>
              <span>{t("updated")}</span>
              <span className="w-8" />
            </div>
            {list.length === 0 ? (
              <NoData />
            ) : (
              list.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(trackPath(`/devices/${d.id}`))}
                  className="flex w-full flex-col gap-3 border-b border-border p-4 text-start transition-colors last:border-0 hover:bg-muted lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4 lg:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TrackerAvatar />
                    <div className="min-w-0">
                      <p dir="auto" className="truncate text-sm font-semibold">{d.name}</p>
                      {d.label && d.label !== d.name && !trackerIconOf(d.label) && (
                        <p dir="auto" className="truncate text-xs text-muted-foreground">{d.label}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{d.typeLabel}</span>
                  <span><StatusPill status={d.status} /></span>
                  <span className="text-sm text-muted-foreground">{d.protocol || "—"}</span>
                  <span className="text-sm text-muted-foreground">{relTime(d.updatedAt)}</span>
                  <ChevronRight className="hidden size-4 text-muted-foreground rtl:rotate-180 lg:block" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
