import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Slider } from "@/features/factory/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import {
  DISK_SIZE_PRESETS,
  DISK_TYPES,
  diskPerformance,
  HOURS_PER_MONTH,
  PRICE_LIST,
  REGIONS,
  roundMoney,
  sizeParts,
  type DiskTypeId,
} from "../lib/catalog";
import { hostStatus, useHosts } from "../lib/hostStore";
import { useServers } from "../lib/serverStore";
import { addVolumes, nextDevicePath, useVolumes } from "../lib/volumeStore";
import { DiskArt, SegmentBar, SizeGauge } from "../diskArt";
import { CreateFooter, CreatePage, DEDICATED_PATH, PageBreadcrumb, VOLUMES_PATH } from "../ui";
import { ServerOption } from "../wizard";

/* Create cloud disk, in two columns.
 *
 *   The choices  the disk's name and the server it goes on (or none yet),
 *                then the type as three cards: price per GB, latency and
 *                IOPS ceiling on each.
 *   The picture  the chosen drive in a ring that fills with the size; what
 *                that size delivers (IOPS, read, write) and costs an hour;
 *                the monthly price; then the size itself: a slider, the
 *                usual sizes as pills, and any size typed in GB or TB.
 *
 * No region picker: an attached disk is made in its server's zone, and one
 * made unattached in the default zone. A local disk is a whole drive in one
 * of three sizes, on one of the account's dedicated servers, so it has the
 * three sizes as pills and no slider. Sizes stay inside each type's range,
 * and prices and performance come from the catalog.
 */

const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;

/* The slider runs on a log scale, so 20, 100 and 500 GB are not crowded
   into the first sliver of the track. */
const STEPS = 1000;
const toPos = (gb: number, min: number, max: number) => Math.round((STEPS * Math.log(gb / min)) / Math.log(max / min));
const fromPos = (pos: number, min: number, max: number) => {
  const raw = min * Math.pow(max / min, pos / STEPS);
  const snap = raw < 100 ? 5 : raw < 500 ? 10 : 50;
  return Math.min(max, Math.max(min, Math.round(raw / snap) * snap));
};

const BADGE_TONE = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  gray: "bg-muted text-muted-foreground",
  brand: "bg-primary/10 text-primary",
} as const;

export default function CreateVolume() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const goToList = () => navigate(VOLUMES_PATH);
  const volumes = useVolumes();
  const allServers = useServers();
  const hosts = useHosts().filter((h) => hostStatus(h) === "active");

  const [name, setName] = useState("disk-01");
  /* Opened from a server's Disks tab: that server, already chosen. */
  const [serverId, setServerId] = useState(() => new URLSearchParams(window.location.search).get("server") ?? "none");
  const [typeId, setTypeId] = useState<DiskTypeId>("ssd");
  const type = DISK_TYPES.find((d) => d.id === typeId)!;
  const [hostId, setHostId] = useState(hosts[0]?.id ?? "");
  const host = hosts.find((h) => h.id === hostId);
  const [sizeGb, setSizeGb] = useState(100);
  const [unit, setUnit] = useState<"GB" | "TB">("GB");
  const [draft, setDraft] = useState("100");
  const [showErrors, setShowErrors] = useState(false);

  /* Servers it can go on: any; a local disk, only those on its machine. */
  const servers = allServers.filter((s) => typeId !== "local" || (!!host && s.hostId === host.id));
  const server = servers.find((s) => s.id === serverId);
  /* Where it is made: its server's zone, its machine's, or the default. */
  const region = REGIONS.find((r) => r.city === (server?.region ?? (typeId === "local" ? host?.region : undefined))) ?? REGIONS[0];
  const zone = server?.zone ?? (typeId === "local" ? host?.zone : undefined) ?? region.zones[0];

  useEffect(() => {
    if (serverId !== "none" && !server) setServerId("none");
  }, [serverId, server]);
  useEffect(() => {
    if (hostId && !host) setHostId(hosts[0]?.id ?? "");
  }, [hostId, host, hosts]);
  /* A size the new type does not offer moves to the nearest it does. */
  useEffect(() => {
    const next = type.fixedSizes
      ? type.fixedSizes.includes(sizeGb)
        ? sizeGb
        : type.fixedSizes[0]
      : Math.min(type.maxGb, Math.max(type.minGb, sizeGb));
    if (next !== sizeGb) setSizeGb(next);
  }, [type, sizeGb]);
  /* The typed box follows the size, in the unit chosen. */
  useEffect(() => {
    setDraft(unit === "GB" ? String(sizeGb) : String(Math.round((sizeGb / 1000) * 100) / 100));
  }, [sizeGb, unit]);

  const perGb = PRICE_LIST[type.price][currency];
  const monthly = roundMoney(sizeGb * perGb, currency);
  const hourly = currency === "TOMAN" ? Math.round(monthly / HOURS_PER_MONTH) : Math.round((monthly / HOURS_PER_MONTH) * 1000) / 1000;
  const perf = diskPerformance(type, sizeGb);
  const share = type.fixedSizes ? sizeGb / type.maxGb : (sizeGb - type.minGb) / (type.maxGb - type.minGb) || 0.02;
  const presets = type.fixedSizes ?? DISK_SIZE_PRESETS.filter((gb) => gb >= type.minGb && gb <= type.maxGb);
  const nameTaken = volumes.some((v) => v.name === name);
  const nameOk = NAME_RE.test(name) && !nameTaken;
  const localOk = typeId !== "local" || !!host;
  const path = server ? nextDevicePath(server, volumes) : null;

  const sizeText = (gb: number) => {
    const { value, unit: u } = sizeParts(gb);
    const digits = language === "en" ? n(value) : n(value).replace(".", "٫");
    return { digits, unit: t(u) };
  };
  const label = (gb: number) => {
    const s = sizeText(gb);
    return `${s.digits} ${s.unit}`;
  };
  const commitDraft = () => {
    const v = Number(draft);
    if (!v) return setDraft(String(sizeGb));
    const gb = unit === "TB" ? v * 1000 : v;
    setSizeGb(Math.min(type.maxGb, Math.max(type.minGb, Math.round(gb))));
  };

  const create = () => {
    if (!nameOk || !localOk) {
      setShowErrors(true);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    addVolumes([
      {
        name,
        type: typeId,
        sizeGb,
        region: region.city,
        zone,
        hostId: typeId === "local" ? host?.id : undefined,
        attachedTo: server && path ? { serverId: server.id, path } : undefined,
      },
    ]);
    toast.success(server ? t("{name} is being created and attached to {server}.", { name, server: server.name }) : t("{name} is being created.", { name }));
    goToList();
  };

  const big = sizeText(sizeGb);

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Storage"), path: VOLUMES_PATH },
          { label: shellT("Cloud Disks"), path: VOLUMES_PATH },
          { label: t("Create disk") },
        ]}
      />
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t("Create disk")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Choose the type and size of the storage for your server.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ---- The choices ---- */}
        <section className="space-y-5 lg:col-span-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required htmlFor="disk-name">
                {t("Disk name")}
              </FieldLabel>
              <Input
                id="disk-name"
                dir="ltr"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                aria-invalid={showErrors && !nameOk}
                className={cn("h-11", showErrors && !nameOk && "border-destructive")}
              />
              {showErrors && !nameOk && (
                <p className="mt-1.5 text-xs text-destructive">
                  {nameTaken ? t("A disk with this name already exists.") : t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")}
                </p>
              )}
            </div>
            <div>
              <FieldLabel optional>{t("Attach to a server")}</FieldLabel>
              <Select value={serverId} onValueChange={setServerId}>
                <SelectTrigger className="h-11" aria-label={t("Attach to a server")}>
                  {server ? <ServerOption server={server} /> : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("Don't attach now")}</SelectItem>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <ServerOption server={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t("Disk type")}</h2>
            <div role="radiogroup" className="space-y-3">
              {DISK_TYPES.map((d) => {
                const selected = d.id === typeId;
                const noHost = d.id === "local" && hosts.length === 0;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={noHost}
                    onClick={() => !noHost && setTypeId(d.id)}
                    className={cn(
                      "w-full rounded-xl border bg-card p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                      noHost
                        ? "cursor-not-allowed border-border opacity-60"
                        : selected
                          ? "border-primary/60 bg-primary/[0.03] ring-2 ring-primary/10"
                          : "border-border hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                            selected ? "border-primary" : "border-muted-foreground/30",
                          )}
                        >
                          {selected && <span className="size-2.5 rounded-full bg-primary" />}
                        </span>
                        <span>
                          <span className="block text-base font-semibold text-foreground">{t(d.name)}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{t(d.description)}</span>
                        </span>
                      </div>
                      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium", BADGE_TONE[d.badgeTone])}>{t(d.badge)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                      <Stat label={t("Per GB a month")} value={format(PRICE_LIST[d.price][currency])} />
                      <Stat label={t("Latency")} value={t(d.latency)} />
                      <Stat label={t("Max IOPS")} value={n(d.maxIops.toLocaleString("en-US"))} />
                    </div>
                    {noHost && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{t("Needs a dedicated server")}</p>}
                  </button>
                );
              })}
            </div>

            {typeId === "local" && hosts.length > 0 && (
              <div className="mt-3">
                <FieldLabel required>{t("Dedicated server")}</FieldLabel>
                <Select dir="ltr" value={hostId} onValueChange={setHostId}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hosts.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-3.5 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">{t("Note")}: </span>
              {t("A Local NVMe disk is a drive in your own dedicated server. It cannot move with the server to another machine, so take snapshots of important data regularly.")}
              {hosts.length === 0 && (
                <>
                  {" "}
                  <button type="button" onClick={() => navigate(DEDICATED_PATH)} className="font-medium text-primary hover:underline">
                    {shellT("Dedicated Servers")}
                  </button>
                </>
              )}
            </div>
            <ul className="mt-3 space-y-1.5 px-1 text-xs leading-5 text-muted-foreground">
              <li>• {t("A new disk is empty: format and mount it inside the server before using it.")}</li>
              <li>• {t("A disk can be made larger later, but not smaller.")}</li>
              <li>• {t("A disk stays, and is billed, until you delete it, even with no server attached.")}</li>
            </ul>
          </div>
        </section>

        {/* ---- The picture and the size ---- */}
        <Card className="p-4 lg:col-span-7 lg:p-6">
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/40 via-card to-muted/20 p-5">
            {/* a faint grid behind the drive */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:22px_22px]"
            />
            <div className="relative flex items-center justify-end text-xs text-muted-foreground">
              <span className="font-mono text-[11px]" dir="ltr">
                {path ?? "-"} · {t(type.name)}
              </span>
            </div>

            <SizeGauge share={share}>
              <DiskArt type={typeId} />
            </SizeGauge>

            <div className="relative -mt-4 text-center">
              <p className="text-4xl font-extrabold tracking-tight text-foreground">
                {big.digits}
                <span className="ms-1.5 text-base font-semibold text-muted-foreground">{big.unit}</span>
              </p>
              <div className="mt-3">
                <SegmentBar share={share} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t("{pct}% of the largest {type} disk", { pct: n(Math.round(share * 100)), type: t(type.name) })}
              </p>
            </div>
          </div>

          {/* What this size delivers, and what it costs an hour. */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label={t("Estimated IOPS")} value={n(perf.iops.toLocaleString("en-US"))} />
            <Metric label={t("Read")} value={`${n(perf.readMbps.toLocaleString("en-US"))} MB/s`} ltr />
            <Metric label={t("Write")} value={`${n(perf.writeMbps.toLocaleString("en-US"))} MB/s`} ltr />
            <Metric label={t("Hourly price")} value={format(hourly)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3.5">
            <span className="text-sm text-muted-foreground">{t("Monthly disk price")}</span>
            <span className="text-2xl font-bold tabular-nums text-primary">{format(monthly)}</span>
          </div>

          {/* The size: a slider, the usual sizes, or any size typed in. A
              local disk has its three sizes only. */}
          <div className="mt-5 space-y-4">
            {!type.fixedSizes && (
              <div>
                <Slider
                  dir={isRTL ? "rtl" : "ltr"}
                  min={0}
                  max={STEPS}
                  step={1}
                  value={[toPos(sizeGb, type.minGb, type.maxGb)]}
                  onValueChange={([v]) => setSizeGb(fromPos(v, type.minGb, type.maxGb))}
                  aria-label={t("Size")}
                  aria-valuetext={`${sizeGb} GB`}
                />
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{label(type.minGb)}</span>
                  <span>{label(type.maxGb)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {presets.map((gb) => (
                <button
                  key={gb}
                  type="button"
                  aria-pressed={gb === sizeGb}
                  onClick={() => setSizeGb(gb)}
                  className={cn(
                    "rounded-full border px-3.5 py-1 text-xs font-medium transition-colors",
                    gb === sizeGb ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50",
                  )}
                >
                  {label(gb)}
                </button>
              ))}
            </div>

            {type.fixedSizes ? (
              <p className="text-xs text-muted-foreground">{t("A local disk is a whole drive on your dedicated server, in these sizes only.")}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">{t("Or another size")}</span>
                <div className="flex items-center gap-2" dir="ltr">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={(e) => e.key === "Enter" && commitDraft()}
                    className="h-9 w-24 text-center"
                    aria-label={t("Size")}
                  />
                  <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
                    {(["GB", "TB"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        aria-pressed={unit === u}
                        className={cn(
                          "rounded px-2.5 py-1 font-medium transition-colors",
                          unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t("From {min} to {max}", { min: label(type.minGb), max: label(type.maxGb) })}</span>
              </div>
            )}
          </div>

        </Card>
      </div>

      <CreateFooter cancel={{ label: t("Cancel"), onClick: goToList }} primary={{ label: t("Create disk"), onClick: create }} />
    </CreatePage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <span className="block truncate text-xs font-semibold text-foreground">{value}</span>
    </span>
  );
}

function Metric({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-foreground">
        <span dir={ltr ? "ltr" : undefined}>{value}</span>
      </p>
    </div>
  );
}
