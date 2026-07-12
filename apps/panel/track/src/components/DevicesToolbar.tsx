import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Columns3,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Table,
  X,
} from "lucide-react";
import { AssetType } from "@/data/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

/* Devices toolbar — same controls & order as the Smart Factory list      */
/* (Search · view toggles · refresh · Filters · Sort · Actions), styled    */
/* to match the GPS Tracking design.                                       */

export type SortKey = "nameAsc" | "nameDesc" | "updated" | "status";
export type StatusFilter = "all" | "online" | "offline";
export type PosFilter = "all" | "GPS" | "LBS" | "WiFi";
export type TypeFilterV = "all" | AssetType;

type Props = {
  search: string;
  setSearch: (v: string) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  fStatus: StatusFilter;
  setFStatus: (v: StatusFilter) => void;
  fType: TypeFilterV;
  setFType: (v: TypeFilterV) => void;
  fPos: PosFilter;
  setFPos: (v: PosFilter) => void;
  onClear: () => void;
  onRefresh: () => void;
};

const triggerCls = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
    active ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted",
  );

const selectCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

export function DevicesToolbar(props: Props) {
  const { t } = useLanguage();
  const [menu, setMenu] = useState<null | "filters" | "sort" | "actions">(null);
  const filtersActive = props.fStatus !== "all" || props.fType !== "all" || props.fPos !== "all";

  const SORTS: { key: SortKey; labelKey: TranslationKey }[] = [
    { key: "nameAsc", labelKey: "sortNameAz" },
    { key: "nameDesc", labelKey: "sortNameZa" },
    { key: "updated", labelKey: "sortUpdated" },
    { key: "status", labelKey: "status" },
  ];

  const close = () => setMenu(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-[180px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
        <input
          value={props.search}
          onChange={(e) => props.setSearch(e.target.value)}
          placeholder={t("searchDevices")}
          className="h-10 w-full rounded-xl border border-border bg-card text-sm outline-none transition-colors focus:border-primary ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
        />
      </div>

      {/* View toggles (table active; others reserved) */}
      <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-card p-1 sm:inline-flex">
        <button className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-label="Table view">
          <Table className="size-4" />
        </button>
        {[Columns3, LayoutGrid, List].map((Icon, i) => (
          <button key={i} disabled className="flex size-8 cursor-not-allowed items-center justify-center rounded-lg text-muted-foreground/40">
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Refresh */}
      <button
        onClick={props.onRefresh}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("refresh")}
      >
        <RefreshCw className="size-4" />
      </button>

      {/* Filters */}
      <div className="relative" onMouseLeave={close}>
        <button onClick={() => setMenu(menu === "filters" ? null : "filters")} className={triggerCls(filtersActive || menu === "filters")}>
          <Filter className="size-4" />
          {t("filters")}
          <ChevronDown className={cn("size-4 transition-transform", menu === "filters" && "rotate-180")} />
        </button>
        {menu === "filters" && (
          <div className="absolute z-50 mt-1 w-64 space-y-3 rounded-xl border border-border bg-popover p-3 shadow-lg ltr:right-0 rtl:left-0">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("status")}</span>
              <select className={selectCls} value={props.fStatus} onChange={(e) => props.setFStatus(e.target.value as StatusFilter)}>
                <option value="all">{t("all")}</option>
                <option value="online">{t("online")}</option>
                <option value="offline">{t("offline")}</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("type")}</span>
              <select className={selectCls} value={props.fType} onChange={(e) => props.setFType(e.target.value as TypeFilterV)}>
                <option value="all">{t("all")}</option>
                <option value="pet">{t("pet")}</option>
                <option value="person">{t("person")}</option>
                <option value="vehicle">{t("vehicle")}</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("positioning")}</span>
              <select className={selectCls} value={props.fPos} onChange={(e) => props.setFPos(e.target.value as PosFilter)}>
                <option value="all">{t("all")}</option>
                <option value="GPS">GPS</option>
                <option value="LBS">LBS</option>
                <option value="WiFi">WiFi</option>
              </select>
            </label>
            <button
              onClick={() => { props.onClear(); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
              {t("clear")}
            </button>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="relative" onMouseLeave={close}>
        <button onClick={() => setMenu(menu === "sort" ? null : "sort")} className={triggerCls(menu === "sort")}>
          <ArrowUpDown className="size-4" />
          {t("sortBy")}
          <ChevronDown className={cn("size-4 transition-transform", menu === "sort" && "rotate-180")} />
        </button>
        {menu === "sort" && (
          <div className="absolute z-50 mt-1 w-48 rounded-xl border border-border bg-popover py-1 shadow-lg ltr:right-0 rtl:left-0">
            {SORTS.map((s) => {
              const active = props.sort === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => { props.setSort(s.key); close(); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                    active ? "bg-primary/5 font-medium text-primary" : "text-foreground",
                  )}
                >
                  <span className="flex-1 text-start">{t(s.labelKey)}</span>
                  {active && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="relative" onMouseLeave={close}>
        <button onClick={() => setMenu(menu === "actions" ? null : "actions")} className={triggerCls(menu === "actions")}>
          {t("actions")}
          <ChevronDown className={cn("size-4 transition-transform", menu === "actions" && "rotate-180")} />
        </button>
        {menu === "actions" && (
          <div className="absolute z-50 mt-1 w-44 rounded-xl border border-border bg-popover py-1 shadow-lg ltr:right-0 rtl:left-0">
            {["Export CSV", "Bulk edit", "Delete"].map((a) => (
              <button
                key={a}
                onClick={() => { close(); toast(a, { description: t("comingSoon") }); }}
                className="flex w-full items-center px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
