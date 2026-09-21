import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent } from "@/features/factory/components/ui/card";

/* The chrome the alarm tabs share, so the four of them open the same way.
   Each tab says what it is and, in one line, what it does — and any tab that
   leads somewhere deeper offers the same way back. */

/** A tab's heading: its name, one line about it, and whatever it offers. */
export const SectionHead = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

/** Back out of a sub-view. The arrow points the way the text runs. */
export const BackLink = ({ label, onClick }: { label: string; onClick: () => void }) => {
  const { isRTL } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
      {label}
    </button>
  );
};

/** One of the doors on the Settings tab: a name, a line about it, a way in. */
export const EntryCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  const { isRTL } = useLanguage();
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer outline-none transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <CardContent className="flex items-start gap-3 pt-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className={`mt-1 size-4 shrink-0 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
      </CardContent>
    </Card>
  );
};
