import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronDown, LayoutGrid, LogOut, Plus, Settings, SlidersHorizontal } from "lucide-react";
import { useListActiveWorkspacesQuery } from "@paapeli/api";
import { CURRENT_USER } from "@paapeli/brand/config";
import { signOut as endSession } from "@paapeli/brand/session";
import { setActiveWorkspaceId, useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const displayName = CURRENT_USER.name;
  const initial = CURRENT_USER.initial;

  const { data, isLoading } = useListActiveWorkspacesQuery();
  const workspaces = useMemo(() => data ?? [], [data]);
  /* The host owns the workspace selection for the whole panel: every remote
     reads it from here to scope its API calls (see @paapeli/brand/workspace).
     It's persisted, so a reload keeps the same workspace — fall back to the
     first one whenever there's no stored id, or the stored one is no longer
     a workspace this user is a member of. */
  const activeWorkspaceId = useActiveWorkspaceId();
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
        aria-label="Account"
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
            <p className="truncate text-sm text-muted-foreground">{CURRENT_USER.email}</p>
          </div>

          <div className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workspaces
          </div>
          <div className="px-2 py-1">
            {isLoading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">Loading…</p>
            ) : workspaces.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">No workspaces yet.</p>
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.workspaceId === activeWorkspaceId;
                return (
                  <button
                    key={ws.workspaceId}
                    onClick={() => {
                      setActiveWorkspaceId(ws.workspaceId);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted",
                    )}
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
                toast.info("Create new workspace", { description: "Coming soon." });
                close();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-4 text-muted-foreground" />
              Create new workspace
            </button>
            <button
              onClick={() => {
                toast.info("Manage workspaces", { description: "Coming soon." });
                close();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              Manage workspaces
            </button>
          </div>

          <div className="my-2 border-t border-border" />

          <div className="px-2">
            <button
              onClick={() => {
                navigate("/AIoT/SmartFactory/account-settings");
                close();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" />
              Account Settings
            </button>
            <button
              onClick={() => {
                endSession();
                window.location.href = "/login";
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
