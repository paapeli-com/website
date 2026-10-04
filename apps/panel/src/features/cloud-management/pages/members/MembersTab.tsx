import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useListWorkspaceMembersQuery, type WorkspaceMember } from "@paapeli/api";
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
 * product access, so that column reports no data rather than a guess, and the
 * product and joined filters have nothing to narrow by yet. One page of the
 * API's maximum (100) is read, which covers a workspace's team today. */
export default function MembersTab({
  workspaceId,
  canInvite,
  onInvite,
}: {
  workspaceId?: string;
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

  const rows = useMemo(() => {
    const list = (data?.data ?? []).filter(
      (m) => (role === "all" || m.role === role) && (status === "all" || m.status.toLowerCase() === status),
    );
    const name = (m: WorkspaceMember) => (m.displayName || m.email || "").toLowerCase();
    return [...list].sort((a, b) =>
      sort === "newest" ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : name(a).localeCompare(name(b)),
    );
  }, [data, role, status, sort]);

  const all = { value: "all", label: tr("optAll") };
  const filterFields: FilterField[] = [
    { key: "status", label: tr("filterStatus"), value: status, onChange: setStatus, options: [all, { value: "active", label: tr("statusActive") }, { value: "invited", label: tr("statusInvited") }, { value: "suspended", label: tr("statusSuspended") }] },
    { key: "role", label: tr("colWorkspaceRole"), value: role, onChange: setRole, options: [all, { value: "OWNER", label: tr("roleOwner") }, { value: "ADMIN", label: tr("roleAdmin") }, { value: "MEMBER", label: tr("roleMember") }, { value: "VIEWER", label: tr("roleViewer") }] },
    { key: "product", label: tr("filterProduct"), value: product, onChange: setProduct, options: [{ value: "all", label: tr("optAllProducts") }] },
    { key: "joined", label: tr("filterJoined"), value: joined, onChange: setJoined, options: [{ value: "any", label: tr("optAnyTime") }] },
  ];
  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: tr("sortNameAsc") },
    { key: "newest", label: tr("sortNewest") },
  ];
  const activeFilterCount = [status, role, product].filter((v) => v !== "all").length + (joined !== "any" ? 1 : 0);
  const narrowed = activeFilterCount > 0 || query !== "";

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
        <p className="py-10 text-center text-sm text-muted-foreground">{tr("noResults")}</p>
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
          onClear: () => { setStatus("all"); setRole("all"); setProduct("all"); setJoined("any"); },
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
            rows.map((m) => (
              <TableRow key={m.workspaceMembershipId}>
                <TableCell className="font-medium text-foreground">{m.displayName || "—"}</TableCell>
                <TableCell className="text-muted-foreground" dir="ltr">{m.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{tr(`role${m.role.charAt(0)}${m.role.slice(1).toLowerCase()}`)}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">—</TableCell>
                <TableCell><StatusBadge statusKey={STATUS_KEY[m.status] ?? "statusExpired"} /></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableShell>
    </ListCard>
  );
}
