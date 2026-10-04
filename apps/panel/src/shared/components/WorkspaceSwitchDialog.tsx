import { useCallback, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { setActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useShellT } from "@/shared/i18n/shell";
import { useAppLanguage, isRTLLanguage } from "@/shared/i18n/appLanguage";

// `to`: where to land after switching, instead of reloading the same page.
type Pending = { id: string; name: string; to?: string } | null;

/**
 * Switching workspace asks first, then reloads the page. Every open query,
 * cache and in-memory store was built for the old workspace, and the host and
 * the product remotes are separate bundles — a full reload is the one way to
 * be sure none of them keeps showing the previous workspace's data.
 *
 * Only for a switch the user picks from a list. Automatic selection (first
 * workspace on login, a freshly created one) still calls setActiveWorkspaceId.
 */
export function useWorkspaceSwitch() {
  const [pending, setPending] = useState<Pending>(null);

  const requestSwitch = useCallback((id: string, name: string, currentId?: string | null, to?: string) => {
    if (id === currentId) return;
    // Deferred a tick: the pickers live in dropdown menus, and opening a modal
    // while one is still closing can leave the page without pointer events.
    setTimeout(() => setPending({ id, name, to }), 0);
  }, []);

  const confirm = () => {
    if (!pending) return;
    setActiveWorkspaceId(pending.id);
    if (pending.to) window.location.assign(pending.to);
    else window.location.reload();
  };

  const dialog = (
    <WorkspaceSwitchDialog pending={pending} onCancel={() => setPending(null)} onConfirm={confirm} />
  );

  return { requestSwitch, dialog };
}

function WorkspaceSwitchDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useShellT();
  const language = useAppLanguage();
  const [confirming, setConfirming] = useState(false);

  return (
    <AlertDialog.Root open={!!pending} onOpenChange={(o) => { if (!o && !confirming) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          dir={isRTLLanguage(language) ? "rtl" : "ltr"}
          className="fixed left-1/2 top-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-lg"
        >
          <AlertDialog.Title className="text-lg font-semibold text-foreground">
            {t("Switch workspace?")}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {t("The page will reload to show the data of")}{" "}
            <span dir="auto" className="font-medium text-foreground">{pending?.name}</span>.
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              disabled={confirming}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {t("Cancel")}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={confirming}
              onClick={(e) => {
                // Keep the dialog up until the reload takes the page away.
                e.preventDefault();
                setConfirming(true);
                onConfirm();
              }}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {confirming ? t("Loading…") : t("Switch")}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
