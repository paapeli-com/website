import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Plus, X } from "lucide-react";
import { useCreateWorkspaceMutation, type WorkspaceResponse } from "@paapeli/api";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage, isRTLLanguage } from "@/shared/i18n/appLanguage";

/**
 * Creating a workspace, as a dialog over whatever page it was asked from:
 * the account menu and Cloud Management's Workspaces page both open it, so
 * creating one no longer means landing on the page that manages them.
 */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (workspace: WorkspaceResponse) => void;
}) {
  const t = useShellT();
  const language = useAppLanguage();
  const [name, setName] = useState("");
  const createWorkspace = useCreateWorkspaceMutation();

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed || createWorkspace.isPending) return;
    createWorkspace.mutate(
      { name: trimmed },
      {
        onSuccess: (ws) => {
          toast.success(t("Workspace created"), { description: ws.name });
          setName("");
          onOpenChange(false);
          onCreated?.(ws);
        },
        onError: (error) => toast.error(apiErrorMessage(error, t("Failed to create workspace"))),
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !createWorkspace.isPending && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          dir={isRTLLanguage(language) ? "rtl" : "ltr"}
          className="fixed left-1/2 top-1/2 z-[100] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">{t("Create new workspace")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("A workspace holds its own products, devices and members.")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t("Close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form
            className="mt-5 flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t("Name")} <span className="text-destructive">*</span>
              </span>
              <input
                autoFocus
                value={name}
                maxLength={254}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("e.g. Smart Factory Ops")}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                {t("Cancel")}
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim() || createWorkspace.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createWorkspace.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {t("Create workspace")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
