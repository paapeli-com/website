import type { ReactNode } from "react";
import { toast as appToast } from "@/shared/lib/toast";

/* The factory's toast({ title, description, variant }) call, drawn by the
   panel's one toast (shared/lib/toast). It used to drive a toaster of its
   own; now every feature's messages look and stack the same. A destructive
   toast is an error; anything else reports something done. */

type Toast = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive" | "outline" | null;
  duration?: number;
  /** Kept for callers that pass one; the shared toast has no action slot. */
  action?: ReactNode;
};

function toast({ title, description, variant, duration }: Toast) {
  const show = variant === "destructive" ? appToast.error : appToast.success;
  const id = title !== undefined && title !== null && title !== ""
    ? show(title, { description: description ?? undefined, duration })
    : show(description ?? "", { duration });
  return {
    id: String(id),
    dismiss: () => appToast.dismiss(id),
    update: (next: Toast) => {
      appToast.dismiss(id);
      return toast(next);
    },
  };
}

function useToast() {
  return {
    toasts: [] as never[],
    toast,
    dismiss: (toastId?: string) => appToast.dismiss(toastId),
  };
}

export { useToast, toast };
