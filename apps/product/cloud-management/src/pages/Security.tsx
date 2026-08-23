import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, PageHeader, SettingRow, Tabs, Toggle } from "@/components/ui";

const TABS = ["General", "Security", "Notifications", "Data & retention", "Audit log"];

export default function Security() {
  const [tab, setTab] = useState("Security");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Settings & security"
        description="Account-wide preferences, authentication policy and data controls — preview data, most controls aren't wired up yet."
        actions={
          <>
            <Button variant="ghost">Download account data</Button>
            <Button onClick={() => toast.success("Saved (preview only — nothing was actually changed)")}>Save changes</Button>
          </>
        }
      />

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {tab !== "Security" && tab !== "General" && tab !== "Data & retention" ? (
        <p className="text-sm text-muted-foreground">This tab isn't part of the design preview yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Authentication</h2>
              <SettingRow title="Two-factor authentication" description="Require a second factor for every member of this account." control={<Toggle checked />} />
              <SettingRow
                title="Single sign-on (SAML)"
                description="Connected to Azure Entra ID."
                control={<Badge tone="ok">Connected</Badge>}
              />
              <SettingRow
                title="Session timeout"
                description="Sign members out after a period of inactivity."
                control={<span className="text-[13px] font-semibold text-foreground">8 hours</span>}
              />
              <SettingRow
                title="Password policy"
                description="Minimum 12 characters, rotation every 180 days."
                control={<Button variant="ghost">Edit</Button>}
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Access control</h2>
              <SettingRow title="IP allow-list" description="Restrict portal and API access to approved ranges." control={<Toggle checked />} />
              <SettingRow
                title="Approve new devices"
                description="Email the owner when a member signs in from a new device."
                control={<Toggle checked />}
              />
              <SettingRow
                title="Service account keys expire"
                description="Force rotation of API keys after 90 days."
                control={<Toggle checked={false} />}
              />
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Account preferences</h2>
              <SettingRow
                title="Default language"
                description="Portal language for new members."
                control={<span className="text-[13px] font-semibold text-foreground">فارسی</span>}
              />
              <SettingRow
                title="Time zone"
                description="Used for invoices, reports and alarm timestamps."
                control={<span className="text-[13px] font-semibold text-foreground">Asia/Tehran</span>}
              />
              <SettingRow title="Data region" description="Where your telemetry and backups are stored." control={<Badge tone="gray">Tehran-1</Badge>} />
              <SettingRow
                title="Billing currency"
                description="Currency shown on invoices and usage reports."
                control={<span className="text-[13px] font-semibold text-foreground">IRR ﷼</span>}
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Data & retention</h2>
              <SettingRow
                title="Telemetry retention"
                description="Raw time-series data kept before roll-up."
                control={<span className="text-[13px] font-semibold text-foreground">24 months</span>}
              />
              <SettingRow title="Automatic backups" description="Daily encrypted backup of configuration and dashboards." control={<Toggle checked />} />
              <SettingRow title="Export on cancellation" description="Provide a full data export when a subscription ends." control={<Toggle checked />} />
            </Card>

            <Card className="flex items-center gap-4 border-destructive/30">
              <div className="flex flex-1 flex-col gap-0.5">
                <h2 className="text-sm font-bold text-destructive">Close account</h2>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Cancels all subscriptions and permanently deletes data after 30 days.
                </p>
              </div>
              <Button variant="danger">Close account</Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
