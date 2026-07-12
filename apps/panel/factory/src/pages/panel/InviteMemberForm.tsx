import { useMemo, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Send, X, Mail, ShieldCheck, MessageSquare } from "lucide-react";

type AiotRole = "Full Access" | "Manager" | "Editor" | "Operator" | "Viewer";
const AIOT_ROLES: AiotRole[] = ["Full Access", "Manager", "Editor", "Operator", "Viewer"];

const LS_INVITES = "paapeli.members.invites";
const loadLS = <T,>(k: string, fb: T): T => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
};
const saveLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const StepBadge = ({ n }: { n: number }) => (
  <span className="h-6 w-6 rounded-full border-2 border-primary text-primary text-xs font-semibold flex items-center justify-center shrink-0">
    {n}
  </span>
);

const SectionCard = ({
  step, title, icon: Icon, optional, children, optionalLabel,
}: {
  step: number; title: string; icon: any; optional?: boolean; children: React.ReactNode; optionalLabel?: string;
}) => (
  <Card className="p-5">
    <div className="flex items-center gap-2.5 mb-5">
      <StepBadge n={step} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {optional && <span className="text-sm text-muted-foreground">({optionalLabel || "Optional"})</span>}
    </div>
    {children}
  </Card>
);

const InviteMemberForm = () => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<AiotRole>("Viewer");
  const [message, setMessage] = useState("");

  const commitEmails = (raw: string) => {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...emails];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    setEmails(next);
    setEmailInput("");
  };

  const onEmailKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitEmails(emailInput);
    } else if (e.key === "Backspace" && !emailInput && emails.length) {
      setEmails(emails.slice(0, -1));
    }
  };

  const onEmailBlur = () => {
    if (emailInput.trim()) commitEmails(emailInput);
  };

  const invalidEmails = useMemo(() => emails.filter((e) => !isValidEmail(e)), [emails]);
  const canSubmit = emails.length > 0 && invalidEmails.length === 0;

  const roleLabel = (r: AiotRole) =>
    ({
      "Full Access": t("roleFull"),
      "Manager": t("roleManager"),
      "Editor": t("roleEditor"),
      "Operator": t("roleOperator"),
      "Viewer": t("roleViewer"),
    }[r]);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast({
        title: t("cannotSend"),
        description: invalidEmails.length
          ? t("invalidEmailDesc").replace("{emails}", invalidEmails.join(", "))
          : t("addEmailRequired"),
        variant: "destructive",
      });
      return;
    }
    const existing = loadLS<any[]>(LS_INVITES, []);
    const now = new Date().toISOString();
    const newOnes = emails.map((email, idx) => ({
      id: `i-${Date.now()}-${idx}`,
      email,
      role,
      invitedBy: t("invitedByYou"),
      sentAt: now,
      status: "Pending",
      message: message || undefined,
    }));
    saveLS(LS_INVITES, [...newOnes, ...existing]);
    toast({
      title: emails.length === 1
        ? t("invitationSent")
        : t("invitationsSentToast").replace("{n}", String(emails.length)),
      description: t("roleColon").replace("{role}", roleLabel(role)),
    });
    navigate(lp("/members?tab=invitations"));
  };

  return (
    <PanelLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/members"))} className="cursor-pointer">
              {t("members")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("inviteMemberTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">{t("inviteMemberTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("inviteMemberSubtitle")}
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-3xl">
        <SectionCard step={1} title={t("emailAddresses")} icon={Mail}>
          <div className="space-y-2">
            <Label htmlFor="email-input" className="text-sm">
              {t("emailAddressLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="rounded-md border bg-background px-2 py-1.5 min-h-10 flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-ring">
              {emails.map((e) => {
                const bad = !isValidEmail(e);
                return (
                  <Badge
                    key={e}
                    variant="outline"
                    className={`gap-1 ${bad ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/10 text-primary border-primary/30"}`}
                  >
                    {e}
                    <button
                      type="button"
                      onClick={() => setEmails(emails.filter((x) => x !== e))}
                      className="ms-1 hover:opacity-70"
                      aria-label={`${t("remove")} ${e}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <input
                id="email-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={onEmailKey}
                onBlur={onEmailBlur}
                placeholder={emails.length ? "" : t("emailPlaceholderEmpty")}
                className="flex-1 min-w-[200px] bg-transparent outline-none text-sm px-1 py-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("emailSeparatorHelp")}
            </p>
          </div>
        </SectionCard>

        <SectionCard step={2} title={t("aiotRole")} icon={ShieldCheck}>
          <div className="space-y-2 max-w-sm">
            <Label className="text-sm">
              {t("aiotRole")} <span className="text-destructive">*</span>
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as AiotRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">
                {AIOT_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("aiotRoleHelper")}
            </p>
          </div>
        </SectionCard>

        <SectionCard step={3} title={t("optionalMessage")} icon={MessageSquare} optional optionalLabel={t("optional")}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("optionalMessagePlaceholder")}
            rows={4}
          />
        </SectionCard>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 px-4 lg:px-6 py-3 bg-background/95 backdrop-blur border-t border-border flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(lp("/members"))}>{t("cancel")}</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
          <Send className="h-4 w-4" /> {emails.length > 1 ? t("sendInvitationsBtn") : t("sendInvitationBtn")}
        </Button>
      </div>
    </PanelLayout>
  );
};

export default InviteMemberForm;
