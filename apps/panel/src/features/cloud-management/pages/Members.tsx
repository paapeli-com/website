import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Button, PageHeader, Tabs } from "@/features/cloud-management/ui";
import MembersTab from "./members/MembersTab";
import RolesTab from "./members/RolesTab";
import InvitationsTab from "./members/InvitationsTab";
import { InviteMemberPanel, NewRolePanel } from "./members/panels";
import { BackendNote, useTr } from "./members/shared";

/* Members: people, what they may do, and who has been asked to join.
 *
 * This replaces Organisation and its five tabs. Three remain, because three
 * questions are actually being asked: who is here, what may they do, and who
 * is on the way in. Organisation profile and Audit log had no backend and no
 * question behind them.
 *
 * The tables are the device list's, to the class — see members/shared.tsx —
 * and the toolbar is the panel's own ListToolbar, which is why this page sits
 * inside the factory's LanguageProvider: that toolbar and the table
 * primitives read their labels from it. The page's own copy comes from
 * members/dictionary.ts.
 *
 * What is real: the invitations you have received, and inviting someone.
 * Everything else waits on endpoints that do not exist yet and says so. */
export default function Members() {
  return (
    <LanguageProvider>
      <MembersPage />
    </LanguageProvider>
  );
}

function MembersPage() {
  const tr = useTr();
  const { isRTL } = useLanguage();
  const { selected } = useWorkspaceSelection();
  const [tab, setTab] = useState<"members" | "roles" | "invitations">("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);

  const labels = {
    members: tr("tabMembers"),
    roles: tr("tabRoles"),
    invitations: tr("tabInvitations"),
  };
  const byLabel = (v: string) =>
    (Object.keys(labels) as (keyof typeof labels)[]).find((k) => labels[k] === v) ?? "members";

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like the rest of Cloud Management. */
    <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="flex flex-col gap-6 p-6">
      <PageHeader
        title={tr("members")}
        description={
          selected
            ? tr("pageSubtitle", { workspace: selected.workspaceName })
            : tr("pageSubtitleNoWorkspace")
        }
        actions={
          <>
            {/* New Role belongs to the tab that shows roles, so it appears
                with it rather than standing on every tab. */}
            {tab === "roles" && (
              <Button variant="ghost" onClick={() => setNewRoleOpen(true)}>
                <Plus className="size-4" />
                {tr("newRole")}
              </Button>
            )}
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              {tr("inviteMember")}
            </Button>
          </>
        }
      />

      <Tabs
        items={[labels.members, labels.roles, labels.invitations]}
        value={labels[tab]}
        onChange={(v) => setTab(byLabel(v))}
      />

      {tab === "members" && (
        <>
          <MembersTab onInvite={() => setInviteOpen(true)} />
          <BackendNote text={tr("backendNote")} />
        </>
      )}
      {tab === "roles" && <RolesTab />}
      {tab === "invitations" && <InvitationsTab isRTL={isRTL} />}

      <InviteMemberPanel
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        workspaceId={selected?.workspaceId}
        isRTL={isRTL}
      />
      <NewRolePanel open={newRoleOpen} onOpenChange={setNewRoleOpen} isRTL={isRTL} />
    </div>
  );
}
