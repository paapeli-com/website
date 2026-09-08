import { Badge, Card, NoData } from "@/features/cloud-management/ui";

/* There's no roles/permissions endpoint yet. The panel is headed "Roles in
   this account", and each row carried a member count — so the list read as
   this tenant's actual roles and how many people hold each. Empty until
   something serves them. */
const ROLES: { name: string; description: string; count: number }[] = [];

export default function RolesPanel() {
  return (
    <Card className="flex max-w-2xl flex-col gap-1">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Roles in this account</h2>
      </div>
      {ROLES.length === 0 && <NoData />}
      {ROLES.map((r) => (
        <div key={r.name} className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-[13.5px] font-semibold text-foreground">{r.name}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">{r.description}</span>
          </div>
          <Badge tone="gray">{r.count}</Badge>
        </div>
      ))}
    </Card>
  );
}
