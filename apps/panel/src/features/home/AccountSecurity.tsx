import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, CircleAlert, Copy, Download, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import {
  useChangePasswordMutation,
  useConfirmRecoveryEmailMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useRegenerateRecoveryCodesMutation,
  useRemoveRecoveryEmailMutation,
  useSetRecoveryEmailMutation,
  useSetupTwoFactorMutation,
  type TwoFactorSetup,
  type UserProfileResponse,
} from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { toast } from "@/shared/lib/toast";
import { apiProblem } from "@/shared/lib/apiError";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";

/* The account's own sign-in security: the password, two-factor sign-in with
 * an authenticator app, and a recovery email (PUT /users/me/password,
 * /users/me/two-factor/*, /users/me/recovery-email). Each row opens in place,
 * as the rest of the page edits in place. */

const fill = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value), text);

const latinDigits = (value: string) =>
  value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function Row({ icon: Icon, title, description, status, action, children }: {
  icon: typeof KeyRound;
  title: string;
  description: string;
  status?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-3.5 last:border-0">
      <div className="flex flex-wrap items-center gap-4">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-[180px] flex-1">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        {status}
        {action}
      </div>
      {children && <div className="mt-3 ps-8">{children}</div>}
    </div>
  );
}

function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return on ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
      <BadgeCheck className="size-3.5" />
      {onLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <CircleAlert className="size-3.5" />
      {offLabel}
    </span>
  );
}

export function AccountSecurity({ profile, onSignedOut }: {
  profile: UserProfileResponse | undefined;
  /** Called once a password change has signed every session out. */
  onSignedOut: () => void;
}) {
  const t = useShellT();

  /** One message for each refusal the gateway can give. */
  const explain = (error: unknown) => {
    const problem = apiProblem(error);
    switch (problem.code) {
      case "WRONG_PASSWORD": return t("The current password is not right.");
      case "WEAK_PASSWORD": return t("A password needs at least 8 characters.");
      case "PASSWORDS_DIFFER": return t("The new password and its confirmation differ.");
      case "CODE_INVALID":
        return problem.attemptsLeft !== undefined
          ? fill(t("That code is not right. {count} tries left."), { count: String(problem.attemptsLeft) })
          : t("That code is not right.");
      case "TOO_MANY_ATTEMPTS": return t("Too many wrong codes. Ask for a new one.");
      case "CODE_EXPIRED":
      case "NO_PENDING_CODE": return t("This code has expired. Ask for a new one.");
      case "SAME_AS_ACCOUNT_EMAIL": return t("Use an address other than your account's email.");
      case "RESEND_TOO_SOON": return t("Wait a moment before asking for another code.");
      case "EMAIL_UNAVAILABLE": return t("The email could not be sent. Try again later.");
      default: return t("Something went wrong. Try again.");
    }
  };

  // ── Password ────────────────────────────────────────────────────────────
  const changePassword = useChangePasswordMutation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const hasPassword = profile?.hasPassword !== false;

  const submitPassword = async () => {
    try {
      await changePassword.mutateAsync({
        currentPassword: hasPassword ? current : undefined,
        newPassword: next,
        confirmPassword: confirm,
      });
      toast.success(t("Your password has changed. Sign in again with the new one."));
      onSignedOut();
    } catch (error) {
      toast.error(explain(error));
    }
  };

  // ── Two-factor ──────────────────────────────────────────────────────────
  const setup = useSetupTwoFactorMutation();
  const enable = useEnableTwoFactorMutation();
  const disable = useDisableTwoFactorMutation();
  const regenerate = useRegenerateRecoveryCodesMutation();
  const [pendingSetup, setPendingSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [manage, setManage] = useState<"disable" | "codes" | null>(null);
  const twoFactorOn = !!profile?.twoFactorEnabled;

  const startSetup = async () => {
    try {
      setPendingSetup(await setup.mutateAsync());
      setTwoFactorCode("");
      setRecoveryCodes(null);
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const submitEnable = async () => {
    try {
      const result = await enable.mutateAsync(twoFactorCode.trim());
      setRecoveryCodes(result.recoveryCodes);
      setPendingSetup(null);
      setTwoFactorCode("");
      toast.success(t("Two-step verification is on."));
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const submitManage = async () => {
    try {
      if (manage === "disable") {
        await disable.mutateAsync(twoFactorCode.trim());
        toast.success(t("Two-step verification is off."));
      } else {
        const result = await regenerate.mutateAsync(twoFactorCode.trim());
        setRecoveryCodes(result.recoveryCodes);
        toast.success(t("New recovery codes are ready. The old ones no longer work."));
      }
      setManage(null);
      setTwoFactorCode("");
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const copyCodes = async (codes: string[]) => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success(t("Copied."));
    } catch {
      toast.error(t("Could not copy. Select the codes and copy them yourself."));
    }
  };

  const downloadCodes = (codes: string[]) => {
    const blob = new Blob([`Paapeli recovery codes\n\n${codes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "paapeli-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Recovery email ──────────────────────────────────────────────────────
  const setRecoveryEmail = useSetRecoveryEmailMutation();
  const confirmRecoveryEmail = useConfirmRecoveryEmailMutation();
  const removeRecoveryEmail = useRemoveRecoveryEmailMutation();
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");

  const sendEmailCode = async (address: string) => {
    try {
      const sent = await setRecoveryEmail.mutateAsync(address.trim());
      setEmailCodeSent(true);
      setEmailCode("");
      toast.success(fill(t("A code is on its way to {email}."), { email: sent.email }));
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const submitEmailCode = async () => {
    try {
      await confirmRecoveryEmail.mutateAsync(emailCode.trim());
      setEmailOpen(false);
      setEmailCodeSent(false);
      toast.success(t("Your recovery email is verified."));
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const codeInput = (value: string, onChange: (v: string) => void, onEnter: () => void, placeholder: string) => (
    <Input
      value={value}
      onChange={(e) => onChange(latinDigits(e.target.value).slice(0, 16))}
      onKeyDown={(e) => e.key === "Enter" && value.trim() && onEnter()}
      dir="ltr"
      autoComplete="one-time-code"
      placeholder={placeholder}
      className="h-9 w-44 text-center tracking-[0.2em]"
    />
  );

  return (
    <div>
      {/* Password */}
      <Row
        icon={KeyRound}
        title={t("Password")}
        description={hasPassword
          ? t("Change the password you sign in with.")
          : t("Your account signs in with Google. Set a password to sign in with your email too.")}
        action={!passwordOpen && (
          <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
            {hasPassword ? t("Change password") : t("Set a password")}
          </Button>
        )}
      >
        {passwordOpen && (
          <div className="flex max-w-md flex-col gap-2.5">
            {hasPassword && (
              <Input type="password" autoComplete="current-password" placeholder={t("Current password")}
                value={current} onChange={(e) => setCurrent(e.target.value)} />
            )}
            <Input type="password" autoComplete="new-password" placeholder={t("New password")}
              value={next} onChange={(e) => setNext(e.target.value)} />
            <Input type="password" autoComplete="new-password" placeholder={t("Repeat the new password")}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              {t("At least 8 characters. Every device, this one included, signs out after the change.")}
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="gap-2" onClick={submitPassword}
                disabled={changePassword.isPending || next.length < 8 || !confirm || (hasPassword && !current)}>
                {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                {t("Save password")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPasswordOpen(false); setCurrent(""); setNext(""); setConfirm(""); }}>
                {t("Cancel")}
              </Button>
            </div>
          </div>
        )}
      </Row>

      {/* Two-factor */}
      <Row
        icon={ShieldCheck}
        title={t("Two factor authentication")}
        description={t("A code from an authenticator app, on top of your password or Google.")}
        status={profile && <StatusBadge on={twoFactorOn} onLabel={t("On")} offLabel={t("Off")} />}
        action={profile && !pendingSetup && !manage && (twoFactorOn ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setManage("codes"); setTwoFactorCode(""); }}>
              {t("New recovery codes")}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
              onClick={() => { setManage("disable"); setTwoFactorCode(""); }}>
              {t("Turn off")}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-2" onClick={startSetup} disabled={setup.isPending}>
            {setup.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("Turn on")}
          </Button>
        ))}
      >
        {pendingSetup && (
          <div className="flex flex-wrap items-start gap-5">
            <div className="rounded-lg border border-border bg-white p-3">
              <QRCodeSVG value={pendingSetup.otpauthUri} size={152} />
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
              <ol className="list-decimal space-y-1 ps-5 text-xs text-muted-foreground">
                <li>{t("Scan the code with an authenticator app, such as Google Authenticator or Microsoft Authenticator.")}</li>
                <li>{t("Or type this key into the app:")}</li>
              </ol>
              <code dir="ltr" className="break-all rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
                {pendingSetup.secret.replace(/(.{4})/g, "$1 ").trim()}
              </code>
              <p className="text-xs text-muted-foreground">{t("Then enter the 6-digit code the app shows:")}</p>
              <div className="flex flex-wrap gap-2">
                {codeInput(twoFactorCode, setTwoFactorCode, submitEnable, "123456")}
                <Button size="sm" className="gap-2" onClick={submitEnable}
                  disabled={enable.isPending || !/^[0-9]{6}$/.test(twoFactorCode.trim())}>
                  {enable.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t("Turn on")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingSetup(null)}>{t("Cancel")}</Button>
              </div>
            </div>
          </div>
        )}

        {manage && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {manage === "disable"
                ? t("Enter a code from your app, or a recovery code, to turn two-step verification off.")
                : t("Enter a code from your app, or a recovery code. The old recovery codes stop working.")}
            </p>
            <div className="flex flex-wrap gap-2">
              {codeInput(twoFactorCode, setTwoFactorCode, submitManage, "123456")}
              <Button size="sm" className="gap-2" onClick={submitManage}
                variant={manage === "disable" ? "destructive" : "default"}
                disabled={disable.isPending || regenerate.isPending || !twoFactorCode.trim()}>
                {(disable.isPending || regenerate.isPending) && <Loader2 className="size-4 animate-spin" />}
                {manage === "disable" ? t("Turn off") : t("New recovery codes")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setManage(null)}>{t("Cancel")}</Button>
            </div>
          </div>
        )}

        {recoveryCodes && (
          <div className="flex flex-col gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-foreground">
              {t("Save these recovery codes somewhere safe. Each signs in once if you lose your phone. They will not be shown again.")}
            </p>
            <div dir="ltr" className="grid grid-cols-2 gap-1.5 font-mono text-sm text-foreground sm:grid-cols-5">
              {recoveryCodes.map((code) => <span key={code}>{code}</span>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => copyCodes(recoveryCodes)}>
                <Copy className="size-4" />{t("Copy")}
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCodes(recoveryCodes)}>
                <Download className="size-4" />{t("Download")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRecoveryCodes(null)}>{t("I have saved them")}</Button>
            </div>
          </div>
        )}
      </Row>

      {/* Recovery email */}
      <Row
        icon={Mail}
        title={t("Recovery email")}
        description={profile?.recoveryEmail
          ? profile.recoveryEmail
          : t("Where password reset codes also go, if you cannot reach your account's email.")}
        status={profile?.recoveryEmail && (
          <StatusBadge on={!!profile.recoveryEmailVerified} onLabel={t("Verified")} offLabel={t("Not verified")} />
        )}
        action={!emailOpen && (
          <div className="flex gap-2">
            {profile?.recoveryEmail && !profile.recoveryEmailVerified && (
              <Button variant="outline" size="sm" onClick={() => { setEmailOpen(true); void sendEmailCode(profile.recoveryEmail ?? ""); }}>
                {t("Verify")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setEmailOpen(true); setEmailCodeSent(false); setEmailInput(""); }}>
              {profile?.recoveryEmail ? t("Change") : t("Add")}
            </Button>
            {profile?.recoveryEmail && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                disabled={removeRecoveryEmail.isPending}
                onClick={() => removeRecoveryEmail.mutate(undefined, {
                  onSuccess: () => toast.success(t("Recovery email removed.")),
                  onError: (error) => toast.error(explain(error)),
                })}>
                {t("Remove")}
              </Button>
            )}
          </div>
        )}
      >
        {emailOpen && (
          <div className="flex flex-col gap-2">
            {!emailCodeSent ? (
              <div className="flex flex-wrap gap-2">
                <Input type="email" dir="ltr" placeholder="name@example.com" value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)} className={cn("h-9 max-w-xs")} />
                <Button size="sm" className="gap-2" onClick={() => sendEmailCode(emailInput)}
                  disabled={setRecoveryEmail.isPending || !/^\S+@\S+\.\S+$/.test(emailInput.trim())}>
                  {setRecoveryEmail.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t("Send code")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEmailOpen(false)}>{t("Cancel")}</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{t("Enter the 6-digit code we emailed. It is valid for 10 minutes.")}</p>
                <div className="flex flex-wrap gap-2">
                  {codeInput(emailCode, setEmailCode, submitEmailCode, "123456")}
                  <Button size="sm" className="gap-2" onClick={submitEmailCode}
                    disabled={confirmRecoveryEmail.isPending || !/^[0-9]{6}$/.test(emailCode.trim())}>
                    {confirmRecoveryEmail.isPending && <Loader2 className="size-4 animate-spin" />}
                    {t("Confirm")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEmailOpen(false); setEmailCodeSent(false); }}>
                    {t("Cancel")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Row>
    </div>
  );
}
