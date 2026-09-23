import { useEffect, useMemo, useState } from "react";
import { useDeleteAlarmRuleMutation, useGetAlarmRulesQuery } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import { TableRowsSkeleton } from "@/features/factory/components/panel/DetailPageSkeleton";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { AlertRuleWizard } from "./AlertRuleWizard";
import {
  severityColors, stateColors, stateLabelKeys, toRow, triggerIcons, triggerLabelKeys, type RuleRow,
} from "./AlertRulesList";

/* One page covers a device: the API clamps page size to 1–100 and counts
   pages from 1. */
const RULES_PAGE = 1;
const RULES_PAGE_SIZE = 100;

/**
 * The alarm rules of one device — GET/POST
 * /alarms/{ws}/{pk}/rule/device/{deviceId}, and the per-rule delete.
 * Creating reuses the Alerts wizard, opened on this device.
 */
export const DeviceAlarmRules = ({ deviceId }: { deviceId: string }) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();

  // Creating and deleting are asynchronous server-side, so poll while any
  // rule is still on its way in or out.
  const [inFlight, setInFlight] = useState(false);
  const rulesQuery = useGetAlarmRulesQuery(
    workspaceId ?? "", PRODUCT_KEY, deviceId, RULES_PAGE, RULES_PAGE_SIZE, true, inFlight ? 5000 : false,
  );
  const { data, isLoading, isError, isFetching, refetch } = rulesQuery;
  const rules = useMemo(() => (data?.data ?? []).map(toRow), [data]);
  useEffect(() => {
    setInFlight(rules.some((r) => r.state === "PROVISIONING" || r.state === "DELETING"));
  }, [rules]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const deleteRule = useDeleteAlarmRuleMutation();
  const [confirmDelete, setConfirmDelete] = useState<RuleRow | null>(null);

  const doDelete = async () => {
    if (!confirmDelete || !workspaceId) return;
    const rule = confirmDelete;
    try {
      await deleteRule.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, alarmRuleId: rule.id, deviceId });
      toast({ title: tt("alertRuleDeleted"), description: rule.name });
    } catch (error) {
      toast({ title: tt("error"), description: error instanceof Error ? error.message : tt("error"), variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

  const loading = isLoading || !workspaceId;

  return (
    <Card dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {tt("rules")}
          {!loading && !isError && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              {data?.totalElements ?? rules.length} {tt("alertRulesCount")}
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { void refetch(); }} disabled={isFetching} aria-label={tt("refresh")}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 gap-2">
            <Plus className="h-4 w-4" /> {tt("alertCreateRule")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <LoadFailed onRetry={() => { void refetch(); }} />
        ) : (
          <div className="rounded-lg border overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{tt("alertRuleName")}</TableHead>
                  <TableHead>{tt("triggerType")}</TableHead>
                  <TableHead>{tt("alertSeverity")}</TableHead>
                  <TableHead>{tt("status")}</TableHead>
                  <TableHead className="w-[80px] text-end">{tt("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton rows={3} columns={5} />
                ) : rules.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-0"><NoData /></TableCell>
                  </TableRow>
                ) : rules.map((rule) => {
                  const TypeIcon = rule.triggerType ? triggerIcons[rule.triggerType] : Zap;
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        {rule.expression && <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{rule.expression}</p>}
                        {rule.state === "FAILED" && rule.lastError && (
                          <p className="text-xs text-destructive mt-0.5">{rule.lastError}</p>
                        )}
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
                      <TableCell>
                        <Badge className={stateColors[rule.state] ?? "bg-muted text-muted-foreground"}>
                          {stateLabelKeys[rule.state] ? tt(stateLabelKeys[rule.state]) : rule.state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
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
        )}
      </CardContent>

      <AlertRuleWizard open={wizardOpen} onOpenChange={setWizardOpen} initialDeviceIds={[deviceId]} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt("alertRuleDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt("alertRuleDeleteDesc")}{" "}
              <span className="font-medium text-foreground">{confirmDelete?.name}</span>
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
    </Card>
  );
};
