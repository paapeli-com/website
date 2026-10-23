import type { ReactNode } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Label } from "@/features/factory/components/ui/label";
import { cn } from "@/shared/lib/utils";

/* A form field's label, the one way every Smart Factory form marks a field:
   a red asterisk when it is required, "(Optional)" beside the label when it
   is optional — never in the placeholder. Create Dashboard set the
   convention; the other forms follow it from here. */
export function FieldLabel({
  children,
  required,
  optional,
  htmlFor,
  className,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <Label
      htmlFor={htmlFor}
      className={cn("mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground", className)}
    >
      {children}
      {required && <span className="text-destructive">*</span>}
      {optional && <span className="font-normal text-muted-foreground">({t("optional")})</span>}
    </Label>
  );
}

/** "(Optional)" on its own, beside a section heading rather than a field. */
export function OptionalNote({ className }: { className?: string }) {
  const { t } = useLanguage();
  return <span className={cn("text-sm text-muted-foreground", className)}>({t("optional")})</span>;
}
