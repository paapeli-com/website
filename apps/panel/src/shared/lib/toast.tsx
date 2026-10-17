import type { ReactNode } from "react";
import { toast as sonner, type ExternalToast } from "sonner";
import { Bell, CircleAlert, Loader2, Smile, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { getAppLanguage, isRTLLanguage, type AppLanguage } from "@/shared/i18n/appLanguage";
import { cn } from "@/shared/lib/utils";

/* The panel's one toast. Every message, from any feature, goes through here
 * and looks the same: a card with a coloured speech-bubble icon, a bold
 * title, the message under it, and a close button.
 *
 * It keeps sonner's call shape (toast.success(message, { description })),
 * so callers did not change; the factory's useToast() hands its calls here
 * too. A message with a description shows the message as the title; a bare
 * message gets its kind's title ("Done!", "Sorry!", ...) above it. */

export type ToastKind = "success" | "info" | "warning" | "error" | "loading";

type Options = ExternalToast;

const STYLE: Record<ToastKind, { icon: LucideIcon; bubble: string }> = {
  success: { icon: Smile, bubble: "bg-emerald-600" },
  info: { icon: Bell, bubble: "bg-sky-500" },
  warning: { icon: CircleAlert, bubble: "bg-amber-400" },
  error: { icon: TriangleAlert, bubble: "bg-red-500" },
  loading: { icon: Loader2, bubble: "bg-sky-500" },
};

const TITLE: Record<ToastKind, Record<AppLanguage, string>> = {
  success: { en: "Done!", fa: "انجام شد!", ar: "تم!" },
  info: { en: "Heads up!", fa: "توجه!", ar: "تنبيه!" },
  warning: { en: "Uh oh...", fa: "دقت کنید!", ar: "انتبه!" },
  error: { en: "Sorry!", fa: "متأسفیم!", ar: "عذرًا!" },
  loading: { en: "Please wait", fa: "لطفاً صبر کنید", ar: "يرجى الانتظار" },
};

const CLOSE: Record<AppLanguage, string> = { en: "Close", fa: "بستن", ar: "إغلاق" };

function ToastCard({ id, kind, title, body }: { id: string | number; kind: ToastKind; title: ReactNode; body?: ReactNode }) {
  const language = getAppLanguage();
  const { icon: Icon, bubble } = STYLE[kind];
  return (
    <div
      dir={isRTLLanguage(language) ? "rtl" : "ltr"}
      role={kind === "error" ? "alert" : "status"}
      className="flex w-[min(380px,calc(100vw-2rem))] items-center gap-3 rounded-xl border border-border bg-card p-3 pe-2 text-card-foreground shadow-lg"
    >
      {/* The bubble: round, with its tail toward the text's start. */}
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full rounded-es-none text-white", bubble)}>
        <Icon className={cn("size-5", kind === "loading" && "animate-spin")} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-foreground">{title}</div>
        {body && <div className="mt-0.5 break-words text-sm text-muted-foreground">{body}</div>}
      </div>
      <button
        type="button"
        onClick={() => sonner.dismiss(id)}
        aria-label={CLOSE[language]}
        className="flex size-7 shrink-0 items-center justify-center self-start rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function show(kind: ToastKind, message: ReactNode, options: Options = {}) {
  const { description, ...rest } = options;
  const hasDescription = description !== undefined && description !== null && description !== "";
  const title = hasDescription ? message : TITLE[kind][getAppLanguage()];
  const body = hasDescription ? (description as ReactNode) : message;
  return sonner.custom((id) => <ToastCard id={id} kind={kind} title={title} body={body} />, {
    ...rest,
    duration: kind === "loading" ? Infinity : rest.duration ?? (kind === "error" ? 6000 : 4000),
  });
}

/** sonner's API, drawn as the panel's toast. A bare toast(...) is informational. */
export const toast = Object.assign(
  (message: ReactNode, options?: Options) => show("info", message, options),
  {
    success: (message: ReactNode, options?: Options) => show("success", message, options),
    info: (message: ReactNode, options?: Options) => show("info", message, options),
    message: (message: ReactNode, options?: Options) => show("info", message, options),
    warning: (message: ReactNode, options?: Options) => show("warning", message, options),
    error: (message: ReactNode, options?: Options) => show("error", message, options),
    loading: (message: ReactNode, options?: Options) => show("loading", message, options),
    dismiss: (id?: string | number) => sonner.dismiss(id),
  },
);
