import { useState } from "react";
import { toast } from "sonner";
import { Building2, Check, Loader2, Plus } from "lucide-react";
import {
  useCreateWorkspaceMutation,
  useGetProductsQuery,
  useListWorkspaceProductsQuery,
  useSubscribeWorkspaceProductMutation,
} from "@paapeli/api";
import { useWorkspaceSelection } from "@/contexts/WorkspaceContext";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

/* Which workspace is active, and what's subscribed to it — the one page in
   this remote backed entirely by @paapeli/api's workspaces endpoints (no
   placeholder data). Organisation (pages/Organisation.tsx) manages the
   active workspace's members/roles once you're in one; this page is where
   you pick or create the workspace itself. */
export default function Workspaces() {
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
        onError: () => toast.error("Failed to create workspace"),
      },
    );
  };

  const { data: products } = useGetProductsQuery();
  const { data: workspaceProducts, isLoading: productsLoading } = useListWorkspaceProductsQuery(
    selectedId ?? "",
    !!selectedId,
  );
  const subscribeProduct = useSubscribeWorkspaceProductMutation();

  const subscribedKeys = new Set((workspaceProducts ?? []).map((p) => p.productKey));
  const availableProducts = (products ?? []).filter((p) => !subscribedKeys.has(p.productKey));

  const handleSubscribe = (productKey: string) => {
    if (!selectedId || subscribeProduct.isPending) return;
    subscribeProduct.mutate(
      { workspaceId: selectedId, productKey },
      {
        onSuccess: () => toast.success("Product subscribed"),
        onError: () => toast.error("Failed to subscribe product"),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Workspaces" description="Workspaces you belong to, and the products subscribed to the active one." />

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
                      <Building2 className="size-4" />
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
              <p className="text-sm text-muted-foreground">Select a workspace to see its subscribed products.</p>
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
                  <div
                    key={p.workspaceProductId}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">{p.productKey}</span>
                    <Badge tone={p.status === "ACTIVE" ? "ok" : p.status === "FAILED" ? "bad" : "gray"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedId && availableProducts.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Label>Subscribe a product</Label>
                <div className="flex flex-wrap gap-2">
                  {availableProducts.map((p) => (
                    <Button
                      key={p.productKey}
                      variant="ghost"
                      onClick={() => handleSubscribe(p.productKey)}
                      disabled={subscribeProduct.isPending}
                    >
                      <Plus className="size-4" />
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
}
