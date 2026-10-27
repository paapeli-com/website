import { useState, type KeyboardEvent } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { ANY_IPV4, ANY_IPV6, newRuleId, type FirewallRule, type RuleProtocol } from "./lib/firewallStore";

/* The firewall pages' shared pieces: how a rule reads, how an address reads,
 * what makes a rule valid, and the rules editor the create and edit page
 * use for both directions.
 *
 * A rule is made from a well-known service (SSH, DNS, MySQL…), which sets
 * its protocol and usual port, or from a bare protocol. Port 25 (SMTP) is
 * closed on the network itself, against spam; a rule that opens it says so.
 */

export const PROTOCOLS: { id: RuleProtocol; label: string }[] = [
  { id: "tcp", label: "TCP" },
  { id: "udp", label: "UDP" },
  { id: "icmp", label: "ICMP" },
  { id: "any", label: "All protocols" },
];

export const SERVICES: { id: string; label: string; protocol: RuleProtocol; port: number }[] = [
  { id: "ssh", label: "SSH", protocol: "tcp", port: 22 },
  { id: "rdp", label: "RDP", protocol: "tcp", port: 3389 },
  { id: "http", label: "HTTP", protocol: "tcp", port: 80 },
  { id: "https", label: "HTTPS", protocol: "tcp", port: 443 },
  { id: "dns", label: "DNS", protocol: "udp", port: 53 },
  { id: "ftp", label: "FTP", protocol: "tcp", port: 21 },
  { id: "ntp", label: "NTP", protocol: "udp", port: 123 },
  { id: "mysql", label: "MySQL", protocol: "tcp", port: 3306 },
  { id: "postgresql", label: "PostgreSQL", protocol: "tcp", port: 5432 },
  { id: "redis", label: "Redis", protocol: "tcp", port: 6379 },
  { id: "mongodb", label: "MongoDB", protocol: "tcp", port: 27017 },
  { id: "openvpn", label: "OpenVPN", protocol: "udp", port: 1194 },
  { id: "wireguard", label: "WireGuard", protocol: "udp", port: 51820 },
  { id: "kubernetes", label: "Kubernetes API", protocol: "tcp", port: 6443 },
];

/** The port the network itself keeps closed. */
export const SMTP_PORT = 25;

export const hasPorts = (p: RuleProtocol) => p === "tcp" || p === "udp";

/** Whether a rule names port 25, alone or in its range. */
export const opensSmtp = (r: FirewallRule) =>
  r.protocol === "tcp" && r.portFrom !== undefined && r.portFrom <= SMTP_PORT && (r.portTo ?? r.portFrom) >= SMTP_PORT;

/** What a rule is: its service's name, or its protocol's. */
export function useRuleKind() {
  const t = useT();
  return (r: FirewallRule) => {
    const svc = SERVICES.find((s) => s.id === r.service);
    return svc ? svc.label : t(PROTOCOLS.find((p) => p.id === r.protocol)!.label);
  };
}

/** "Any IPv4" for 0.0.0.0/0, "Any IPv6" for ::/0, the range otherwise. */
export function useAddressLabel() {
  const t = useT();
  return (a: string) => (a === ANY_IPV4 ? t("Any IPv4") : a === ANY_IPV6 ? t("Any IPv6") : a);
}
const isAny = (a: string) => a === ANY_IPV4 || a === ANY_IPV6;

/** "22", "8000-8100", "All ports", or "-" where ports do not apply. */
export function usePortLabel() {
  const t = useT();
  return (r: FirewallRule) =>
    !hasPorts(r.protocol) ? "-" : r.portFrom === undefined ? t("All ports") : r.portTo && r.portTo !== r.portFrom ? `${r.portFrom}-${r.portTo}` : String(r.portFrom);
}

function validAddress(a: string) {
  const v4 = a.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/);
  if (v4) return v4.slice(1, 5).every((o) => Number(o) <= 255) && (v4[5] === undefined || Number(v4[5]) <= 32);
  const v6 = a.match(/^([0-9a-fA-F:]+)(?:\/(\d{1,3}))?$/);
  return !!v6 && v6[1].includes(":") && (v6[2] === undefined || Number(v6[2]) <= 128);
}

const validPort = (p?: number) => p !== undefined && Number.isInteger(p) && p >= 1 && p <= 65535;

/** What is wrong with a rule, or null. */
export function ruleProblem(r: FirewallRule): "addresses" | "port" | null {
  if (r.addresses.length === 0 || !r.addresses.every(validAddress)) return "addresses";
  if (hasPorts(r.protocol)) {
    if (!validPort(r.portFrom)) return "port";
    if (r.portTo !== undefined && (!validPort(r.portTo) || r.portTo < r.portFrom!)) return "port";
  }
  return null;
}

/** An address as a chip: the "any" ranges in words, an address as written. */
function AddressChip({ address, children }: { address: string; children?: React.ReactNode }) {
  const addressLabel = useAddressLabel();
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
      <span dir={isAny(address) ? undefined : "ltr"}>{addressLabel(address)}</span>
      {children}
    </span>
  );
}

/* ---- Reading --------------------------------------------------------------------- */

const RULE_GRID = "grid grid-cols-[7rem_5rem_minmax(0,1fr)_minmax(0,8rem)] items-center gap-3";

/** A direction's rules as a small table, the headings over the columns. */
export function RuleTable({ rules, direction }: { rules: FirewallRule[]; direction: "inbound" | "outbound" }) {
  const t = useT();
  const kind = useRuleKind();
  const portLabel = usePortLabel();
  return (
    <div>
      <div className={cn(RULE_GRID, "border-b border-border pb-1.5 text-[11px] text-muted-foreground")}>
        <span>{t("Protocol")}</span>
        <span>{t("Port")}</span>
        <span>{direction === "inbound" ? t("Sources") : t("Destinations")}</span>
        <span>{t("Description")}</span>
      </div>
      <div className="divide-y divide-border">
        {rules.map((r) => (
          <div key={r.id} className={cn(RULE_GRID, "py-2 text-sm")}>
            <span className="truncate font-medium text-foreground">{kind(r)}</span>
            <span className="text-foreground" dir="ltr">
              <span className="inline-block">{portLabel(r)}</span>
            </span>
            <span className="flex min-w-0 flex-wrap gap-1">
              {r.addresses.map((a) => (
                <AddressChip key={a} address={a} />
              ))}
            </span>
            <span className="truncate text-xs text-muted-foreground" title={r.description}>
              {r.description ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- The editor ---------------------------------------------------------------- */

/** One direction's rules: each a box to edit or remove, a blank rule, and
    for inbound, the usual services in one click. */
export function RulesEditor({
  rules,
  onChange,
  direction,
  showErrors,
}: {
  rules: FirewallRule[];
  onChange: (rules: FirewallRule[]) => void;
  direction: "inbound" | "outbound";
  showErrors: boolean;
}) {
  const t = useT();
  const set = (id: string, patch: Partial<FirewallRule>) => onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = (patch: Partial<FirewallRule> = { protocol: "tcp" }) =>
    onChange([...rules, { id: newRuleId(), protocol: "tcp", addresses: [ANY_IPV4, ANY_IPV6], ...patch }]);

  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <RuleRow
          key={r.id}
          rule={r}
          direction={direction}
          showErrors={showErrors}
          onChange={(patch) => set(r.id, patch)}
          onRemove={() => onChange(rules.filter((x) => x.id !== r.id))}
        />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 border-dashed" onClick={() => add()}>
          <Plus className="size-3.5" />
          {t("Add rule")}
        </Button>
        {direction === "inbound" &&
          ["ssh", "http", "https", "rdp"].map((id) => {
            const s = SERVICES.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                onClick={() => add({ service: s.id, protocol: s.protocol, portFrom: s.port })}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {s.label}
              </button>
            );
          })}
        {direction === "inbound" && (
          <button
            type="button"
            onClick={() => add({ protocol: "icmp", description: "Ping" })}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            + Ping
          </button>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  direction,
  showErrors,
  onChange,
  onRemove,
}: {
  rule: FirewallRule;
  direction: "inbound" | "outbound";
  showErrors: boolean;
  onChange: (patch: Partial<FirewallRule>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { isRTL } = useLanguage();
  const [draft, setDraft] = useState("");
  const [describing, setDescribing] = useState(!!rule.description);
  const problem = showErrors ? ruleProblem(rule) : null;
  const ports = hasPorts(rule.protocol);
  /* A service names one port: the range's end does not apply. */
  const single = !!rule.service;
  const kindValue = rule.service ? `svc:${rule.service}` : rule.protocol;

  const addAddress = (raw: string) => {
    const parts = raw.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange({ addresses: Array.from(new Set([...rule.addresses, ...parts])) });
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAddress(draft);
    } else if (e.key === "Backspace" && !draft && rule.addresses.length) {
      onChange({ addresses: rule.addresses.slice(0, -1) });
    }
  };
  const num = (v: string) => (v.trim() === "" ? undefined : Math.round(Number(v)));
  const chooseKind = (v: string) => {
    if (v.startsWith("svc:")) {
      const s = SERVICES.find((x) => x.id === v.slice(4))!;
      onChange({ service: s.id, protocol: s.protocol, portFrom: s.port, portTo: undefined });
    } else {
      const protocol = v as RuleProtocol;
      onChange(hasPorts(protocol) ? { service: undefined, protocol } : { service: undefined, protocol, portFrom: undefined, portTo: undefined });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-start gap-3">
        {/* Addresses as chips; the two "any" ranges a click away. */}
        <div className="min-w-[240px] flex-1">
          <p className="mb-1 text-xs text-muted-foreground">{direction === "inbound" ? t("Sources") : t("Destinations")}</p>
          <div
            className={cn(
              "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5",
              problem === "addresses" ? "border-destructive" : "border-input",
            )}
          >
            {rule.addresses.map((a) => (
              <AddressChip key={a} address={a}>
                <button
                  type="button"
                  aria-label={t("Remove")}
                  onClick={() => onChange({ addresses: rule.addresses.filter((x) => x !== a) })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </AddressChip>
            ))}
            <input
              dir="ltr"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={() => addAddress(draft)}
              placeholder={rule.addresses.length ? "" : "203.0.113.0/24"}
              className="h-6 min-w-[130px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label={direction === "inbound" ? t("Sources") : t("Destinations")}
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-muted-foreground">{t("Type an IP or range and press Enter; add as many as you need.")}</span>
            {!rule.addresses.includes(ANY_IPV4) && (
              <button type="button" className="text-primary hover:underline" onClick={() => onChange({ addresses: [...rule.addresses, ANY_IPV4] })}>
                + {t("Any IPv4")}
              </button>
            )}
            {!rule.addresses.includes(ANY_IPV6) && (
              <button type="button" className="text-primary hover:underline" onClick={() => onChange({ addresses: [...rule.addresses, ANY_IPV6] })}>
                + {t("Any IPv6")}
              </button>
            )}
          </div>
          {problem === "addresses" && <p className="mt-1 text-[11px] text-destructive">{t("Enter at least one valid address or range.")}</p>}
        </div>

        {/* Service or protocol: the well-known services first. */}
        <div className="w-44">
          <p className="mb-1 text-xs text-muted-foreground">{t("Protocol")}</p>
          <Select dir={isRTL ? "rtl" : "ltr"} value={kindValue} onValueChange={chooseKind}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground">{t("Services")}</SelectLabel>
                {SERVICES.map((s) => (
                  <SelectItem key={s.id} value={`svc:${s.id}`}>
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {s.protocol.toUpperCase()} {s.port}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground">{t("Protocols")}</SelectLabel>
                {PROTOCOLS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {t(p.label)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Port, then the range's end, each with its own heading. */}
        <div className="flex items-start gap-1.5">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("Port")}</p>
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              disabled={!ports}
              value={rule.portFrom ?? ""}
              onChange={(e) => onChange({ portFrom: num(e.target.value) })}
              aria-label={t("Port")}
              className={cn("h-10 w-24 text-center", problem === "port" && "border-destructive")}
            />
          </div>
          <span className="mt-8 text-muted-foreground">–</span>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("To")}</p>
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              disabled={!ports || single}
              value={single ? "" : (rule.portTo ?? "")}
              onChange={(e) => onChange({ portTo: num(e.target.value) })}
              aria-label={t("Last port")}
              className={cn("h-10 w-24 text-center", problem === "port" && "border-destructive")}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="mt-6 h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
          aria-label={t("Remove rule")}
          title={t("Remove rule")}
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {problem === "port" && <p className="mt-1.5 text-[11px] text-destructive">{t("Ports run from 1 to 65535.")}</p>}
      {opensSmtp(rule) && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          {t("Port 25 (SMTP) stays closed on our network to keep it off spam lists. To send mail on it, ask support to open it.")}
        </p>
      )}

      {describing ? (
        <Input
          value={rule.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          placeholder={t("What this rule is for")}
          className="mt-2 h-9 text-sm"
          autoFocus={!rule.description}
        />
      ) : (
        <button type="button" onClick={() => setDescribing(true)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
          + {t("Add description")}
        </button>
      )}
    </div>
  );
}
