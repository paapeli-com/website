import { useState } from "react";
import { UserPlus } from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { AddFirst } from "@/features/factory/components/AddFirst";
import { ListCard, TableShell, useTr } from "./shared";

/* The roster.
 *
 * There is no endpoint that lists a workspace's members — you can invite one
 * but you cannot read the list back — so the table is built and empty, and
 * says how to start filling it. When the endpoint lands, `members` is the one
 * thing that changes. */
export default function MembersTab({ onInvite }: { onInvite: () => void }) {
  const tr = useTr();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [product, setProduct] = useState("all");
  const [status, setStatus] = useState("all");
  const [joined, setJoined] = useState("any");
  const [sort, setSort] = useState("nameAsc");
  const [view, setView] = useState<ViewMode>("table");

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

  return (
    <ListCard>
      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: tr("searchMembers") }}
        view={{ value: view, onChange: setView, available: ["table"] }}
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
            <TableHead className="w-[44px]">
              <div className="flex justify-center">
                <Checkbox checked={false} disabled />
              </div>
            </TableHead>
            <TableHead>{tr("colMember")}</TableHead>
            <TableHead>{tr("colEmail")}</TableHead>
            <TableHead>{tr("colWorkspaceRole")}</TableHead>
            <TableHead className="hidden lg:table-cell">{tr("colProductAccess")}</TableHead>
            <TableHead>{tr("colStatus")}</TableHead>
            <TableHead className="w-[110px] text-end">{tr("colActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7}>
              {/* The columns stay on screen while the list is empty, as on the
                  device and gateway lists. */}
              <AddFirst icon={UserPlus} label={tr("inviteMember")} onAction={onInvite} />
            </TableCell>
          </TableRow>
        </TableBody>
      </TableShell>
    </ListCard>
  );
}
