import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * The empty state for a list nobody has filled in yet: an outline of the thing
 * that is missing, and the one button that creates it.
 *
 * Distinct from <NoData/>, which says a surface has no backend behind it, and
 * from a filtered-to-nothing state, which offers "clear filters" instead. This
 * one means "the list is genuinely empty, and here is how to start it", so it
 * is the only one of the three that carries an action.
 *
 * Rendered inside the table body rather than in place of the table, so the
 * columns stay on screen and the page keeps its shape while it is empty.
 */
export const AddFirst = ({
  icon: Icon,
  label,
  onAction,
  className,
}: {
  icon: LucideIcon;
  /** Already translated by the caller — "Add Your First Device". */
  label: string;
  onAction: () => void;
  className?: string;
}) => (
  <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}>
    <Icon className="h-12 w-12 text-muted-foreground/50" />
    <Button onClick={onAction} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      <Plus className="h-4 w-4 me-2" />
      {label}
    </Button>
  </div>
);

export default AddFirst;
