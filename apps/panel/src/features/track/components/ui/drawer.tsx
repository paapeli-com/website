import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* Lightweight slide-over panel (used for the command drawer & add flows). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "absolute inset-y-0 flex w-full max-w-[420px] flex-col bg-card shadow-2xl transition-transform duration-300 ltr:right-0 rtl:left-0",
          open ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="text-base font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
