import * as React from "react";
import { cn } from "@/shared/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** False for dialogs whose content can't be recovered once dismissed. */
  closeOnBackdrop?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={closeOnBackdrop ? onClose : undefined} className="absolute inset-0 bg-black/40" />
      <div className={cn("relative w-full max-w-md animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-2xl", className)}>
        {title && <h3 className="mb-3 text-lg font-semibold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
