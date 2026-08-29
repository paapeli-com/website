import { useState, type FormEvent } from "react";
import { authService, setApiAuthToken, workspacesService } from "@paapeli/api";
import { signIn as persistSession } from "@paapeli/brand/session";
import { SiteNav } from "./SiteNav";

/* The product-agnostic sign-in page, served at /login for every product on this
   origin. Ported from the hand-written login/index.html so it can share the
   marketing site's header (see SiteNav).

   Two things improved in the move rather than being transcribed:
   - The API call goes through @paapeli/api instead of a hardcoded fetch to
     https://gateway.paapeli.me, so it follows the same base URL as the rest of
     the app — which means the dev proxy applies and a 401 here is readable.
   - The session is written by @paapeli/brand/session's signIn() instead of a
     duplicated localStorage shape that had to be kept in step by hand. */

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

/* Google's mark, kept in its brand colours even while the button is disabled —
   a greyed-out logo reads as broken rather than as "not yet available". The
   button's own muted styling carries that message instead. */
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

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

  const show = (next: "signin" | "signup") => {
    setError("");
    setSignupError("");
    setSuccess("");
    setMode(next);
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { token } = await authService.login({ username: email.trim(), password });
      persistSession(email.trim(), token);
      window.location.href = redirectTarget();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? "Invalid email or password." : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword || !confirmPassword) {
      setSignupError("Email, password, and confirm password are required.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords don't match.");
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
        // Best effort: a brand new account has no workspace, and every
        // product endpoint is scoped to one. A failure here must not block
        // the user from getting in, so it is swallowed and logged.
        try {
          await workspacesService.createWorkspace({ name: "My Workspace" });
        } catch (workspaceError) {
          console.warn("Failed to create default workspace", workspaceError);
        }
        window.location.href = redirectTarget();
        return;
      }
      // No token back (verification required) — send them to sign in.
      setEmail(signupEmail.trim());
      setSuccess("Account created. Check your email to verify it, then sign in.");
      setMode("signin");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSignupError(message || "Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
                Sign in to your account
              </h1>

              {error && <Notice tone="error">{error}</Notice>}
              {success && <Notice tone="success">{success}</Notice>}

              <div className="mb-4">
                <label className={label} htmlFor="email">Email / Username</label>
                <input
                  id="email"
                  className={field}
                  type="text"
                  placeholder="name@host.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className={label} htmlFor="password">Password</label>
                <input
                  id="password"
                  className={field}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>

              {/* Google sign-in is not implemented — there is no OAuth flow
                  behind it. Rendered disabled rather than hidden so the option
                  is visibly planned, and `title` says why on hover. The old
                  static page showed it enabled and answered a click with an
                  error toast, which is a worse way to learn the same thing. */}
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Google sign-in isn't available yet"
                className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-60"
              >
                <GoogleMark />
                Continue with Google
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Google sign-in isn't available yet.
              </p>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => show("signup")}
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h1 className="mb-5 text-center text-xl font-bold text-foreground">
                Create your account
              </h1>

              {signupError && <Notice tone="error">{signupError}</Notice>}

              <div className="mb-4">
                <label className={label} htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  className={field}
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  className={field}
                  type="text"
                  placeholder="name@host.com"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  className={field}
                  type="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className={label} htmlFor="signup-confirm">Confirm password</label>
                <input
                  id="signup-confirm"
                  className={field}
                  type="password"
                  placeholder="Confirm password"
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
                {busy ? "Signing up…" : "Sign up"}
              </button>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => show("signin")}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
