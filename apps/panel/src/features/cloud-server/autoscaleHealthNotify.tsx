import { useMemo, useState } from "react";
import { useListWorkspaceMembersQuery } from "@paapeli/api";
import { getCurrentUserId } from "@paapeli/brand/session";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { Check, ChevronDown, Info, MessageSquareText, Search, X } from "lucide-react";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/factory/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { DEFAULT_CHECK, type HealthCheck, type HealthSource } from "./lib/autoscaleStore";

/* Two settings an Auto Scale group has in the wizard and on its page alike:
 * how a failed instance is noticed, and who is texted when the group scales.
 * One copy each, so the two places cannot drift apart.
 */

// ---- How a failure is noticed -------------------------------------------------------

/** Instance status, or the load balancer's health check with what it asks,
    the grace period, and one sentence saying what all of it adds up to. */
export function HealthSettings({
  source,
  onSource,
  hasLb,
  check,
  onCheck,
  graceMin,
  onGrace,
}: {
  source: HealthSource;
  onSource: (s: HealthSource) => void;
  hasLb: boolean;
  check: HealthCheck;
  onCheck: (c: HealthCheck) => void;
  graceMin: number;
  onGrace: (m: number) => void;
}) {
  const t = useT();
  const { isRTL, formatNumber } = useLanguage();
  const [advanced, setAdvanced] = useState(false);
  const isHttp = check.protocol !== "TCP";
  const set = (patch: Partial<HealthCheck>) => onCheck({ ...check, ...patch });

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-2 text-sm font-medium text-foreground">{t("How a failure is noticed")}</p>
      <RadioGroup dir={isRTL ? "rtl" : "ltr"} value={source} onValueChange={(v) => onSource(v as HealthSource)} className="space-y-3">
        <div className="flex items-start gap-2.5">
          <RadioGroupItem value="infra" id="hs-infra" className="mt-0.5" />
          <Label htmlFor="hs-infra" className="cursor-pointer font-normal">
            <span className="block text-sm font-medium text-foreground">{t("Instance status")}</span>
            {/* What the platform itself watches; nothing to set. */}
            <span className="block text-xs text-muted-foreground">
              {t("Failed when the server goes into error, shuts down without anyone stopping it, or its host fails.")}
            </span>
          </Label>
        </div>
        <div className={cn("flex items-start gap-2.5", !hasLb && "opacity-50")}>
          <RadioGroupItem value="lb" id="hs-lb" disabled={!hasLb} className="mt-0.5" />
          <Label htmlFor="hs-lb" className={cn("font-normal", hasLb ? "cursor-pointer" : "cursor-not-allowed")}>
            <span className="block text-sm font-medium text-foreground">{t("Load balancer health check")}</span>
            <span className="block text-xs text-muted-foreground">
              {hasLb ? t("The load balancer asks the application, and replaces it when it stops answering.") : t("Needs a load balancer.")}
            </span>
          </Label>
        </div>
      </RadioGroup>

      {source === "lb" && hasLb && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {/* What it asks: always in view. */}
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t("Protocol")}>
              <Select dir="ltr" value={check.protocol} onValueChange={(v) => set({ protocol: v as HealthCheck["protocol"] })}>
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["HTTP", "HTTPS", "TCP"] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("Port")}>
              <NumberInput value={check.port} min={1} max={65535} onChange={(port) => set({ port })} className="w-24" />
            </Field>
            {isHttp && (
              <Field label={t("Path")}>
                <Input
                  dir="ltr"
                  value={check.path}
                  onChange={(e) => set({ path: e.target.value.startsWith("/") ? e.target.value : `/${e.target.value}` })}
                  className="h-9 w-44 font-mono text-xs"
                />
              </Field>
            )}
          </div>

          {/* The timings, folded away: the defaults suit most. */}
          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={advanced}
          >
            <ChevronDown className={cn("size-3.5 transition-transform", advanced && "rotate-180")} />
            {t("Advanced settings")}
          </button>
          {advanced && (
            <div className="flex flex-wrap items-end gap-3">
              {isHttp && (
                <Field label={t("Healthy answer")}>
                  <Input dir="ltr" value={check.codes} onChange={(e) => set({ codes: e.target.value })} className="h-9 w-24" />
                </Field>
              )}
              <Field label={t("Check every (s)")}>
                <NumberInput value={check.intervalSec} min={2} max={300} onChange={(intervalSec) => set({ intervalSec })} className="w-20" />
              </Field>
              <Field label={t("Timeout (s)")}>
                <NumberInput value={check.timeoutSec} min={1} max={60} onChange={(timeoutSec) => set({ timeoutSec })} className="w-20" />
              </Field>
              <Field label={t("Failed after")}>
                <NumberInput value={check.unhealthyAfter} min={1} max={10} onChange={(unhealthyAfter) => set({ unhealthyAfter })} className="w-20" />
              </Field>
              <Field label={t("Healthy after")}>
                <NumberInput value={check.healthyAfter} min={1} max={10} onChange={(healthyAfter) => set({ healthyAfter })} className="w-20" />
              </Field>
            </div>
          )}

          {/* All of it in one sentence. */}
          <p className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" />
            <span>
              {isHttp
                ? t("Every {interval} s, {protocol} {path} on port {port} is asked; {n} answers in a row other than {codes} and the instance is replaced.", {
                    interval: formatNumber(check.intervalSec),
                    protocol: check.protocol,
                    path: check.path,
                    port: check.port,
                    n: formatNumber(check.unhealthyAfter),
                    codes: check.codes,
                  })
                : t("Every {interval} s, port {port} is tried; {n} failed connections in a row and the instance is replaced.", {
                    interval: formatNumber(check.intervalSec),
                    port: check.port,
                    n: formatNumber(check.unhealthyAfter),
                  })}
            </span>
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-foreground">{t("Grace period")}</span>
        <Select value={String(graceMin)} onValueChange={(v) => onGrace(Number(v))}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 5, 10].map((g) => (
              <SelectItem key={g} value={String(g)}>
                {t("{n} min", { n: formatNumber(g) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{t("A new instance is not judged before this.")}</span>
      </div>
    </div>
  );
}

export const withDefaultCheck = (check?: HealthCheck) => check ?? DEFAULT_CHECK;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <Input
      type="number"
      dir="ltr"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
      className={cn("h-9", className)}
    />
  );
}

// ---- Text members when the group scales ------------------------------------------------

/** A tick, and when it is on, the workspace members to text: one or more,
    from a searchable list. The gateway sends through its SMS channel, to
    verified phones only, as it does for Smart Factory alarms. */
export function SmsNotify({
  value,
  onChange,
}: {
  value: { sms: boolean; userIds: string[] };
  onChange: (v: { sms: boolean; userIds: string[] }) => void;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        value.sms ? "border-primary/50 bg-primary/[0.04]" : "border-border",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox checked={value.sms} onCheckedChange={(c) => onChange({ ...value, sms: c === true })} className="mt-0.5" />
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquareText className={cn("size-4", value.sms ? "text-primary" : "text-muted-foreground")} />
            {t("Text members when the group scales")}
          </span>
          <span className="block text-xs text-muted-foreground">
            {t("An SMS each time instances are added or removed.")}
          </span>
        </span>
      </label>
      {value.sms && (
        <div className="mt-3 ps-7">
          <MemberPicker userIds={value.userIds} onChange={(userIds) => onChange({ ...value, userIds })} />
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Sent through the workspace's SMS channel, to members who have verified their phone; the others are skipped.")}
          </p>
        </div>
      )}
    </div>
  );
}

/** The workspace's active members, picked one or more at a time. */
function MemberPicker({ userIds, onChange }: { userIds: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();
  const { isRTL } = useLanguage();
  const workspaceId = useActiveWorkspaceId() ?? "";
  const me = getCurrentUserId();
  const { data, isPending } = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);
  const [query, setQuery] = useState("");

  const members = useMemo(() => {
    const rows = (data?.data ?? []).filter((m) => m.status === "ACTIVE");
    return rows.map((m) => ({
      id: m.userId,
      name: m.displayName || m.email || m.userId.slice(0, 8),
      email: m.email ?? "",
      isMe: m.userId === me,
    }));
  }, [data, me]);
  const shown = members.filter((m) => !query || `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()));
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? (id === me ? t("You") : id.slice(0, 8));
  const toggle = (id: string) => onChange(userIds.includes(id) ? userIds.filter((x) => x !== id) : [...userIds, id]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 w-full max-w-md flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-start text-sm"
        >
          {userIds.length === 0 ? (
            <span className="px-1 text-muted-foreground">{t("Choose members")}</span>
          ) : (
            userIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
                {nameOf(id)}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={t("Remove")}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(id);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </span>
              </span>
            ))
          )}
          <ChevronDown className="ms-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align={isRTL ? "end" : "start"} className="w-[320px] p-2" data-uniform-type>
        <div className="relative mb-2">
          <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search members")} className="h-8 ps-8 text-xs" />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {isPending ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">{t("Loading")}</p>
          ) : shown.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">{t("No members found")}</p>
          ) : (
            shown.map((m) => {
              const on = userIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted",
                    on && "bg-primary/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">
                      {m.name}
                      {m.isMe && <span className="ms-1 text-xs text-muted-foreground">({t("You")})</span>}
                    </span>
                    {m.email && m.email !== m.name && (
                      <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                        {m.email}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
