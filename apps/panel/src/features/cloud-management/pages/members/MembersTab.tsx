import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, SearchX, UserPlus } from "lucide-react";
import { useListWorkspaceMembersQuery, useListWorkspaceProductsQuery, workspacesService, type WorkspaceMember } from "@paapeli/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/features/factory/components/ui/switch";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Button } from "@/features/factory/components/ui/button";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { AddFirst } from "@/features/factory/components/AddFirst";
import { NoData } from "@/features/cloud-management/ui";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { ListCard, StatusBadge, TableShell, useTr } from "./shared";

const STATUS_KEY: Record<WorkspaceMember["status"], string> = {
  ACTIVE: "statusActive",
  INVITED: "statusInvited",
  SUSPENDED: "statusSuspended",
  REJECTED: "statusDeclined",
  EXPIRED: "statusExpired",
};

/* The roster, from GET /workspaces/{id}/members. Search goes to the server;
 * role and status filter the page that came back. The response carries no
 * product access, so that column reports no data rather than a guess. A
 * workspace role reaches every product the workspace holds, so the product
 * filter lists those products and narrows nobody out of one; joined filters
 * on when the membership was created. One page of the API's maximum (100) is
 * read, which covers a workspace's team today. */

const DAY_MS = 24 * 60 * 60 * 1000;
const JOINED_DAYS: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

const PRODUCT_LABEL: Record<string, string> = { smartFactory: "productSmartFactory", gpsTracking: "productGpsTracking" };

const joinedMatches = (joined: string, createdAt: string) => {
  if (joined === "any") return true;
  const age = Date.now() - Date.parse(createdAt);
  if (joined === "older") return age > 90 * DAY_MS;
  return age <= JOINED_DAYS[joined] * DAY_MS;
};
function BillingReadSwitch({ workspaceId, member }: { workspaceId: string; member: WorkspaceMember }) {
  const tr = useTr();
  const client = useQueryClient();
  const write = useMutation({
    mutationFn: (granted: boolean) => workspacesService.setBillingRead(workspaceId, member.workspaceMembershipId, granted),
    onSuccess: () => client.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] }),
  });
  return <>
    <label className="mt-2 flex items-center gap-2 text-sm">
      <Switch aria-label={`${tr("canViewBilling")}: ${member.displayName || member.email || member.userId}`}
        checked={member.billingReadGranted} disabled={write.isPending} onCheckedChange={granted => write.mutate(granted)} />
      {tr("canViewBilling")}
    </label>
    {write.isError && <div role="alert" className="text-destructive">
      {apiErrorMessage(write.error, tr("billingWriteFailed"))}
      <Button variant="outline" size="sm" onClick={() => write.mutate(write.variables)}>{tr("retry")}</Button>
    </div>}
  </>;
}

export default function MembersTab({
  workspaceId,
  isOwner,
  canInvite,
  onInvite,
}: {
  workspaceId?: string;
  isOwner: boolean;
  canInvite: boolean;
  onInvite: () => void;
}) {
  const tr = useTr();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [product, setProduct] = useState("all");
  const [status, setStatus] = useState("all");
  const [joined, setJoined] = useState("any");
  const [sort, setSort] = useState("nameAsc");
  const [view, setView] = useState<ViewMode>("table");

  // Wait for typing to settle before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isFetching } = useListWorkspaceMembersQuery(
    workspaceId ?? "",
    query,
    1,
    100,
  );

  const { data: products } = useListWorkspaceProductsQuery(workspaceId ?? "", !!workspaceId);
  const productOptions = (products ?? [])
    .filter((p) => p.status === "ACTIVE")
    .map((p) => ({ value: p.productKey, label: PRODUCT_LABEL[p.productKey] ? tr(PRODUCT_LABEL[p.productKey]) : p.productKey }));

  const rows = useMemo(() => {
    const list = (data?.data ?? []).filter(
      (m) =>
        (role === "all" || m.role === role) &&
        (status === "all" || m.status.toLowerCase() === status) &&
        joinedMatches(joined, m.createdAt),
    );
    const name = (m: WorkspaceMember) => (m.displayName || m.email || "").toLowerCase();
    return [...list].sort((a, b) =>
      sort === "newest" ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : name(a).localeCompare(name(b)),
    );
  }, [data, role, status, joined, sort]);

  const all = { value: "all", label: tr("optAll") };
  const filterFields: FilterField[] = [
    { key: "status", label: tr("filterStatus"), value: status, onChange: setStatus, options: [all, { value: "active", label: tr("statusActive") }, { value: "invited", label: tr("statusInvited") }, { value: "suspended", label: tr("statusSuspended") }] },
    { key: "role", label: tr("colWorkspaceRole"), value: role, onChange: setRole, options: [all, { value: "OWNER", label: tr("roleOwner") }, { value: "ADMIN", label: tr("roleAdmin") }, { value: "MEMBER", label: tr("roleMember") }, { value: "VIEWER", label: tr("roleViewer") }] },
    { key: "product", label: tr("filterProduct"), value: product, onChange: setProduct, options: [{ value: "all", label: tr("optAllProducts") }, ...productOptions] },
    {
      key: "joined",
      label: tr("filterJoined"),
      value: joined,
      onChange: setJoined,
      options: [
        { value: "any", label: tr("optAnyTime") },
        { value: "7", label: tr("optLast7") },
        { value: "30", label: tr("optLast30") },
        { value: "90", label: tr("optLast90") },
        { value: "older", label: tr("optOlder90") },
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: tr("sortNameAsc") },
    { key: "newest", label: tr("sortNewest") },
  ];
  const activeFilterCount = [status, role, product].filter((v) => v !== "all").length + (joined !== "any" ? 1 : 0);
  const narrowed = activeFilterCount > 0 || query !== "";
  const clearFilters = () => { setStatus("all"); setRole("all"); setProduct("all"); setJoined("any"); };

  const body = () => {
    if (!workspaceId) return <NoData className="py-10" />;
    if (isLoading)
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      );
    if (isError)
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-destructive">{apiErrorMessage(error, tr("loadMembersFailed"))}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="size-3.5" />
            {tr("retry")}
          </Button>
        </div>
      );
    if (rows.length === 0)
      return narrowed ? (
        <NoData
          icon={SearchX}
          title={tr("noResults")}
          description={tr("noMembersMatch")}
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {tr("clearFilters")}
              </Button>
            ) : undefined
          }
        />
      ) : canInvite ? (
        <AddFirst icon={UserPlus} label={tr("inviteMember")} onAction={onInvite} />
      ) : (
        <NoData className="py-10" />
      );
    return null;
  };
  const placeholder = body();

  return (
    <ListCard>
      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: tr("searchMembers") }}
        view={{ value: view, onChange: setView, available: ["table"] }}
        onRefresh={() => { void refetch(); }}
        isRefreshing={isFetching && !isLoading}
        filter={{
          fields: filterFields,
          activeCount: activeFilterCount,
          onClear: clearFilters,
        }}
        sort={{ options: sortOptions, value: sort, onChange: setSort }}
        actions={[{ key: "export", label: tr("actionExport"), comingSoon: true }]}
        selectionCount={0}
      />

      <TableShell minWidth="880px">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{tr("colMember")}</TableHead>
            <TableHead>{tr("colEmail")}</TableHead>
            <TableHead>{tr("colWorkspaceRole")}</TableHead>
            <TableHead className="hidden lg:table-cell">{tr("colProductAccess")}</TableHead>
            <TableHead>{tr("colStatus")}</TableHead>
            <TableHead className="hidden md:table-cell">{tr("colDate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placeholder ? (
            <TableRow className="hover:bg-transparent">
              {/* The columns stay on screen while the list is empty, as on the
                  device and gateway lists. */}
              <TableCell colSpan={6} className="p-0">{placeholder}</TableCell>
            </TableRow>
          ) : (
            rows.map((m) => {
              const roleLabel = tr(`role${m.role.charAt(0)}${m.role.slice(1).toLowerCase()}`);
              return (
              <TableRow key={m.workspaceMembershipId}>
                <TableCell className="font-medium text-foreground">{m.displayName || "—"}</TableCell>
                <TableCell className="text-muted-foreground" dir="ltr">{m.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {isOwner && workspaceId && m.status === "ACTIVE" && (m.role === "MEMBER" || m.role === "VIEWER") ? (
                    <details>
                      <summary className="cursor-pointer" aria-label={`${roleLabel}: ${m.displayName || m.email || m.userId} — ${tr("canViewBilling")}`}>
                        {roleLabel}
                      </summary>
                      <BillingReadSwitch workspaceId={workspaceId} member={m} />
                    </details>
                  ) : roleLabel}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">—</TableCell>
                <TableCell><StatusBadge statusKey={STATUS_KEY[m.status] ?? "statusExpired"} /></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </TableShell>
    </ListCard>
  );
}
