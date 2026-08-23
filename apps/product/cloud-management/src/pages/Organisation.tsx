import { useState } from "react";
import { toast } from "sonner";
import { Shield, UserPlus } from "lucide-react";
import { useWorkspaceSelection } from "@/contexts/WorkspaceContext";
import { Button, PageHeader, Tabs } from "@/components/ui";
import MembersPanel from "./organisation/MembersPanel";
import RolesPanel from "./organisation/RolesPanel";
import InvitationsPanel from "./organisation/InvitationsPanel";
import ProfilePanel from "./organisation/ProfilePanel";

const TABS = ["Members", "Roles", "Invitations", "Organisation profile", "Audit log"];

/* Consolidates the design's single "Organisation" nav entry (tabs: Members
   / Roles / Invitations / Organisation profile / Audit log) — Members and
   Invitations are real (@paapeli/api), Roles and Audit log have no backend
   yet, see their panels for details. */
export default function Organisation() {
  const [tab, setTab] = useState("Members");
  const { selected } = useWorkspaceSelection();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Organisation"
        description={selected ? `Tenant profile, members and roles for ${selected.workspaceName}.` : "Tenant profile, members and roles."}
        actions={
          <>
            <Button variant="ghost" onClick={() => setTab("Roles")}>
              <Shield className="size-4" />
              Roles & permissions
            </Button>
            <Button onClick={() => setTab("Members")}>
              <UserPlus className="size-4" />
              Invite member
            </Button>
          </>
        }
      />

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {tab === "Members" && <MembersPanel />}
      {tab === "Roles" && <RolesPanel />}
      {tab === "Invitations" && <InvitationsPanel />}
      {tab === "Organisation profile" && <ProfilePanel />}
      {tab === "Audit log" && (
        <p className="text-sm text-muted-foreground">This tab isn't part of the design preview yet.</p>
      )}
    </div>
  );
}
