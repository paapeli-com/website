import { ReactNode, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

interface KpiSectionProps {
  /** Stable key for persisting the hidden/visible state per page */
  storageKey: string;
  children: ReactNode;
  /** Optional label for the toggle tooltip */
  label?: string;
  className?: string;
}

const PREFIX = "paapeli.kpi.visible.";

export const KpiSection = ({ storageKey, children, label = "KPI cards", className }: KpiSectionProps) => {
  const key = PREFIX + storageKey;
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setVisible(raw === "1");
    } catch {}
  }, [key]);

  const toggle = () => {
    setVisible((v) => {
      const next = !v;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const ToggleBtn = (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggle}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 bg-background/80 backdrop-blur-sm shadow-sm"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
            aria-expanded={visible}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {visible ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{visible ? `Hide ${label}` : `Show ${label}`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!visible) {
    // Collapsed: render just the toggle as a compact inline bar (no big empty row)
    return (
      <div className={cn("flex justify-end", className)}>
        {ToggleBtn}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-1 end-1 z-10">{ToggleBtn}</div>
      {children}
    </div>
  );
};
