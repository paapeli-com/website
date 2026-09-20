import { useState } from "react";
import { toast } from "sonner";
import { Building2, Check, Loader2, Plus } from "lucide-react";
import { useCreateWorkspaceMutation, useListWorkspaceProductsQuery } from "@paapeli/api";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader, SkeletonList } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Which workspace is active, and what's subscribed to it — the one page in
   this remote backed entirely by @paapeli/api's workspaces endpoints (no
   placeholder data). Organisation (pages/Organisation.tsx) manages the
   active workspace's members/roles once you're in one; this page is where
   you pick or create the workspace itself. */
export default function Workspaces() {
  const t = useShellT();
  const { workspaces, isLoading, selectedId, selected, setSelectedId } = useWorkspaceSelection();

  const [newName, setNewName] = useState("");
  const createWorkspace = useCreateWorkspaceMutation();

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || createWorkspace.isPending) return;
    createWorkspace.mutate(
      { name },
      {
        onSuccess: (ws) => {
          toast.success(`Workspace "${ws.name}" created`);
          setNewName("");
          setSelectedId(ws.id);
        },
        onError: (error) => toast.error(apiErrorMessage(error, t("Failed to create workspace"))),
      },
    );
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
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-1 p-2">
            {isLoading ? (
              <SkeletonList rows={4} variant="tile" />
            ) : workspaces.length === 0 ? (
              <EmptyState title={t("No workspaces yet")} description={t("Create your first workspace to get started.")} />
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.workspaceId === selectedId;
                return (
                  <button
                    key={ws.workspaceId}
                    onClick={() => setSelectedId(ws.workspaceId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
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
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                        {ws.workspaceName}
                      </span>
                      <span className="block text-xs text-muted-foreground">{t(ws.role)}</span>
                    </span>
                    <Badge tone={ws.membershipStatus === "ACTIVE" ? "ok" : "gray"}>{t(ws.membershipStatus)}</Badge>
                    {isActive && <Check className="size-4 text-primary" />}
                  </button>
                );
              })
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">
              {selected ? `${t("Products")} · ${selected.workspaceName}` : t("Products")}
            </h2>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">{t("Select a workspace to see its subscribed products.")}</p>
            ) : productsLoading ? (
              <SkeletonList rows={2} />
            ) : (workspaceProducts ?? []).length === 0 ? (
              <EmptyState title={t("No products subscribed")} description={t("Subscribe a product below to get started.")} />
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
              </div>
            )}
          </Card>
        </div>

        <Card className="flex h-fit flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground">{t("Create new workspace")}</h2>
          <div>
            <Label>{t("Name")}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("e.g. Smart Factory Ops")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button onClick={handleCreate} disabled={!newName.trim() || createWorkspace.isPending}>
            {createWorkspace.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("Create workspace")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
