import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, CircleAlert, Loader2, MessageSquare } from "lucide-react";
import {
  IRANIAN_MOBILE_PATTERN,
  useConfirmPhoneVerificationMutation,
  useSendPhoneVerificationMutation,
  type PhoneVerificationResponse,
  type UserPhoneResponse,
} from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { InfoNote } from "@/shared/components/InfoNote";
import { apiProblem } from "@/shared/lib/apiError";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { cn } from "@/shared/lib/utils";

/* Proving the saved phone with a texted code (POST .../phone/verification,
 * then .../confirm). Only a verified number is ever texted an alarm, so the
 * rules the gateway holds a code to are spelled out under the field.
 *
 * `stored` is the number as saved; `typed` is what the field holds now. A
 * number not yet saved cannot be verified: the code goes to the saved one. */

const fill = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value), text);

/** Seconds from now until an ISO time, never below zero. */
const secondsUntil = (iso: string | undefined, now: number) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000)) : 0;

export function PhoneVerification({ stored, typed }: { stored: UserPhoneResponse | undefined; typed: string }) {
  const t = useShellT();
  const language = useAppLanguage();
  const sendCode = useSendPhoneVerificationMutation();
  const confirm = useConfirmPhoneVerificationMutation();
  const [pending, setPending] = useState<PhoneVerificationResponse | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // A ticking clock only while a code is out, for the two countdowns.
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending]);

  // A different number saved since the code went out makes that code moot.
  useEffect(() => {
    if (pending && stored?.phone !== pending.phone) setPending(null);
  }, [stored?.phone, pending]);

  const clock = (seconds: number) =>
    localizeDigits(language, `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);

  const unsaved = !stored || typed !== stored.phone;
  const verified = !unsaved && !!stored?.verified;
  const iranian = IRANIAN_MOBILE_PATTERN.test(typed);
  const expiresIn = secondsUntil(pending?.expiresAt, now);
  const resendIn = secondsUntil(pending?.resendAvailableAt, now);

  const explain = (error: unknown) => {
    const problem = apiProblem(error);
    const wait = clock(problem.retryAfterSeconds ?? 60);
    switch (problem.code) {
      case "RESEND_TOO_SOON":
        return fill(t("Wait {time} before asking for another code."), { time: wait });
      case "HOURLY_LIMIT":
        return t("This number has had 5 codes in the last hour. Try again later.");
      case "CODE_INVALID":
        return fill(t("That code is not right. {count} tries left."), {
          count: localizeDigits(language, problem.attemptsLeft ?? 0),
        });
      case "TOO_MANY_ATTEMPTS":
        return t("Too many wrong codes. Ask for a new one.");
      case "CODE_EXPIRED":
      case "NO_PENDING_CODE":
        return t("This code has expired. Ask for a new one.");
      case "UNSUPPORTED_NUMBER":
        return t("Text messages only go to Iranian mobile numbers (+989...).");
      case "PHONE_NOT_SET":
        return t("Save the number first.");
      default:
        return t("Text messages are not available right now. Try again later.");
    }
  };

  const requestCode = async () => {
    try {
      const sent = await sendCode.mutateAsync();
      setPending(sent);
      setCode("");
      setNow(Date.now());
      toast.success(fill(t("Code sent to {phone}."), { phone: sent.phone }));
    } catch (error) {
      const problem = apiProblem(error);
      if (problem.code === "ALREADY_VERIFIED") return;
      toast.error(explain(error));
    }
  };

  const submitCode = async () => {
    try {
      await confirm.mutateAsync(code);
      setPending(null);
      setCode("");
      toast.success(t("Your phone number is verified."));
    } catch (error) {
      const problem = apiProblem(error);
      if (problem.code === "TOO_MANY_ATTEMPTS" || problem.code === "CODE_EXPIRED" || problem.code === "NO_PENDING_CODE") {
        setPending(null);
      }
      toast.error(explain(error));
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
      {typed !== "" && (
        <div className="flex flex-wrap items-center gap-3">
          {verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="size-3.5" />
              {t("Verified")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <CircleAlert className="size-3.5" />
              {t("Not verified")}
            </span>
          )}

          {!verified && !pending && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={requestCode}
              disabled={unsaved || !iranian || sendCode.isPending}
            >
              {sendCode.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
              {t("Verify by SMS")}
            </Button>
          )}

          {!verified && unsaved && (
            <span className="text-xs text-muted-foreground">{t("Save the number first.")}</span>
          )}
          {!verified && !unsaved && !iranian && (
            <span className="text-xs text-muted-foreground">
              {t("Text messages only go to Iranian mobile numbers (+989...).")}
            </span>
          )}
        </div>
      )}

      {pending && !verified && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          {pending.sandboxCode && (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              {fill(t("Test mode: no SMS is sent. Your code is {code}."), { code: pending.sandboxCode })}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9۰-۹٠-٩]/g, "")
                .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
                .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
                .slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && void submitCode()}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              placeholder={t("6-digit code")}
              className="h-9 w-36 text-center tracking-[0.3em]"
              autoFocus
            />
            <Button size="sm" onClick={submitCode} disabled={code.length !== 6 || confirm.isPending || expiresIn === 0} className="gap-2">
              {confirm.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("Confirm")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={requestCode}
              disabled={resendIn > 0 || sendCode.isPending}
            >
              {resendIn > 0 ? fill(t("Resend code in {time}"), { time: clock(resendIn) }) : t("Resend code")}
            </Button>
          </div>
          <span className={cn("text-xs", expiresIn > 0 ? "text-muted-foreground" : "text-destructive")}>
            {expiresIn > 0
              ? fill(t("The code expires in {time}."), { time: clock(expiresIn) })
              : t("This code has expired. Ask for a new one.")}
          </span>
        </div>
      )}

      <InfoNote
        title={t("About text messages")}
        items={[
          t("Alarm text messages only go to a verified number."),
          t("A code is valid for 2 minutes and 5 tries. You can ask for a new one after 60 seconds, up to 5 times an hour."),
          t("Changing the number means verifying it again."),
          t("Text messages only go to Iranian mobile numbers (+989...)."),
        ]}
      />
    </div>
  );
}
