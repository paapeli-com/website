import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import {
  useAcceptWorkspaceInvitationMutation,
  useListWorkspaceInvitationsQuery,
  useRejectWorkspaceInvitationMutation,
} from "@paapeli/api";
import { Badge, Button, Card, EmptyState } from "@/features/cloud-management/ui";
import { apiErrorMessage } from "@/shared/lib/apiError";

export default function InvitationsPanel() {
  const { data, isLoading, refetch } = useListWorkspaceInvitationsQuery();
  const accept = useAcceptWorkspaceInvitationMutation();
  const reject = useRejectWorkspaceInvitationMutation();

  const invitations = (data ?? []).filter((w) => w.membershipStatus === "INVITED");

  const handleAccept = (workspaceId: string, name: string) => {
    accept.mutate(workspaceId, {
      onSuccess: () => {
        toast.success(`Joined ${name}`);
        refetch();
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Failed to accept invitation")),
    });
  };

  const handleReject = (workspaceId: string, name: string) => {
    reject.mutate(workspaceId, {
      onSuccess: () => {
        toast.success(`Declined invitation to ${name}`);
        refetch();
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Failed to decline invitation")),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading invitations…
      </div>
    );
  }

  if (invitations.length === 0) {
    return <EmptyState title="No pending invitations" description="You're all caught up." />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {invitations.map((w) => (
        <Card key={w.workspaceId} className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">{w.workspaceName}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Invited as <Badge tone="brand">{w.role}</Badge>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleReject(w.workspaceId, w.workspaceName)} disabled={reject.isPending}>
              <X className="size-4" />
              Decline
            </Button>
            <Button onClick={() => handleAccept(w.workspaceId, w.workspaceName)} disabled={accept.isPending}>
              <Check className="size-4" />
              Accept
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
