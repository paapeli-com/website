import { useState } from "react";
import { toast } from "sonner";
import { Check, LayoutGrid, Loader2, Plus } from "lucide-react";
import { useCreateWorkspaceMutation, useListWorkspaceProductsQuery } from "@paapeli/api";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, Field, Input, Label } from "@/features/cloud-management/ui";
import { cn } from "@/shared/lib/utils";
import { apiErrorMessage } from "@/shared/lib/apiError";

export default function ProfilePanel() {
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
        onError: (error) => toast.error(apiErrorMessage(error, "Failed to create workspace")),
      },
    );
  };

  const { data: workspaceProducts, isLoading: productsLoading } = useListWorkspaceProductsQuery(
    selectedId ?? "",
    !!selectedId,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading workspaces…
            </div>
          ) : workspaces.length === 0 ? (
            <EmptyState title="No workspaces yet" description="Create your first workspace to get started." />
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
                    <LayoutGrid className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                      {ws.workspaceName}
                    </span>
                    <span className="block text-xs text-muted-foreground">{ws.role}</span>
                  </span>
                  <Badge tone={ws.membershipStatus === "ACTIVE" ? "ok" : "gray"}>{ws.membershipStatus}</Badge>
                  {isActive && <Check className="size-4 text-primary" />}
                </button>
              );
            })
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground">
            {selected ? `Products — ${selected.workspaceName}` : "Products"}
          </h2>
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">Select a workspace above to see its subscribed products.</p>
          ) : productsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading products…
            </div>
          ) : (workspaceProducts ?? []).length === 0 ? (
            <EmptyState title="No products subscribed" description="Subscribe a product below to get started." />
          ) : (
            <div className="flex flex-col gap-2">
              {workspaceProducts!.map((p) => (
                <div key={p.workspaceProductId} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                  <span className="text-sm font-medium text-foreground">{p.productKey}</span>
                  <Badge tone={p.status === "ACTIVE" ? "ok" : p.status === "FAILED" ? "bad" : "gray"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-foreground">Organisation profile</h2>
          <Field label="Legal name" value={selected?.workspaceName ?? "—"} />
          <Field label="Primary contact" value={selected ? `${selected.role.toLowerCase()} on ${selected.workspaceName}` : "—"} />
          <div>
            <Button onClick={() => toast.info("Organisation profile", { description: "Coming soon." })}>Save changes</Button>
          </div>
        </Card>
      </div>

      <Card className="flex h-fit flex-col gap-3">
        <h2 className="text-sm font-bold text-foreground">Create new workspace</h2>
        <div>
          <Label>Name</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Smart Factory Ops"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={!newName.trim() || createWorkspace.isPending}>
          {createWorkspace.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create workspace
        </Button>
      </Card>
    </div>
  );
}
