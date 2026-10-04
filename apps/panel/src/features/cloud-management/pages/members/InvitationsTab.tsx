import { useState } from "react";
import { toast } from "sonner";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import {
  useAcceptWorkspaceInvitationMutation,
  useListWorkspaceInvitationsQuery,
  useRejectWorkspaceInvitationMutation,
  type UserWorkspace,
} from "@paapeli/api";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Button } from "@/features/factory/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { NoData, Tabs } from "@/features/cloud-management/ui";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { BackendNote, ListCard, StatusBadge, TableShell, useTr } from "./shared";

/* Received and sent are two different things and only one of them is real.
 *
 * Received are the current user's own invitations (GET /workspaces/invitations)
 * and they accept or decline them themselves — nobody approves anybody else
 * here. Sent would be the invitations this workspace has issued, which has no
 * endpoint: you can post one but you cannot read them back. */
type Pending = { workspaceId: string; workspaceName: string };

export default function InvitationsTab({ isRTL }: { isRTL: boolean }) {
  const tr = useTr();
  const [sub, setSub] = useState<"received" | "sent">("received");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<ViewMode>("table");
  const [confirmAccept, setConfirmAccept] = useState<Pending | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<Pending | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useListWorkspaceInvitationsQuery();
  const accept = useAcceptWorkspaceInvitationMutation();
  const reject = useRejectWorkspaceInvitationMutation();

  const received: UserWorkspace[] = (data ?? []).filter((w) =>
    !search.trim() || w.workspaceName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const doAccept = (p: Pending) => {
    accept.mutate(p.workspaceId, {
      onSuccess: () => { toast.success(p.workspaceName); void refetch(); },
      onError: (e) => toast.error(apiErrorMessage(e, tr("inviteFailed"))),
    });
    setConfirmAccept(null);
  };
  const doDecline = (p: Pending) => {
    reject.mutate(p.workspaceId, {
      onSuccess: () => { toast.success(p.workspaceName); void refetch(); },
      onError: (e) => toast.error(apiErrorMessage(e, tr("inviteFailed"))),
    });
    setConfirmDecline(null);
  };

  const all = { value: "all", label: tr("optAll") };
  const filterFields: FilterField[] = [
    {
      key: "status", label: tr("filterStatus"), value: status, onChange: setStatus,
      options: [all, { value: "pending", label: tr("statusPending") }, { value: "accepted", label: tr("statusAccepted") }, { value: "declined", label: tr("statusDeclined") }, { value: "expired", label: tr("statusExpired") }],
    },
  ];
  const sortOptions: SortOption[] = [{ key: "newest", label: tr("sortNewest") }];
  const isReceived = sub === "received";

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        items={[tr("invReceived"), tr("invSent")]}
        value={isReceived ? tr("invReceived") : tr("invSent")}
        onChange={(v) => setSub(v === tr("invReceived") ? "received" : "sent")}
      />

      <ListCard>
        <ListToolbar
          search={{ value: search, onChange: setSearch, placeholder: tr("searchInvitations") }}
          view={{ value: view, onChange: setView, available: ["table"] }}
          onRefresh={() => { void refetch(); }}
          isRefreshing={isFetching && !isLoading}
          filter={{ fields: filterFields, activeCount: status === "all" ? 0 : 1, onClear: () => setStatus("all") }}
          sort={{ options: sortOptions, value: sort, onChange: setSort }}
          selectionCount={0}
        />

        <TableShell minWidth="780px">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{isReceived ? tr("colWorkspace") : tr("colEmail")}</TableHead>
              <TableHead className="hidden lg:table-cell">
                {isReceived ? tr("colInvitedBy") : tr("colProductAccess")}
              </TableHead>
              <TableHead>{tr("filterRole")}</TableHead>
              <TableHead className="hidden md:table-cell">{tr("colDate")}</TableHead>
              <TableHead>{tr("colStatus")}</TableHead>
              <TableHead className="w-[150px] text-end">{tr("colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isReceived && (isLoading || (isError && !data)) ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <p className="text-sm text-destructive">{apiErrorMessage(error, tr("loadInvitationsFailed"))}</p>
                      <Button variant="outline" size="sm" onClick={() => void refetch()}>
                        <RefreshCw className="size-3.5" />
                        {tr("retry")}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : !isReceived || received.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <NoData className="py-10" />
                </TableCell>
              </TableRow>
            ) : (
              received.map((w) => (
                <TableRow key={w.workspaceId}>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-3.5" />
                      </span>
                      <span className="font-medium text-foreground">{w.workspaceName}</span>
                    </span>
                  </TableCell>
                  {/* Who sent it is not in the response, and the date is not
                      either, so both report no data rather than a guess. */}
                  <TableCell className="hidden lg:table-cell text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">{tr(`role${w.role.charAt(0)}${w.role.slice(1).toLowerCase()}`)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">—</TableCell>
                  <TableCell><StatusBadge statusKey="statusPending" /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary"
                        onClick={() => setConfirmAccept({ workspaceId: w.workspaceId, workspaceName: w.workspaceName })}
                        disabled={accept.isPending || reject.isPending}
                      >
                        {tr("accept")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDecline({ workspaceId: w.workspaceId, workspaceName: w.workspaceName })}
                        disabled={accept.isPending || reject.isPending}
                      >
                        {tr("decline")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableShell>
      </ListCard>

      <BackendNote text={isReceived ? tr("noteReceived") : tr("noteSent")} />

      {/* The same confirm the rest of the panel uses, because accepting puts
          you in someone else's workspace and declining cannot be undone. */}
      <AlertDialog open={!!confirmAccept} onOpenChange={(o) => { if (!o) setConfirmAccept(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("confirmAcceptTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("confirmAcceptDesc")}{" "}
              <span className="font-medium text-foreground">{confirmAccept?.workspaceName ?? ""}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAccept && doAccept(confirmAccept)}>
              {tr("accept")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDecline} onOpenChange={(o) => { if (!o) setConfirmDecline(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("confirmDeclineTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("confirmDeclineDesc")}{" "}
              <span className="font-medium text-foreground">{confirmDecline?.workspaceName ?? ""}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDecline && doDecline(confirmDecline)}
            >
              {tr("decline")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
