import { Badge, Button, Card, NoData, PageHeader, ProgressBar, Table, Toggle } from "@/features/cloud-management/ui";

/* @paapeli/api has no usage/metering module yet.

   Every figure here was invented: five meters with percentages against plan
   limits (messages at 82% of quota), a thirty-day message-volume curve with
   its own date axis, and a per-resource table down to an overage charge of
   ﷼ 3,400,000. A quota meter is read as a measurement of your account, so
   these report no data until something meters them. */
const METERS: { label: string; used: string; limit: string; pct: number }[] = [];

const USAGE_BY_RESOURCE: [string, string, string, string, string][] = [];

export default function Usage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Usage & quotas"
        description="Consumption against plan limits for the current billing period."
        actions={
          <>
            <Button variant="ghost">Period: This month</Button>
            <Button>Request quota increase</Button>
          </>
        }
      />

      {METERS.length === 0 && <Card><NoData /></Card>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {METERS.map((m) => (
          <Card key={m.label} className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{m.label}</span>
              <Badge tone={m.pct >= 80 ? "warn" : "gray"}>{m.pct}%</Badge>
            </div>
            <span className="text-xl font-bold text-foreground">{m.used}</span>
            <ProgressBar pct={m.pct} tone={m.pct >= 80 ? "bad" : undefined} />
            <span className="text-xs text-muted-foreground">Limit {m.limit}</span>
          </Card>
        ))}
      </div>

      <Card className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">Message volume — last 30 days</h2>
          <Badge tone="gray">Messages</Badge>
        </div>
        <div className="flex h-40 items-center justify-center">
          <NoData />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <Table
          columns={["Resource", "Included", "Used", "Overage", "Est. cost"]}
          head={
            <>
              <h2 className="text-sm font-bold text-foreground">Usage by resource</h2>
              <span className="text-xs text-muted-foreground">Billing period to date</span>
            </>
          }
          rows={USAGE_BY_RESOURCE}
        />

        <Card className="flex flex-col">
          <h2 className="mb-1 text-sm font-bold text-foreground">Quota alerts</h2>
          <p className="mb-2 text-[13px] text-muted-foreground">
            Notify the billing owner and admins when a resource crosses a threshold.
          </p>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13.5px] text-muted-foreground">At 80% of quota</span>
            <Toggle checked />
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13.5px] text-muted-foreground">At 100% of quota</span>
            <Toggle checked />
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13.5px] text-muted-foreground">On any overage charge</span>
            <Toggle checked />
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13.5px] text-muted-foreground">Weekly usage digest</span>
            <Toggle checked={false} />
          </div>
        </Card>
      </div>
    </div>
  );
}
