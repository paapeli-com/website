import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import {
  Camera, Check, ChevronRight, Loader2, LogOut, Mail, Monitor, Paintbrush,
  Palette, Phone, Shield, User as UserIcon,
} from "lucide-react";
import { useDisplayName } from "@/shared/hooks/useDisplayName";
import { getCurrentUser, signOut as endSession } from "@paapeli/brand/session";
import {
  E164_PHONE_PATTERN, endServerSession, useGetMyPhoneQuery, useGetMyProfileQuery, useLogoutAllMutation,
  useSetMyPhoneMutation, useUpdateMyProfileMutation,
} from "@paapeli/api";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { useTheme } from "@paapeli/brand/theme";
import { useBrand, type AccentId } from "@/shell/BrandProvider";
import { useShellT } from "@/shared/i18n/shell";
import { APP_LANGUAGES, isRTLLanguage, setAppLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { cn } from "@/shared/lib/utils";
import { PhoneSmsNote, PhoneVerification } from "@/features/home/PhoneVerification";

/* The account's own settings, at /Home/account-settings.
 *
 * It used to live under Smart Factory, which made a personal page look like a
 * property of one product. Anything that belongs to the person rather than to
 * a workspace or a product belongs under /Home, and this is the first of them.
 *
 * What is real: the display name (GET/PUT /users/me), the email from the
 * session, the phone contact method
 * (GET/PUT /users/me/contact-methods/phone) and its verification by a texted
 * code (see PhoneVerification), dark mode, the panel language,
 * the accent colour, signing out, and signing out everywhere. Password, two
 * factor, the recovery email and the session list have no endpoint, so they
 * keep their headings and report no data rather than asserting an account is
 * protected in ways it may not be. */

const AVATAR_STORAGE_KEY = "paapeli.profile.avatar.";

const ACCENTS: { id: AccentId; label: string }[] = [
  { id: "paapeli", label: "Paapeli" },
  { id: "green", label: "Green" },
];

/** A titled block, the shape every card on this page takes. */
function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Label, hint and field, as the design lays a profile field out. */
function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Mail;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function AccountSettings() {
  const t = useShellT();
  const navigate = useNavigate();
  const language = useAppLanguage();
  const isRTL = isRTLLanguage(language);
  const { dark, toggle: toggleDark } = useTheme();
  const { accent, setAccent, accentColor } = useBrand();
  const logoutAll = useLogoutAllMutation();
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUser = getCurrentUser();
  const username = (currentUser?.email ?? "").split("@")[0];
  const accountName = useDisplayName();
  const email = currentUser?.email ?? "";

  /* Seeded once from the profile (GET /users/me), never while the user types.
     It stays empty when the account has no name: seeding it with the email
     stand-in would let that be saved as the actual name. */
  const profileQuery = useGetMyProfileQuery();
  const updateProfile = useUpdateMyProfileMutation();
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [nameSeeded, setNameSeeded] = useState(false);
  useEffect(() => {
    if (nameSeeded || !profileQuery.data) return;
    setDisplayNameInput(profileQuery.data.displayName ?? "");
    setNameSeeded(true);
  }, [profileQuery.data, nameSeeded]);
  const nameTrimmed = displayNameInput.trim();

  const storageKey = AVATAR_STORAGE_KEY + (username || "anon");
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setAvatar(stored);
    } catch {
      /* private mode: the initial goes on the tile instead */
    }
  }, [storageKey]);

  /* A 404 means no number is set yet, so the field starts empty. It is seeded
     once, when the stored number arrives, and never while the user types. */
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

  const pickAvatar = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatar(url);
      try {
        localStorage.setItem(storageKey, url);
      } catch {
        /* the picture still shows for this session */
      }
      toast.success(t("Profile picture updated."));
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* nothing to clear */
    }
  };

  const save = async () => {
    if (nameSeeded && nameTrimmed !== (profileQuery.data?.displayName ?? "")) {
      try {
        const saved = await updateProfile.mutateAsync({ displayName: nameTrimmed || null });
        setDisplayNameInput(saved.displayName ?? "");
      } catch (err) {
        toast.error(apiErrorMessage(err, t("Could not save your name.")));
        return;
      }
    }
    const stored = phoneQuery.data?.phone ?? "";
    if (phoneTrimmed !== stored) {
      if (!phoneTrimmed) {
        // The API has no delete for the phone contact, so an empty field
        // cannot be saved; the stored number stands.
        setPhoneInput(stored);
      } else if (phoneInvalid) {
        toast.error(t("Enter the number in international format, starting with +."));
        return;
      } else {
        try {
          const saved = await setPhone.mutateAsync({ phone: phoneTrimmed });
          setPhoneInput(saved.phone);
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          toast.error(
            status === 400
              ? t("Enter the number in international format, starting with +.")
              : (err as Error)?.message,
          );
          return;
        }
      }
    }
    toast.success(t("Your profile has been updated."));
  };

  const signOutHere = async () => {
    await endServerSession();
    endSession();
    window.location.href = "/login";
  };

  /* Password, two factor and the recovery email describe controls the product
     intends to offer. None has an endpoint, so each says so rather than
     claiming a state. */
  const securityRows = [
    { title: "Password", description: "Change the password you sign in with." },
    { title: "Two factor authentication", description: "A second factor on top of your password." },
    { title: "Recovery email", description: "Where a reset link is sent if you are locked out." },
  ];

  return (
    <div
      data-uniform-type
      dir={isRTL ? "rtl" : "ltr"}
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-6 sm:px-6"
    >
      {/* Spelled out rather than the shared Breadcrumb, which reads the
          factory's language provider and this page is not inside one. */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <button type="button" onClick={() => navigate("/Home")} className="hover:text-foreground">
          {t("Home")}
        </button>
        <ChevronRight className={cn("size-3.5", isRTL && "rotate-180")} />
        <span className="font-semibold text-primary">{t("Account settings")}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Account settings")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Your personal profile, appearance and sign in security.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={signOutHere} className="gap-2">
            <LogOut className="size-4" />
            {t("Sign out")}
          </Button>
          <Button onClick={save} disabled={setPhone.isPending || updateProfile.isPending} className="gap-2">
            {(setPhone.isPending || updateProfile.isPending) && <Loader2 className="size-4 animate-spin" />}
            {t("Save changes")}
          </Button>
        </div>
      </header>

      {/* Profile */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="relative shrink-0">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/10 text-xl font-semibold text-primary">
              {avatar ? (
                <img src={avatar} alt="" className="size-full object-cover" />
              ) : (
                (username?.[0] || "U").toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={pickAvatar}
              aria-label={t("Upload new")}
              className="absolute -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground ltr:-right-0.5 rtl:-left-0.5"
            >
              <Camera className="size-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          </div>

          <div className="min-w-[200px] flex-1">
            <div className="text-base font-bold text-foreground">{accountName}</div>
            <div className="mb-2.5 text-xs text-muted-foreground" dir="ltr">{email}</div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={pickAvatar}>{t("Upload new")}</Button>
              {avatar && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs font-semibold text-destructive hover:underline"
                >
                  {t("Remove")}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 px-3.5 py-2.5">
            <span className="size-2 shrink-0 rounded-full bg-emerald-600" />
            <div>
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("Account active")}
              </div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                {t("Verified and in good standing")}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={UserIcon} label={t("Display name")} hint={t("Shown to the members of your workspaces.")}>
            <Input
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder={t("Your name")}
              maxLength={100}
              disabled={!nameSeeded}
            />
          </Field>
          <Field icon={Mail} label={t("Email")}>
            <Input value={email} dir="ltr" disabled className="bg-muted" />
          </Field>
          {/* The phone and its verification share one column, so the badge
              and the button sit right under the number they are about. */}
          <div className="flex flex-col gap-2">
            <Field
              icon={Phone}
              label={t("Phone")}
              hint={t("International format with the country code, for example +989121234567.")}
            >
              <Input
                value={phoneInput}
                dir="ltr"
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+989121234567"
                className={cn(phoneInvalid && "border-destructive")}
              />
            </Field>
            <PhoneVerification stored={phoneQuery.data} typed={phoneTrimmed} />
          </div>
          <PhoneSmsNote className="sm:col-span-2 lg:col-span-3" />
        </div>
      </section>

      {/* Appearance */}
      <Section icon={Palette} title={t("Appearance")}>
        <div className="flex flex-wrap items-center gap-4 border-b border-border py-3">
          <div className="min-w-[160px] flex-1">
            <div className="text-sm font-semibold text-foreground">{t("Dark mode")}</div>
            <div className="text-xs text-muted-foreground">{t("Applies to the whole panel.")}</div>
          </div>
          <Switch checked={dark} onCheckedChange={toggleDark} />
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-3.5">
          <div className="min-w-[160px] flex-1">
            <div className="text-sm font-semibold text-foreground">{t("Language")}</div>
            <div className="text-xs text-muted-foreground">{t("The panel's direction follows the language.")}</div>
          </div>
          <div className="inline-flex shrink-0 rounded-xl bg-muted p-1">
            {APP_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setAppLanguage(lang.code)}
                lang={lang.code}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  language === lang.code
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Panel colour */}
      <Section icon={Paintbrush} title={t("Panel colour")}>
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENTS.map((option) => {
            const on = accent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccent(option.id)}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-full border px-3.5 text-sm transition-colors",
                  on ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40",
                )}
              >
                <span className="size-3 rounded-full" style={{ background: `hsl(${accentColor(option.id)})` }} />
                {option.label}
                {on && <Check className="size-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">{t("Kept in this browser for now.")}</p>
      </Section>

      {/* Sign in and security */}
      <Section icon={Shield} title={t("Sign in and security")}>
        {securityRows.map((row) => (
          <div
            key={row.title}
            className="flex flex-wrap items-center gap-4 border-b border-border py-3.5 last:border-0"
          >
            <div className="min-w-[180px] flex-1">
              <div className="text-sm font-semibold text-foreground">{t(row.title)}</div>
              <div className="text-xs text-muted-foreground">{t(row.description)}</div>
            </div>
            {/* No endpoint behind any of these yet, so the control says so
                rather than opening a form that cannot save. */}
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        ))}

        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Active sessions")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmSignOutAll(true)}
              disabled={logoutAll.isPending}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              {logoutAll.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {t("Sign out from all devices")}
            </Button>
          </div>
          {/* The devices an account is signed in on would be a list of real
              sessions; nothing serves one, so this reports no data rather
              than naming machines and cities that were never checked. */}
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border py-8 text-center">
            <Monitor className="size-6 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        </div>
      </Section>

      <AlertDialog open={confirmSignOutAll} onOpenChange={setConfirmSignOutAll}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Sign out everywhere?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Anyone signed in as you, anywhere, will have to sign in again.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSignOutAll(false);
                logoutAll.mutate(undefined, {
                  onSuccess: () => {
                    toast.success(t("Signed out from all devices"));
                    void signOutHere();
                  },
                  onError: () => toast.error(t("Could not sign out from all devices")),
                });
              }}
            >
              {t("Sign out from all devices")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
