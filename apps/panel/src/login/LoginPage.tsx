import { useCallback, useState, type FormEvent } from "react";
import { assetsService, authService, setApiAuthToken, workspacesService } from "@paapeli/api";
import { productKeyFor } from "@paapeli/brand/config";
import { signIn as persistSession } from "@paapeli/brand/session";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "@paapeli/brand/workspace";
import { SiteNav } from "./SiteNav";
import { useCopy } from "./copy";
import { decodeGoogleIdentity, useGoogleButton } from "./googleSignIn";
import { useAppLanguage } from "@/shared/i18n/appLanguage";

/* The product-agnostic sign-in page, served at /login for every product on this
   origin. Ported from the hand-written login/index.html so it can share the
   marketing site's header (see SiteNav).

   Two things improved in the move rather than being transcribed:
   - The API call goes through @paapeli/api instead of a hardcoded gateway URL,
     so it follows the same base URL as the rest of the app — which means the
     dev proxy applies and a 401 here is readable.
   - The session is written by @paapeli/brand/session's signIn() instead of a
     duplicated localStorage shape that had to be kept in step by hand.

   Copy comes from ./copy, keyed off the panel-wide language store — so the
   header's switcher translates this page instead of navigating away from it,
   and the choice is still there after signing in. */

const DEFAULT_REDIRECT = "/AIoT/SmartFactory";

/** Where to land after signing in — never back onto this page. */
function redirectTarget(): string {
  const target = new URLSearchParams(window.location.search).get("redirect");
  if (!target || target.startsWith("/login")) return DEFAULT_REDIRECT;
  return target;
}

const Mark = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7C11 9.20914 9.20914 11 7 11C4.79086 11 3 9.20914 3 7Z"
      fill="#FF7900"
    />
    <path
      d="M17 3C19.2091 3 21 4.79086 21 7C21 8.94683 19.6088 10.5671 17.7666 10.9248L14.6015 11.774C13.2218 12.1441 12.1443 13.2219 11.7744 14.6016L10.9238 17.7744C10.5631 19.6128 8.94411 21 7 21C4.79086 21 3 19.2091 3 17C3 15.0613 4.37913 13.4438 6.20996 13.0771L9.39678 12.2227C10.7763 11.8528 11.854 10.7754 12.2242 9.39594L13.0742 6.22852C13.4337 4.38852 15.0548 3 17 3Z"
      fill="#111111"
    />
  </svg>
);

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary";
const label = "mb-1.5 block text-sm font-medium text-foreground";

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          : "mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700"
      }
    >
      {children}
    </div>
  );
}

/* A local heuristic, not a policy: the gateway owns the real password rules,
   so this only guides the user and never blocks submitting. Scores 0–4. */
function scorePassword(password: string): number {
  if (!password) return 0;
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;
  // Too short, or one repeated character, is weak however varied it looks.
  if (password.length < 8 || /^(.)\1+$/.test(password)) return 1;
  return Math.max(1, Math.min(4, points - 1));
}

const STRENGTH_STYLES = [
  { bar: "bg-destructive", text: "text-destructive" },
  { bar: "bg-amber-500", text: "text-amber-600" },
  { bar: "bg-emerald-400", text: "text-emerald-600" },
  { bar: "bg-emerald-600", text: "text-emerald-700" },
];

function PasswordStrength({ password }: { password: string }) {
  const copy = useCopy();
  const score = scorePassword(password);
  if (score === 0) return null;
  const labels = [copy.strengthWeak, copy.strengthFair, copy.strengthGood, copy.strengthStrong];
  const style = STRENGTH_STYLES[score - 1];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors ${segment <= score ? style.bar : "bg-border"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        <span className="sr-only">{copy.passwordStrength}: </span>
        <span className={`font-medium ${style.text}`}>{labels[score - 1]}</span>
        {score < 4 && <> · {copy.passwordHint}</>}
      </p>
    </div>
  );
}

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

/** The product whose root location is provisioned at sign-in. */
const ROOT_PRODUCT_KEY = productKeyFor("SmartFactory");

/* Gets the account to a usable tree before it reaches the panel: a workspace,
   the SmartFactory subscription, and that product's root location.

   The steps are in dependency order. Every product endpoint is scoped to a
   workspace, and POST .../root needs the subscription to be active already.
   So this does what ProductGate would do on the first feature load, then
   creates the root the Locations page used to create on first visit.

   The workspace picked is the one AccountMenu would pick (the stored id if
   the user is still a member, else the first), and it is stored as active so
   the shell scopes to the workspace that was just set up.

   Best effort: a failure here must not block the user from getting in, so it
   is logged and swallowed. ProductGate and the Locations page's manual button
   remain the fallbacks. */
async function ensureWorkspaceSetup() {
  try {
    const workspaces = await workspacesService.listActiveWorkspaces();
    const stored = getActiveWorkspaceId();
    let workspaceId =
      workspaces.find((ws) => ws.workspaceId === stored)?.workspaceId ?? workspaces[0]?.workspaceId;
    if (!workspaceId) {
      workspaceId = (await workspacesService.createWorkspace({ name: "My Workspace" })).id;
    }
    setActiveWorkspaceId(workspaceId);

    if (!ROOT_PRODUCT_KEY) return;

    const products = await workspacesService.listWorkspaceProducts(workspaceId);
    if (!products.some((p) => p.productKey === ROOT_PRODUCT_KEY)) {
      try {
        await workspacesService.subscribeWorkspaceProduct(workspaceId, { productKey: ROOT_PRODUCT_KEY });
      } catch (error) {
        // 409 = already subscribed, the state we wanted.
        if (statusOf(error) !== 409) throw error;
      }
    }

    /* GET 404 = no root yet. POST 409 = the root appeared meanwhile, or the
       subscription made a moment ago is still provisioning — so on 409 wait
       briefly and look again rather than giving up. Capped, so a stuck
       subscription delays sign-in by a few seconds at most. */
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await assetsService.getRoot(workspaceId, ROOT_PRODUCT_KEY);
        return;
      } catch (error) {
        if (statusOf(error) !== 404) throw error;
      }
      try {
        await assetsService.provisionRoot(workspaceId, ROOT_PRODUCT_KEY);
        return;
      } catch (error) {
        if (statusOf(error) !== 409) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.warn("Failed to set up the workspace and root location", error);
  }
}

export default function LoginPage() {
  const copy = useCopy();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");

  /* The reset is two calls, so the form is two steps: ask for a code, then
     spend it on a new password. `resetNotice` carries the deliberately vague
     confirmation from step one — see handleRequestReset. */
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  const show = (next: "signin" | "signup" | "reset") => {
    setError("");
    setSignupError("");
    setResetError("");
    setSuccess("");
    setMode(next);
  };

  /** Opens the reset flow at step one, seeded with whatever was typed above. */
  const startReset = () => {
    setResetEmail(email.trim());
    setResetStep("request");
    setResetCode("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setResetNotice("");
    show("reset");
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(copy.errCredentialsRequired);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { token } = await authService.login({ username: email.trim(), password });
      persistSession(email.trim(), token);
      setApiAuthToken(token);
      await ensureWorkspaceSetup();
      window.location.href = redirectTarget();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? copy.errInvalidCredentials : copy.errSignInFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword || !confirmPassword) {
      setSignupError(copy.errSignupFieldsRequired);
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError(copy.errPasswordsDontMatch);
      return;
    }
    setSignupError("");
    setBusy(true);
    try {
      const result = await authService.signup({
        email: signupEmail.trim(),
        displayName: displayName.trim() || undefined,
        password: signupPassword,
        confirmedPassword: confirmPassword,
      });
      const token = result?.authentication?.token;
      if (token) {
        // Active immediately — sign in and land them in the app.
        persistSession(signupEmail.trim(), token, result.displayName);
        setApiAuthToken(token);
        await ensureWorkspaceSetup();
        window.location.href = redirectTarget();
        return;
      }
      // No token back (verification required) — send them to sign in.
      setEmail(signupEmail.trim());
      setSuccess(copy.okAccountCreated);
      setMode("signin");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSignupError(message || copy.errSignUpFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError(copy.errResetEmailRequired);
      return;
    }
    setResetError("");
    setBusy(true);
    try {
      await authService.requestPasswordReset({ email: resetEmail.trim() });
      /* The endpoint answers the same way whether or not the account exists,
         and whether or not the request was throttled — so say only what is
         true for every one of those cases and move on to the code step. */
      setResetNotice(copy.okResetCodeSent);
      setResetStep("confirm");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setResetError(message || copy.errBadEmail);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword || !newPasswordConfirm) {
      setResetError(copy.errResetFieldsRequired);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setResetError(copy.errPasswordsDontMatch);
      return;
    }
    setResetError("");
    setBusy(true);
    try {
      await authService.resetPassword({
        code: resetCode.trim(),
        password: newPassword,
        passwordConfirm: newPasswordConfirm,
      });
      // The reset revokes existing tokens, so there is nothing to carry over:
      // land them on sign-in with the email they just recovered.
      setEmail(resetEmail.trim());
      setPassword("");
      setSuccess(copy.okPasswordChanged);
      setMode("signin");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      /* Submitting a code consumes it even when the update fails, so every
         error here ends the same way: this code is spent, ask for another. */
      setResetError(
        `${status === 404 ? copy.errCodeInvalid : message || copy.errResetFailed} ${copy.retryWithNewCode}`,
      );
    } finally {
      setBusy(false);
    }
  };

  /* One endpoint covers both halves of the form: the gateway creates an
     account when the verified Google email is unknown, and links it to an
     existing password account when it isn't. So the button means "sign in"
     and "sign up" at once, and it renders in both modes. */
  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError("");
      setSignupError("");
      setBusy(true);
      try {
        const { token } = await authService.googleSignIn({ idToken });
        const { email: googleEmail, name } = decodeGoogleIdentity(idToken);
        persistSession(googleEmail ?? "", token, name);
        setApiAuthToken(token);
        // Google sign-up is silent — there is no separate "account created"
        // response to branch on, so run the setup either way.
        await ensureWorkspaceSetup();
        window.location.href = redirectTarget();
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        // No `response` at all means the request never got an answer (blocked,
        // offline, CORS) — worth distinguishing in the console from a gateway
        // that answered with a status.
        console.error(`[google] gateway rejected the ID token (${status ?? "no response"})`, err);
        const message = status === 503 ? copy.googleNotConfigured : copy.googleSignInFailed;
        if (mode === "signup") setSignupError(message);
        else setError(message);
        setBusy(false);
      }
    },
    [copy, mode],
  );

  const google = useGoogleButton(handleGoogleCredential, useAppLanguage());

  /* The divider + button, shown under both the sign-in and sign-up forms. */
  const googleBlock = (
    <>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{copy.or}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* GIS renders its own button in here — it cannot be styled, only sized,
          so the container is what gets measured. */}
      <div ref={google.ref} className="flex min-h-[44px] justify-center" />

      {google.state === "failed" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{copy.googleLoadFailed}</p>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteNav />
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-5 flex justify-center">
            <Mark />
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn}>
              <h1 className="mb-5 text-center text-xl font-bold text-foreground">
                {copy.signInTitle}
              </h1>

              {error && <Notice tone="error">{error}</Notice>}
              {success && <Notice tone="success">{success}</Notice>}

              <div className="mb-4">
                <label className={label} htmlFor="email">{copy.emailOrUsername}</label>
                <input
                  id="email"
                  className={field}
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className={label} htmlFor="password">{copy.password}</label>
                <input
                  id="password"
                  className={field}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={startReset}
                >
                  {copy.forgotPassword}
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? copy.signingIn : copy.signIn}
              </button>

              {googleBlock}

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {copy.noAccount}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => show("signup")}
                >
                  {copy.signUp}
                </button>
              </p>
            </form>
          ) : mode === "signup" ? (
            <form onSubmit={handleSignUp}>
              <h1 className="mb-5 text-center text-xl font-bold text-foreground">
                {copy.createAccount}
              </h1>

              {signupError && <Notice tone="error">{signupError}</Notice>}

              <div className="mb-4">
                <label className={label} htmlFor="signup-name">{copy.fullName}</label>
                <input
                  id="signup-name"
                  className={field}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-email">{copy.email}</label>
                <input
                  id="signup-email"
                  className={field}
                  type="text"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-password">{copy.password}</label>
                <input
                  id="signup-password"
                  className={field}
                  type="password"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <PasswordStrength password={signupPassword} />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-confirm">{copy.confirmPassword}</label>
                <input
                  id="signup-confirm"
                  className={field}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? copy.signingUp : copy.signUp}
              </button>

              {googleBlock}

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {copy.haveAccount}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => show("signin")}
                >
                  {copy.signIn}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={resetStep === "request" ? handleRequestReset : handleResetPassword}>
              <h1 className="mb-2 text-center text-xl font-bold text-foreground">
                {copy.resetTitle}
              </h1>
              <p className="mb-5 text-center text-sm text-muted-foreground">
                {resetStep === "request" ? copy.resetIntroRequest : copy.resetIntroConfirm}
              </p>

              {resetError && <Notice tone="error">{resetError}</Notice>}
              {!resetError && resetNotice && <Notice tone="success">{resetNotice}</Notice>}

              {resetStep === "request" ? (
                <div className="mb-4">
                  <label className={label} htmlFor="reset-email">{copy.email}</label>
                  <input
                    id="reset-email"
                    className={field}
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className={label} htmlFor="reset-code">{copy.resetCode}</label>
                    <input
                      id="reset-code"
                      className={field}
                      type="text"
                      autoComplete="one-time-code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className={label} htmlFor="reset-password">{copy.newPassword}</label>
                    <input
                      id="reset-password"
                      className={field}
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <PasswordStrength password={newPassword} />
                  </div>

                  <div className="mb-4">
                    <label className={label} htmlFor="reset-confirm">{copy.confirmNewPassword}</label>
                    <input
                      id="reset-confirm"
                      className={field}
                      type="password"
                      autoComplete="new-password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-1 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {resetStep === "request"
                  ? busy ? copy.sending : copy.sendResetCode
                  : busy ? copy.resetting : copy.resetPassword}
              </button>

              {resetStep === "confirm" && (
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {copy.noCode}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      setResetError("");
                      setResetNotice("");
                      setResetStep("request");
                    }}
                  >
                    {copy.sendAnother}
                  </button>
                </p>
              )}

              <p className="mt-3 text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => show("signin")}
                >
                  {copy.backToSignIn}
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
