import { ShieldOff } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function WorkspaceRoles() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Roles & Access" description="Manage what each role can do in this workspace." />
      <EmptyState
        title={
          <span className="flex items-center gap-2">
            <ShieldOff className="size-4" /> Not available yet
          </span>
        }
        description="Role and permission management isn't exposed by the API yet — this section will light up once that endpoint exists."
      />
    </div>
  );
}
