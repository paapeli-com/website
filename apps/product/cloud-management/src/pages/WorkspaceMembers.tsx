import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { useInviteWorkspaceMemberMutation, type WorkspaceRole } from "@paapeli/api";
import { useWorkspaceSelection } from "@/contexts/WorkspaceContext";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";

const ROLES: WorkspaceRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export default function WorkspaceMembers() {
  const { selected } = useWorkspaceSelection();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const invite = useInviteWorkspaceMemberMutation();

  const handleInvite = () => {
    if (!selected || !email.trim() || invite.isPending) return;
    invite.mutate(
      { workspaceId: selected.workspaceId, email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${email.trim()}`);
          setEmail("");
        },
        onError: () => toast.error("Failed to send invitation"),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Members"
        description={selected ? `Invite people to ${selected.workspaceName}.` : "Select a workspace on the General tab first."}
      />

      <Card className="flex max-w-lg flex-col gap-4">
        <h2 className="text-sm font-bold text-foreground">Invite a member</h2>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            disabled={!selected}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
        </div>
        <div>
          <Label>Role</Label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                disabled={!selected}
                className={`h-9 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                  role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleInvite} disabled={!selected || !email.trim() || invite.isPending}>
          {invite.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Send invitation
        </Button>
      </Card>

      <p className="max-w-lg text-sm text-muted-foreground">
        A full member roster isn't available from the API yet — this page can only send new invitations for now.
        Once someone accepts, they'll show up wherever the backend exposes workspace membership.
      </p>
    </div>
  );
}
