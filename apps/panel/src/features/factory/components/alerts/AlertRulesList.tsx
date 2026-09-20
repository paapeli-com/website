import { useEffect, useMemo, useState } from "react";
import {
  useDeleteAlarmRuleMutation,
  useGetWorkspaceAlarmRulesQuery,
  type AlarmRuleItem,
  type AlarmRuleProvisioningState,
  type RuleTriggerType,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Trash2, Plus, Zap, Clock, Repeat, Download } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import { TableRowsSkeleton } from "@/features/factory/components/panel/DetailPageSkeleton";
import type { AlertSeverity } from "@/features/factory/types/alerts";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { queryLoad, usePageLoad } from "@/shared/hooks/usePageLoad";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { LoadingOverlay } from "@/shared/components/LoadingOverlay";
import { SEVERITY_RANK, apiSeverityToUi } from "./alarmRuleMapping";

/* One request covers the workspace: the API clamps page size to 1–100. Page 0
   is the first page whether the endpoint counts from 0 or treats anything
   below 1 as 1 (as its per-device sibling documents). */
const RULES_PAGE = 0;
const RULES_PAGE_SIZE = 100;
const PAGE_SIZE = 10;

const triggerIcons: Record<RuleTriggerType, typeof Zap> = {
  SIMPLE: Zap,
  DURATION: Clock,
  REPEATING: Repeat,
};

const triggerLabelKeys: Record<RuleTriggerType, string> = {
  SIMPLE: "alertTriggerSimple",
  DURATION: "alertTriggerDuration",
  REPEATING: "alertTriggerRepeating",
};

const stateLabelKeys: Record<AlarmRuleProvisioningState, string> = {
  PROVISIONING: "alertRuleStateProvisioning",
  ACTIVE: "alertRuleStateActive",
  FAILED: "alertRuleStateFailed",
  DELETING: "alertRuleStateDeleting",
};

const stateColors: Record<AlarmRuleProvisioningState, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
  PROVISIONING: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10",
  DELETING: "bg-muted text-muted-foreground hover:bg-muted",
  FAILED: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10",
};

const severityColors: Record<AlertSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

/** The row the table renders, derived from an AlarmRuleItem. */
interface RuleRow {
  id: string;
  deviceId: string;
  name: string;
  description: string;
  /** The most severe level the rule defines; null if it defines none. */
  severity: AlertSeverity | null;
  triggerType: RuleTriggerType | null;
  expression: string;
  state: AlarmRuleProvisioningState;
  lastError?: string;
  createdAt: string;
}

const toRow = (r: AlarmRuleItem): RuleRow => {
  // A rule can define conditions for several severities; show the most severe.
  const top = Object.entries(r.alarmRules ?? {})
    .map(([severity, rule]) => ({ severity: apiSeverityToUi(severity), rule }))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
  return {
    id: r.id,
    deviceId: r.deviceId,
    name: r.name,
    description: r.description ?? "",
    severity: top?.severity ?? null,
    triggerType: top?.rule.triggerType ?? null,
    expression: top?.rule.triggerExpression ?? "",
    state: r.provisioningState,
    lastError: r.lastError,
    createdAt: r.createdAt,
  };
};

interface AlertRulesListProps {
  onCreateRule: () => void;
}

export const AlertRulesList = ({ onCreateRule }: AlertRulesListProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();
  const { items: devices } = useDevices();
  const deviceName = (id: string) => {
    const d = devices.find((x) => x.id === id);
    return d ? d.label || d.name : id;
  };

  // Creating and deleting are asynchronous server-side, so poll while any
  // rule is still on its way in or out.
  const [inFlight, setInFlight] = useState(false);
  const rulesQuery = useGetWorkspaceAlarmRulesQuery(
    workspaceId ?? "", PRODUCT_KEY, RULES_PAGE, RULES_PAGE_SIZE,
    { refetchInterval: inFlight ? 5000 : false },
  );
  const { data, isLoading, isError, error, isFetching, refetch } = rulesQuery;
  const rulesLoad = queryLoad(rulesQuery);
  const pageLoad = usePageLoad({
    loading: rulesLoad.loading || !workspaceId,
    failed: rulesLoad.failed,
    onRetry: refetch,
  });
  const rules = useMemo(() => (data?.data ?? []).map(toRow), [data]);
  // A failed load surfaces as a toast, once per failure, rather than as a
  // table row; the table falls through to its empty state.
  useEffect(() => {
    if (!isError) return;
    toast({ title: tt("error"), description: apiErrorMessage(error, tt("alertRulesLoadFailed")), variant: "destructive" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);
  useEffect(() => {
    setInFlight(rules.some((r) => r.state === "PROVISIONING" || r.state === "DELETING"));
  }, [rules]);

  const deleteRule = useDeleteAlarmRuleMutation();
  const [confirmDelete, setConfirmDelete] = useState<RuleRow | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState("nameAsc");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rules
      .filter((r) => {
        if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
        if (statusFilter !== "all" && r.state !== statusFilter) return false;
        if (severityFilter !== "all" && r.severity !== severityFilter) return false;
        if (triggerTypeFilter !== "all" && r.triggerType !== triggerTypeFilter) return false;
        if (deviceFilter !== "all" && r.deviceId !== deviceFilter) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "nameDesc": return b.name.localeCompare(a.name);
          case "lastUpdated": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "severity": return (b.severity ? SEVERITY_RANK[b.severity] : 0) - (a.severity ? SEVERITY_RANK[a.severity] : 0);
          case "nameAsc":
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [rules, search, statusFilter, severityFilter, triggerTypeFilter, deviceFilter, sortKey]);

  const ruleDeviceIds = useMemo(() => Array.from(new Set(rules.map((r) => r.deviceId))), [rules]);

  const filterFields: FilterField[] = [
    {
      key: "status", label: tt("status"), value: statusFilter, onChange: setStatusFilter,
      options: [
        { value: "all", label: tt("all") },
        ...(Object.keys(stateLabelKeys) as AlarmRuleProvisioningState[]).map((s) => ({ value: s, label: tt(stateLabelKeys[s]) })),
      ],
    },
    {
      key: "device", label: tt("alertRuleDevice"), value: deviceFilter, onChange: setDeviceFilter,
      options: [{ value: "all", label: tt("all") }, ...ruleDeviceIds.map((id) => ({ value: id, label: deviceName(id) }))],
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
        ...(Object.keys(triggerLabelKeys) as RuleTriggerType[]).map((k) => ({ value: k, label: tt(triggerLabelKeys[k]) })),
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
    const header = ["id", "name", "device", "triggerType", "severity", "state", "expression", "createdAt"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = filtered.map((r) =>
      [r.id, r.name, deviceName(r.deviceId), r.triggerType ?? "", r.severity ?? "", r.state, r.expression, r.createdAt].map(esc).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alert-rules-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const actionItems: ActionItem[] = [
    { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
  ];

  const doDelete = async () => {
    if (!confirmDelete || !workspaceId) return;
    const rule = confirmDelete;
    try {
      await deleteRule.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, alarmRuleId: rule.id, deviceId: rule.deviceId });
      toast({ title: tt("alertRuleDeleted"), description: rule.name });
    } catch (error) {
      toast({ title: tt("error"), description: error instanceof Error ? error.message : tt("error"), variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

  const activeFilterCount = [statusFilter, deviceFilter, severityFilter, triggerTypeFilter].filter((v) => v !== "all").length;

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {data?.totalElements ?? rules.length} {tt("alertRulesCount")}
        </p>
        <Button size="sm" onClick={onCreateRule} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 gap-2 rounded-md">
          <Plus className="h-4 w-4" />
          {tt("alertCreateRule")}
        </Button>
      </div>

      {/* Toolbar, table and pagination in one card, the shape every other
          list page on the panel uses. */}
      <Card>
        <CardContent className="pt-6">

      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: tt("alertSearchPlaceholder") }}
        view={{ value: listView, onChange: setListView, available: ["table"] }}
        onRefresh={() => { void refetch(); }}
        isRefreshing={isFetching && !isLoading}
        filter={{ fields: filterFields, activeCount: activeFilterCount, onClear: () => { setStatusFilter("all"); setDeviceFilter("all"); setSeverityFilter("all"); setTriggerTypeFilter("all"); } }}
        sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
        actions={actionItems}
        selectionCount={0}
      />

      <div className="relative rounded-lg border bg-card overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
        {pageLoad.status === "loading" && <LoadingOverlay className="items-center pt-0" />}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{tt("alertRuleName")}</TableHead>
              <TableHead>{tt("triggerType")}</TableHead>
              <TableHead>{tt("alertSeverity")}</TableHead>
              <TableHead className="hidden lg:table-cell">{tt("alertRuleDevice")}</TableHead>
              <TableHead>{tt("status")}</TableHead>
              <TableHead className="w-[80px] text-end">{tt("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageLoad.status === "loading" && <TableRowsSkeleton rows={4} columns={6} />}
            {pageLoad.status === "ready" && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {/* Nothing on the server is "no data"; nothing matching the
                      current search/filters is an empty result set. */}
                  {rules.length === 0 ? (
                    <NoData />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">{tt("noResults") || "No results"}</p>
                  )}
                </TableCell>
              </TableRow>
            )}
            {pageLoad.status === "ready" && paged.map((rule) => {
              const TypeIcon = rule.triggerType ? triggerIcons[rule.triggerType] : Zap;
              return (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                      {rule.expression && <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{rule.expression}</p>}
                      {rule.state === "FAILED" && rule.lastError && (
                        <p className="text-xs text-destructive mt-0.5">{rule.lastError}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.triggerType ? (
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{tt(triggerLabelKeys[rule.triggerType])}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">{tt("noData")}</span>}
                  </TableCell>
                  <TableCell>
                    {rule.severity ? (
                      <Badge className={severityColors[rule.severity]}>
                        {tt(`alert${rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}`)}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">{tt("noData")}</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">{deviceName(rule.deviceId)}</TableCell>
                  <TableCell>
                    <Badge className={stateColors[rule.state] ?? "bg-muted text-muted-foreground"}>
                      {stateLabelKeys[rule.state] ? tt(stateLabelKeys[rule.state]) : rule.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(rule)}
                        disabled={rule.state === "DELETING"}
                        aria-label={tt("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end mt-4 pt-4">
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("alertRuleDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("alertRuleDeleteDesc")}{" "}
              <span className="font-medium text-foreground">
                {confirmDelete ? `${confirmDelete.name} · ${deviceName(confirmDelete.deviceId)}` : ""}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doDelete}
              disabled={deleteRule.isPending}
            >
              {tt("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
