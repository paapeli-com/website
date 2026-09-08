import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, NoDataValue, PageHeader, SettingRow, Tabs } from "@/features/cloud-management/ui";

/* No settings backend yet.

   Every control on this page asserted account state and none of it was read
   from anywhere: two-factor "on", SSO "Connected to Azure Entra ID", an IP
   allow-list enabled, an 8-hour session timeout, a 24-month retention window.
   On a security page that is the most costly kind of invention — someone
   reading it concludes the account is protected in ways it is not, and the
   toggles could not change anything either way. Each row keeps its title and
   description, which describe a control the product intends to offer, and
   reports that its current value is unknown. */

const TABS = ["General", "Security", "Notifications", "Data & retention", "Audit log"];

export default function Security() {
  const [tab, setTab] = useState("Security");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Settings & security"
        description="Account-wide preferences, authentication policy and data controls."
        actions={
          <>
            <Button variant="ghost">Download account data</Button>
            <Button onClick={() => toast.info("Save changes", { description: "Coming soon." })}>Save changes</Button>
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
              <SettingRow title="Two-factor authentication" description="Require a second factor for every member of this account." control={<NoDataValue />} />
              <SettingRow
                title="Single sign-on (SAML)"
                description="Federate sign-in with your identity provider."
                control={<NoDataValue />}
              />
              <SettingRow
                title="Session timeout"
                description="Sign members out after a period of inactivity."
                control={<NoDataValue />}
              />
              <SettingRow
                title="Password policy"
                description="Length, complexity and rotation rules for member passwords."
                control={<Button variant="ghost">Edit</Button>}
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Access control</h2>
              <SettingRow title="IP allow-list" description="Restrict portal and API access to approved ranges." control={<NoDataValue />} />
              <SettingRow
                title="Approve new devices"
                description="Email the owner when a member signs in from a new device."
                control={<NoDataValue />}
              />
              <SettingRow
                title="Service account keys expire"
                description="Force rotation of API keys on a fixed schedule."
                control={<NoDataValue />}
              />
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Account preferences</h2>
              <SettingRow
                title="Default language"
                description="Portal language for new members."
                control={<NoDataValue />}
              />
              <SettingRow
                title="Time zone"
                description="Used for invoices, reports and alarm timestamps."
                control={<NoDataValue />}
              />
              <SettingRow title="Data region" description="Where your telemetry and backups are stored." control={<NoDataValue />} />
              <SettingRow
                title="Billing currency"
                description="Currency shown on invoices and usage reports."
                control={<NoDataValue />}
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">Data & retention</h2>
              <SettingRow
                title="Telemetry retention"
                description="Raw time-series data kept before roll-up."
                control={<NoDataValue />}
              />
              <SettingRow title="Automatic backups" description="Daily encrypted backup of configuration and dashboards." control={<NoDataValue />} />
              <SettingRow title="Export on cancellation" description="Provide a full data export when a subscription ends." control={<NoDataValue />} />
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
