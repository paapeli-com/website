import type { ReactNode } from "react";
import { Label } from "@/features/factory/components/ui/label";
import { cn } from "@/shared/lib/utils";

/* A form field's label, the one way every form in the panel marks a field:
   a red asterisk when it is required, nothing when it is not. Fields used to
   say "(Optional)" as well, which doubled the noise of every form for no
   information the asterisk did not already give. `optional` stays in the
   signature so existing callers keep compiling; it no longer renders. */
export function FieldLabel({
  children,
  required,
  htmlFor,
  className,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn("mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground", className)}
    >
      {children}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
}

/** Formerly "(Optional)" beside a section heading. Optional sections now say
 *  nothing, as optional fields do, so this renders nothing. */
export function OptionalNote(_props: { className?: string }) {
  return null;
}
