import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/nav/types";

/* Generic renderer for both flat lists (GPS Tracking) and one-level
   grouped menus (Smart Factory) — see src/nav/{factoryNav,trackNav}.ts. */

function Leaf({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { title, icon: Icon, path, href } = item;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group relative flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
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
          "group relative flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-[13px] transition-colors",
          isActive ? "bg-primary/5 font-medium text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute bottom-1 top-1 w-[3px] rounded-full bg-primary ltr:left-0 rtl:right-0" aria-hidden />}
          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
          <span className="flex-1 truncate text-start">{title}</span>
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

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-[13px] transition-colors",
          isGroupActive ? "font-medium text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isGroupActive && "text-primary")} />
        <span className="flex-1 truncate text-start">{item.title}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} />
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

export function SidebarContent({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-card">
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) =>
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
