import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/features/factory/components/ui/button";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_GPU_PATH } from "@/shell/nav/cloudServerNav";
import { useT } from "./i18n";

/* The frame both create pages share, taken from Smart Factory's Create alert
 * rule page (AlertRuleForm) so the two read as one panel: the same three-level
 * breadcrumb, the same text-2xl title with one line under it, and the same
 * sticky footer of Cancel, Back and the primary action.
 */

export const SERVERS_PATH = `${CLOUD_SERVER_BASE}/servers`;
export const NEW_SERVER_PATH = `${SERVERS_PATH}/new`;
export const CREATE_SERVER_PATH = `${SERVERS_PATH}/create`;
export const SERVER_CREATED_PATH = `${SERVERS_PATH}/created`;
/* GPU servers: their own list and their own wizard, the same pages in GPU
   mode. */
export const GPU_SERVERS_PATH = CLOUD_SERVER_GPU_PATH;
export const CREATE_GPU_SERVER_PATH = `${GPU_SERVERS_PATH}/create`;
export const AUTOSCALE_PATH = `${CLOUD_SERVER_BASE}/auto-scale`;
export const CREATE_AUTOSCALE_PATH = `${AUTOSCALE_PATH}/create`;
export const groupPath = (id: string) => `${AUTOSCALE_PATH}/${id}`;
export const DEDICATED_PATH = `${CLOUD_SERVER_BASE}/dedicated-servers`;
export const CREATE_DEDICATED_PATH = `${DEDICATED_PATH}/create`;
export const IMAGES_PATH = `${CLOUD_SERVER_BASE}/images`;
export const UPLOAD_IMAGE_PATH = `${IMAGES_PATH}/upload`;
export const BACKUPS_PATH = `${CLOUD_SERVER_BASE}/backups`;
export const CREATE_BACKUP_PATH = `${BACKUPS_PATH}/create`;
export const SNAPSHOTS_PATH = `${CLOUD_SERVER_BASE}/snapshots`;
export const VOLUMES_PATH = `${CLOUD_SERVER_BASE}/volumes`;
export const CREATE_VOLUME_PATH = `${VOLUMES_PATH}/create`;
export const FIREWALLS_PATH = `${CLOUD_SERVER_BASE}/security-groups`;
export const CREATE_FIREWALL_PATH = `${FIREWALLS_PATH}/create`;
export const firewallPath = (id: string) => `${FIREWALLS_PATH}/${id}`;
export const SSH_KEYS_PATH = `${CLOUD_SERVER_BASE}/ssh-keys`;
export const CREATE_SSH_KEY_PATH = `${SSH_KEYS_PATH}/create`;
export const NETWORKS_PATH = `${CLOUD_SERVER_BASE}/vpc`;
export const CREATE_NETWORK_PATH = `${NETWORKS_PATH}/create`;
export const networkPath = (id: string) => `${NETWORKS_PATH}/${id}`;

export function CreateHeader({
  description,
  title,
  gpu,
}: {
  description: string;
  title?: string;
  /** Under GPU Servers rather than Cloud Server. */
  gpu?: boolean;
}) {
  const t = useT();
  const heading = title ?? t("Create cloud server");
  const shellT = useShellT();
  const navigate = useNavigate();
  const listPath = gpu ? GPU_SERVERS_PATH : SERVERS_PATH;
  return (
    <>
      {/* Compute > Cloud Server > Create cloud server: the sidebar group, the
          page, then this one, as Alarms > Rules > Create rule is. */}
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(listPath)} className="cursor-pointer">
              {shellT("Compute")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(listPath)} className="cursor-pointer">
              {shellT(gpu ? "GPU Servers" : "Cloud Server")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{heading}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  );
}

/** A list page's breadcrumb, the create pages' component: the sidebar group,
    then the page, the last item being where you are. */
export function PageBreadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  const navigate = useNavigate();
  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === items.length - 1 || !item.path ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink onClick={() => navigate(item.path!)} className="cursor-pointer">
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type Action = { label: string; onClick: () => void; disabled?: boolean };

/** AlertRuleForm's footer, button for button. */
export function CreateFooter({ cancel, back, primary }: { cancel: Action; back?: Action; primary: Action }) {
  const { isRTL } = useLanguage();
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <div className={cn("flex items-center justify-end gap-3", isRTL && "flex-row-reverse")}>
        <Button variant="ghost" onClick={cancel.onClick} className="min-w-[100px]">
          {cancel.label}
        </Button>
        {back && (
          <Button variant="outline" onClick={back.onClick} disabled={back.disabled} className="min-w-[100px]">
            {back.label}
          </Button>
        )}
        <Button
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {primary.label}
        </Button>
      </div>
    </div>
  );
}

/** Text cut with an ellipsis when its column is too narrow, carrying the full
    text as a tooltip then and only then. Re-measured on resize, so a column
    that widens drops the tooltip again. */
export function TruncatedText({
  text,
  className,
  ltr,
  mono,
}: {
  text: string;
  className?: string;
  ltr?: boolean;
  mono?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);
  return (
    <span
      ref={ref}
      dir={ltr ? "ltr" : undefined}
      title={cut ? text : undefined}
      className={cn("block min-w-0 truncate", mono && "font-mono text-xs", className)}
    >
      {text}
    </span>
  );
}

/** The page frame: the padding the factory pages sit in. */
export function CreatePage({ children }: { children: ReactNode }) {
  return <div className="p-4 lg:p-6">{children}</div>;
}

/** Cloud Server's confirmations: one frame everywhere, with a tick to
    confirm first wherever data is lost. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  acknowledge,
  destructive,
  confirmLabel,
  onConfirm,
  blocked,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  acknowledge?: string;
  destructive?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  /** Nothing can be done yet; the description says why. */
  blocked?: boolean;
}) {
  const { t: ft, isRTL } = useLanguage();
  const fx = ft as (k: string) => string;
  const [agreed, setAgreed] = useState(false);
  useEffect(() => setAgreed(false), [open]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[460px]">
        <DialogHeader className={isRTL ? "text-right" : ""}>
          <DialogTitle className={isRTL ? "text-right" : ""}>{title}</DialogTitle>
          <DialogDescription className={isRTL ? "text-right" : ""}>{description}</DialogDescription>
        </DialogHeader>
        {acknowledge && (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
            <span>{acknowledge}</span>
          </label>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} disabled={blocked || (!!acknowledge && !agreed)} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Work under way, as a bar and a percentage worked out from when it began
    and how long it takes. Wherever the console waits on something: a server
    or disk being made, a backup or snapshot, a restore, an extension. */
export function ProgressStatus({
  label,
  startedAt,
  durationMs,
  now,
  tone = "sky",
}: {
  label: string;
  startedAt: number;
  durationMs: number;
  now: number;
  /** Amber for work that replaces data (a restore). */
  tone?: "sky" | "amber";
}) {
  const { formatNumber, isRTL } = useLanguage();
  /* Never 100 while still running: the row turns ready instead. */
  const pct = Math.min(99, Math.max(1, Math.floor(((now - startedAt) / durationMs) * 100)));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            "inline-flex min-w-0 items-center gap-1.5 font-medium",
            tone === "sky" ? "text-sky-700 dark:text-sky-400" : "text-amber-700 dark:text-amber-400",
          )}
        >
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatNumber(pct)}
          {isRTL ? "٪" : "%"}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", tone === "sky" ? "bg-sky-500" : "bg-amber-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* Deleting what matters most (a server, an Auto Scale group, a dedicated
   server) takes this phrase typed out, the same in every language. */
export const DELETE_PHRASE = "delete me";
export const deletePhraseOk = (value: string) => value.trim().toLowerCase() === DELETE_PHRASE;

export function TypeToConfirm({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT();
  /* The phrase sits inside the sentence in every language, set apart. */
  const [before, after] = t("To confirm, type {phrase} below.", { phrase: "\u0000" }).split("\u0000");
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-medium text-foreground">
        {t("Confirm deletion")} <span className="text-xs font-normal text-destructive">({t("Required")})</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {before}
        <span dir="ltr" className="rounded bg-muted px-1 font-mono font-medium text-foreground">
          {DELETE_PHRASE}
        </span>
        {after}
      </p>
      <Input
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DELETE_PHRASE}
        autoComplete="off"
        spellCheck={false}
        aria-label={t("Confirm deletion")}
        className="mt-2 h-9"
      />
    </div>
  );
}
