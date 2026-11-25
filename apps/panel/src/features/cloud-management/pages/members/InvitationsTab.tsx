import { useState } from "react";
import { toast } from "@/shared/lib/toast";
import { Building2, Loader2, Mail, RefreshCw } from "lucide-react";
import {
  useAcceptWorkspaceInvitationMutation,
  useListSentInvitationsQuery,
  useListWorkspaceInvitationsQuery,
  useRejectWorkspaceInvitationMutation,
  type SentInvitation,
  type UserWorkspace,
  type WorkspaceMembershipStatus,
} from "@paapeli/api";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Button } from "@/features/factory/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { EmptyState, Tabs } from "@/features/cloud-management/ui";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { LISTED_PRODUCTS } from "@/shared/config";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { BackendNote, ListCard, StatusBadge, TableShell, canInvite, useTr } from "./shared";

/* Received: the invitations waiting for this person's own answer, from any
 * workspace (GET /workspaces/invitations), with who sent each one.
 * Sent: what the selected workspace has invited, and what became of each
 * (GET /workspaces/{id}/invitations), for whoever may invite into it. */
type Pending = { workspaceId: string; workspaceName: string };

/** A membership status as the invitation's outcome. */
const STATUS_KEY: Record<WorkspaceMembershipStatus, string> = {
  INVITED: "statusPending",
  ACTIVE: "statusAccepted",
  REJECTED: "statusDeclined",
  EXPIRED: "statusExpired",
  SUSPENDED: "statusSuspended",
};
const FILTER_OF: Record<string, WorkspaceMembershipStatus> = {
  pending: "INVITED",
  accepted: "ACTIVE",
  declined: "REJECTED",
  expired: "EXPIRED",
};
const SOLUTIONS = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []);

export default function InvitationsTab({ isRTL }: { isRTL: boolean }) {
  const tr = useTr();
  const shellT = useShellT();
  const language = useAppLanguage();
  const { selected } = useWorkspaceSelection();
  const mayInvite = canInvite(selected?.role);
  const [sub, setSub] = useState<"received" | "sent">("received");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<ViewMode>("table");
  const [confirmAccept, setConfirmAccept] = useState<Pending | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<Pending | null>(null);

  const receivedQuery = useListWorkspaceInvitationsQuery();
  const sentQuery = useListSentInvitationsQuery(selected?.workspaceId ?? "", mayInvite);
  const accept = useAcceptWorkspaceInvitationMutation();
  const reject = useRejectWorkspaceInvitationMutation();

  const isReceived = sub === "received";
  const query = isReceived ? receivedQuery : sentQuery;
  const term = search.trim().toLowerCase();
  const wanted = status === "all" ? null : FILTER_OF[status];

  const received: UserWorkspace[] = (receivedQuery.data ?? []).filter(
    (w) =>
      (!term || w.workspaceName.toLowerCase().includes(term) || (w.invitedByEmail ?? "").toLowerCase().includes(term)) &&
      (!wanted || w.membershipStatus === wanted),
  );
  const sent: SentInvitation[] = (sentQuery.data ?? []).filter(
    (s) =>
      (!term || s.email.toLowerCase().includes(term) || (s.displayName ?? "").toLowerCase().includes(term)) &&
      (!wanted || s.status === wanted),
  );
  const pendingReceived = (receivedQuery.data ?? []).filter((w) => w.membershipStatus === "INVITED").length;

  const date = (seconds?: number | null) =>
    seconds ? new Date(seconds * 1000).toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" }) : "—";
  const role = (r: string) => tr(`role${r.charAt(0)}${r.slice(1).toLowerCase()}`);
  const products = (keys?: string[] | null) =>
    !keys || keys.length === 0
      ? tr("allProducts")
      : keys.map((k) => shellT(SOLUTIONS.find((s) => s.productKey === k)?.name ?? k)).join(language === "en" ? ", " : "، ");

  const doAccept = (p: Pending) => {
    accept.mutate(p.workspaceId, {
      onSuccess: () => { toast.success(p.workspaceName); void receivedQuery.refetch(); },
      onError: (e) => toast.error(apiErrorMessage(e, tr("inviteFailed"))),
    });
    setConfirmAccept(null);
  };
  const doDecline = (p: Pending) => {
    reject.mutate(p.workspaceId, {
      onSuccess: () => { toast.success(p.workspaceName); void receivedQuery.refetch(); },
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

  const loadingOrFailed = query.isLoading || (query.isError && !query.data);
  const rows = isReceived ? received.length : sent.length;

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        items={[tr("invReceived"), tr("invSent")]}
        value={isReceived ? tr("invReceived") : tr("invSent")}
        onChange={(v) => setSub(v === tr("invReceived") ? "received" : "sent")}
        counts={{ [tr("invReceived")]: pendingReceived }}
      />

      {!isReceived && !mayInvite ? (
        <BackendNote text={tr("noSentPermission")} />
      ) : (
        <ListCard>
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: tr("searchInvitations") }}
            view={{ value: view, onChange: setView, available: ["table"] }}
            onRefresh={() => { void query.refetch(); }}
            isRefreshing={query.isFetching && !query.isLoading}
            filter={{ fields: filterFields, activeCount: status === "all" ? 0 : 1, onClear: () => setStatus("all") }}
            sort={{ options: sortOptions, value: sort, onChange: setSort }}
            selectionCount={0}
          />

          <TableShell minWidth="780px">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{isReceived ? tr("colWorkspace") : tr("colEmail")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tr("colInvitedBy")}</TableHead>
                <TableHead>{tr("filterRole")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tr("colProductAccess")}</TableHead>
                <TableHead className="hidden md:table-cell">{tr("colDate")}</TableHead>
                <TableHead>{tr("colStatus")}</TableHead>
                {isReceived && <TableHead className="w-[150px] text-end">{tr("colAction")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingOrFailed ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0">
                    {query.isLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <p className="text-sm text-destructive">{apiErrorMessage(query.error, tr("loadInvitationsFailed"))}</p>
                        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                          <RefreshCw className="size-3.5" />
                          {tr("retry")}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : rows === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0">
                    {isReceived ? (
                      <EmptyState icon={Mail} title={tr("noReceivedInvitations")} />
                    ) : (
                      <EmptyState icon={Mail} title={tr("noSentInvitations")} description={tr("noSentInvitationsDesc")} />
                    )}
                  </TableCell>
                </TableRow>
              ) : isReceived ? (
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
                    <TableCell className="hidden lg:table-cell">
                      <Sender name={w.invitedByName} email={w.invitedByEmail} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role(w.role)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{products(w.productKeys)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{date(w.invitedAt)}</TableCell>
                    <TableCell><StatusBadge statusKey={STATUS_KEY[w.membershipStatus] ?? "statusPending"} /></TableCell>
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
              ) : (
                sent.map((s) => (
                  <TableRow key={s.workspaceMembershipId}>
                    <TableCell>
                      <span className="flex min-w-0 flex-col">
                        {s.displayName && s.displayName !== s.email && (
                          <span className="truncate font-medium text-foreground">{s.displayName}</span>
                        )}
                        <span className="truncate text-muted-foreground" dir="ltr">{s.email}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Sender name={s.invitedByName} email={s.invitedByEmail} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role(s.role)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{products(s.productKeys)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{date(s.invitedAt)}</TableCell>
                    <TableCell><StatusBadge statusKey={STATUS_KEY[s.status] ?? "statusPending"} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableShell>
        </ListCard>
      )}

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

/** Who sent an invitation: name over email. A dash for one sent before the sender was recorded. */
function Sender({ name, email }: { name?: string | null; email?: string | null }) {
  if (!name && !email) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex min-w-0 flex-col">
      {name && name !== email && <span className="truncate text-foreground">{name}</span>}
      {email && <span className="truncate text-xs text-muted-foreground" dir="ltr">{email}</span>}
    </span>
  );
}
