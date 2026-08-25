import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { NavItem, NavSection } from "@/shell/nav/types";

/* Generic renderer for both flat lists (GPS Tracking) and one-level
   grouped menus (Smart Factory, Cloud Management) — see
   src/nav/{factoryNav,trackNav,cloudManagementNav}.ts. */

function ComingSoonLeaf({ item }: { item: NavItem }) {
  const { title, icon: Icon } = item;
  return (
    <button
      type="button"
      onClick={() => toast.info(title, { description: "Coming soon." })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-foreground/50 transition-colors hover:bg-muted hover:text-foreground/70"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-start">{title}</span>
    </button>
  );
}

function Leaf({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { title, icon: Icon, path, href, comingSoon, chevron } = item;

  if (comingSoon) return <ComingSoonLeaf item={item} />;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-start">{title}</span>
      </a>
    );
  }

  return (
    <NavLink
      to={path!}
      end={path!.endsWith("/")}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
          isActive
            ? "bg-primary/10 font-semibold text-primary ltr:shadow-[inset_2px_0_0_0_hsl(var(--primary))] rtl:shadow-[inset_-2px_0_0_0_hsl(var(--primary))]"
            : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
          <span className="flex-1 truncate text-start">{title}</span>
          {chevron && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
        </>
      )}
    </NavLink>
  );
}

function Group({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation();
  const isGroupActive = item.children!.some((c) => c.path && location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isGroupActive);
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-foreground/40">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-start">{item.title}</span>
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Coming Soon
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn("flex-1 truncate text-start", open && "font-bold")}>{item.title}</span>
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 ltr:ml-[22px] rtl:mr-[22px] border-border ltr:border-l rtl:border-r ltr:pl-2 rtl:pr-2">
          {item.children!.map((c) => (
            <Leaf key={c.title} item={c} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarContent({ section, onNavigate }: { section: NavSection; onNavigate?: () => void }) {
  const SectionIcon = section.icon;
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="px-2 pt-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-primary/10 px-3 py-2.5 text-sm font-bold text-foreground">
          <SectionIcon className="size-4 shrink-0 text-primary" />
          <span className="truncate">{section.title}</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {section.items.map((item) =>
          item.children ? (
            <Group key={item.title} item={item} onNavigate={onNavigate} />
          ) : (
            <Leaf key={item.title} item={item} onNavigate={onNavigate} />
          ),
        )}
      </nav>
    </div>
  );
}
