import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  ChevronDown,
  Gauge,
  Globe,
  MapPin,
  Network,
  Plus,
  Route,
  Server,
  SlidersHorizontal,
  Tag,
  Trash2,
  Waypoints,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { REGIONS } from "../lib/catalog";
import { isCidr, parseCidr, usableHosts } from "../lib/ipv4";
import {
  advancedProblems,
  createNetwork,
  defaultsFor,
  MAX_DNS,
  MAX_ROUTES,
  MTU_MAX,
  MTU_MIN,
  newNetworkInput,
  problemsOf,
  updateNetwork,
  useNetworks,
  validateNetwork,
  type NetworkInput,
  type Problem,
} from "../lib/networkStore";
import { apiCall } from "../lib/openstackErrors";
import { CreateFooter, CreatePage, NETWORKS_PATH, PageBreadcrumb } from "../ui";
import { FieldBox, Note, Pill, RegionBox, SummaryLine } from "../wizard";

/* Create or edit a private network: one page.
 *
 *   The row     where, its name and its subnet, as equal boxes.
 *   Advanced    gateway, DHCP and its address ranges, DNS servers, static
 *               routes and MTU; closed on a new network, since every field
 *               starts filled in with something that works.
 *
 * Every field is checked as it is typed (lib/networkStore.ts has the rules,
 * Neutron's own), so a mistake shows under its field before Create is
 * pressed; an empty required field is pointed at on Create. What the store,
 * and later the API, still refuses comes back as a toast in the person's
 * language (lib/openstackErrors.ts).
 *
 * Editing keeps the region and the subnet: Neutron cannot change a subnet's
 * range. The gateway, DHCP, DNS, routes and MTU can change.
 */

export default function NetworkForm() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { networkId } = useParams();
  const networks = useNetworks();
  const existing = networkId
    ? networks.find((x) => x.id === networkId)
    : undefined;
  const editing = !!networkId;
  const goToList = () => navigate(NETWORKS_PATH);

  const [regionId, setRegionId] = useState(
    REGIONS.find((r) => r.city === existing?.region)?.id ?? REGIONS[0].id,
  );
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const [form, setForm] = useState<NetworkInput>(
    () => existing ?? newNetworkInput(region.city, networks),
  );
  const [advancedOpen, setAdvancedOpen] = useState(editing);
  /* The gateway and range follow the subnet until either is changed. */
  const [derivedTouched, setDerivedTouched] = useState(editing);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<NetworkInput>) =>
    setForm((f) => ({ ...f, ...patch }));
  const setDerived = (patch: Partial<NetworkInput>) => {
    setDerivedTouched(true);
    set(patch);
  };

  useEffect(() => {
    if (editing || derivedTouched) return;
    const d = defaultsFor(form.cidr);
    if (d) setForm((f) => ({ ...f, ...d }));
  }, [form.cidr, editing, derivedTouched]);

  const input = { ...form, region: editing ? form.region : region.city };
  const errors = useMemo(
    () =>
      validateNetwork(
        input,
        networks.filter((x) => x.id !== networkId),
        existing?.ports ?? [],
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, region.city, networks, networkId],
  );
  const problems = problemsOf(errors);
  const subnet = parseCidr(form.cidr);
  const hosts = isCidr(subnet) ? usableHosts(subnet) : 0;

  /* Shown as it is typed; an empty field only once Create is pressed. */
  const shown = (p: Problem | undefined, value: string) =>
    p && (showErrors || value.trim() !== "") ? p : undefined;

  if (editing && !existing) {
    return (
      <CreatePage>
        <p className="py-16 text-center text-muted-foreground">
          {t("This network no longer exists.")}
        </p>
        <div className="text-center">
          <Button variant="outline" onClick={goToList}>
            {t("Back to private networks")}
          </Button>
        </div>
      </CreatePage>
    );
  }

  const submit = async () => {
    if (problems.length > 0) {
      setShowErrors(true);
      if (advancedProblems(errors)) setAdvancedOpen(true);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    setSaving(true);
    const done = await apiCall(() => {
      if (existing) updateNetwork(existing.id, input);
      else createNetwork(input);
      return true;
    }, t);
    setSaving(false);
    if (!done) return;
    toast.success(
      existing
        ? t("{name} saved", { name: form.name })
        : t("{name} created", { name: form.name }),
    );
    goToList();
  };

  const title = editing ? existing!.name : t("Create private network");
  const primaryLabel = editing ? t("Save changes") : t("Create network");

  const updateList = <K extends "pools" | "dns" | "routes">(
    key: K,
    i: number,
    value: NetworkInput[K][number],
  ) => {
    if (key === "pools") setDerivedTouched(true);
    setForm((f) => ({
      ...f,
      [key]: (f[key] as unknown[]).map((x, j) => (j === i ? value : x)),
    }));
  };
  const removeAt = (key: "pools" | "dns" | "routes", i: number) => {
    if (key === "pools") setDerivedTouched(true);
    setForm((f) => ({
      ...f,
      [key]: (f[key] as unknown[]).filter((_, j) => j !== i),
    }));
  };

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Networking"), path: NETWORKS_PATH },
          { label: shellT("Private Networks"), path: NETWORKS_PATH },
          { label: title },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          <span dir={editing ? "ltr" : undefined}>{title}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "A network of your own between your servers, closed to the internet.",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 space-y-5 p-4 lg:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {editing ? (
              <FieldBox
                icon={MapPin}
                title={t("Region")}
                description={t("A network stays in the region it is made in.")}
              >
                <Input value={t(form.region)} disabled className="h-12" />
              </FieldBox>
            ) : (
              <RegionBox
                regionId={regionId}
                zone={zone}
                onChange={(r, z) => {
                  setRegionId(r);
                  setZone(z);
                }}
                description={t(
                  "A private network spans every zone of its region.",
                )}
              />
            )}

            {/* Side by side at every width, inputs on one line. */}
            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <FieldBox
                title={t("Network name")}
                required
                description={t("English letters, digits, . _ and -")}
              >
                <Input
                  dir="ltr"
                  value={form.name}
                  onChange={(e) =>
                    set({ name: e.target.value.replace(/\s/g, "-") })
                  }
                  aria-label={t("Network name")}
                  aria-invalid={!!shown(errors.name, form.name)}
                  className={cn(
                    "h-12",
                    shown(errors.name, form.name) && "border-destructive",
                  )}
                />
                <FieldError problem={shown(errors.name, form.name)} />
              </FieldBox>

              <FieldBox
                title={t("Subnet")}
                required
                description={
                  editing
                    ? t("Cannot be changed once made.")
                    : t("A private range, from /16 to /29.")
                }
              >
                <div className="relative" dir="ltr">
                  <Input
                    dir="ltr"
                    value={form.cidr}
                    disabled={editing}
                    onChange={(e) => set({ cidr: e.target.value.trim() })}
                    placeholder="10.0.0.0/24"
                    aria-label={t("Subnet")}
                    aria-invalid={!!shown(errors.cidr, form.cidr)}
                    className={cn(
                      "h-12 pe-24 font-mono",
                      shown(errors.cidr, form.cidr) && "border-destructive",
                    )}
                  />
                  {hosts > 0 && !shown(errors.cidr, form.cidr) && (
                    <span
                      dir="auto"
                      title={t("{n} usable addresses", {
                        n: n(hosts.toLocaleString("en-US")),
                      })}
                      className="pointer-events-none absolute inset-y-0 end-3 my-auto h-fit rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {t("{n} addresses", {
                        n: n(hosts.toLocaleString("en-US")),
                      })}
                    </span>
                  )}
                </div>
                <FieldError problem={shown(errors.cidr, form.cidr)} />
              </FieldBox>
            </div>
          </div>

          {/* Advanced: closed on a new network, with what it holds said in a line. */}
          <div className="rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              aria-expanded={advancedOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-start"
            >
              <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {t("Advanced settings")}
                </span>
                <span
                  className="block truncate text-xs text-muted-foreground"
                  dir="auto"
                >
                  {[
                    form.gatewayIp
                      ? `${t("Gateway")} ${form.gatewayIp}`
                      : t("No gateway"),
                    form.dhcp ? "DHCP" : t("DHCP off"),
                    `DNS ${n(form.dns.length)}`,
                    form.routes.length
                      ? t("{n} routes", { n: n(form.routes.length) })
                      : null,
                    `MTU ${n(form.mtu)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {showErrors && advancedProblems(errors) && (
                <Pill>{t("Needs a fix")}</Pill>
              )}
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  advancedOpen && "rotate-180",
                )}
              />
            </button>

            {advancedOpen && (
              <div className="divide-y divide-border border-t border-border">
                {/* Gateway */}
                <Section
                  icon={Globe}
                  title={t("Gateway")}
                  description={t(
                    "Servers reach outside the subnet through this address.",
                  )}
                  control={
                    <Switch
                      checked={form.gatewayIp !== null}
                      onCheckedChange={(on) =>
                        setDerived({
                          gatewayIp: on
                            ? (defaultsFor(form.cidr)?.gatewayIp ?? "")
                            : null,
                        })
                      }
                      aria-label={t("Gateway")}
                    />
                  }
                >
                  {form.gatewayIp !== null ? (
                    <div className="max-w-xs">
                      <IpInput
                        value={form.gatewayIp}
                        onChange={(v) => setDerived({ gatewayIp: v })}
                        label={t("Gateway address")}
                        problem={shown(errors.gateway, form.gatewayIp)}
                        placeholder="10.0.0.1"
                      />
                    </div>
                  ) : (
                    <Note>
                      {t(
                        "With no gateway, servers reach only this subnet and the static routes below.",
                      )}
                    </Note>
                  )}
                  <Note className="mt-3">
                    {t(
                      "If one of your servers does the routing, such as a firewall or VPN server, turn the gateway off and add a static route through it instead.",
                    )}
                  </Note>
                </Section>

                {/* DHCP */}
                <Section
                  icon={Server}
                  title="DHCP"
                  description={t(
                    "Servers get their address from these ranges.",
                  )}
                  control={
                    <Switch
                      checked={form.dhcp}
                      onCheckedChange={(on) => set({ dhcp: on })}
                      aria-label="DHCP"
                    />
                  }
                >
                  {!form.dhcp && (
                    <Note className="mb-3">
                      {t(
                        "Addresses are still given from these ranges, but each server has to set its own inside the operating system.",
                      )}
                    </Note>
                  )}
                  <div className="space-y-2">
                    {form.pools.map((p, i) => {
                      const problem = shown(errors.pools[i], p.start + p.end);
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-2">
                            <span className="w-8 shrink-0 text-xs text-muted-foreground">
                              {t("From")}
                            </span>
                            <IpInput
                              value={p.start}
                              onChange={(v) =>
                                updateList("pools", i, { ...p, start: v })
                              }
                              label={t("First address")}
                              invalid={!!problem}
                              placeholder="10.0.0.10"
                            />
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {t("to")}
                            </span>
                            <IpInput
                              value={p.end}
                              onChange={(v) =>
                                updateList("pools", i, { ...p, end: v })
                              }
                              label={t("Last address")}
                              invalid={!!problem}
                              placeholder="10.0.0.254"
                            />
                            <RemoveButton
                              onClick={() => removeAt("pools", i)}
                              label={t("Remove range")}
                            />
                          </div>
                          <FieldError problem={problem} className="ms-10" />
                        </div>
                      );
                    })}
                    <FieldError
                      problem={showErrors ? errors.poolsAll : undefined}
                    />
                    <AddButton
                      onClick={() =>
                        setDerived({
                          pools: [...form.pools, { start: "", end: "" }],
                        })
                      }
                    >
                      {t("Add range")}
                    </AddButton>
                  </div>
                </Section>

                {/* DNS */}
                <Section
                  icon={Network}
                  title={t("DNS servers")}
                  description={t(
                    "Given to servers with their address. Up to {n}.",
                    { n: n(MAX_DNS) },
                  )}
                >
                  <div className="space-y-2">
                    {form.dns.map((d, i) => (
                      <div key={i}>
                        <div className="flex max-w-sm items-center gap-2">
                          <IpInput
                            value={d}
                            onChange={(v) => updateList("dns", i, v)}
                            label={t("DNS server")}
                            invalid={!!shown(errors.dns[i], d)}
                            placeholder="8.8.8.8"
                          />
                          <RemoveButton
                            onClick={() => removeAt("dns", i)}
                            label={t("Remove")}
                          />
                        </div>
                        <FieldError problem={shown(errors.dns[i], d)} />
                      </div>
                    ))}
                    {form.dns.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("No DNS server: servers use what their image sets.")}
                      </p>
                    )}
                    <FieldError problem={errors.dnsAll} />
                    <AddButton
                      disabled={form.dns.length >= MAX_DNS}
                      onClick={() => set({ dns: [...form.dns, ""] })}
                    >
                      {t("Add DNS server")}
                    </AddButton>
                  </div>
                </Section>

                {/* Static routes */}
                <Section
                  icon={Route}
                  title={t("Static routes")}
                  description={t(
                    "Send traffic for a range through a server on this network. Up to {n}.",
                    { n: n(MAX_ROUTES) },
                  )}
                >
                  <div className="space-y-2">
                    {form.routes.length > 0 && (
                      <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
                        <span className="flex-1">{t("Destination")}</span>
                        <span className="w-4" />
                        <span className="flex-1">{t("Next hop")}</span>
                        <span className="w-8" />
                      </div>
                    )}
                    {form.routes.map((r, i) => {
                      const row = errors.routes[i] ?? {};
                      const dp = shown(row.destination, r.destination);
                      const hp = shown(row.nexthop, r.nexthop);
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-2">
                            <IpInput
                              value={r.destination}
                              onChange={(v) =>
                                updateList("routes", i, {
                                  ...r,
                                  destination: v,
                                })
                              }
                              label={t("Destination")}
                              invalid={!!dp}
                              placeholder="192.168.10.0/24"
                            />
                            <ArrowLeftRight className="size-4 shrink-0 text-muted-foreground" />
                            <IpInput
                              value={r.nexthop}
                              onChange={(v) =>
                                updateList("routes", i, { ...r, nexthop: v })
                              }
                              label={t("Next hop")}
                              invalid={!!hp}
                              placeholder="10.0.0.5"
                            />
                            <RemoveButton
                              onClick={() => removeAt("routes", i)}
                              label={t("Remove route")}
                            />
                          </div>
                          <FieldError problem={dp ?? hp} />
                        </div>
                      );
                    })}
                    {form.routes.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("No static routes.")}
                      </p>
                    )}
                    <FieldError problem={errors.routesAll} />
                    <AddButton
                      disabled={form.routes.length >= MAX_ROUTES}
                      onClick={() =>
                        set({
                          routes: [
                            ...form.routes,
                            { destination: "", nexthop: "" },
                          ],
                        })
                      }
                    >
                      {t("Add route")}
                    </AddButton>
                  </div>
                </Section>

                {/* MTU */}
                <Section
                  icon={Gauge}
                  title="MTU"
                  description={t(
                    "The largest packet on this network, in bytes. Leave it unless you know you need another.",
                  )}
                >
                  <div className="max-w-[10rem]">
                    <Input
                      dir="ltr"
                      inputMode="numeric"
                      value={Number.isNaN(form.mtu) ? "" : String(form.mtu)}
                      onChange={(e) =>
                        set({
                          mtu:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value.replace(/\D/g, "")),
                        })
                      }
                      aria-label="MTU"
                      className={cn(
                        "h-10 font-mono",
                        errors.mtu &&
                          (showErrors || !Number.isNaN(form.mtu)) &&
                          "border-destructive",
                      )}
                    />
                  </div>
                  {errors.mtu && (showErrors || !Number.isNaN(form.mtu)) ? (
                    <FieldError problem={errors.mtu} />
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t("From {min} to {max}.", {
                        min: n(MTU_MIN),
                        max: n(MTU_MAX),
                      })}
                    </p>
                  )}
                </Section>
              </div>
            )}
          </div>
        </Card>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              {t("Summary")}
            </p>
            <SummaryLine
              icon={MapPin}
              label={t("Region")}
              value={t(editing ? form.region : region.city)}
            />
            <SummaryLine
              icon={Tag}
              label={t("Network name")}
              value={<span dir="ltr">{form.name || "-"}</span>}
            />
            <SummaryLine
              icon={Waypoints}
              label={t("Subnet")}
              value={<span dir="ltr">{form.cidr || "-"}</span>}
            />
            <SummaryLine
              icon={Globe}
              label={t("Gateway")}
              value={
                form.gatewayIp ? (
                  <span dir="ltr">{form.gatewayIp}</span>
                ) : (
                  t("None")
                )
              }
            />
            <SummaryLine
              icon={Server}
              label="DHCP"
              value={
                form.pools[0] ? (
                  <span dir="ltr">
                    {form.pools[0].start} - {form.pools[0].end}
                    {form.pools.length > 1 ? ` +${form.pools.length - 1}` : ""}
                  </span>
                ) : (
                  "-"
                )
              }
            />
            <SummaryLine
              icon={Network}
              label="DNS"
              value={
                <span dir="ltr">
                  {form.dns.filter(Boolean).join(", ") || "-"}
                </span>
              }
            />
            {existing && (
              <SummaryLine
                icon={Server}
                label={t("Servers")}
                value={n(existing.ports.length)}
              />
            )}
            <Button
              onClick={() => void submit()}
              disabled={saving}
              className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Waypoints className="size-4" />
              {primaryLabel}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToList }}
        primary={{ label: primaryLabel, onClick: () => void submit() }}
      />
    </CreatePage>
  );
}

// ---- Pieces ----------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  description,
  control,
  children,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  control?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      <div className="ps-7">{children}</div>
    </section>
  );
}

function IpInput({
  value,
  onChange,
  label,
  problem,
  invalid,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  problem?: Problem;
  invalid?: boolean;
  placeholder?: string;
}) {
  const bad = invalid || !!problem;
  return (
    <div className="min-w-0 flex-1">
      <Input
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={bad}
        spellCheck={false}
        className={cn("h-10 font-mono text-sm", bad && "border-destructive")}
      />
      <FieldError problem={problem} />
    </div>
  );
}

function FieldError({
  problem,
  className,
}: {
  problem?: Problem;
  className?: string;
}) {
  const t = useT();
  if (!problem) return null;
  return (
    <p className={cn("mt-1.5 text-xs text-destructive", className)}>
      {t(problem.text, problem.vars)}
    </p>
  );
}

function RemoveButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function AddButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      onClick={onClick}
      disabled={disabled}
    >
      <Plus className="size-3.5" />
      {children}
    </Button>
  );
}
