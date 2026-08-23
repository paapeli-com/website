import { useNavigate } from "react-router-dom";
import { Cpu, FileText, Gauge, Package, Users } from "lucide-react";
import { useWorkspaceSelection } from "@/contexts/WorkspaceContext";
import { Badge, Card, IconTile, PageHeader, ProgressBar, Table } from "@/components/ui";

/* Spend, invoices and platform-status widgets below are placeholder data —
   see RemoteApp.tsx for which sections of this design have a real backend
   today. Product/workspace identity (name, subscribed products) is real. */
const RECENT_INVOICES = [
  { id: "INV-2026-07", period: "Jul 2026", amount: "﷼ 89,600,000" },
  { id: "INV-2026-06", period: "Jun 2026", amount: "﷼ 91,200,000" },
  { id: "INV-2026-05", period: "May 2026", amount: "﷼ 88,400,000" },
];

/* `to` targets here (and in the onClick handlers below) are ROUTE-RELATIVE
   — see RemoteApp.tsx for why: they resolve correctly whether this remote
   is mounted under the host's "/CloudManagement/*" or run standalone. */
const ATTENTION = [
  { text: "Card ending 4417 expires in 21 days", cta: "Update payment method", to: "payment-methods" },
  { text: "Message quota at 82% of plan limit", cta: "Review usage", to: "usage" },
  { text: "2 invited members have not accepted", cta: "Resend invites", to: "organisation" },
];

const PLATFORM_STATUS: { name: string; ok: boolean }[] = [
  { name: "AIoT ingestion", ok: true },
  { name: "Rule engine", ok: true },
  { name: "AI engine", ok: true },
  { name: "Object store", ok: false },
  { name: "Portal & API", ok: true },
];

export default function Overview() {
  const navigate = useNavigate();
  const { selected } = useWorkspaceSelection();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Cloud home"
        description={
          selected
            ? `Everything about ${selected.workspaceName}'s Paapeli cloud account — products, spending and settings.`
            : "Everything about your Paapeli cloud account — products, spending and settings."
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="flex flex-wrap items-center gap-5 sm:flex-nowrap">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Cpu className="size-8" />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">AIoT</h2>
              <Badge tone="ok">Active</Badge>
              <Badge tone="brand">Business plan</Badge>
            </div>
            <p className="text-[13.5px] text-muted-foreground">
              Assets, alarms, AI analytics, OTA and operations for 8 connected assets across 3 locations.
            </p>
            <div className="mt-1 flex flex-wrap gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Assets</div>
                <div className="text-sm font-semibold text-foreground">8 / 25</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Messages this month</div>
                <div className="text-sm font-semibold text-foreground">4.1M</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Renews</div>
                <div className="text-sm font-semibold text-foreground">1 Sep 2026</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground">This month</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold leading-none text-foreground">﷼ 84,200,000</span>
            <span className="text-xs text-emerald-600">−6% vs last month</span>
          </div>
          <ProgressBar pct={58} />
          <p className="text-xs text-muted-foreground">Forecast ﷼ 121,000,000 · budget ﷼ 145,000,000</p>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wallet balance</span>
            <span className="font-semibold text-foreground">﷼ 32,500,000</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IconTile icon={Package} title="Subscriptions & plans" cta="Manage subscriptions" onClick={() => navigate("subscriptions")}>
          Plan tier, seats, renewal date and add-ons for each subscription.
        </IconTile>
        <IconTile icon={FileText} title="Billing & invoices" cta="View invoices" onClick={() => navigate("billing")}>
          Download invoices, see payment status and set the billing profile.
        </IconTile>
        <IconTile icon={Gauge} title="Usage & quotas" cta="View usage" onClick={() => navigate("usage")}>
          Track messages, storage and API calls against your plan limits.
        </IconTile>
        <IconTile icon={Users} title="Organisation & access" cta="Manage access" onClick={() => navigate("organisation")}>
          Members, roles, API keys and single sign-on for your tenant.
        </IconTile>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Table
          columns={["Invoice", "Period", "Amount"]}
          head={
            <>
              <h2 className="text-sm font-bold text-foreground">Recent invoices</h2>
              <button
                type="button"
                onClick={() => navigate("billing")}
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                See all
              </button>
            </>
          }
          rows={RECENT_INVOICES.map((inv) => [inv.id, inv.period, inv.amount])}
        />

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-foreground">Needs your attention</h2>
          {ATTENTION.map((a) => (
            <div key={a.text} className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13.5px] text-foreground">{a.text}</span>
                <button type="button" onClick={() => navigate(a.to)} className="text-start text-xs font-semibold text-primary hover:underline">
                  {a.cta}
                </button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground">Platform status</h2>
          {PLATFORM_STATUS.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[13.5px] text-foreground">
                <span className={`size-2 rounded-full ${s.ok ? "bg-emerald-600" : "bg-orange-500"}`} />
                {s.name}
              </div>
              <span className={`text-xs ${s.ok ? "text-emerald-600" : "text-orange-600"}`}>{s.ok ? "Operational" : "Degraded"}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
