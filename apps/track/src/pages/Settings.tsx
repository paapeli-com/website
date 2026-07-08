import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Info, KeyRound, LogOut, Map, Palette, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTheme } from "@/lib/useTheme";
import { useBrand } from "@/brand/BrandProvider";
import { SAMPLE_TENANTS } from "@paapeli/brand/config";
import { Language } from "@/i18n/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { dark, toggle } = useTheme();
  const { brand, setTenant } = useBrand();
  const navigate = useNavigate();
  const soon = () => toast(t("comingSoon"));

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
        onClick={() => { logout(); navigate("/login"); }}
      >
        <LogOut className="size-4" />
        {t("logout")}
      </Button>
    </div>
  );
}
