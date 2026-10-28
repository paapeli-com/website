import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Plus,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  Split,
  Tag,
  Trash2,
  Waypoints,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { REGIONS } from "../lib/catalog";
import { useServers, type ServerRecord } from "../lib/serverStore";
import { useNetworks, type Problem } from "../lib/networkStore";
import { useGroups } from "../lib/autoscaleStore";
import { useFirewalls, type FirewallGroup } from "../lib/firewallStore";
import { apiCall } from "../lib/openstackErrors";
import {
  createLoadBalancer,
  LB_ALGORITHMS,
  LB_PROTOCOLS,
  MAX_RULES,
  MONITOR_TYPES,
  newLoadBalancerInput,
  newMember,
  newRule,
  PERSISTENCE_FOR,
  problemsOf,
  ruleHasProblems,
  updateLoadBalancer,
  useLoadBalancers,
  validateLoadBalancer,
  withProtocol,
  type HealthMonitor,
  type LbAlgorithm,
  type LbProtocol,
  type LoadBalancerInput,
  type MonitorType,
  type Persistence,
  type RuleErrors,
  type TrafficRule,
} from "../lib/loadBalancerStore";
import { useLbText } from "../lbUi";
import { CREATE_NETWORK_PATH, CreateFooter, CreatePage, LOAD_BALANCERS_PATH, NETWORKS_PATH, PageBreadcrumb } from "../ui";
import { FieldBox, Note, Pill, RegionBox, SummaryLine } from "../wizard";

/* Create or edit a load balancer: one page.
 *
 *   The row        where, its name, and the private network its address is on.
 *   Second row     a description, and the private address: the next free one
 *                  or one chosen.
 *   Traffic rules  one card each: the protocol and port it listens on and the
 *                  port on the servers; how traffic is spread and kept
 *                  together; the servers; the health check; and, folded away,
 *                  limits, timeouts, X-Forwarded-For and allowed ranges.
 *
 * Every field starts from a value that works, so a new load balancer can be
 * created as it opens. Every field is checked as it is typed against
 * Octavia's own rules (lib/loadBalancerStore.ts); what the store, and later
 * the API, still refuses comes back as a toast in the person's language.
 *
 * Editing keeps the region, network and address: Octavia cannot move a load
 * balancer's VIP. Rules, servers and health checks can change.
 */

export default function LoadBalancerForm() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const { formatNumber: n } = useLanguage();
  const { lbId } = useParams();
  const lbs = useLoadBalancers();
  const networks = useNetworks();
  const existing = lbId ? lbs.find((x) => x.id === lbId) : undefined;
  const editing = !!lbId;
  const goToList = () => navigate(LOAD_BALANCERS_PATH);

  const [regionId, setRegionId] = useState(REGIONS.find((r) => r.city === existing?.region)?.id ?? REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [form, setForm] = useState<LoadBalancerInput>(() => existing ?? newLoadBalancerInput(region.city, lbs, networks));
  const [vipMode, setVipMode] = useState<"auto" | "fixed">("auto");
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  /* Rules whose health check or advanced settings are open. */
  const [open, setOpen] = useState<Record<string, { health?: boolean; advanced?: boolean }>>({});

  const set = (patch: Partial<LoadBalancerInput>) => setForm((f) => ({ ...f, ...patch }));
  const setRule = (id: string, next: TrafficRule) => setForm((f) => ({ ...f, rules: f.rules.map((r) => (r.id === id ? next : r)) }));

  const regionCity = editing ? form.region : region.city;
  const regionNetworks = networks.filter((x) => x.region === regionCity);
  const network = networks.find((x) => x.id === form.networkId);
  const input: LoadBalancerInput = { ...form, region: regionCity, vipAddress: vipMode === "fixed" ? form.vipAddress : editing ? form.vipAddress : "" };
  const errors = useMemo(
    () => validateLoadBalancer(input, lbs.filter((x) => x.id !== lbId), !editing),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, vipMode, regionCity, lbs, networks, lbId],
  );
  const problems = problemsOf(errors);

  /* Shown as it is typed; an empty field only once Create is pressed. */
  const shown = (p: Problem | undefined, value: string) => (p && (showErrors || value.trim() !== "") ? p : undefined);

  if (editing && !existing) {
    return (
      <CreatePage>
        <p className="py-16 text-center text-muted-foreground">{t("This load balancer no longer exists.")}</p>
        <div className="text-center">
          <Button variant="outline" onClick={goToList}>
            {t("Back to load balancers")}
          </Button>
        </div>
      </CreatePage>
    );
  }

  const submit = async () => {
    if (problems.length > 0) {
      setShowErrors(true);
      /* Open whatever holds a problem, so it can be seen. */
      setOpen((prev) => {
        const next = { ...prev };
        form.rules.forEach((r, i) => {
          const e = errors.rules[i];
          if (!e) return;
          if (e.path || e.codes || e.delay || e.timeout || e.retries) next[r.id] = { ...next[r.id], health: true };
          if (e.connectionLimit || e.timeouts || e.cidrs.some(Boolean)) next[r.id] = { ...next[r.id], advanced: true };
        });
        return next;
      });
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    setSaving(true);
    const done = await apiCall(() => {
      if (existing) updateLoadBalancer(existing.id, input);
      else createLoadBalancer(input);
      return true;
    }, t);
    setSaving(false);
    if (!done) return;
    toast.success(existing ? t("{name} saved", { name: form.name }) : t("{name} is being created.", { name: form.name }));
    goToList();
  };

  const title = editing ? existing!.name : t("Create load balancer");
  const primaryLabel = editing ? t("Save changes") : t("Create load balancer");
  const memberCount = form.rules.reduce((sum, r) => sum + r.members.length, 0);

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Networking"), path: NETWORKS_PATH },
          { label: shellT("Load Balancer"), path: LOAD_BALANCERS_PATH },
          { label: title },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          <span dir={editing ? "ltr" : undefined}>{title}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("One address in front of several servers, sending traffic only to those that answer.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4 p-4 lg:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {editing ? (
                <FieldBox icon={MapPin} title={t("Region")} description={t("A load balancer stays in the region it is made in.")}>
                  <Input value={t(form.region)} disabled className="h-12" />
                </FieldBox>
              ) : (
                <RegionBox
                  regionId={regionId}
                  zone={zone}
                  onChange={(r, z) => {
                    setRegionId(r);
                    setZone(z);
                    const city = REGIONS.find((x) => x.id === r)!.city;
                    set({ networkId: networks.find((x) => x.region === city)?.id ?? "", rules: form.rules.map((x) => ({ ...x, members: [] })) });
                  }}
                  description={t("Its servers must be in the same region.")}
                />
              )}

              {/* Side by side at every width, inputs on one line. */}
              <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                <FieldBox title={t("Name")} required description={t("English letters, digits, . _ and -")}>
                  <Input
                    dir="ltr"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value.replace(/\s/g, "-") })}
                    aria-label={t("Name")}
                    aria-invalid={!!shown(errors.name, form.name)}
                    className={cn("h-12 rtl:text-right", shown(errors.name, form.name) && "border-destructive")}
                  />
                  <FieldError problem={shown(errors.name, form.name)} />
                </FieldBox>

                <FieldBox
                  title={t("Private network")}
                  required
                  description={editing ? t("Cannot be changed once made.") : t("Its address is on this network.")}
                >
                  {regionNetworks.length === 0 && !editing ? (
                    <div className="flex h-12 items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground">
                      <span className="truncate">{t("No network in this region")}</span>
                      <button type="button" className="shrink-0 font-medium text-primary hover:underline" onClick={() => navigate(CREATE_NETWORK_PATH)}>
                        {t("Create one")}
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={form.networkId}
                      disabled={editing}
                      onValueChange={(v) => set({ networkId: v, vipAddress: "", rules: form.rules.map((x) => ({ ...x, members: [] })) })}
                    >
                      <SelectTrigger
                        className={cn("h-12", showErrors && errors.network && "border-destructive")}
                        aria-label={t("Private network")}
                      >
                        <SelectValue placeholder={t("Choose a network")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(editing ? networks.filter((x) => x.id === form.networkId) : regionNetworks).map((x) => (
                          <SelectItem key={x.id} value={x.id}>
                            <span dir="ltr">{x.name}</span> <span className="text-muted-foreground">·</span>{" "}
                            <span dir="ltr" className="text-xs text-muted-foreground">
                              {x.cidr}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FieldError problem={showErrors ? errors.network : undefined} />
                </FieldBox>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FieldBox icon={Waypoints} title={t("Private address")} description={t("Servers on the network reach it here; a public IP points here too.")}>
                {editing ? (
                  <Input dir="ltr" value={form.vipAddress} disabled className="h-10 rtl:text-right" />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Segmented
                      value={vipMode}
                      onChange={(v) => setVipMode(v as "auto" | "fixed")}
                      options={[
                        ["auto", t("Next free address")],
                        ["fixed", t("A chosen address")],
                      ]}
                    />
                    {vipMode === "fixed" && (
                      <Input
                        dir="ltr"
                        value={form.vipAddress}
                        onChange={(e) => set({ vipAddress: e.target.value.replace(/\s/g, "") })}
                        placeholder={network?.pools[0]?.start ?? "10.0.0.10"}
                        aria-label={t("Private address")}
                        className={cn("h-9 w-40 rtl:text-right", shown(errors.vip, form.vipAddress) && "border-destructive")}
                      />
                    )}
                  </div>
                )}
                <FieldError problem={vipMode === "fixed" ? shown(errors.vip, form.vipAddress) : undefined} />
              </FieldBox>
              <FieldBox icon={FileText} title={t("Description")} description={t("Optional, for you and your team.")}>
                <Input value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={255} className="h-10" />
              </FieldBox>
            </div>
          </Card>

          {/* Traffic rules */}
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Traffic rules")}</h2>
                <p className="text-xs text-muted-foreground">{t("Each rule sends what arrives on one port to your servers.")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={form.rules.length >= MAX_RULES}
                onClick={() => set({ rules: [...form.rules, newRule(form.rules)] })}
              >
                <Plus className="size-3.5" />
                {t("Add rule")}
              </Button>
            </div>
            {form.rules.length === 0 ? (
              <Note>{t("No rule: the load balancer is made, but takes no traffic until a rule is added.")}</Note>
            ) : (
              <div className="space-y-4">
                {form.rules.map((r, i) => (
                  <RuleCard
                    key={r.id}
                    index={i}
                    rule={r}
                    errors={errors.rules[i]}
                    showErrors={showErrors}
                    lbId={lbId}
                    networkId={form.networkId}
                    open={open[r.id] ?? {}}
                    onOpen={(o) => setOpen((prev) => ({ ...prev, [r.id]: { ...prev[r.id], ...o } }))}
                    onChange={(next) => setRule(r.id, next)}
                    onRemove={() => set({ rules: form.rules.filter((x) => x.id !== r.id) })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
            <SummaryLine icon={MapPin} label={t("Region")} value={t(regionCity)} />
            <SummaryLine icon={Tag} label={t("Name")} value={<span dir="ltr">{form.name || "-"}</span>} />
            <SummaryLine icon={Waypoints} label={t("Private network")} value={network ? <span dir="ltr">{network.name}</span> : "-"} />
            <SummaryLine
              icon={Split}
              label={t("Private address")}
              value={editing || vipMode === "fixed" ? <span dir="ltr">{form.vipAddress || "-"}</span> : t("Next free address")}
            />
            <SummaryLine
              icon={SlidersHorizontal}
              label={t("Traffic rules")}
              value={
                form.rules.length ? (
                  <span dir="ltr" className="text-xs">
                    {form.rules.map((r) => `${r.protocol}:${r.port}`).join(", ")}
                  </span>
                ) : (
                  t("None")
                )
              }
            />
            <SummaryLine icon={Server} label={t("Servers")} value={n(memberCount)} />
            <Button
              onClick={() => void submit()}
              disabled={saving}
              className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Split className="size-4" />
              {primaryLabel}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter cancel={{ label: t("Cancel"), onClick: goToList }} primary={{ label: primaryLabel, onClick: () => void submit() }} />
    </CreatePage>
  );
}

// ---- A traffic rule ---------------------------------------------------------------

/** Whether a server's firewalls let this rule's traffic in on its port. */
function firewallOpens(groups: FirewallGroup[], serverId: string, rule: TrafficRule) {
  const mine = groups.filter((g) => g.serverIds.includes(serverId));
  if (mine.length === 0) return true; /* not known here: say nothing */
  const proto = rule.protocol === "UDP" ? "udp" : "tcp";
  return mine.some((g) =>
    g.inbound.some(
      (x) =>
        (x.protocol === "any" || x.protocol === proto) &&
        (x.portFrom === undefined || (rule.targetPort >= x.portFrom && rule.targetPort <= (x.portTo ?? x.portFrom))),
    ),
  );
}

function RuleCard({
  index,
  rule,
  errors,
  showErrors,
  lbId,
  networkId,
  open,
  onOpen,
  onChange,
  onRemove,
}: {
  index: number;
  rule: TrafficRule;
  errors?: RuleErrors;
  showErrors: boolean;
  lbId?: string;
  networkId: string;
  open: { health?: boolean; advanced?: boolean };
  onOpen: (o: { health?: boolean; advanced?: boolean }) => void;
  onChange: (next: TrafficRule) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { isRTL, formatNumber } = useLanguage();
  const text = useLbText();
  const navigate = useNavigate();
  const servers = useServers();
  const networks = useNetworks();
  const firewalls = useFirewalls();
  const groups = useGroups().filter((g) => lbId && g.lb?.id === lbId && g.lb.ruleId === rule.id);
  const network = networks.find((x) => x.id === networkId);
  const set = (patch: Partial<TrafficRule>) => onChange({ ...rule, ...patch });
  const setMonitor = (patch: Partial<HealthMonitor>) => onChange({ ...rule, monitor: { ...rule.monitor, ...patch } });
  const e: RuleErrors = errors ?? { cidrs: [], weights: [] };
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const isHttpCheck = rule.monitor.type === "HTTP" || rule.monitor.type === "HTTPS";

  /* Servers on the network, not yet behind this rule. */
  const onNetwork: ServerRecord[] = (network?.ports ?? [])
    .filter((p) => p.serverId && !p.device)
    .map((p) => servers.find((s) => s.id === p.serverId))
    .filter((s): s is ServerRecord => !!s);
  const addable = onNetwork.filter((s) => !rule.members.some((m) => m.serverId === s.id));
  const ipOf = (serverId: string) => network?.ports.find((p) => p.serverId === serverId)?.ip ?? "-";

  return (
    <Card className={cn("overflow-hidden", showErrors && ruleHasProblems(errors) && "border-destructive/60")}>
      {/* What it listens on and where it sends it. */}
      <div className="flex flex-wrap items-end gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center self-center rounded-lg bg-background text-xs font-semibold text-muted-foreground">
          {formatNumber(index + 1)}
        </span>
        <Field label={t("Protocol")}>
          <Select value={rule.protocol} onValueChange={(v) => onChange(withProtocol(rule, v as LbProtocol))}>
            <SelectTrigger className="h-9 w-28 bg-background" dir="ltr">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LB_PROTOCOLS.map((p) => (
                /* HTTP only for now; the rest come later. */
                <SelectItem key={p} value={p} disabled={p !== "HTTP"}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("Port")}>
          <NumField value={rule.port} onChange={(port) => set({ port })} invalid={!!e.port} className="w-24 bg-background" label={t("Port")} />
        </Field>
        <Arrow className="mb-2.5 size-4 shrink-0 text-muted-foreground" />
        <Field label={t("Servers' port")}>
          <NumField
            value={rule.targetPort}
            onChange={(targetPort) => set({ targetPort })}
            invalid={!!e.targetPort}
            className="w-24 bg-background"
            label={t("Servers' port")}
          />
        </Field>
        <div className="ms-auto self-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={groups.length > 0}
            aria-label={t("Remove rule")}
            title={groups.length > 0 ? t("An Auto Scale group uses this rule.") : t("Remove rule")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        {(e.port || e.targetPort) && (
          <div className="basis-full">
            <FieldError problem={e.port ?? e.targetPort} className="mt-0" />
          </div>
        )}
        {rule.protocol === "HTTPS" && (
          <p className="basis-full text-xs text-muted-foreground">
            {t("HTTPS is passed through as it is: your servers hold the certificate and decrypt it.")}
          </p>
        )}
      </div>

      <div className="space-y-5 p-4">
        {/* How traffic is spread, and kept together. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">{t("Spread traffic")}</p>
            <Select value={rule.algorithm} onValueChange={(v) => set({ algorithm: v as LbAlgorithm })}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LB_ALGORITHMS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {text.algorithm[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">{text.algorithmHint[rule.algorithm]}</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">{t("Session persistence")}</p>
            <Select value={rule.persistence} onValueChange={(v) => set({ persistence: v as Persistence })}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSISTENCE_FOR[rule.protocol].map((p) => (
                  <SelectItem key={p} value={p}>
                    {text.persistence[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rule.persistence === "APP_COOKIE" ? (
              <>
                <Input
                  dir="ltr"
                  value={rule.cookieName}
                  onChange={(ev) => set({ cookieName: ev.target.value.replace(/\s/g, "") })}
                  placeholder="SESSIONID"
                  aria-label={t("Cookie name")}
                  className={cn("mt-2 h-9 text-sm rtl:text-right", (showErrors || rule.cookieName) && e.cookie && "border-destructive")}
                />
                <FieldError problem={showErrors || rule.cookieName ? e.cookie : undefined} />
              </>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">{t("Keeps a visitor on the same server between requests.")}</p>
            )}
          </div>
        </div>

        {/* The servers behind it. */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("Servers")}</p>
          {rule.members.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs text-muted-foreground [&>th]:px-3 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                    <th>{t("Server")}</th>
                    <th className="w-28">{t("Weight")}</th>
                    <th className="w-24">{t("Backup")}</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rule.members.map((m, i) => {
                    const s = servers.find((x) => x.id === m.serverId);
                    const closed = !firewallOpens(firewalls, m.serverId, rule);
                    return (
                      <tr key={m.id} className="border-t border-border align-top [&>td]:px-3 [&>td]:py-2">
                        <td>
                          <span dir="ltr" className="block truncate font-medium text-foreground">
                            {s?.name ?? "-"}
                          </span>
                          <span dir="ltr" className="block text-xs text-muted-foreground">
                            {ipOf(m.serverId)}:{rule.targetPort}
                          </span>
                          {closed && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                              <ShieldAlert className="size-3.5 shrink-0" />
                              {t("Its firewall does not let port {port} in.", { port: rule.targetPort })}
                            </span>
                          )}
                        </td>
                        <td>
                          <NumField
                            value={m.weight}
                            onChange={(weight) => set({ members: rule.members.map((x) => (x.id === m.id ? { ...x, weight } : x)) })}
                            invalid={!!e.weights[i]}
                            className="h-8 w-20"
                            label={t("Weight")}
                          />
                          <FieldError problem={e.weights[i]} />
                        </td>
                        <td>
                          <Checkbox
                            className="mt-2"
                            checked={m.backup}
                            onCheckedChange={(c) => set({ members: rule.members.map((x) => (x.id === m.id ? { ...x, backup: c === true } : x)) })}
                            aria-label={t("Backup")}
                          />
                        </td>
                        <td className="text-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => set({ members: rule.members.filter((x) => x.id !== m.id) })}
                            aria-label={t("Remove")}
                            title={t("Remove")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <FieldError problem={e.members} />
          {groups.map((g) => (
            <p key={g.id} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="size-3.5 shrink-0" />
              {t("The instances of Auto Scale group {name} join this rule on their own.", { name: g.name })}
            </p>
          ))}
          <div className="mt-2">
            {!network ? (
              <p className="text-xs text-muted-foreground">{t("Choose a private network first.")}</p>
            ) : onNetwork.length === 0 ? (
              <Note>
                {t("No server is on {name} yet. Connect your servers to it on the Private Networks page, then add them here.", { name: network.name })}{" "}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(NETWORKS_PATH)}>
                  {t("Private Networks")}
                </button>
              </Note>
            ) : addable.length > 0 ? (
              <Select value="" onValueChange={(id) => set({ members: [...rule.members, newMember(id)] })}>
                <SelectTrigger className="h-9 w-full sm:w-72">
                  <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                    <Plus className="size-3.5 shrink-0" />
                    {t("Add a server")}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {addable.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span dir="ltr">{s.name}</span>{" "}
                      <span dir="ltr" className="text-xs text-muted-foreground">
                        {ipOf(s.id)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">{t("Every server on this network is already behind this rule.")}</p>
            )}
          </div>
          {rule.members.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("A server with weight 0 takes no new visitors. A backup server gets traffic only when the others are down.")}
            </p>
          )}
        </div>

        {/* Health check */}
        <Fold
          icon={HeartPulse}
          title={t("Health check")}
          summary={text.monitor(rule.monitor)}
          open={!!open.health}
          onToggle={() => onOpen({ health: !open.health })}
          needsFix={showErrors && !!(e.path || e.codes || e.delay || e.timeout || e.retries)}
          control={
            <Switch checked={rule.monitor.enabled} onCheckedChange={(enabled) => setMonitor({ enabled })} aria-label={t("Health check")} />
          }
        >
          {!rule.monitor.enabled ? (
            <Note>{t("Without a health check, traffic keeps going to a server that has stopped answering.")}</Note>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start gap-3">
                <Field label={t("Type")}>
                  <Select value={rule.monitor.type} onValueChange={(v) => setMonitor({ type: v as MonitorType })}>
                    <SelectTrigger className="h-9 w-32" dir="ltr">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONITOR_TYPES[rule.protocol].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {isHttpCheck && (
                  <>
                    <Field label={t("Path")} problem={e.path}>
                      <Input
                        dir="ltr"
                        value={rule.monitor.path}
                        onChange={(ev) => setMonitor({ path: ev.target.value })}
                        className={cn("h-9 w-44 text-sm rtl:text-right", e.path && "border-destructive")}
                      />
                    </Field>
                    <Field label={t("Healthy answer")} problem={e.codes}>
                      <Input
                        dir="ltr"
                        value={rule.monitor.codes}
                        onChange={(ev) => setMonitor({ codes: ev.target.value })}
                        className={cn("h-9 w-28 text-sm rtl:text-right", e.codes && "border-destructive")}
                      />
                    </Field>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <Field label={t("Check every (s)")} problem={e.delay}>
                  <NumField value={rule.monitor.delay} onChange={(delay) => setMonitor({ delay })} invalid={!!e.delay} className="w-20" label={t("Check every (s)")} />
                </Field>
                <Field label={t("Timeout (s)")} problem={e.timeout}>
                  <NumField value={rule.monitor.timeout} onChange={(timeout) => setMonitor({ timeout })} invalid={!!e.timeout} className="w-20" label={t("Timeout (s)")} />
                </Field>
                <Field label={t("Failed after")}>
                  <NumField
                    value={rule.monitor.maxRetriesDown}
                    onChange={(maxRetriesDown) => setMonitor({ maxRetriesDown })}
                    invalid={!!e.retries}
                    className="w-20"
                    label={t("Failed after")}
                  />
                </Field>
                <Field label={t("Healthy after")}>
                  <NumField
                    value={rule.monitor.maxRetries}
                    onChange={(maxRetries) => setMonitor({ maxRetries })}
                    invalid={!!e.retries}
                    className="w-20"
                    label={t("Healthy after")}
                  />
                </Field>
              </div>
              <FieldError problem={e.retries} />
              <p className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" />
                <span>
                  {t("Every {interval} s each server is checked on port {port}; after {down} failures in a row it gets no traffic, and after {up} answers in a row it gets traffic again.", {
                    interval: formatNumber(rule.monitor.delay || 0),
                    port: rule.targetPort,
                    down: formatNumber(rule.monitor.maxRetriesDown || 0),
                    up: formatNumber(rule.monitor.maxRetries || 0),
                  })}
                </span>
              </p>
            </div>
          )}
        </Fold>

        {/* Limits, timeouts, headers, allowed ranges */}
        <Fold
          icon={SlidersHorizontal}
          title={t("Advanced settings")}
          summary={[
            rule.connectionLimit === null ? t("No connection limit") : t("Up to {n} connections", { n: formatNumber(rule.connectionLimit) }),
            rule.allowedCidrs.length ? t("{n} allowed ranges", { n: formatNumber(rule.allowedCidrs.length) }) : t("Open to all"),
            rule.protocol === "HTTP" && rule.forwardedFor ? "X-Forwarded-For" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          open={!!open.advanced}
          onToggle={() => onOpen({ advanced: !open.advanced })}
          needsFix={showErrors && !!(e.connectionLimit || e.timeouts || e.cidrs.some(Boolean))}
        >
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground">{t("Connection limit")}</span>
                <Segmented
                  value={rule.connectionLimit === null ? "none" : "set"}
                  onChange={(v) => set({ connectionLimit: v === "none" ? null : 5000 })}
                  options={[
                    ["none", t("No limit")],
                    ["set", t("Limit")],
                  ]}
                />
                {rule.connectionLimit !== null && (
                  <NumField
                    value={rule.connectionLimit}
                    onChange={(connectionLimit) => set({ connectionLimit })}
                    invalid={!!e.connectionLimit}
                    className="w-28"
                    label={t("Connection limit")}
                  />
                )}
              </div>
              <FieldError problem={e.connectionLimit} />
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-foreground">{t("Timeouts")}</p>
              <div className="flex flex-wrap items-start gap-3">
                <Field label={t("Visitor idle (s)")}>
                  <NumField
                    value={rule.clientTimeoutSec}
                    onChange={(clientTimeoutSec) => set({ clientTimeoutSec })}
                    invalid={!!e.timeouts}
                    className="w-24"
                    label={t("Visitor idle (s)")}
                  />
                </Field>
                <Field label={t("Server idle (s)")}>
                  <NumField
                    value={rule.memberTimeoutSec}
                    onChange={(memberTimeoutSec) => set({ memberTimeoutSec })}
                    invalid={!!e.timeouts}
                    className="w-24"
                    label={t("Server idle (s)")}
                  />
                </Field>
                <Field label={t("Connect to server (s)")}>
                  <NumField
                    value={rule.connectTimeoutSec}
                    onChange={(connectTimeoutSec) => set({ connectTimeoutSec })}
                    invalid={!!e.timeouts}
                    className="w-24"
                    label={t("Connect to server (s)")}
                  />
                </Field>
              </div>
              <FieldError problem={e.timeouts} />
            </div>

            {rule.protocol === "HTTP" && (
              <label className="flex cursor-pointer items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-medium text-foreground">{t("Pass on the visitor's address")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("Adds X-Forwarded-For and X-Forwarded-Port, so your application sees who is asking.")}
                  </span>
                </span>
                <Switch checked={rule.forwardedFor} onCheckedChange={(forwardedFor) => set({ forwardedFor })} />
              </label>
            )}

            <div>
              <p className="text-sm font-medium text-foreground">{t("Allowed addresses")}</p>
              <p className="mb-2 text-xs text-muted-foreground">{t("Only these ranges may connect. Empty: anyone may.")}</p>
              <div className="space-y-2">
                {rule.allowedCidrs.map((c, i) => (
                  <div key={i}>
                    <div className="flex max-w-sm items-center gap-2">
                      <Input
                        dir="ltr"
                        value={c}
                        onChange={(ev) => set({ allowedCidrs: rule.allowedCidrs.map((x, j) => (j === i ? ev.target.value.replace(/\s/g, "") : x)) })}
                        placeholder="203.0.113.0/24"
                        aria-label={t("Allowed addresses")}
                        className={cn("h-9 text-sm rtl:text-right", onlyIf(e.cidrs[i], showErrors || !!c) && "border-destructive")}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => set({ allowedCidrs: rule.allowedCidrs.filter((_, j) => j !== i) })}
                        aria-label={t("Remove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <FieldError problem={onlyIf(e.cidrs[i], showErrors || !!c)} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => set({ allowedCidrs: [...rule.allowedCidrs, ""] })}>
                  <Plus className="size-3.5" />
                  {t("Add range")}
                </Button>
              </div>
            </div>
          </div>
        </Fold>
      </div>
    </Card>
  );
}

// ---- Pieces ----------------------------------------------------------------------

const onlyIf = (p: Problem | undefined, when: boolean) => (when ? p : undefined);

function Fold({
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  needsFix,
  control,
  children,
}: {
  icon: typeof Info;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  needsFix?: boolean;
  control?: ReactNode;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-start">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {summary}
            </span>
          </span>
          {needsFix && <Pill>{t("Needs a fix")}</Pill>}
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {control}
      </div>
      {open && <div className="border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

function Field({ label, problem, children }: { label: string; problem?: Problem; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
      <FieldError problem={problem} className="max-w-[12rem]" />
    </div>
  );
}

function NumField({
  value,
  onChange,
  invalid,
  className,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
  className?: string;
  label: string;
}) {
  return (
    <Input
      inputMode="numeric"
      value={Number.isNaN(value) ? "" : String(value)}
      onChange={(ev) => onChange(ev.target.value === "" ? NaN : Number(ev.target.value.replace(/\D/g, "")))}
      aria-label={label}
      aria-invalid={invalid}
      className={cn("h-9 text-sm", invalid && "border-destructive", className)}
    />
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: (readonly [string, string])[] }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FieldError({ problem, className }: { problem?: Problem; className?: string }) {
  const t = useT();
  if (!problem) return null;
  return <p className={cn("mt-1.5 text-xs text-destructive", className)}>{t(problem.text, problem.vars)}</p>;
}
