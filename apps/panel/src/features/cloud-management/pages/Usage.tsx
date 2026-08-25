import { AreaChart, Badge, Button, Card, PageHeader, ProgressBar, Table, Toggle } from "@/features/cloud-management/ui";

/* Placeholder data — @paapeli/api has no usage/metering module yet. */
const METERS: { label: string; used: string; limit: string; pct: number }[] = [
  { label: "Messages", used: "4.1M", limit: "5M / month", pct: 82 },
  { label: "Connected assets", used: "8", limit: "25 assets", pct: 32 },
  { label: "Time-series storage", used: "620 GB", limit: "1 TB", pct: 62 },
  { label: "API calls", used: "1.9M", limit: "10M / month", pct: 19 },
  { label: "Team seats", used: "9", limit: "20 seats", pct: 45 },
];

const MESSAGE_TREND = [42, 46, 44, 52, 49, 58, 55, 63, 60, 68, 65, 72];
const TREND_LABELS = ["11 Jul", "16 Jul", "21 Jul", "26 Jul", "31 Jul", "5 Aug", "9 Aug"];

const USAGE_BY_RESOURCE: [string, string, string, string, string][] = [
  ["Messages", "5M", "4.1M", "—", "﷼ 0"],
  ["Time-series storage", "1 TB", "620 GB", "—", "﷼ 0"],
  ["API calls", "10M", "1.9M", "—", "﷼ 0"],
  ["AI analysis runs", "2,000", "2,340", "340 runs", "﷼ 3,400,000"],
  ["OTA bandwidth", "200 GB", "86 GB", "—", "﷼ 0"],
];

export default function Usage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Usage & quotas"
        description="Consumption against plan limits for the current billing period — preview data, no usage backend yet."
        actions={
          <>
            <Button variant="ghost">Period: This month</Button>
            <Button>Request quota increase</Button>
          </>
        }
      />

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
        <div className="h-40">
          <AreaChart points={MESSAGE_TREND} />
        </div>
        <div className="flex justify-between text-[11.5px] text-muted-foreground">
          {TREND_LABELS.map((d) => (
            <span key={d}>{d}</span>
          ))}
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
