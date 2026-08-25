import { Badge, Card } from "@/features/cloud-management/ui";

/* Placeholder data — there's no roles/permissions endpoint yet, so this
   renders the shape the design calls for without pretending it's wired up. */
const ROLES = [
  { name: "Owner", description: "Full control, including closing the account", count: 1 },
  { name: "Billing admin", description: "Invoices, payment methods, subscriptions", count: 1 },
  { name: "Cloud admin", description: "Members, access, product settings", count: 2 },
  { name: "Operator", description: "Day-to-day product use, no billing", count: 4 },
  { name: "Viewer", description: "Read-only across products", count: 1 },
];

export default function RolesPanel() {
  return (
    <Card className="flex max-w-2xl flex-col gap-1">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Roles in this account</h2>
        <Badge tone="gray">Preview data</Badge>
      </div>
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
