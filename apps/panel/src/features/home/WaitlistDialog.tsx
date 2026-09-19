import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { getCurrentUser } from "@paapeli/brand/session";
import { isEmailAddress, sendContactRequest } from "@/shared/lib/contactForm";
import { useShellT } from "@/shared/i18n/shell";

/* "Join waitlist" on a product that isn't shipped yet. One field: where to
   reach them. The message goes to the same inbox as the website's contact
   form (see src/shared/lib/contactForm.ts), with the product in the subject
   so the mail says what it is about before anyone opens it.

   `product` is the English product name, not the translated one: the subject
   line has to be legible to whoever reads the inbox, whatever language the
   person filling the form was using. */
export function WaitlistDialog({
  product,
  workspaceName,
  onClose,
}: {
  product: string;
  workspaceName?: string;
  onClose: () => void;
}) {
  const t = useShellT();
  const user = getCurrentUser();
  const [email, setEmail] = useState(user?.email ?? "");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!isEmailAddress(email)) {
      toast.error(t("Enter a valid email address."));
      inputRef.current?.focus();
      return;
    }

    setSending(true);
    try {
      await sendContactRequest({
        subject: `Waitlist request: ${product} (Paapeli panel)`,
        fields: {
          Product: product,
          Email: email.trim(),
          "Signed in as": user?.email,
          Workspace: workspaceName,
          Request: `Add this address to the ${product} waitlist and get in touch.`,
        },
      });
      toast.success(t("Thanks. We will get in touch."));
      onClose();
    } catch {
      toast.error(t("That didn't go through. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Join the waitlist")}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close")}
          className="absolute top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ltr:right-4 rtl:left-4"
        >
          <X className="size-4" />
        </button>

        <h2 className="text-base font-bold text-foreground">{t("Join the waitlist")}</h2>
        <p className="mt-0.5 text-sm font-semibold text-primary">{t(product)}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("Leave your email and we will get in touch when it is ready.")}
        </p>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">{t("Email address")}</span>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              dir="ltr"
              className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending && <Loader2 className="size-4 animate-spin" />}
              {sending ? t("Sending…") : t("Send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
