import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Badge, Button, Card, Field, NoDataValue, PageHeader, Table } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";

/* @paapeli/api has no API-key/service-account module yet, and the "Create API
   key" form below is not wired to anything.

   Five live-looking keys with prefixes, scopes and "last used 2 min ago", plus
   an access log naming four people and the IP addresses they acted from. A
   security page is the last place to invent records: someone reading it would
   reasonably revoke a key or investigate a sign-in that never happened. */
const API_KEYS: [string, string, string, string, string, "ok" | "bad"][] = [];

const ACCESS_EVENTS: string[][] = [];

/* Scopes are the product's permission model — a fixed set the form offers,
   not account data — so they stay. */
const SCOPES = ["AIoT — read", "AIoT — write", "Cloud — billing read", "Cloud — organisation admin"];

/* Service addresses are product constants and real; the webhook signing
   secret is per-account and was invented, so it has no value to show. */
const ENDPOINTS: [string, string | null][] = [
  ["REST API", "https://api.paapeli.cloud/v1"],
  ["MQTT broker", "mqtts://mqtt.paapeli.cloud:8883"],
  ["Webhook signature", null],
];

export default function AccessApiKeys() {
  const [name, setName] = useState("");
  const [enabledScopes, setEnabledScopes] = useState<Set<string>>(new Set(["AIoT — read", "AIoT — write"]));

  const toggleScope = (scope: string) =>
    setEnabledScopes((prev) => {
      const next = new Set(prev);
      next.has(scope) ? next.delete(scope) : next.add(scope);
      return next;
    });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Access & API keys"
        description="Programmatic access to the Paapeli cloud API."
        actions={<Button variant="ghost">API documentation</Button>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Table
            columns={["Name", "Key", "Scope", "Created", "Last used", "Status"]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">API keys</h2>
                <span className="text-xs text-muted-foreground">Keys are shown once at creation</span>
              </>
            }
            rows={API_KEYS.map(([name_, key, scope, created, used, status]) => [
              name_,
              <span key="k" className="font-mono text-xs">
                {key}
              </span>,
              scope,
              created,
              used,
              <Badge key="s" tone={status}>
                {status === "ok" ? "Active" : "Revoked"}
              </Badge>,
            ])}
          />

          <Table
            columns={["Event", "Actor", "IP", "When"]}
            head={<h2 className="text-sm font-bold text-foreground">Recent access events</h2>}
            rows={ACCESS_EVENTS}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-foreground">Create API key</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Key name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production ingest"
                className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-foreground">Scopes</span>
              {SCOPES.map((scope) => {
                const on = enabledScopes.has(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className="flex items-center gap-2.5 text-start"
                  >
                    <span
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="text-[13.5px] text-muted-foreground">{scope}</span>
                  </button>
                );
              })}
            </div>
            <Field label="Expires" value="90 days" />
            <div>
              <Button onClick={() => toast.info("Create API key", { description: "Coming soon." })}>Generate key</Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">Endpoints</h2>
            {ENDPOINTS.map(([l, v]) => (
              <div key={l} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{l}</span>
                <span className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground">
                  {v ?? <NoDataValue className="font-sans text-xs" />}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
