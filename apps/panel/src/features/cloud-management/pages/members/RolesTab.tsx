import { useState } from "react";
import { LISTED_PRODUCTS } from "@/shared/config";

import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { Badge, Card, NoData } from "@/features/cloud-management/ui";
import { ListCard, TableShell, useTr } from "./shared";

/* The four roles the API actually has. WorkspaceRole is OWNER | ADMIN |
   MEMBER | VIEWER, so those four are real and described here; anything
   custom needs a roles endpoint, which is what New Role waits on. */
const BUILT_IN = [
  { key: "OWNER", name: "roleOwner", desc: "roleOwnerDesc" },
  { key: "ADMIN", name: "roleAdmin", desc: "roleAdminDesc" },
  { key: "MEMBER", name: "roleMember", desc: "roleMemberDesc" },
  { key: "VIEWER", name: "roleViewer", desc: "roleViewerDesc" },
];

export default function RolesTab() {
  const tr = useTr();
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("all");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("nameAsc");
  const [view, setView] = useState<ViewMode>("table");

  const solutions = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []);
  const all = { value: "all", label: tr("optAll") };
  const filterFields: FilterField[] = [
    {
      key: "product", label: tr("filterProduct"), value: product, onChange: setProduct,
      options: [{ value: "all", label: tr("optAllProducts") }, ...solutions.map((s) => ({ value: s.id, label: s.name }))],
    },
    {
      key: "role", label: tr("filterRole"), value: role, onChange: setRole,
      options: [all, ...BUILT_IN.map((r) => ({ value: r.key, label: tr(r.name) }))],
    },
  ];
  const sortOptions: SortOption[] = [{ key: "nameAsc", label: tr("sortNameAsc") }];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tr("sectionWorkspaceRoles")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUILT_IN.map((r) => (
            <Card key={r.key} className="flex items-start gap-3 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">{tr(r.name)}</span>
                  <Badge tone="gray">{tr("roleSystemTag")}</Badge>
                </div>
                <span className="text-xs leading-relaxed text-muted-foreground">{tr(r.desc)}</span>
              </div>
              {/* How many people hold the role needs the member roster, which
                  has no endpoint, so it reports no data rather than a zero. */}
              <span className="shrink-0 text-xs text-muted-foreground">—</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tr("sectionProductAccess")}
        </h2>
        <ListCard>
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: tr("searchMembers") }}
            view={{ value: view, onChange: setView, available: ["table"] }}
            filter={{ fields: filterFields, activeCount: [product, role].filter((v) => v !== "all").length, onClear: () => { setProduct("all"); setRole("all"); } }}
            sort={{ options: sortOptions, value: sort, onChange: setSort }}
            selectionCount={0}
          />
          <TableShell minWidth="720px">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{tr("colMember")}</TableHead>
                <TableHead>{tr("filterProduct")}</TableHead>
                <TableHead>{tr("filterRole")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tr("colAccess")}</TableHead>
                <TableHead className="w-[90px] text-end">{tr("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <NoData />
                </TableCell>
              </TableRow>
            </TableBody>
          </TableShell>
        </ListCard>
      </section>
    </div>
  );
}
