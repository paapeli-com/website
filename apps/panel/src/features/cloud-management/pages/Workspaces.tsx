import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "@/shared/lib/toast";
import { useNavigate } from "react-router-dom";
import { Building2, Check, Loader2, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import {
  useDeleteWorkspaceMutation,
  useListWorkspaceProductsQuery,
  useRenameWorkspaceMutation,
} from "@paapeli/api";
import { setActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, Input, PageHeader, SkeletonList } from "@/features/cloud-management/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { canInvite } from "@/features/cloud-management/pages/members/shared";
import { useWorkspaceSwitch } from "@/shared/components/WorkspaceSwitchDialog";
import { CreateWorkspaceDialog } from "@/shared/components/CreateWorkspaceDialog";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Which workspace is active, and what's subscribed to it — the one page in
   this remote backed entirely by @paapeli/api's workspaces endpoints (no
   placeholder data). Members (pages/Members.tsx) manages the
   active workspace's members/roles once you're in one; this page is where
   you pick or create the workspace itself. */
export default function Workspaces() {
  const t = useShellT();
  const navigate = useNavigate();
  const { workspaces, isLoading, selectedId, selected, setSelectedId } = useWorkspaceSelection();
  /* Picking a row switches the whole panel's workspace, so it asks and
     reloads exactly as the header's account menu does. */
  const workspaceSwitch = useWorkspaceSwitch();
  const pick = (id: string, name: string) => workspaceSwitch.requestSwitch(id, name, selectedId);

  const [creating, setCreating] = useState(false);

  /* Renaming and deleting are the owner's alone (the gateway's
     MANAGE_WORKSPACE). Renaming happens in place, in the row. */
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const renameWorkspace = useRenameWorkspaceMutation();
  const saveRename = () => {
    if (!renaming || renameWorkspace.isPending) return;
    const name = renaming.name.trim();
    if (!name) return;
    renameWorkspace.mutate(
      { workspaceId: renaming.id, name },
      {
        onSuccess: () => {
          toast.success(t("Workspace renamed"), { description: name });
          setRenaming(null);
        },
        onError: (error) => toast.error(apiErrorMessage(error, t("Failed to rename workspace"))),
      },
    );
  };

  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const deleteWorkspace = useDeleteWorkspaceMutation();
  const confirmDelete = () => {
    if (!deleting || deleteWorkspace.isPending) return;
    const { id, name } = deleting;
    deleteWorkspace.mutate(id, {
      onSuccess: () => {
        toast.success(t("Workspace deleted"), { description: name });
        setDeleting(null);
        // The active one is gone: start over in another, as a switch does.
        if (id === selectedId) {
          const next = workspaces.find((w) => w.workspaceId !== id);
          if (next) setActiveWorkspaceId(next.workspaceId);
          window.location.reload();
        }
      },
      onError: (error) => toast.error(apiErrorMessage(error, t("Failed to delete workspace"))),
    });
  };

  const { data: workspaceProducts, isLoading: productsLoading } = useListWorkspaceProductsQuery(
    selectedId ?? "",
    !!selectedId,
  );

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads
       at those steps in every language, like Home. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Workspaces")}
        description={t("Workspaces you belong to, and the products subscribed to the active one.")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("Create workspace")}
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <TooltipProvider delayDuration={150}>
          <Card className="flex flex-col gap-1 p-2">
            {isLoading ? (
              <SkeletonList rows={4} variant="tile" />
            ) : workspaces.length === 0 ? (
              <EmptyState title={t("No workspaces yet")} description={t("Create your first workspace to get started.")} />
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.workspaceId === selectedId;
                const isOwner = ws.role === "OWNER";
                const isRenaming = renaming?.id === ws.workspaceId;
                return (
                  /* A div, not a button: the row holds its own Invite Member
                     button, and a button cannot sit inside another. */
                  <div
                    key={ws.workspaceId}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isRenaming && pick(ws.workspaceId, ws.workspaceName)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pick(ws.workspaceId, ws.workspaceName);
                      }
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Building2 className="size-4" />
                    </span>
                    {isRenaming ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveRename();
                        }}
                      >
                        <Input
                          autoFocus
                          value={renaming.name}
                          maxLength={254}
                          aria-label={t("Workspace name")}
                          onChange={(e) => setRenaming({ id: ws.workspaceId, name: e.target.value })}
                          onKeyDown={(e) => e.key === "Escape" && setRenaming(null)}
                          className="h-9"
                        />
                        <Button type="submit" className="h-9 px-3 text-xs" disabled={!renaming.name.trim() || renameWorkspace.isPending}>
                          {renameWorkspace.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          {t("Save")}
                        </Button>
                        <Button type="button" variant="ghost" className="h-9 px-2" aria-label={t("Cancel")} onClick={() => setRenaming(null)}>
                          <X className="size-3.5" />
                        </Button>
                      </form>
                    ) : (
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                        {ws.workspaceName}
                      </span>
                      <span className="block text-xs text-muted-foreground">{t(ws.role)}</span>
                    </span>
                    )}
                    {!isRenaming && (<>
                    <Badge tone={ws.membershipStatus === "ACTIVE" ? "ok" : "gray"}>{t(ws.membershipStatus)}</Badge>
                    {/* Members works on the selected workspace, so this row is
                        made the selected one before going there. Only an owner
                        or admin may invite; everyone else gets the reason on
                        hover. The span carries the tooltip, since a disabled
                        button fires no pointer events. */}
                    {canInvite(ws.role) ? (
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ws.workspaceId === selectedId) {
                            navigate("/CloudManagement/members");
                            return;
                          }
                          // Another workspace: ask to switch, as the header
                          // does, then land on its Members.
                          workspaceSwitch.requestSwitch(ws.workspaceId, ws.workspaceName, selectedId, "/CloudManagement/members");
                        }}
                      >
                        <UserPlus className="size-3.5" />
                        {t("Invite Member")}
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" disabled className="pointer-events-none h-8 px-3 text-xs">
                              <UserPlus className="size-3.5" />
                              {t("Invite Member")}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t("You don't have permission to invite members.")}</TooltipContent>
                      </Tooltip>
                    )}
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          className="h-8 px-2"
                          aria-label={t("Rename")}
                          title={t("Rename")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenaming({ id: ws.workspaceId, name: ws.workspaceName });
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          aria-label={t("Delete")}
                          title={t("Delete")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting({ id: ws.workspaceId, name: ws.workspaceName });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                    {isActive && <Check className="size-4 text-primary" />}
                    </>)}
                  </div>
                );
              })
            )}
          </Card>
          </TooltipProvider>

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">
              {selected ? `${t("Products")} · ${selected.workspaceName}` : t("Products")}
            </h2>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">{t("Select a workspace to see its subscribed products.")}</p>
            ) : productsLoading ? (
              <SkeletonList rows={2} />
            ) : (workspaceProducts ?? []).length === 0 ? (
              <EmptyState title={t("No products subscribed")} description={t("A product joins this workspace the first time an owner or admin opens it, and stays active after that.")} />
            ) : (
              <div className="flex flex-col gap-2">
                {workspaceProducts!.map((p) => (
                  <div
                    key={p.workspaceProductId}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">{t(p.productKey)}</span>
                    <Badge tone={p.status === "ACTIVE" ? "ok" : p.status === "FAILED" ? "bad" : "gray"}>
                      {t(p.status)}
                    </Badge>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t("A product joins this workspace the first time an owner or admin opens it, and stays active after that.")}</p>
              </div>
            )}
          </Card>
        </div>

      </div>
      {workspaceSwitch.dialog}
      <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} onCreated={(ws) => setSelectedId(ws.id)} />

      <AlertDialog.Root open={!!deleting} onOpenChange={(o) => !o && !deleteWorkspace.isPending && setDeleting(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/60" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <AlertDialog.Title className="text-lg font-semibold text-foreground">{t("Delete workspace?")}</AlertDialog.Title>
              <AlertDialog.Cancel
                aria-label={t("Close")}
                className="-me-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </AlertDialog.Cancel>
            </div>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              <span dir="auto" className="font-medium text-foreground">{deleting?.name}</span>{" "}
              {t("will no longer be available to you or any of its members.")}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
                {t("Cancel")}
              </AlertDialog.Cancel>
              <AlertDialog.Action
                disabled={deleteWorkspace.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteWorkspace.isPending && <Loader2 className="size-4 animate-spin" />}
                {t("Delete")}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
