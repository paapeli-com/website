import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, LayoutGrid, MapPin, Plus, Server, Settings, Wrench, type LucideIcon } from "lucide-react";
import { solutionPath } from "@paapeli/brand/config";
import { cn } from "@/shared/lib/utils";
import { menuRowBase, menuRowIdle } from "@/shell/menuRow";
import { useShellT } from "@/shared/i18n/shell";

interface CreateNewItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Where it goes. Without one the row is not built yet and says so. */
  path?: string;
}

/* This menu lives in the shell, outside any feature, so destinations are built
   from the solution's mount point rather than from a feature-local helper. */
const factory = (path: string) => `${solutionPath("SmartFactory")}${path}`;

const MAIN_ITEMS: CreateNewItem[] = [
  { title: "Device", subtitle: "Add industrial devices", icon: Settings, path: factory("/devices/new") },
  { title: "Gateway", subtitle: "Register edge gateways", icon: Server },
  /* Locations are created in the tree on that page (each node's "..." menu),
     not on a dedicated form, so this opens the page itself. */
  { title: "Location", subtitle: "Create regions and production lines", icon: MapPin, path: factory("/locations") },
  { title: "Rule", subtitle: "Create monitoring rules", icon: Bell, path: factory("/alarms/rules/new") },
];

const ADVANCED_ITEMS: CreateNewItem[] = [
  { title: "Work Order", subtitle: "Create maintenance tasks", icon: Wrench },
  { title: "Dashboard", subtitle: "Create operational dashboards", icon: LayoutGrid, path: factory("/dashboard/new") },
];

function CreateNewRow({ item, onPick }: { item: CreateNewItem; onPick: (item: CreateNewItem) => void }) {
  const Icon = item.icon;
  const t = useShellT();
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      className={cn(menuRowBase, menuRowIdle)}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{t(item.title)}</span>
        <span className="block text-sm text-muted-foreground">{t(item.subtitle)}</span>
      </span>
    </button>
  );
}

export function CreateNewMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const t = useShellT();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handlePick = (item: CreateNewItem) => {
    setOpen(false);
    if (item.path) {
      navigate(item.path);
      return;
    }
    // Gateway and Work Order have no page and no endpoint yet.
    toast.info(t(item.title), { description: t("Coming soon.") });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:flex"
      >
        <Plus className="size-4" />
        {t("New Items")}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-popover p-4 shadow-lg",
            "ltr:right-0 rtl:left-0",
          )}
        >
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground">{t("Create New")}</h3>
            <p className="text-sm text-muted-foreground">{t("Create and configure a new industrial entity.")}</p>
          </div>

          <div className="space-y-1">
            {MAIN_ITEMS.map((item) => (
              <CreateNewRow key={item.title} item={item} onPick={handlePick} />
            ))}
          </div>

          <div className="my-3 border-t border-border" />

          <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Advanced Options")}
          </div>
          <div className="space-y-1">
            {ADVANCED_ITEMS.map((item) => (
              <CreateNewRow key={item.title} item={item} onPick={handlePick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
