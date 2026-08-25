import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, ChevronRight, Info, KeyRound, LogOut, Map, Palette, Plus, ShieldCheck } from "lucide-react";
import { CURRENT_USER } from "@paapeli/brand/config";
import { signOut as endSession } from "@paapeli/brand/session";
import { useWorkspace } from "@/features/track/contexts/WorkspaceContext";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { useTheme } from "@paapeli/brand/theme";
import { useBrand } from "@/shell/BrandProvider";
import { SAMPLE_TENANTS } from "@paapeli/brand/config";
import { Language } from "@/features/track/i18n/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/track/components/ui/card";
import { Switch } from "@/features/track/components/ui/switch";
import { Button } from "@/features/track/components/ui/button";
import { cn } from "@/shared/lib/utils";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
];

function LinkRow({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3.5 text-start transition-colors hover:bg-muted">
      <Icon className="size-5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
    </button>
  );
}

export default function Settings() {
  const user = { email: CURRENT_USER.email };
  const { t, language, setLanguage } = useLanguage();
  const { dark, toggle } = useTheme();
  const { brand, setTenant } = useBrand();
  const { workspaces, activeId, setActive, addWorkspace, canAdd } = useWorkspace();
  const navigate = useNavigate();
  const [newWs, setNewWs] = useState("");
  const soon = () => toast(t("comingSoon"));

  const handleAddWorkspace = () => {
    if (addWorkspace(newWs)) setNewWs("");
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-6">
      <h1 className="mb-5 text-xl font-bold">{t("settings")}</h1>

      {/* Account */}
      <Card className="mb-4">
        <CardHeader><CardTitle>{t("account")}</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {(user?.email ?? "U")[0].toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{t("profile")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="size-4" />{t("workspaces")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex flex-col gap-2">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeId;
              return (
                <button
                  key={ws.id}
                  onClick={() => setActive(ws.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-start transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                  )}
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Building2 className="size-5" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{ws.name}</span>
                  {isActive && <span className="text-xs font-medium text-primary">{t("active")}</span>}
                </button>
              );
            })}
          </div>

          {canAdd && (
            <div className="flex gap-2">
              <input
                value={newWs}
                onChange={(e) => setNewWs(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWorkspace()}
                placeholder={t("workspaceName")}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <Button onClick={handleAddWorkspace} disabled={!newWs.trim()}>
                <Plus className="size-4" />
                {t("create")}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("maxWorkspaces")}</p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="size-4" />{t("appearance")}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("darkMode")}</span>
            <Switch checked={dark} onChange={toggle} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("language")}</span>
            <div className="inline-flex rounded-xl bg-muted p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={cn("rounded-lg px-3 py-1 text-xs font-medium transition-colors", language === l.code ? "bg-card shadow-sm" : "text-muted-foreground")}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand / white-label */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" />{t("brand")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <p className="text-xs text-muted-foreground">{t("tenant")}: <span className="font-medium text-foreground">{brand.tenantId}</span></p>
          <div className="flex flex-wrap gap-2">
            {Object.values(SAMPLE_TENANTS).map((tn) => (
              <button
                key={tn.tenantId}
                onClick={() => setTenant(tn.tenantId)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                  brand.tenantId === tn.tenantId ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                )}
              >
                <span className="size-4 rounded-full" style={{ background: `hsl(${tn.primary})` }} />
                {tn.appName}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="mb-4 divide-y divide-border overflow-hidden">
        <LinkRow icon={KeyRound} label={t("modifyPassword")} onClick={soon} />
        <LinkRow icon={Map} label={t("mapSettings")} onClick={soon} />
        <LinkRow icon={Info} label={t("faq")} onClick={soon} />
        <LinkRow icon={ShieldCheck} label={t("privacyPolicy")} onClick={soon} />
        <LinkRow icon={Info} label={t("aboutUs")} onClick={soon} />
      </Card>

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={() => { endSession(); window.location.href = "/login"; }}
      >
        <LogOut className="size-4" />
        {t("logout")}
      </Button>
    </div>
  );
}
