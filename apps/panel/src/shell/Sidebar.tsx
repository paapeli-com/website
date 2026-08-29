import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { NavItem, NavSection } from "@/shell/nav/types";

/* Generic renderer for both flat lists (GPS Tracking) and one-level
   grouped menus (Smart Factory, Cloud Management) — see
   src/nav/{factoryNav,trackNav,cloudManagementNav}.ts. */

function ComingSoonLeaf({ item, nested }: { item: NavItem; nested?: boolean }) {
  const { title, icon: Icon } = item;
  return (
    <button
      type="button"
      onClick={() => toast.info(title, { description: "Coming soon." })}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-foreground/50 transition-colors hover:bg-muted hover:text-foreground/70",
        nested && "ltr:pl-11 rtl:pr-11",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-start">{title}</span>
    </button>
  );
}

/* `nested` = a child of an expanded group. Group children are indented by
   padding rather than by a margin on their container, so the active highlight
   still reaches the sidebar edge. */
function Leaf({ item, onNavigate, nested }: { item: NavItem; onNavigate?: () => void; nested?: boolean }) {
  const { title, icon: Icon, path, href, comingSoon, chevron } = item;

  if (comingSoon) return <ComingSoonLeaf item={item} nested={nested} />;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group relative flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
          nested && "ltr:pl-11 rtl:pr-11",
        )}
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
          "group relative flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition-colors",
          nested && "ltr:pl-11 rtl:pr-11",
          isActive
            ? "bg-primary/10 font-semibold text-primary"
            : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* The active marker is its own element rather than an inset
              box-shadow, so it sits at the sidebar's own edge independently of
              the row's padding — a shadow is drawn on the border box and would
              start wherever the row does. Full height, square ends. */}
          {isActive && (
            <span aria-hidden className="absolute inset-y-0 start-0 w-[3px] bg-primary" />
          )}
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
      <div className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-foreground/40">
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
        className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-foreground transition-colors hover:bg-muted"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn("flex-1 truncate text-start", open && "font-bold")}>{item.title}</span>
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((c) => (
            <Leaf key={c.title} item={c} onNavigate={onNavigate} nested />
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
            {/* No horizontal padding: the active row's highlight and its left bar
          run to the sidebar's own edge, so the inset lives on each row. */}
      <nav className="flex-1 space-y-1 overflow-y-auto py-4">
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
