import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { WorkOrderApiSource, WorkOrderApiWorkType } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/factory/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/features/factory/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import type { WorkOrderPriority, WorkOrderStatus } from "@/features/factory/hooks/useWorkOrders";

export const PRIORITY_BADGE: Record<WorkOrderPriority, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

/** The dot beside a status, as the device list marks online and offline. */
export const STATUS_DOT: Record<WorkOrderStatus, string> = {
  Open: "bg-red-500",
  "In Progress": "bg-blue-500",
  "On Hold": "bg-amber-500",
  Done: "bg-emerald-500",
  Cancelled: "bg-muted-foreground/50",
};

export const STATUSES: WorkOrderStatus[] = ["Open", "In Progress", "On Hold", "Done", "Cancelled"];
export const PRIORITIES: WorkOrderPriority[] = ["Critical", "High", "Medium", "Low"];
export const SOURCES: WorkOrderApiSource[] = ["MANUAL", "ALARM", "ANOMALY", "FORECAST"];
export const WORK_TYPES: WorkOrderApiWorkType[] = ["REACTIVE", "PREVENTIVE", "OTHER"];
export const TEAMS = ["mechanical", "electrical", "instrumentation", "operations"] as const;

/** The words for a work order's statuses, priorities, sources, types and teams. */
export const useWorkOrderLabels = () => {
  const { t } = useLanguage();
  return useMemo(() => {
    const status: Record<WorkOrderStatus, string> = {
      Open: t("woStatusOpen"),
      "In Progress": t("woStatusInProgress"),
      "On Hold": t("woStatusOnHold"),
      Done: t("woStatusDone"),
      Cancelled: t("woStatusCancelled"),
    };
    const priority: Record<WorkOrderPriority, string> = {
      Critical: t("woPriorityCritical"),
      High: t("woPriorityHigh"),
      Medium: t("woPriorityMedium"),
      Low: t("woPriorityLow"),
    };
    const source: Record<WorkOrderApiSource, string> = {
      MANUAL: t("woSourceManual"),
      ALARM: t("woSourceAlarm"),
      ANOMALY: t("woSourceAnomaly"),
      FORECAST: t("woSourceForecast"),
    };
    const workType: Record<WorkOrderApiWorkType, string> = {
      REACTIVE: t("woTypeReactive"),
      PREVENTIVE: t("woTypePreventive"),
      OTHER: t("woTypeOther"),
    };
    const teams: Record<string, string> = {
      mechanical: t("teamMechanical"),
      electrical: t("teamElectrical"),
      instrumentation: t("teamInstrumentation"),
      operations: t("teamOperations"),
    };
    return {
      status: (s: WorkOrderStatus) => status[s],
      priority: (p: WorkOrderPriority) => priority[p],
      source: (s: WorkOrderApiSource) => source[s],
      workType: (w: WorkOrderApiWorkType) => workType[w],
      // A team written by hand through the API still shows, as it was written.
      team: (team: string) => teams[team] || team,
    };
  }, [t]);
};

export const StatusPill = ({ status }: { status: WorkOrderStatus }) => {
  const labels = useWorkOrderLabels();
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {labels.status(status)}
    </span>
  );
};

export interface PickerOption {
  value: string;
  label: string;
  /** A second, quieter line: a device's location, a member's email. */
  hint?: string;
}

/**
 * A dropdown with a search box, for lists too long to scroll: devices,
 * locations, members. Shows the first `limit` matches and narrows as you type.
 */
export const SearchSelect = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  noneLabel,
  disabled,
  limit = 60,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  /** When set, the list starts with this entry, which clears the choice. */
  noneLabel?: string;
  disabled?: boolean;
  limit?: number;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q))
      : options;
    return matches.slice(0, limit);
  }, [options, query, limit]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal h-10 px-3", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[260px]" align="start">
        {/* Filtering is done above, on label and hint; cmdk only draws the list. */}
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {noneLabel && !query && (
                <CommandItem value="__none" onSelect={() => pick("")}>
                  <Check className={cn("h-4 w-4 me-2", value ? "opacity-0" : "opacity-100")} />
                  <span className="text-muted-foreground">{noneLabel}</span>
                </CommandItem>
              )}
              {shown.map((o) => (
                <CommandItem key={o.value} value={o.value} onSelect={() => pick(o.value)}>
                  <Check className={cn("h-4 w-4 me-2 shrink-0", o.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/** The statuses that ask for a word of explanation before the order moves. */
export type ExplainedStatus = "On Hold" | "Cancelled" | "Done";

/**
 * Asks why before an order is put on hold or cancelled, and what was done
 * before it is finished. The first two need an answer; the last is optional.
 */
export const StatusNoteDialog = ({
  target,
  onClose,
  onConfirm,
}: {
  /** The status the order is moving to; null keeps the dialog closed. */
  target: ExplainedStatus | null;
  onClose: () => void;
  onConfirm: (status: ExplainedStatus, note: string) => Promise<void> | void;
}) => {
  const { t, isRTL } = useLanguage();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (target) {
      setNote("");
      setMissing(false);
    }
  }, [target]);

  const required = target === "On Hold" || target === "Cancelled";
  const title =
    target === "On Hold" ? t("woHoldAction") : target === "Cancelled" ? t("woStatusCancelled") : t("markDone");
  const question =
    target === "On Hold" ? t("woHoldReason") : target === "Cancelled" ? t("woCancelReason") : t("woDoneNote");

  const confirm = async () => {
    if (!target || busy) return;
    if (required && !note.trim()) {
      setMissing(true);
      return;
    }
    setBusy(true);
    try {
      await onConfirm(target, note.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{question}</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="sr-only">{question}</Label>
          <Textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setMissing(false); }}
            rows={3}
            maxLength={500}
            autoFocus
          />
          {missing && <p className="mt-1.5 text-xs text-destructive">{t("woReasonRequired")}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t("cancel")}</Button>
          <Button onClick={confirm} disabled={busy}>{t("woApply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
