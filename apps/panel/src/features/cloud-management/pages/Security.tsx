import { useState } from "react";
import { toast } from "@/shared/lib/toast";
import { Button, Card, NoDataValue, PageHeader, SettingRow, Tabs } from "@/features/cloud-management/ui";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { currencyName, useBillingCurrency } from "@/shared/lib/billingCurrency";
import { useGetWorkspaceSecuritySummaryQuery } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";

const fill = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value), text);

/* Mostly no settings backend yet. Two rows are real: how many members sign in
   with two-factor, and the password rule, both from the workspace's security
   summary.

   Every control on this page asserted account state and none of it was read
   from anywhere: two-factor "on", SSO "Connected to Azure Entra ID", an IP
   allow-list enabled, an 8-hour session timeout, a 24-month retention window.
   On a security page that is the most costly kind of invention: someone
   reading it concludes the account is protected in ways it is not, and the
   toggles could not change anything either way. Each row keeps its title and
   description, which describe a control the product intends to offer, and
   reports that its current value is unknown.

   Billing currency is the exception: the account carries one now, so that row
   shows it rather than reporting no data, and the billing page is where it is
   changed.

   Signing out everywhere is not here. The endpoint revokes the sessions of
   the signed-in user, not of the account's members, so it belongs with the
   other things you do to your own account: see AccountSettings. */

const TABS = ["General", "Security", "Notifications", "Data & retention", "Audit log"];

export default function Security() {
  const t = useShellT();
  const language = useAppLanguage();
  const { currency } = useBillingCurrency();
  const [tab, setTab] = useState("Security");
  // Two-factor take-up and the password rule (GET /workspaces/{id}/security-summary).
  const workspaceId = useActiveWorkspaceId();
  const { data: summary } = useGetWorkspaceSecuritySummaryQuery(workspaceId ?? "");

  const labelled = TABS.map((name) => t(name));
  const tabFor = (label: string) => TABS[labelled.indexOf(label)] ?? "Security";

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like Dashboards and the device list. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Settings & security")}
        description={t("Account-wide preferences, authentication policy and data controls.")}
        actions={
          <>
            <Button variant="ghost">{t("Download account data")}</Button>
            <Button onClick={() => toast.info(t("Save changes"), { description: t("Coming soon.") })}>
              {t("Save changes")}
            </Button>
          </>
        }
      />

      <Tabs items={labelled} value={t(tab)} onChange={(v) => setTab(tabFor(v))} />

      {tab !== "Security" && tab !== "General" && tab !== "Data & retention" ? (
        <p className="text-sm text-muted-foreground">{t("This tab isn't part of the design preview yet.")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">{t("Authentication")}</h2>
              {/* Each member turns two-factor on for their own account (Account
                  settings); this shows how many have. Requiring it of everyone
                  is not offered yet. */}
              <SettingRow
                title={t("Two-factor authentication")}
                description={t("Members who sign in with a code from an authenticator app.")}
                control={summary ? (
                  <span className="text-[13.5px] font-medium text-foreground">
                    {fill(t("{on} of {all} members"), {
                      on: localizeDigits(language, summary.membersWithTwoFactor),
                      all: localizeDigits(language, summary.members),
                    })}
                  </span>
                ) : <NoDataValue />}
              />
              <SettingRow
                title={t("Single sign-on (SAML)")}
                description={t("Federate sign-in with your identity provider.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Session timeout")}
                description={t("Sign members out after a period of inactivity.")}
                control={<NoDataValue />}
              />
              {/* The rule every account's password is held to, as the gateway
                  enforces it. It is the platform's, not editable per account. */}
              <SettingRow
                title={t("Password policy")}
                description={t("The length every member's password is held to.")}
                control={summary ? (
                  <span className="text-[13.5px] font-medium text-foreground">
                    {fill(t("At least {n} characters"), { n: localizeDigits(language, summary.passwordMinLength) })}
                  </span>
                ) : <NoDataValue />}
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">{t("Access control")}</h2>
              <SettingRow
                title={t("IP allow-list")}
                description={t("Restrict portal and API access to approved ranges.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Approve new devices")}
                description={t("Email the owner when a member signs in from a new device.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Service account keys expire")}
                description={t("Force rotation of API keys on a fixed schedule.")}
                control={<NoDataValue />}
              />
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">{t("Account preferences")}</h2>
              <SettingRow
                title={t("Default language")}
                description={t("Portal language for new members.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Time zone")}
                description={t("Used for invoices, reports and alarm timestamps.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Data region")}
                description={t("Where your telemetry and backups are stored.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Billing currency")}
                description={t("Currency shown on invoices and usage reports.")}
                control={
                  <span className="text-[13.5px] font-medium text-foreground">
                    {currencyName(currency, language)}
                  </span>
                }
              />
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="px-1 pb-1 text-sm font-bold text-foreground">{t("Data & retention")}</h2>
              <SettingRow
                title={t("Telemetry retention")}
                description={t("Raw time-series data kept before roll-up.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Automatic backups")}
                description={t("Daily encrypted backup of configuration and dashboards.")}
                control={<NoDataValue />}
              />
              <SettingRow
                title={t("Export on cancellation")}
                description={t("Provide a full data export when a subscription ends.")}
                control={<NoDataValue />}
              />
            </Card>

            <Card className="flex items-center gap-4 border-destructive/30">
              <div className="flex flex-1 flex-col gap-0.5">
                <h2 className="text-sm font-bold text-destructive">{t("Close account")}</h2>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {t("Cancels all subscriptions and permanently deletes data after 30 days.")}
                </p>
              </div>
              <Button variant="danger">{t("Close account")}</Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
