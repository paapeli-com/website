import { useMemo, useState } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Switch } from "@/features/factory/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import {
  Edit, Trash2, Plus, Zap, Wifi, Brain, Activity, Clock, Layers,
  Download, Pencil, Archive,
} from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import type { AlertRule, RuleType, AlertSeverity } from "@/features/factory/types/alerts";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { useAlertRulesStore } from "@/features/factory/hooks/useAlertStore";


const ruleTypeIcons: Record<RuleType, any> = {
  threshold: Zap,
  condition: Activity,
  time_window: Clock,
  device_state: Wifi,
  heartbeat: Activity,
  anomaly: Brain,
  cross_device: Layers,
};

const ruleTypeLabelKeys: Record<RuleType, string> = {
  threshold: "ruleTypeThreshold",
  condition: "ruleTypeCondition",
  time_window: "ruleTypeTimeWindow",
  device_state: "ruleTypeDeviceState",
  heartbeat: "ruleTypeHeartbeat",
  anomaly: "ruleTypeAnomaly",
  cross_device: "ruleTypeCrossDevice",
};

const severityColors: Record<AlertSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

interface AlertRulesListProps {
  onCreateRule: () => void;
}

export const AlertRulesList = ({ onCreateRule }: AlertRulesListProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;

  /* Only what the user actually created (localStorage-backed). The seeded
     ALR-* rules that used to be concatenated here were invented — there is no
     rules endpoint yet, so an empty store means no data. */
  const { items: rules } = useAlertRulesStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState("nameAsc");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  /* The switch was never persisted for the seeded rules either; this keeps it
     responsive without claiming a write the store cannot make. */
  const [enabledOverrides, setEnabledOverrides] = useState<Record<string, boolean>>({});
  const isEnabled = (rule: AlertRule) => enabledOverrides[rule.id] ?? rule.enabled;
  const toggleRule = (ruleId: string, current: boolean) => {
    setEnabledOverrides((prev) => ({ ...prev, [ruleId]: !current }));
  };

  const filtered = useMemo(() => {
    const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return rules
      .filter((r) => {
        if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !(r.description || "").toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== "all") {
          const on = statusFilter === "enabled";
          if (r.enabled !== on) return false;
        }
        if (severityFilter !== "all" && r.severity !== severityFilter) return false;
        if (triggerTypeFilter !== "all" && r.ruleType !== triggerTypeFilter) return false;
        if (locationFilter !== "all" && r.locationId !== locationFilter) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "nameDesc": return b.name.localeCompare(a.name);
          case "lastUpdated":
            return new Date((b as any).updatedAt || 0).getTime() - new Date((a as any).updatedAt || 0).getTime();
          case "severity":
            return (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0);
          case "nameAsc":
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [rules, search, statusFilter, severityFilter, triggerTypeFilter, locationFilter, sortKey]);

  const locations = useMemo(() => Array.from(new Set(rules.map((r) => r.locationId).filter(Boolean))) as string[], [rules]);

  const filterFields: FilterField[] = [
    {
      key: "status", label: tt("status"), value: statusFilter, onChange: setStatusFilter,
      options: [
        { value: "all", label: tt("all") },
        { value: "enabled", label: tt("enabled") },
        { value: "disabled", label: tt("disabled") || "Disabled" },
      ],
    },
    {
      key: "location", label: tt("location"), value: locationFilter, onChange: setLocationFilter,
      options: [{ value: "all", label: tt("all") }, ...locations.map((l) => ({ value: l, label: l }))],
    },
    {
      key: "severity", label: tt("alertSeverity"), value: severityFilter, onChange: setSeverityFilter,
      options: [
        { value: "all", label: tt("all") },
        { value: "critical", label: tt("alertCritical") },
        { value: "high", label: tt("alertHigh") },
        { value: "medium", label: tt("alertMedium") },
        { value: "low", label: tt("alertLow") },
      ],
    },
    {
      key: "triggerType", label: tt("triggerType"), value: triggerTypeFilter, onChange: setTriggerTypeFilter,
      options: [
        { value: "all", label: tt("all") },
        ...Object.keys(ruleTypeLabelKeys).map((k) => ({ value: k, label: tt(ruleTypeLabelKeys[k as RuleType]) })),
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: tt("sortNameAsc") },
    { key: "nameDesc", label: tt("sortNameDesc") },
    { key: "lastUpdated", label: tt("sortLastUpdated") },
    { key: "severity", label: tt("sortSeverity") },
  ];

  const handleExport = () => {
    const header = ["id", "name", "ruleType", "severity", "enabled", "triggerCount", "locationId"];
    const csv = [header.join(","), ...filtered.map((r) => header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alert-rules-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const actionItems: ActionItem[] = [
    { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
    { key: "bulkEdit", label: tt("bulkEdit"), icon: Pencil, comingSoon: true },
    { key: "archive", label: tt("archive"), icon: Archive, comingSoon: true },
    { key: "delete", label: tt("delete"), icon: Trash2, destructive: true, comingSoon: true },
  ];

  const activeFilterCount = [statusFilter, locationFilter, severityFilter, triggerTypeFilter].filter((v) => v !== "all").length;

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rules.length} {t("alertRulesCount")}
        </p>
        <Button size="sm" onClick={onCreateRule} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 gap-2 rounded-md">
          <Plus className="h-4 w-4" />
          {t("alertCreateRule")}
        </Button>
      </div>

      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: tt("alertSearchPlaceholder") }}
        view={{ value: listView, onChange: setListView, available: ["table"] }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setStatusFilter("all"); setLocationFilter("all"); setSeverityFilter("all"); setTriggerTypeFilter("all"); } }}
        sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
        actions={actionItems}
        selectionCount={0}
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{t("alertRuleName")}</TableHead>
              <TableHead>{t("alertRuleType")}</TableHead>
              <TableHead>{t("alertSeverity")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("alertTriggerCount")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("alertRuleScope")}</TableHead>
              <TableHead>{t("enabled")}</TableHead>
              <TableHead className="w-[80px] text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  {/* Nothing stored at all is "no data"; nothing matching the
                      current search/filters is an empty result set. */}
                  {rules.length === 0 ? (
                    <NoData />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">{tt("noResults") || "No results"}</p>
                  )}
                </TableCell>
              </TableRow>
            )}
            {paged.map((rule) => {
              const TypeIcon = ruleTypeIcons[rule.ruleType];
              return (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{tt(ruleTypeLabelKeys[rule.ruleType])}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[rule.severity]}>
                      {t(`alert${rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}` as any)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{rule.triggerCount}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {rule.deviceIds.length > 0 ? tt("devicesCount").replace("{n}", String(rule.deviceIds.length)) : rule.locationId || tt("all")}
                  </TableCell>
                  <TableCell>
                    <Switch checked={isEnabled(rule)} onCheckedChange={() => toggleRule(rule.id, isEnabled(rule))} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end">
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

