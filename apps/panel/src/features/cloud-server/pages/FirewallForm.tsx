import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, Server, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { useServers } from "../lib/serverStore";
import { createFirewall, groupsOf, updateFirewall, useFirewalls, type FirewallRule } from "../lib/firewallStore";
import { ruleProblem, RulesEditor } from "../firewallUi";
import { ConfirmDialog, CreateFooter, CreatePage, FIREWALLS_PATH, PageBreadcrumb } from "../ui";
import { FieldBox, Note, Pill, ServerOption, StepSection, SummaryLine } from "../wizard";

/* Create or edit a firewall: one page, top to bottom.
 *
 *   The row     its name and a line on what it is for, as equal boxes.
 *   Inbound     the rules for traffic reaching the servers; anything else is
 *               dropped. The usual services are one click each.
 *   Outbound    the rules for traffic leaving them; with none, all is allowed.
 *   Servers     which servers it applies to, ticked.
 *
 * Saving an edit that removes rules from a firewall in use asks first: the
 * servers lose that access at once. The default firewall keeps its name.
 */

const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;

export default function FirewallForm() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { groupId } = useParams();
  const groups = useFirewalls();
  const servers = useServers();
  const existing = groupId ? groups.find((g) => g.id === groupId) : undefined;
  const editing = !!groupId;
  const goToList = () => navigate(FIREWALLS_PATH);

  const [name, setName] = useState(existing?.name ?? "firewall-01");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [inbound, setInbound] = useState<FirewallRule[]>(existing?.inbound ?? []);
  const [outbound, setOutbound] = useState<FirewallRule[]>(existing?.outbound ?? []);
  const [serverIds, setServerIds] = useState<string[]>(existing?.serverIds ?? []);
  const [showErrors, setShowErrors] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const nameTaken = groups.some((g) => g.name === name && g.id !== groupId);
  const nameOk = NAME_RE.test(name) && !nameTaken;
  const rulesOk = [...inbound, ...outbound].every((r) => !ruleProblem(r));
  /* Rules this edit takes away from a firewall that servers use now. */
  const removedRules = useMemo(() => {
    if (!existing || existing.serverIds.length === 0) return 0;
    const kept = new Set([...inbound, ...outbound].map((r) => r.id));
    return [...existing.inbound, ...existing.outbound].filter((r) => !kept.has(r.id)).length;
  }, [existing, inbound, outbound]);
  /* Servers this edit takes it off that have no other firewall. */
  const closing = existing ? existing.serverIds.filter((id) => !serverIds.includes(id) && groupsOf(groups, id).length === 1) : [];

  if (editing && !existing) {
    return (
      <CreatePage>
        <p className="py-16 text-center text-muted-foreground">{t("This firewall no longer exists.")}</p>
        <div className="text-center">
          <Button variant="outline" onClick={goToList}>
            {t("Back to firewalls")}
          </Button>
        </div>
      </CreatePage>
    );
  }

  const save = () => {
    const input = { name, description: description.trim() || undefined, inbound, outbound, serverIds };
    if (existing) {
      updateFirewall(existing.id, input);
      toast.success(t("{name} saved", { name }));
    } else {
      createFirewall(input);
      toast.success(t("{name} created", { name }));
    }
    goToList();
  };

  const submit = () => {
    if (!nameOk || !rulesOk) {
      setShowErrors(true);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    if (removedRules > 0 || closing.length > 0) setConfirming(true);
    else save();
  };

  const title = editing ? existing!.name : t("Create firewall");
  const primaryLabel = editing ? t("Save changes") : t("Create firewall");

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Security"), path: FIREWALLS_PATH },
          { label: shellT("Firewall"), path: FIREWALLS_PATH },
          { label: title },
        ]}
      />
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span dir={editing ? "ltr" : undefined}>{title}</span>
          {existing?.isDefault && <Pill>{t("Default")}</Pill>}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Decide which traffic can reach your servers and where they can connect to.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 space-y-6 p-4 lg:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FieldBox
              title={t("Firewall name")}
              required
              description={existing?.isDefault ? t("The default firewall keeps its name.") : t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}
            >
              <Input
                dir="ltr"
                value={name}
                disabled={existing?.isDefault}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                aria-label={t("Firewall name")}
                aria-invalid={showErrors && !nameOk}
                className={cn("h-11", showErrors && !nameOk && "border-destructive")}
              />
              {showErrors && !nameOk && (
                <p className="mt-1.5 text-xs text-destructive">
                  {nameTaken ? t("A firewall with this name already exists.") : t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")}
                </p>
              )}
            </FieldBox>
            <FieldBox title={t("Description")} description={t("Optional. What this firewall is for.")}>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} aria-label={t("Description")} className="h-11" />
            </FieldBox>
          </div>

          <div className="border-t border-border pt-5">
            <StepSection
              icon={ArrowDownToLine}
              title={t("Inbound rules")}
              description={t("Which traffic can reach the servers. Anything no rule allows is blocked.")}
            >
              <RulesEditor rules={inbound} onChange={setInbound} direction="inbound" showErrors={showErrors} />
            </StepSection>
          </div>

          <div className="border-t border-border pt-5">
            <StepSection
              icon={ArrowUpFromLine}
              title={t("Outbound rules")}
              description={t("Where the servers can connect to. With no rule, everything is allowed; add one to allow only what it names.")}
            >
              <RulesEditor rules={outbound} onChange={setOutbound} direction="outbound" showErrors={showErrors} />
              {/* Said where it matters: sending mail goes out on port 25. */}
              <Note className="mt-3">
                {t("Port 25 (SMTP) stays closed on our network to keep it off spam lists. To send mail on it, ask support to open it.")}
              </Note>
            </StepSection>
          </div>

          <div className="border-t border-border pt-5">
            <StepSection icon={Server} title={t("Apply to servers")} description={t("The rules take effect on these servers as soon as you save.")}>
              {servers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("No servers yet. You can apply it from the firewall list later.")}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {servers.map((s) => {
                    const on = serverIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          on ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
                        )}
                      >
                        <Checkbox checked={on} onCheckedChange={(c) => setServerIds((prev) => (c ? [...prev, s.id] : prev.filter((x) => x !== s.id)))} />
                        <ServerOption server={s} />
                      </label>
                    );
                  })}
                </div>
              )}
              {closing.length > 0 && (
                <Note className="mt-3">{t("{n} servers would be left with no firewall, and closed to all inbound traffic.", { n: n(closing.length) })}</Note>
              )}
            </StepSection>
          </div>
        </Card>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
            <SummaryLine icon={Tag} label={t("Firewall name")} value={<span dir="ltr">{name || "-"}</span>} />
            <SummaryLine icon={ArrowDownToLine} label={t("Inbound rules")} value={inbound.length ? n(inbound.length) : t("None, all blocked")} />
            <SummaryLine icon={ArrowUpFromLine} label={t("Outbound rules")} value={outbound.length ? n(outbound.length) : t("None, all allowed")} />
            <SummaryLine icon={Server} label={t("Servers")} value={n(serverIds.length)} />
            <Button onClick={submit} className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShieldCheck className="size-4" />
              {primaryLabel}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter cancel={{ label: t("Cancel"), onClick: goToList }} primary={{ label: primaryLabel, onClick: submit }} />

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("Save changes to {name}?", { name })}
        description={[
          removedRules > 0
            ? t("{n} rules are removed. The {k} servers using this firewall lose that access right away.", {
                n: n(removedRules),
                k: n(existing?.serverIds.length ?? 0),
              })
            : "",
          closing.length > 0 ? t("{n} servers would be left with no firewall, and closed to all inbound traffic.", { n: n(closing.length) }) : "",
        ]
          .filter(Boolean)
          .join(" ")}
        destructive
        confirmLabel={t("Save changes")}
        onConfirm={() => {
          setConfirming(false);
          save();
        }}
      />
    </CreatePage>
  );
}
