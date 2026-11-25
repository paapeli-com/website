import { useState } from "react";
import { LISTED_PRODUCTS } from "@/shared/config";
import { toast } from "@/shared/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useInviteWorkspaceMemberMutation, type WorkspaceRole } from "@paapeli/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useShellT } from "@/shared/i18n/shell";
import { useTr } from "./shared";

const ROLES: { value: WorkspaceRole; name: string; desc: string }[] = [
  { value: "ADMIN", name: "roleAdmin", desc: "roleAdminDesc" },
  { value: "MEMBER", name: "roleMember", desc: "roleMemberDesc" },
  { value: "VIEWER", name: "roleViewer", desc: "roleViewerDesc" },
];

/* A panel rather than a dialog: picking a role and the products someone can
   reach is a form with sections, and the sheet is what the panel already uses
   for those. Owner is not offered — a workspace has one and it is not granted
   by invitation. */
export function InviteMemberPanel({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  isRTL,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  workspaceName?: string;
  isRTL: boolean;
}) {
  const tr = useTr();
  const invite = useInviteWorkspaceMemberMutation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const shellT = useShellT();
  const solutions = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []).filter((s) => !!s.productKey);
  /* Every product starts ticked: untick the ones this person should not
     reach. All ticked is sent as "every product", so a product added later
     reaches them too. An admin always reaches every product. */
  const [unticked, setUnticked] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setUnticked((p) => ({ ...p, [key]: !p[key] }));
  const isAdmin = role === "ADMIN";
  const chosen = solutions.filter((s) => !unticked[s.productKey!]).map((s) => s.productKey!);
  const noneChosen = !isAdmin && chosen.length === 0;

  const send = () => {
    if (!workspaceId || !email.trim() || invite.isPending || noneChosen) return;
    const productKeys = isAdmin || chosen.length === solutions.length ? undefined : chosen;
    invite.mutate(
      { workspaceId, email: email.trim(), role, productKeys },
      {
        onSuccess: () => {
          toast.success(tr("inviteSent", { email: email.trim() }));
          // The roster lists active members only, so the invitee joins it on
          // accepting; refetch so it is current when they do.
          void queryClient.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] });
          void queryClient.invalidateQueries({ queryKey: ["sentInvitations", workspaceId] });
          setEmail("");
          setUnticked({});
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, tr("inviteFailed"))),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="text-base">{tr("inviteMember")}</SheetTitle>
          <SheetDescription className="text-[13px]">{tr("invitePanelDesc")}</SheetDescription>
          {/* Named here so nobody invites into the wrong workspace. */}
          {workspaceName && (
            <span className="w-fit rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {tr("currentWorkspace", { name: workspaceName })}
            </span>
          )}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{tr("emailLabel")}</span>
            <Input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr("emailPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-foreground">{tr("colWorkspaceRole")}</span>
            {ROLES.map((r) => {
              const on = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                    on ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${on ? "border-primary" : "border-muted-foreground/40"}`}>
                    {on && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold text-foreground">{tr(r.name)}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{tr(r.desc)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-foreground">{tr("productAccessLabel")}</span>
            {isAdmin && <span className="text-xs text-muted-foreground">{tr("adminAllProducts")}</span>}
            {solutions.map((s) => {
              const on = isAdmin || !unticked[s.productKey!];
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isAdmin}
                  onClick={() => toggle(s.productKey!)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                    on ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 text-[13.5px] font-medium text-foreground">{shellT(s.name)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {on ? tr(ROLES.find((r) => r.value === role)?.name ?? "roleMember") : tr("noAccess")}
                  </span>
                </button>
              );
            })}
            {noneChosen && <span className="text-xs text-destructive">{tr("pickOneProduct")}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tr("cancel")}</Button>
          <Button onClick={send} disabled={!workspaceId || !email.trim() || invite.isPending || noneChosen} className="gap-2">
            {invite.isPending && <Loader2 className="size-4 animate-spin" />}
            {tr("sendInvitation")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const ACCESS_LEVELS = ["permNone", "permRead", "permWrite"];

/* New Role, as a panel like Invite Member rather than a page of its own.
 *
 * There is no roles endpoint — not to create one, not to list them — so this
 * collects the answer and says it cannot save it yet. Building it now means
 * the shape is agreed before the backend exists, which is the point of the
 * design. */
export function NewRolePanel({
  open,
  onOpenChange,
  isRTL,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL: boolean;
}) {
  const tr = useTr();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basedOn, setBasedOn] = useState<WorkspaceRole>("VIEWER");
  const [access, setAccess] = useState<Record<string, string>>({});

  const solutions = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} dir={isRTL ? "rtl" : "ltr"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="text-base">{tr("newRole")}</SheetTitle>
          <SheetDescription className="text-[13px]">{tr("newRoleDesc")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{tr("roleNameLabel")}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("roleNamePlaceholder")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{tr("roleDescLabel")}</span>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr("roleDescPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{tr("basedOnLabel")}</span>
            <Select value={basedOn} onValueChange={(v) => setBasedOn(v as WorkspaceRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{tr(r.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-foreground">{tr("permissionsLabel")}</span>
            {solutions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="min-w-0 flex-1 text-[13.5px] font-medium text-foreground">{s.name}</span>
                <Select
                  value={access[s.id] ?? "permNone"}
                  onValueChange={(v) => setAccess((a) => ({ ...a, [s.id]: v }))}
                >
                  <SelectTrigger className="h-8 w-[140px] shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{tr(lvl)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tr("cancel")}</Button>
          <Button
            disabled
            title={tr("comingSoon")}
            className="gap-2"
          >
            {tr("createRole")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
