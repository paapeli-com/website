import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PanelLayout } from "@/layouts/PanelLayout";
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
import { Camera, Mail, User as UserIcon, Shield, LogOut } from "lucide-react";
import sinaProfileImg from "@/assets/sina-profile.png";

const AVATAR_STORAGE_KEY = "paapeli.profile.avatar.";

const AccountSettings = () => {
  const { t, isRTL, language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const username = user?.getUsername?.() || "";
  const isSina = username === "sina";
  const displayName = isSina ? "هلدینگ هوشمند سینا" : username || "User";
  const email = isSina ? "sina@paapeli.com" : username;
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  // Avatar: per-user, persisted in localStorage. Default Sina to uploaded picture.
  const storageKey = AVATAR_STORAGE_KEY + (username || "anon");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState(displayName);

  useEffect(() => {
    if (!user) {
      navigate(lp("/login") as any);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setAvatar(stored);
      else if (isSina) setAvatar(sinaProfileImg);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, storageKey, isSina]);

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
    await signOut();
    navigate(lp("/login") as any);
  };

  return (
    <PanelLayout>
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
    </PanelLayout>
  );
};

export default AccountSettings;
