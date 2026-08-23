import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, UserPlus } from "lucide-react";
import { useInviteWorkspaceMemberMutation, type WorkspaceRole } from "@paapeli/api";
import { useWorkspaceSelection } from "@/contexts/WorkspaceContext";
import { Avatar, Badge, Button, Card, Input, Label, Table } from "@/components/ui";

const ROLES: WorkspaceRole[] = ["ADMIN", "MEMBER", "VIEWER"];

/* Member roster below is illustrative placeholder data — there's no
   list-members endpoint yet. Once one exists, replace this with a real
   query the same way the invite form beside it already talks to the API. */
const MOCK_ROSTER: { name: string; email: string; role: string; lastActive: string; status: "ok" | "info" }[] = [
  { name: "Sina Ahmadi", email: "sina@company.com", role: "Owner", lastActive: "5 min ago", status: "ok" },
  { name: "Maryam Rahimi", email: "maryam@company.com", role: "Billing admin", lastActive: "2 h ago", status: "ok" },
  { name: "Hossein Karimi", email: "hossein@company.com", role: "Cloud admin", lastActive: "Yesterday", status: "ok" },
  { name: "Nasim Fallah", email: "nasim@company.com", role: "Operator", lastActive: "3 days ago", status: "ok" },
  { name: "Ali Tavakoli", email: "ali@contractor.com", role: "Viewer", lastActive: "—", status: "info" },
];

export default function MembersPanel() {
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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <Table
        columns={["Member", "Role", "Last active", "Status", ""]}
        head={
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">{MOCK_ROSTER.length} members</h2>
            <Badge tone="gray">Preview data</Badge>
          </div>
        }
        rows={MOCK_ROSTER.map((m, i) => [
          <div key="m" className="flex items-center gap-3">
            <Avatar name={m.name} colorIndex={i} />
            <span className="flex flex-col">
              <span className="font-medium text-foreground">{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.email}</span>
            </span>
          </div>,
          m.role,
          m.lastActive,
          <Badge key="s" tone={m.status}>
            {m.status === "info" ? "Invited" : "Active"}
          </Badge>,
          <MoreHorizontal key="dots" className="size-4 text-muted-foreground" />,
        ])}
      />

      <Card className="flex h-fit flex-col gap-4">
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
          <div className="flex flex-wrap gap-2">
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
        <p className="text-xs text-muted-foreground">
          Sending is real and hits the API — the roster on the left is placeholder until a list-members endpoint exists.
        </p>
      </Card>
    </div>
  );
}
