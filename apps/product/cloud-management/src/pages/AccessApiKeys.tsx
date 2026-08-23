import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Badge, Button, Card, Field, PageHeader, Table } from "@/components/ui";
import { cn } from "@/lib/utils";

/* Placeholder data — @paapeli/api has no API-key/service-account module
   yet. The "Create API key" form below is not wired to anything. */
const API_KEYS: [string, string, string, string, string, "ok" | "bad"][] = [
  ["Production ingest", "pk_live_••••••••3f9a", "AIoT · write", "12 Mar 2026", "2 min ago", "ok"],
  ["Grafana read-only", "pk_live_••••••••b71c", "AIoT · read", "4 Apr 2026", "1 h ago", "ok"],
  ["Billing export", "pk_live_••••••••28de", "Cloud · billing read", "19 May 2026", "Yesterday", "ok"],
  ["Staging sandbox", "pk_test_••••••••90aa", "AIoT · full", "2 Jun 2026", "6 days ago", "ok"],
  ["Legacy gateway", "pk_live_••••••••55c1", "AIoT · write", "8 Nov 2025", "3 months ago", "bad"],
];

const ACCESS_EVENTS = [
  ["API key created — Billing export", "Maryam Rahimi", "5.63.12.44", "19 May 2026, 10:22"],
  ["Key revoked — Legacy gateway", "Hossein Karimi", "5.63.12.44", "2 May 2026, 16:03"],
  ["Sign-in from new device", "Sina Ahmadi", "91.98.7.210", "1 May 2026, 08:47"],
  ["Payment method updated", "Maryam Rahimi", "5.63.12.44", "28 Apr 2026, 13:15"],
];

const SCOPES = ["AIoT — read", "AIoT — write", "Cloud — billing read", "Cloud — organisation admin"];

const ENDPOINTS = [
  ["REST API", "https://api.paapeli.cloud/v1"],
  ["MQTT broker", "mqtts://mqtt.paapeli.cloud:8883"],
  ["Webhook signature", "whsec_••••••••4c2b"],
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
        description="Programmatic access to the Paapeli cloud API — preview data, no key-management backend yet."
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
                <span className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
