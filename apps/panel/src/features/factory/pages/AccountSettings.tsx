import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { getCurrentUser } from "@paapeli/brand/session";
import { signOut as endSession } from "@paapeli/brand/session";
import { endServerSession, useGetMyPhoneQuery, useSetMyPhoneMutation, E164_PHONE_PATTERN } from "@paapeli/api";
import { useAuth } from "@/features/factory/store/authStore";
import { useWorkspace } from "@/features/factory/store/workspaceStore";
import { useWorkspaceSwitch } from "@/shared/components/WorkspaceSwitchDialog";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Separator } from "@/features/factory/components/ui/separator";
import { useToast } from "@/features/factory/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { Camera, Mail, Phone, User as UserIcon, Shield, LogOut, Building2, Plus, Check, Palette, Paintbrush } from "lucide-react";
import { Switch } from "@/features/factory/components/ui/switch";
import { useTheme } from "@paapeli/brand/theme";
import { useBrand, type AccentId } from "@/shell/BrandProvider";
import type { Language } from "@/features/factory/i18n/translations";
import sinaProfileImg from "@/features/factory/assets/sina-profile.png";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const AVATAR_STORAGE_KEY = "paapeli.profile.avatar.";

/* Each language in its own script: someone looking for Persian is looking
   for the Persian word, whatever the panel is set to right now. */
const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
];

const ACCENTS: AccentId[] = ["paapeli", "green"];

const AccountSettings = () => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { signOut } = useAuth();
  /* Dark mode and the accent are account preferences, not product ones.
     They used to live on GPS Tracking's own settings page, which is why
     they were unreachable from anywhere else. */
  const { dark, toggle: toggleDark } = useTheme();
  const { accent, setAccent, accentColor } = useBrand();
  /* Real workspaces (GET /api/v1/aiot/workspaces); the selection is the same
     one the panel host's account menu drives, and is what scopes this
     product's API calls. */
  const { workspaces, activeId: activeWs, addWorkspace, canAdd, isAdding } = useWorkspace();
  const workspaceSwitch = useWorkspaceSwitch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Identity from the shared session user (not Cognito — gating is now the
  // shared session, so the Cognito user is null here).
  const currentUser = getCurrentUser();
  const username = (currentUser?.email ?? "").split("@")[0];
  const isSina = username === "sina";
  /* Two different things: what the header/avatar block shows when the account
     has no display name, and what the editable field below is seeded with. The
     field must stay empty — seeding it with the placeholder would let "فاقد
     دیتا" be saved as the account's actual name. */
  const accountName = currentUser?.name ?? "";
  const displayName = accountName || t("noData");
  const email = currentUser?.email ?? "";
  const lp = (p: string) => localizedPath(p, language);

  // Avatar: per-user, persisted in localStorage. Default Sina to uploaded picture.
  const storageKey = AVATAR_STORAGE_KEY + (username || "anon");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState(accountName);
  const [newWs, setNewWs] = useState("");

  /* Phone contact (GET/PUT /users/me/contact-methods/phone). A 404 means none
     is set yet, so the field starts empty. The input is seeded once, when the
     stored number arrives, and is not overwritten while the user types. */
  const phoneQuery = useGetMyPhoneQuery();
  const setPhone = useSetMyPhoneMutation();
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSeeded, setPhoneSeeded] = useState(false);
  useEffect(() => {
    if (phoneSeeded || phoneQuery.isPending) return;
    setPhoneInput(phoneQuery.data?.phone ?? "");
    setPhoneSeeded(true);
  }, [phoneQuery.isPending, phoneQuery.data, phoneSeeded]);
  const phoneTrimmed = phoneInput.replace(/[\s-]/g, "");
  const phoneInvalid = phoneTrimmed !== "" && !E164_PHONE_PATTERN.test(phoneTrimmed);

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

  const handleSave = async () => {
    const storedPhone = phoneQuery.data?.phone ?? "";
    if (phoneTrimmed !== storedPhone) {
      if (!phoneTrimmed) {
        // The API has no delete for the phone contact; an empty field can't be saved.
        setPhoneInput(storedPhone);
      } else if (phoneInvalid) {
        toast({ title: t("error"), description: t("phoneInvalid"), variant: "destructive" });
        return;
      } else {
        try {
          const saved = await setPhone.mutateAsync({ phone: phoneTrimmed });
          setPhoneInput(saved.phone);
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          toast({
            title: t("error"),
            description: status === 400 ? t("phoneInvalid") : (err as Error)?.message,
            variant: "destructive",
          });
          return;
        }
      }
    }
    toast({ title: "Saved", description: "Your profile has been updated." });
  };

  const handleLogout = async () => {
    await endServerSession();
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
                dir="auto"
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
                placeholder={t("noData")}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input id="email" type="email" value={email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5" /> {t("phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={phoneInput}
                placeholder="+989121234567"
                disabled={phoneQuery.isPending}
                aria-invalid={phoneInvalid}
                onChange={(e) => setPhoneInput(e.target.value)}
                className={phoneInvalid ? "border-destructive focus-visible:ring-destructive" : undefined}
              />
              <p className={`text-[11px] ${phoneInvalid ? "text-destructive" : "text-muted-foreground"}`}>
                {phoneInvalid ? t("phoneInvalid") : t("phoneFormatHint")}
              </p>
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
            <Button onClick={handleSave} disabled={setPhone.isPending} className="bg-primary hover:bg-primary/90">
              {t("saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mt-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4" />
            {t("appearance")}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("darkMode")}</span>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("languageLabel")}</span>
            <div className="inline-flex rounded-xl bg-muted p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    language === l.code ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel colour */}
      <Card className="mt-4">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Paintbrush className="h-4 w-4" />
            {t("panelColor")}
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((id) => (
              <button
                key={id}
                onClick={() => setAccent(id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  accent === id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                }`}
              >
                <span className="size-4 rounded-full" style={{ background: `hsl(${accentColor(id)})` }} />
                {id === "paapeli" ? t("panelColorPaapeli") : t("panelColorGreen")}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("panelColorNote")}</p>
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
                  onClick={() => workspaceSwitch.requestSwitch(ws.id, ws.name, activeWs)}
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
                onClick={async () => {
                  try {
                    if (await addWorkspace(newWs)) setNewWs("");
                  } catch {
                    toast({ title: "Error", description: "Couldn't create the workspace.", variant: "destructive" });
                  }
                }}
                disabled={!newWs.trim() || isAdding}
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
      {workspaceSwitch.dialog}
    </>
  );
};

export default AccountSettings;
