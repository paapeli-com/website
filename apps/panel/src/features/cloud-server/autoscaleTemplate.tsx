import { useEffect, useState } from "react";
import { Camera, Disc, Eye, EyeOff, KeyRound, Loader2, Lock, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { adminUser, DEFAULT_IMAGE, DEFAULT_PLAN_ID, IMAGES, PLANS } from "./lib/catalog";
import { DEFAULT_FIREWALL_ID, inboundSummary, useFirewalls, type FirewallGroup } from "./lib/firewallStore";
import { OsLogo } from "./lib/osLogos";
import { addImageFromSnapshot, imageInRegion, imageOfSnapshot, imageProgress, snapshotFamily, useImages } from "./lib/imageStore";
import { snapshotStatus, useSnapshots } from "./lib/snapshotStore";
import { useServers } from "./lib/serverStore";
import { keyAvailableIn, useSshKeys } from "./lib/sshKeyStore";
import type { AutoScaleGroup, GroupTemplate } from "./lib/autoscaleStore";
import { CreateSnapshotDialog } from "./snapshotDialog";
import { AddKeyDialog } from "./sshKeyDialog";
import { CopyButton } from "./ui";
import { Note, OptionCard, Pill } from "./wizard";

/* An Auto Scale group's template: what every instance is made from.
 *
 *   Image      a system image, or one of the account's own: an image it
 *              uploaded or saved, or a snapshot of a server it prepared,
 *              saved as an image when the template is saved, so the group
 *              keeps working after that server and its snapshots are gone.
 *   Size       the plan; one whose disk is smaller than the image needs is
 *              not offered (Nova refuses it: FlavorDiskSmallerThanImage).
 *   Sign-in    one SSH key for every instance, or a password set here.
 *              Windows signs in with a password: its key-encrypted password
 *              is fetched per instance, and instances are not opened one by
 *              one.
 *   Firewall
 *   Script     Nova's user_data, run on each new instance's first boot by
 *              cloud-init (cloudbase-init on Windows); at most 64 KB once
 *              base64 encoded.
 *
 * Used by the create wizard and by the group's Change template dialog.
 */

export const TEMPLATE_SIZES = PLANS.filter((p) => p.family === "shared" || p.family === "dedicated");

/** Nova takes up to 65535 bytes of base64: 49149 bytes of script. */
export const MAX_SCRIPT_BYTES = 49_149;

const PASSWORD_OK = (p: string) => p.length >= 8 && p.length <= 64 && !/\s/.test(p) && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(13);
  crypto.getRandomValues(bytes);
  /* An upper, a lower and a digit, whatever the draw was. */
  return `${Array.from(bytes, (b) => chars[b % chars.length]).join("")}Kq7`;
}

export interface TemplateDraft {
  source: "os" | "mine";
  osId: string;
  versions: Record<string, string>;
  /** "img:<id>" or "snap:<id>". */
  mineId: string;
  sizeFamily: "shared" | "dedicated";
  planId: string;
  firewallId: string;
  access: "ssh" | "password";
  sshKeyId: string;
  password: string;
  script: string;
}

const defaultVersions = () => Object.fromEntries(IMAGES.map((i) => [i.id, i.id === DEFAULT_IMAGE.imageId ? DEFAULT_IMAGE.version : i.versions[0]]));

/** A new group's template: a key when the account has one, a generated
    password when it has none. */
export const newDraft = (hasKeys: boolean): TemplateDraft => ({
  source: "os",
  osId: DEFAULT_IMAGE.imageId,
  versions: defaultVersions(),
  mineId: "",
  sizeFamily: "shared",
  planId: DEFAULT_PLAN_ID,
  firewallId: DEFAULT_FIREWALL_ID,
  access: hasKeys ? "ssh" : "password",
  sshKeyId: "",
  password: hasKeys ? "" : generatePassword(),
  script: "",
});

/** A group's template as a draft to change. The password is not kept, so
    it starts empty: left empty, the current one stays. */
export function draftFromGroup(g: AutoScaleGroup, firewalls: FirewallGroup[]): TemplateDraft {
  const custom = g.imageSource === "custom";
  const os = IMAGES.find((i) => i.id === g.imageId);
  const versions = defaultVersions();
  if (os) versions[os.id] = os.versions.find((v) => g.image.endsWith(v)) ?? os.versions[0];
  const plan = TEMPLATE_SIZES.find((p) => p.id === g.planId);
  return {
    source: custom ? "mine" : "os",
    osId: os?.id ?? DEFAULT_IMAGE.imageId,
    versions,
    mineId: custom ? `img:${g.imageId}` : "",
    sizeFamily: plan?.family === "dedicated" ? "dedicated" : "shared",
    planId: plan?.id ?? DEFAULT_PLAN_ID,
    firewallId: g.firewallId ?? firewalls.find((f) => f.name === g.firewall)?.id ?? DEFAULT_FIREWALL_ID,
    access: g.access?.method ?? "ssh",
    sshKeyId: g.access?.method === "ssh" ? g.access.keyId : "",
    password: "",
    script: g.script ?? "",
  };
}

export interface MineChoice {
  id: string;
  kind: "image" | "snapshot";
  refId: string;
  name: string;
  family: "linux" | "windows";
  sizeGb: number;
  ready: boolean;
  /** Uploaded, saved from a snapshot (its name), or a snapshot of a server (its name). */
  origin: { type: "upload" } | { type: "saved"; from: string } | { type: "snapshot"; server: string };
}

/** What a draft comes to: the image, the plan, the key, and what is still
    missing, as sentences. */
export function useTemplateInfo(d: TemplateDraft, region: string, zone: string, opts: { keepPassword?: boolean } = {}) {
  const t = useT();
  const images = useImages();
  const snapshots = useSnapshots();
  const servers = useServers();
  const keys = useSshKeys();
  const firewalls = useFirewalls();

  const mine: MineChoice[] = [
    ...images
      .filter((i) => imageInRegion(i, region) && imageProgress(i).status !== "failed")
      .map<MineChoice>((i) => ({
        id: `img:${i.id}`,
        kind: "image",
        refId: i.id,
        name: i.name,
        family: i.osFamily,
        sizeGb: i.sizeGb,
        ready: imageProgress(i).status === "ready",
        origin: i.source === "snapshot" ? { type: "saved", from: i.location } : { type: "upload" },
      })),
    /* A snapshot already saved as an image is offered as that image. */
    ...snapshots
      .filter((s) => s.region === region && !imageOfSnapshot(s.id, images))
      .map<MineChoice>((s) => ({
        id: `snap:${s.id}`,
        kind: "snapshot",
        refId: s.id,
        name: s.name,
        family: snapshotFamily(s.serverId),
        sizeGb: s.sizeGb,
        ready: snapshotStatus(s) !== "creating",
        origin: { type: "snapshot", server: servers.find((x) => x.id === s.serverId)?.name ?? "-" },
      })),
  ];

  const os = IMAGES.find((i) => i.id === d.osId) ?? IMAGES[0];
  const chosen = d.source === "mine" ? mine.find((c) => c.id === d.mineId) : undefined;
  const family = d.source === "os" ? os.family : (chosen?.family ?? "linux");
  const imageLabel = d.source === "os" ? `${os.name} ${d.versions[os.id]}` : (chosen?.name ?? "");
  const needGb = chosen?.sizeGb ?? 0;
  const plan = TEMPLATE_SIZES.find((p) => p.id === d.planId) ?? TEMPLATE_SIZES[0];
  /* Windows signs in with a password. */
  const access = family === "windows" ? "password" : d.access;
  const keysHere = keys.filter((k) => k.type === "ssh" && keyAvailableIn(k, region, zone));
  const key = keysHere.find((k) => k.id === d.sshKeyId);
  const firewall = firewalls.find((f) => f.id === d.firewallId);
  const scriptBytes = new TextEncoder().encode(d.script).length;

  const problems = {
    image:
      d.source === "mine" && !chosen
        ? t("Choose an image or a snapshot.")
        : chosen && !chosen.ready
          ? t("{name} is still being made. Choose it once it is ready.", { name: chosen.name })
          : undefined,
    plan: plan.diskGb < needGb ? t("The image needs a boot disk of at least {n} GB. Choose a larger plan.", { n: needGb }) : undefined,
    access:
      access === "ssh" && !key
        ? t("Choose an SSH key.")
        : access === "password" && !(opts.keepPassword && !d.password) && !PASSWORD_OK(d.password)
          ? t("Use 8 to 64 characters with an uppercase letter, a lowercase letter and a digit, and no spaces.")
          : undefined,
    script: scriptBytes > MAX_SCRIPT_BYTES ? t("The startup script is too long. Keep it under 48 KB.") : undefined,
  };
  const ok = !problems.image && !problems.plan && !problems.access && !problems.script;
  return { mine, os, chosen, family, imageLabel, needGb, plan, access, keysHere, key, firewall, scriptBytes, problems, ok };
}

export type TemplateInfo = ReturnType<typeof useTemplateInfo>;

/** The group's template fields from a checked draft. A chosen snapshot is
    saved as an image first (Nova makes instances from images), named after
    it; `savedImage` says so. With `keepAccess`, an empty password keeps the
    one the group has. */
export function resolveTemplate(d: TemplateDraft, info: TemplateInfo, region: string): GroupTemplate & { savedImage?: string } {
  let imageId = info.os.id;
  let savedImage: string | undefined;
  if (d.source === "mine" && info.chosen) {
    imageId = info.chosen.refId;
    if (info.chosen.kind === "snapshot") {
      const made = addImageFromSnapshot({
        name: `${info.chosen.name.replace(/-snapshot$/, "")}-image`.slice(0, 63),
        snapshotId: info.chosen.refId,
        snapshotName: info.chosen.name,
        region,
        osFamily: info.chosen.family,
        sizeGb: info.chosen.sizeGb,
      });
      imageId = made.id;
      savedImage = made.name;
    }
  }
  return {
    imageSource: d.source === "mine" ? "custom" : "os",
    imageId,
    image: savedImage ?? info.imageLabel,
    osFamily: info.family,
    planId: info.plan.id,
    vcpu: info.plan.vcpu,
    ramGb: info.plan.ramGb,
    diskGb: info.plan.diskGb,
    firewall: info.firewall?.name ?? "",
    firewallId: info.firewall?.id,
    access: info.access === "ssh" && info.key ? { method: "ssh", keyId: info.key.id, keyName: info.key.name } : { method: "password" },
    script: d.script.trim() ? d.script : undefined,
    savedImage,
  };
}

/** The image as a line: the system image's logo, or a disc for an own one. */
export function TemplateImage({ source, imageId, label }: { source?: "os" | "custom"; imageId: string; label: string }) {
  const os = source === "custom" ? undefined : IMAGES.find((i) => i.id === imageId);
  return (
    <span dir="ltr" className="inline-flex min-w-0 items-center gap-1.5">
      {os ? (
        <OsLogo
          id={os.id}
          name={os.name}
          color={os.color}
          className="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold [&_svg]:size-3.5"
        />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
          <Disc className="size-3.5" />
        </span>
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function TemplateFields({
  draft: d,
  onChange,
  info,
  region,
  zone,
  showErrors,
  keepPassword,
}: {
  draft: TemplateDraft;
  onChange: (patch: Partial<TemplateDraft>) => void;
  info: TemplateInfo;
  region: string;
  zone: string;
  showErrors: boolean;
  /** Changing a group that signs in with a password: empty keeps it. */
  keepPassword?: boolean;
}) {
  const t = useT();
  const { isRTL, formatNumber } = useLanguage();
  const { currency, format } = useBillingCurrency();
  const firewalls = useFirewalls();
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { plan, needGb, family, problems } = info;

  /* A larger image moves the plan up to the first one that fits. */
  useEffect(() => {
    if (plan.diskGb >= needGb) return;
    const fits = TEMPLATE_SIZES.find((p) => p.family === d.sizeFamily && p.diskGb >= needGb) ?? TEMPLATE_SIZES.find((p) => p.diskGb >= needGb);
    if (fits) onChange({ planId: fits.id, sizeFamily: fits.family === "dedicated" ? "dedicated" : "shared" });
  }, [needGb]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The chosen key went, or the region changed: fall back to the first. */
  useEffect(() => {
    if (d.access === "ssh" && !info.key && info.keysHere[0]) onChange({ sshKeyId: info.keysHere[0].id });
  }, [d.access, info.key, info.keysHere]); // eslint-disable-line react-hooks/exhaustive-deps

  const error = (text?: string) => showErrors && text && <p className="mt-1.5 text-xs text-destructive">{text}</p>;
  const familyLabel = (f: "linux" | "windows") => (f === "windows" ? t("Windows") : t("Linux"));
  const originLabel = (c: MineChoice) =>
    c.origin.type === "upload"
      ? t("Uploaded image")
      : c.origin.type === "saved"
        ? t("Saved from {name}", { name: c.origin.from })
        : t("Snapshot of {name}", { name: c.origin.server });

  return (
    <div className="space-y-6">
      {/* Image */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <FieldLabel required className="mb-0">
            {t("Image")}
          </FieldLabel>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {(["os", "mine"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={d.source === s}
                onClick={() => onChange({ source: s })}
                className={cn(
                  "rounded-md px-3 py-1 text-xs transition-colors",
                  d.source === s ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "os" ? t("Operating systems") : t("My images and snapshots")}
              </button>
            ))}
          </div>
        </div>

        {d.source === "os" ? (
          <>
            {/* Small tiles, and one version list for the chosen image. */}
            <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {IMAGES.map((img) => {
                const on = img.id === d.osId;
                return (
                  <button
                    key={img.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange({ osId: img.id })}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                      on ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                    )}
                  >
                    <OsLogo
                      id={img.id}
                      name={img.name}
                      color={img.color}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold [&_svg]:size-4"
                    />
                    <span className="truncate text-sm font-medium text-foreground" title={img.name}>
                      {img.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t("Version")}</span>
              <Select dir="ltr" value={d.versions[info.os.id]} onValueChange={(v) => onChange({ versions: { ...d.versions, [info.os.id]: v } })}>
                <SelectTrigger className="h-9 w-48" aria-label={t("Version")} dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {info.os.versions.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("Set up a server with your software, take a snapshot of it, and choose it here. A snapshot is saved as an image when the group is saved, so the group keeps working after the server is deleted.")}
            </p>
            {info.mine.length > 0 ? (
              <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {info.mine.map((c) => {
                  const on = c.id === d.mineId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!c.ready}
                      onClick={() => onChange({ mineId: c.id })}
                      className={cn(
                        "flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
                        on ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                        showErrors && problems.image && !d.mineId && "border-destructive",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {c.kind === "image" ? <Disc className="size-4" /> : <Camera className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span dir="ltr" className="block truncate text-sm font-medium text-foreground">
                          {c.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {originLabel(c)} · {familyLabel(c.family)} · {formatNumber(c.sizeGb)} {t("GB")}
                        </span>
                      </span>
                      {!c.ready && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label={t("Creating")} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                {t("No image or snapshot in {region} yet.", { region: t(region) })}
              </div>
            )}
            {error(problems.image)}
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setSnapshotOpen(true)}>
              <Camera className="size-3.5" />
              {t("Take a snapshot")}
            </Button>
            <Note className="mt-3">
              <ul className="list-disc space-y-1 ps-4">
                <li>{t("Your app should start by itself when the server boots.")}</li>
                <li>{t("Keep data in a database or on a cloud disk, not on the instance: instances are removed when the group scales in.")}</li>
                {family === "windows" && <li>{t("Run Sysprep on a Windows server before taking its snapshot.")}</li>}
              </ul>
            </Note>
          </>
        )}
      </div>

      {/* Size */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <FieldLabel required className="mb-0">
            {t("Instance size")}
          </FieldLabel>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {(["shared", "dedicated"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={d.sizeFamily === f}
                onClick={() => {
                  const first = TEMPLATE_SIZES.find((p) => p.family === f && p.diskGb >= needGb) ?? TEMPLATE_SIZES.find((p) => p.family === f)!;
                  onChange(plan.family === f ? { sizeFamily: f } : { sizeFamily: f, planId: first.id });
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs transition-colors",
                  d.sizeFamily === f ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "shared" ? t("Shared vCPU") : t("Dedicated vCPU")}
              </button>
            ))}
          </div>
        </div>
        <RadioGroup dir={isRTL ? "rtl" : "ltr"} value={d.planId} onValueChange={(v) => onChange({ planId: v })} className="block">
          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[44px]" aria-label={t("Choose plan")} />
                  <TableHead>{t("Plan")}</TableHead>
                  <TableHead>{t("vCPU")}</TableHead>
                  <TableHead>{t("RAM")}</TableHead>
                  <TableHead>{t("Boot disk")}</TableHead>
                  <TableHead className="text-end">{t("Price per instance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEMPLATE_SIZES.filter((p) => p.family === d.sizeFamily).map((p) => {
                  const tooSmall = p.diskGb < needGb;
                  return (
                    <TableRow
                      key={p.id}
                      onClick={() => !tooSmall && onChange({ planId: p.id })}
                      title={tooSmall ? t("The image needs a boot disk of at least {n} GB. Choose a larger plan.", { n: needGb }) : undefined}
                      className={cn(
                        "border-b",
                        tooSmall
                          ? "cursor-not-allowed opacity-50"
                          : p.id === d.planId
                            ? "cursor-pointer bg-primary/[0.04] hover:bg-primary/[0.06]"
                            : "cursor-pointer hover:bg-muted/30",
                      )}
                    >
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <RadioGroupItem value={p.id} disabled={tooSmall} aria-label={p.id.toUpperCase()} />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" dir="ltr">
                        {p.id.toUpperCase()}
                      </TableCell>
                      <TableCell>{formatNumber(p.vcpu)}</TableCell>
                      <TableCell>
                        {formatNumber(p.ramGb)} {t("GB")}
                      </TableCell>
                      <TableCell>
                        {formatNumber(p.diskGb)} {t("GB")}
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {format(p.monthly[currency])} {t("/ month")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </RadioGroup>
        {error(problems.plan)}
      </div>

      {/* Sign-in */}
      <div>
        <FieldLabel required>{t("Sign-in")}</FieldLabel>
        {family === "windows" ? (
          <p className="mb-3 text-xs text-muted-foreground">{t("Windows instances sign in as Administrator with a password.")}</p>
        ) : (
          <div role="radiogroup" className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <OptionCard selected={d.access === "ssh"} onSelect={() => onChange({ access: "ssh" })}>
              <div className="flex items-center gap-2.5">
                <KeyRound className={cn("size-4", d.access === "ssh" ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-semibold text-foreground">{t("SSH key")}</span>
                <Pill tone="ok">{t("More secure")}</Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("The same key on every instance.")}</p>
            </OptionCard>
            <OptionCard
              selected={d.access === "password"}
              onSelect={() => onChange(d.password || keepPassword ? { access: "password" } : { access: "password", password: generatePassword() })}
            >
              <div className="flex items-center gap-2.5">
                <Lock className={cn("size-4", d.access === "password" ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-semibold text-foreground">{t("Password")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("The same password on every instance.")}</p>
            </OptionCard>
          </div>
        )}

        {info.access === "ssh" ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Select dir="ltr" value={d.sshKeyId} onValueChange={(v) => onChange({ sshKeyId: v })}>
                <SelectTrigger className={cn("w-full sm:w-72", showErrors && problems.access && "border-destructive")} aria-invalid={showErrors && !!problems.access}>
                  <SelectValue placeholder={t("Choose an SSH key.")} />
                </SelectTrigger>
                <SelectContent>
                  {info.keysHere.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setKeyOpen(true)}>
                <Plus className="me-1.5 size-4" />
                {t("Add SSH key")}
              </Button>
            </div>
            {error(problems.access)}
            <p className="mt-1.5 text-xs text-muted-foreground">{t("Sign in as {user}.", { user: adminUser(family) })}</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Input
                  dir="ltr"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={d.password}
                  placeholder={keepPassword ? t("Leave empty to keep the current one") : undefined}
                  onChange={(e) => onChange({ password: e.target.value })}
                  className={cn("pe-10 rtl:text-right", showErrors && problems.access && "border-destructive")}
                  aria-label={t("Password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("Hide password") : t("Show password")}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {d.password && <CopyButton text={d.password} />}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onChange({ password: generatePassword() });
                  setShowPassword(true);
                }}
              >
                <RefreshCw className="size-3.5" />
                {t("Generate")}
              </Button>
            </div>
            {error(problems.access)}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("Sign in as {user}. Keep the password somewhere safe: it is not shown again.", { user: adminUser(family) })}
            </p>
          </div>
        )}
      </div>

      {/* Firewall */}
      <div>
        <FieldLabel required>{t("Firewall")}</FieldLabel>
        <Select dir="ltr" value={d.firewallId} onValueChange={(v) => onChange({ firewallId: v })}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {firewalls.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
                {f.inbound.length > 0 && <span className="text-muted-foreground"> ({inboundSummary(f)})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Script */}
      <div>
        <FieldLabel>
          {t("Startup script")} <span className="font-normal text-muted-foreground">({t("Optional")})</span>
        </FieldLabel>
        <p className="mb-2 text-xs text-muted-foreground">
          {t("Runs on every new instance on its first boot, for example to fetch the latest version of your app.")}
        </p>
        <Textarea
          dir="ltr"
          rows={5}
          spellCheck={false}
          value={d.script}
          onChange={(e) => onChange({ script: e.target.value })}
          placeholder={family === "windows" ? "#ps1_sysnative\nRestart-Service -Name MyApp" : "#!/bin/bash\ncd /opt/app\ngit pull\nsystemctl restart app"}
          className={cn("font-mono text-xs", showErrors && problems.script && "border-destructive")}
        />
        {problems.script ? (
          <p className="mt-1.5 text-xs text-destructive">{problems.script}</p>
        ) : (
          info.scriptBytes > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("{used} KB of 48 KB", { used: formatNumber(Math.ceil(info.scriptBytes / 1024)) })}
            </p>
          )
        )}
      </div>

      <CreateSnapshotDialog
        open={snapshotOpen}
        region={region}
        onClose={() => setSnapshotOpen(false)}
        onTaken={(s) => onChange({ source: "mine", mineId: `snap:${s.id}` })}
      />
      <AddKeyDialog open={keyOpen} onOpenChange={setKeyOpen} region={region} zone={zone} onAdd={(k) => onChange({ access: "ssh", sshKeyId: k.id })} />
    </div>
  );
}
