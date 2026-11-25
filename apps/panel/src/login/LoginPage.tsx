import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
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

/* Signing in lands on the account's Home page (src/features/home), not inside
   one product: which product to open is the first thing Home asks. */
const DEFAULT_REDIRECT = "/Home";

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
/** "a, b and c" in the page's language. */
const joinFields = (items: string[], lang: string) => {
  if (items.length < 2) return items.join("");
  const and = lang === "en" ? " and " : " و ";
  const comma = lang === "en" ? ", " : "، ";
  return items.slice(0, -1).join(comma) + and + items[items.length - 1];
};
/* A required field left empty: the same field, outlined in red. */
const fieldInvalid = field.replace("border-border", "border-destructive").replace("focus:border-primary", "focus:border-destructive");
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

/* A password field with an eye to show what was typed. Every password field
   on the page uses it: sign in, sign up and the reset, each with its own
   toggle. The eye sits at the end of the field: the right in English, the
   left in Persian and Arabic. The padding keeps a long password from running
   underneath it. */
function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Left empty on submit: outlined in red. */
  invalid?: boolean;
}) {
  const copy = useCopy();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        className={`${invalid ? fieldInvalid : field} pe-10`}
        aria-invalid={invalid || undefined}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? copy.hidePassword : copy.showPassword}
        title={shown ? copy.hidePassword : copy.showPassword}
        aria-pressed={shown}
        aria-controls={id}
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
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
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "twoFactor">("signin");

  /* A sign-in whose first factor passed on an account with two-factor on:
     the challenge to finish it with, and who it is for. */
  const [challenge, setChallenge] = useState<{ token: string; email: string; name?: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

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

  /* The fields left empty on the last submit. The message names only those,
     and each is outlined in red until something is typed into it. */
  const lang = useAppLanguage();
  const [missing, setMissing] = useState<Set<string>>(() => new Set());
  const requireFields = (fields: [id: string, value: string, label: string][], fail: (message: string) => void) => {
    const empty = fields.filter(([, value]) => !value.trim());
    setMissing(new Set(empty.map(([id]) => id)));
    if (!empty.length) return true;
    const labels = empty.map(([, , text]) => (lang === "en" ? text.toLowerCase() : text));
    fail(copy.errMissingFields.replace("{fields}", joinFields(labels, lang)));
    return false;
  };
  const fieldFor = (id: string) => (missing.has(id) ? fieldInvalid : field);
  const filled = (id: string) => {
    if (missing.has(id)) setMissing((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  /* The gateway ignores a second request for a code within a minute, so
     "Send another" waits out a little more than that, counting down. */
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const show = (next: "signin" | "signup" | "reset" | "twoFactor") => {
    setError("");
    setSignupError("");
    setResetError("");
    setSuccess("");
    setMissing(new Set());
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
    if (!requireFields([["email", email, copy.emailOrUsername], ["password", password, copy.password]], setError)) return;
    setError("");
    setBusy(true);
    try {
      const result = await authService.login({ username: email.trim(), password });
      if (result.twoFactorRequired && result.challengeToken) {
        askForSecondFactor(result.challengeToken, email.trim());
        return;
      }
      const { token } = result;
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

  /** The first factor passed; the account wants its second. */
  const askForSecondFactor = (token: string, who: string, name?: string) => {
    setChallenge({ token, email: who, name });
    setTwoFactorCode("");
    setTwoFactorError("");
    setMode("twoFactor");
  };

  const handleTwoFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (!challenge || !twoFactorCode.trim()) return;
    setTwoFactorError("");
    setBusy(true);
    try {
      const { token } = await authService.loginTwoFactor(challenge.token, twoFactorCode.trim());
      persistSession(challenge.email, token, challenge.name);
      setApiAuthToken(token);
      await ensureWorkspaceSetup();
      window.location.href = redirectTarget();
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; attemptsLeft?: number } } })?.response?.data;
      if (data?.code === "CODE_INVALID") {
        setTwoFactorError(copy.errTwoFactorWrong.replace("{n}", String(data.attemptsLeft ?? 0)));
      } else {
        // Expired, spent or too many wrong codes: the sign-in starts over.
        setChallenge(null);
        setPassword("");
        setError(copy.errTwoFactorExpired);
        setMode("signin");
      }
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !requireFields(
        [
          ["signup-email", signupEmail, copy.email],
          ["signup-password", signupPassword, copy.password],
          ["signup-confirm", confirmPassword, copy.confirmPassword],
        ],
        setSignupError,
      )
    ) return;
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
      /* The gateway answers with a ProblemDetail: the text is in `detail`,
         not `message`, and a taken email is a 409 ENTITY_ALREADY_EXISTS.
         That one is said in the reader's language; anything else shows the
         gateway's own text if there is one. */
      const response = (err as {
        response?: { status?: number; data?: { code?: string; detail?: string; message?: string } };
      })?.response;
      const data = response?.data;
      if (response?.status === 409 || data?.code === "ENTITY_ALREADY_EXISTS") {
        setEmail(signupEmail.trim());
        setSignupError(copy.errEmailTaken);
      } else {
        setSignupError(data?.message || data?.detail || copy.errSignUpFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireFields([["reset-email", resetEmail, copy.email]], setResetError)) return;
    setResetError("");
    setBusy(true);
    try {
      await authService.requestPasswordReset({ email: resetEmail.trim() });
      /* The endpoint answers the same way whether or not the account exists,
         and whether or not the request was throttled — so say only what is
         true for every one of those cases and move on to the code step. */
      setResetNotice(copy.okResetCodeSent);
      setResetStep("confirm");
      setResendAt(Date.now() + 90_000);
      setNow(Date.now());
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setResetError(message || copy.errBadEmail);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !requireFields(
        [
          ["reset-code", resetCode, copy.resetCode],
          ["reset-password", newPassword, copy.newPassword],
          ["reset-confirm", newPasswordConfirm, copy.confirmNewPassword],
        ],
        setResetError,
      )
    ) return;
    if (newPassword !== newPasswordConfirm) {
      setResetError(copy.errPasswordsDontMatch);
      return;
    }
    setResetError("");
    setBusy(true);
    try {
      await authService.resetPassword({
        code: resetCode.trim(),
        email: resetEmail.trim(),
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
      /* A wrong code can be tried again, up to five times. A right one is
         spent even when the update fails, so anything else needs a new code. */
      setResetError(
        status === 404 ? copy.errCodeWrong : `${message || copy.errResetFailed} ${copy.retryWithNewCode}`,
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
        const result = await authService.googleSignIn({ idToken });
        const { email: googleEmail, name } = decodeGoogleIdentity(idToken);
        if (result.twoFactorRequired && result.challengeToken) {
          askForSecondFactor(result.challengeToken, googleEmail ?? "", name);
          setBusy(false);
          return;
        }
        const { token } = result;
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

          {mode === "twoFactor" ? (
            <form onSubmit={handleTwoFactor}>
              <h1 className="mb-2 text-center text-xl font-bold text-foreground">
                {copy.twoFactorTitle}
              </h1>
              <p className="mb-5 text-center text-sm text-muted-foreground">{copy.twoFactorHint}</p>

              {twoFactorError && <Notice tone="error">{twoFactorError}</Notice>}

              <div className="mb-4">
                <label className={label} htmlFor="two-factor-code">{copy.twoFactorCode}</label>
                <input
                  id="two-factor-code"
                  className={`${field} text-center tracking-[0.3em]`}
                  type="text"
                  dir="ltr"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={16}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value
                    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
                    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))))}
                />
              </div>

              <button
                type="submit"
                disabled={busy || !twoFactorCode.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? copy.verifying : copy.verify}
              </button>

              <p className="mt-5 text-center text-sm">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => { setChallenge(null); show("signin"); }}
                >
                  {copy.backToSignIn}
                </button>
              </p>
            </form>
          ) : mode === "signin" ? (
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
                  className={fieldFor("email")}
                  aria-invalid={missing.has("email") || undefined}
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); filled("email"); }}
                />
              </div>

              <div className="mb-2">
                <label className={label} htmlFor="password">{copy.password}</label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(v) => { setPassword(v); filled("password"); }}
                  invalid={missing.has("password")}
                />
              </div>

              {/* In English this sits at the end of the line, under the right
                  edge of the field. In Persian and Arabic `justify-end` is the
                  left edge, which put it opposite the labels; it belongs on
                  the same side they are on. */}
              <div className="flex justify-end rtl:justify-start">
                <button
                  type="button"
                  className="text-start text-sm font-medium text-primary hover:underline"
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
                  className={fieldFor("signup-email")}
                  aria-invalid={missing.has("signup-email") || undefined}
                  type="text"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); filled("signup-email"); }}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-password">{copy.password}</label>
                <PasswordInput
                  id="signup-password"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(v) => { setSignupPassword(v); filled("signup-password"); }}
                  invalid={missing.has("signup-password")}
                />
                <PasswordStrength password={signupPassword} />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-confirm">{copy.confirmPassword}</label>
                <PasswordInput
                  id="signup-confirm"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(v) => { setConfirmPassword(v); filled("signup-confirm"); }}
                  invalid={missing.has("signup-confirm")}
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
                    className={fieldFor("reset-email")}
                    aria-invalid={missing.has("reset-email") || undefined}
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => { setResetEmail(e.target.value); filled("reset-email"); }}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className={label} htmlFor="reset-code">{copy.resetCode}</label>
                    <input
                      id="reset-code"
                      className={fieldFor("reset-code")}
                      aria-invalid={missing.has("reset-code") || undefined}
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      autoComplete="one-time-code"
                      value={resetCode}
                      onChange={(e) => { setResetCode(e.target.value); filled("reset-code"); }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className={label} htmlFor="reset-password">{copy.newPassword}</label>
                    <PasswordInput
                      id="reset-password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(v) => { setNewPassword(v); filled("reset-password"); }}
                      invalid={missing.has("reset-password")}
                    />
                    <PasswordStrength password={newPassword} />
                  </div>

                  <div className="mb-4">
                    <label className={label} htmlFor="reset-confirm">{copy.confirmNewPassword}</label>
                    <PasswordInput
                      id="reset-confirm"
                      autoComplete="new-password"
                      value={newPasswordConfirm}
                      onChange={(v) => { setNewPasswordConfirm(v); filled("reset-confirm"); }}
                      invalid={missing.has("reset-confirm")}
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

              {resetStep === "confirm" && resendSeconds > 0 && (
                <p className="mt-5 text-center text-sm text-muted-foreground" aria-live="polite">
                  {copy.resendIn.replace("{s}", resendSeconds.toLocaleString(lang))}
                </p>
              )}
              {resetStep === "confirm" && resendSeconds === 0 && (
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
