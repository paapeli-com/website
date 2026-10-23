import { BarChart3, Gauge } from "lucide-react";
import { Badge, Button, Card, NoData, PageHeader, ProgressBar, Table, Toggle, useComingSoon } from "@/features/cloud-management/ui";
import { useShellT } from "@/shared/i18n/shell";

/* @paapeli/api has no usage/metering module yet.

   Every figure here was invented: five meters with percentages against plan
   limits (messages at 82% of quota), a thirty-day message-volume curve with
   its own date axis, and a per-resource table down to an overage charge of
   3,400,000. A quota meter is read as a measurement of your account, so
   these report no data until something meters them. */
const METERS: { label: string; used: string; limit: string; pct: number }[] = [];

const USAGE_BY_RESOURCE: [string, string, string, string, string][] = [];

const ALERTS = ["At 80% of quota", "At 100% of quota", "On any overage charge", "Weekly usage digest"];

export default function Usage() {
  const t = useShellT();
  const soon = useComingSoon();

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like Dashboards and the device list. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Usage & quotas")}
        description={t("Consumption against plan limits for the current billing period.")}
        actions={
          <>
            <Button variant="ghost" onClick={() => soon("Period: This month")}>{t("Period: This month")}</Button>
            <Button onClick={() => soon("Request quota increase")}>{t("Request quota increase")}</Button>
          </>
        }
      />

      {METERS.length === 0 && (
        <Card>
          <NoData
            icon={Gauge}
            title={t("No usage yet")}
            description={t("Usage against your plan limits shows here once your devices start sending data.")}
          />
        </Card>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {METERS.map((m) => (
          <Card key={m.label} className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{t(m.label)}</span>
              <Badge tone={m.pct >= 80 ? "warn" : "gray"}>{m.pct}%</Badge>
            </div>
            <span className="text-xl font-bold text-foreground">{m.used}</span>
            <ProgressBar pct={m.pct} tone={m.pct >= 80 ? "bad" : undefined} />
            <span className="text-xs text-muted-foreground">{t("Limit")} {m.limit}</span>
          </Card>
        ))}
      </div>

      <Card className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">{t("Message volume in the last 30 days")}</h2>
          <Badge tone="gray">{t("Messages")}</Badge>
        </div>
        <div className="flex h-40 items-center justify-center">
          <NoData icon={BarChart3} title={t("No messages yet")} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <Table
          columns={[t("Resource"), t("Included"), t("Used"), t("Overage"), t("Est. cost")]}
          head={
            <>
              <h2 className="text-sm font-bold text-foreground">{t("Usage by resource")}</h2>
              <span className="text-xs text-muted-foreground">{t("Billing period to date")}</span>
            </>
          }
          rows={USAGE_BY_RESOURCE}
          empty={{ icon: Gauge, title: t("No usage yet") }}
        />

        <Card className="flex flex-col">
          <h2 className="mb-1 text-sm font-bold text-foreground">{t("Quota alerts")}</h2>
          <p className="mb-2 text-[13px] text-muted-foreground">
            {t("Notify the billing owner and admins when a resource crosses a threshold.")}
          </p>
          {ALERTS.map((label, i) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-muted-foreground">{t(label)}</span>
              {/* The weekly digest is the one that is off by default. */}
              <Toggle checked={i < 3} onChange={() => soon("Quota alerts")} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
