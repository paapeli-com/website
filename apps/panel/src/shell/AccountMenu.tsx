import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, LayoutGrid, LogOut, Plus, Settings, SlidersHorizontal } from "lucide-react";
import { endServerSession, useListActiveWorkspacesQuery } from "@paapeli/api";
import { getCurrentUser, signOut as endSession } from "@paapeli/brand/session";
import { setActiveWorkspaceId, useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";
import { menuRowBase, menuRowDanger, menuRowIdle, menuRowSelected } from "@/shell/menuRow";
import { useShellT } from "@/shared/i18n/shell";
import { useDisplayName } from "@/shared/hooks/useDisplayName";
import { useWorkspaceSwitch } from "@/shared/components/WorkspaceSwitchDialog";
import { CreateWorkspaceDialog } from "@/shared/components/CreateWorkspaceDialog";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const t = useShellT();
  /* The signed-in account, not a hardcoded placeholder person. Nothing serves
     a display name yet (only signup returns one), so it usually has none —
     the email and the avatar letter are real either way. */
  const user = getCurrentUser();
  const displayName = useDisplayName();
  const initial = (displayName || user?.email || "").trim().charAt(0).toUpperCase();

  const { data, isLoading } = useListActiveWorkspacesQuery();
  const workspaces = useMemo(() => data ?? [], [data]);
  /* The host owns the workspace selection for the whole panel: every remote
     reads it from here to scope its API calls (see @paapeli/brand/workspace).
     It's persisted, so a reload keeps the same workspace — fall back to the
     first one whenever there's no stored id, or the stored one is no longer
     a workspace this user is a member of. */
  const activeWorkspaceId = useActiveWorkspaceId();
  const workspaceSwitch = useWorkspaceSwitch();
  useEffect(() => {
    if (workspaces.length === 0) return;
    if (workspaces.some((ws) => ws.workspaceId === activeWorkspaceId)) return;
    setActiveWorkspaceId(workspaces[0].workspaceId);
  }, [workspaces, activeWorkspaceId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-xl px-1.5 hover:bg-muted"
        aria-label={t("Account")}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initial}
        </span>
        <span className="hidden max-w-[180px] truncate text-sm font-medium md:inline">{displayName}</span>
        <ChevronDown className="hidden size-4 text-muted-foreground md:inline" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover py-3 shadow-lg ltr:right-0 rtl:left-0">
          <div className="px-4 pb-3">
            <p className="truncate text-base font-bold text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <div className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Workspaces")}
          </div>
          <div className="px-2 py-1">
            {isLoading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{t("Loading…")}</p>
            ) : workspaces.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{t("No workspaces yet.")}</p>
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.workspaceId === activeWorkspaceId;
                return (
                  <button
                    key={ws.workspaceId}
                    onClick={() => {
                      workspaceSwitch.requestSwitch(ws.workspaceId, ws.workspaceName, activeWorkspaceId);
                      close();
                    }}
                    className={cn(menuRowBase, isActive ? menuRowSelected : menuRowIdle)}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <LayoutGrid className="size-4" />
                    </span>
                    <span className={cn("flex-1 truncate text-start", isActive ? "font-bold text-primary" : "text-foreground")}>
                      {ws.workspaceName}
                    </span>
                    {isActive && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-2 py-1">
            <button
              onClick={() => {
                // A dialog over the current page, not a trip to the page that
                // manages workspaces. Deferred a tick, as switching is: the
                // menu is still closing.
                close();
                setTimeout(() => setCreating(true), 0);
              }}
              className={cn(menuRowBase, menuRowIdle)}
            >
              <Plus className="size-4 text-muted-foreground" />
              {t("Create new workspace")}
            </button>
            <button
              onClick={() => {
                navigate("/CloudManagement/workspaces");
                close();
              }}
              className={cn(menuRowBase, menuRowIdle)}
            >
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              {t("Manage workspaces")}
            </button>
          </div>

          <div className="my-2 border-t border-border" />

          <div className="px-2">
            <button
              onClick={() => {
                // Account settings belong to the person, not to a product, so they sit
                // at the top level under /Home and are reached from here only.
                navigate("/Home/account-settings");
                close();
              }}
              className={cn(menuRowBase, menuRowIdle)}
            >
              <Settings className="size-4 text-muted-foreground" />
              {t("Account Settings")}
            </button>
            <button
              onClick={async () => {
                await endServerSession();
                endSession();
                window.location.href = "/login";
              }}
              className={cn(menuRowBase, menuRowDanger)}
            >
              <LogOut className="size-4" />
              {t("Sign out")}
            </button>
          </div>
        </div>
      )}
      {workspaceSwitch.dialog}
      <CreateWorkspaceDialog
        open={creating}
        onOpenChange={setCreating}
        // Offer to move into the new workspace, the same ask as any switch.
        onCreated={(ws) => workspaceSwitch.requestSwitch(ws.id, ws.name, activeWorkspaceId)}
      />
    </div>
  );
}
