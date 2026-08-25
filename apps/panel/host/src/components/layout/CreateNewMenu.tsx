import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, LayoutGrid, MapPin, Plus, Server, Settings, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateNewItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

const MAIN_ITEMS: CreateNewItem[] = [
  { title: "Device", subtitle: "Add industrial devices", icon: Settings },
  { title: "Gateway", subtitle: "Register edge gateways", icon: Server },
  { title: "Location", subtitle: "Create regions and production lines", icon: MapPin },
  { title: "Rule", subtitle: "Create monitoring rules", icon: Bell },
];

const ADVANCED_ITEMS: CreateNewItem[] = [
  { title: "Work Order", subtitle: "Create maintenance tasks", icon: Wrench },
  { title: "Dashboard", subtitle: "Create operational dashboards", icon: LayoutGrid },
];

function CreateNewRow({ item, onPick }: { item: CreateNewItem; onPick: (title: string) => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onPick(item.title)}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-start transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{item.title}</span>
        <span className="block text-sm text-muted-foreground">{item.subtitle}</span>
      </span>
    </button>
  );
}

export function CreateNewMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handlePick = (title: string) => {
    toast.info(title, { description: "Coming soon." });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:flex"
      >
        <Plus className="size-4" />
        New Items
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-popover p-4 shadow-lg",
            "ltr:right-0 rtl:left-0",
          )}
        >
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground">Create New</h3>
            <p className="text-sm text-muted-foreground">Create and configure a new industrial entity.</p>
          </div>

          <div className="space-y-1">
            {MAIN_ITEMS.map((item) => (
              <CreateNewRow key={item.title} item={item} onPick={handlePick} />
            ))}
          </div>

          <div className="my-3 border-t border-border" />

          <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Advanced Options
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
