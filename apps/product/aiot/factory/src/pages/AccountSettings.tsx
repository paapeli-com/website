import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { CURRENT_USER } from "@paapeli/brand/config";
import { signOut as endSession } from "@paapeli/brand/session";
import { useAuth } from "@/store/authStore";
import { useWorkspace } from "@/store/workspaceStore";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Camera, Mail, User as UserIcon, Shield, LogOut, Building2, Plus, Check } from "lucide-react";
import sinaProfileImg from "@/assets/sina-profile.png";

const AVATAR_STORAGE_KEY = "paapeli.profile.avatar.";

const AccountSettings = () => {
  const { t, isRTL, language } = useLanguage();
  const { signOut } = useAuth();
  const { workspaces, activeId: activeWs, setActive: setActiveWs, addWorkspace, canAdd } = useWorkspace();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Identity from the shared session user (not Cognito — gating is now the
  // shared session, so the Cognito user is null here).
  const username = CURRENT_USER.email.split("@")[0];
  const isSina = username === "sina";
  const displayName = CURRENT_USER.name;
  const email = CURRENT_USER.email;
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  // Avatar: per-user, persisted in localStorage. Default Sina to uploaded picture.
  const storageKey = AVATAR_STORAGE_KEY + (username || "anon");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState(displayName);
  const [newWs, setNewWs] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setAvatar(stored);
      else if (isSina) setAvatar(sinaProfileImg);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isSina]);

  const handlePick = () => fileRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatar(url);
      try {
        localStorage.setItem(storageKey, url);
      } catch {}
      toast({ title: "Saved", description: "Profile picture updated." });
    };
    reader.readAsDataURL(f);
  };

  const handleRemove = () => {
    setAvatar(isSina ? sinaProfileImg : null);
    try {
      if (isSina) localStorage.setItem(storageKey, sinaProfileImg);
      else localStorage.removeItem(storageKey);
    } catch {}
  };

  const handleSave = () => {
    toast({ title: "Saved", description: "Your profile has been updated." });
  };

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    endSession();
    window.location.href = "/login";
  };

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/home"))} className="cursor-pointer">
              {t("home") || "Home"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("settings") || "Settings"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={t("settings") || "Settings"}
        countLabel={t("accountSettings") || "Account Settings"}
      />

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Profile picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden border">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold">
                    {(username?.[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePick}
                className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90"
                aria-label="Change profile picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <div className="min-w-0">
              <div
                className="text-base font-semibold truncate"
                dir={isSina ? "rtl" : "ltr"}
                style={{ fontFamily: isSina ? "'Vazirmatn', sans-serif" : undefined }}
              >
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground truncate">{email}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePick} className="h-7 text-xs">
                  Upload new
                </Button>
                <Button size="sm" variant="ghost" onClick={handleRemove} className="h-7 text-xs">
                  {isSina ? "Reset" : "Remove"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2 text-xs">
                <UserIcon className="h-3.5 w-3.5" /> Display Name
              </Label>
              <Input
                id="displayName"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                dir={isSina ? "rtl" : "ltr"}
                style={{ fontFamily: isSina ? "'Vazirmatn', sans-serif" : undefined }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input id="email" type="email" value={email || ""} disabled className="bg-muted" />
            </div>
          </div>

          <Separator />

          {/* Account status */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Account Active</div>
              <div className="text-xs text-muted-foreground">
                Your account is verified and in good standing.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              {language === "en" ? "Sign out" : language === "ar" ? "تسجيل الخروج" : "خروج"}
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {t("saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces (cloud-level) */}
      <Card className="mt-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4" />
            {language === "en" ? "Workspaces" : language === "ar" ? "مساحات العمل" : "فضاهای کاری"}
          </div>
          <div className="space-y-2">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWs;
              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveWs(ws.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-start transition-colors ${isActive ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{ws.name}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          {canAdd && (
            <div className="flex gap-2">
              <Input
                value={newWs}
                onChange={(e) => setNewWs(e.target.value)}
                placeholder={language === "en" ? "Workspace name" : language === "ar" ? "اسم مساحة العمل" : "نام فضای کاری"}
              />
              <Button
                onClick={() => { if (addWorkspace(newWs)) setNewWs(""); }}
                disabled={!newWs.trim()}
                className="shrink-0 gap-2"
              >
                <Plus className="h-4 w-4" />
                {language === "en" ? "Create" : language === "ar" ? "إنشاء" : "ایجاد"}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {language === "en"
              ? "You can create or join up to 5 workspaces."
              : language === "ar"
              ? "يمكنك إنشاء أو الانضمام إلى ٥ مساحات عمل كحد أقصى."
              : "می‌توانید تا ۵ فضای کاری بسازید یا عضو شوید."}
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default AccountSettings;
