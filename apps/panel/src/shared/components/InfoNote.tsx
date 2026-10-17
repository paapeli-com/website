import { Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* A short note on how something behaves, with its rules as a list: the one
   shape for "what you should know" wherever the panel explains a limit,
   so the same rule reads the same in every place it appears. */
export function InfoNote({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground", className)}>
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
        <Info className="size-3.5 shrink-0 text-primary" />
        {title}
      </div>
      <ul className="list-disc space-y-1 ps-5 marker:text-muted-foreground/60">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
