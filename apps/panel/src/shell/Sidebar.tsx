import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { NavItem, NavSection } from "@/shell/nav/types";
import { useShellT } from "@/shared/i18n/shell";

/* Generic renderer for both flat lists (GPS Tracking) and one-level
   grouped menus (Smart Factory, Cloud Management) — see
   src/nav/{factoryNav,trackNav,cloudManagementNav}.ts.

   `collapsed` is the desktop icon-only rail (the header's menu button). A
   collapsed row is a fixed square tile centred in the rail — the icon has no
   label to size against, so a fixed size keeps every row identical and evenly
   spaced. The label moves to the native tooltip. */

interface RowProps {
  item: NavItem;
  onNavigate?: () => void;
  collapsed?: boolean;
  /** The one menu path that is active for the current URL (see activeNavPath). */
  activePath?: string;
}

const normalizePath = (path: string) => path.toLowerCase().replace(/\/+$/, "") || "/";

/* The menu path the current URL belongs to. A path matches the URL itself or
   anything beneath it, and a path ending in "/" (a section's home) only
   matches exactly. When several match, the longest wins: /devices/gateways
   belongs to Gateways alone, not to Devices as well. */
const activeNavPath = (pathname: string, items: NavItem[]) => {
  const current = normalizePath(pathname);
  const paths = items.flatMap((i) => [i, ...(i.children ?? [])]).flatMap((i) => (i.path ? [i.path] : []));
  let best: string | undefined;
  for (const path of paths) {
    const p = normalizePath(path);
    const matches = path.endsWith("/") ? current === p : current === p || current.startsWith(`${p}/`);
    if (matches && (!best || p.length > normalizePath(best).length)) best = path;
  }
  return best;
};

/* These rows had no focus style of their own, so the browser's default ring
   was all there was — a black box drawn around a row after you clicked it and
   then pressed a key, since Chrome re-reads the focused element as
   keyboard-focused on any keydown, Escape included.

   Replaced with the panel's own: a faint brand ring instead of the black box,
   and only for keyboard focus, so a click leaves nothing behind. `outline-none`
   is Tailwind's transparent outline rather than `outline: none`, so it still
   resolves to a visible one under forced colours. */
/* A row's label, cut with an ellipsis when it runs past the sidebar, and
   then, only then, carrying the whole text as its hover tooltip. Measured
   rather than guessed from a character count: the same name is a different
   width in every language, and a label that already reads in full should not
   pop a tooltip repeating what is on screen. Re-measured on resize, since
   the sidebar's width and the web font both settle after first paint. */
function NavLabel({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);
  return (
    <span ref={ref} title={truncated ? text : undefined} className={cn("min-w-0 truncate", className)}>
      {text}
    </span>
  );
}

const rowFocus = "outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const rowBase = `flex items-center gap-3 text-[13px] transition-colors ${rowFocus}`;
/* Square tile on the rail; a full-width padded row otherwise. */
const rowShape = (collapsed?: boolean) =>
  collapsed ? "mx-auto size-9 justify-center rounded-xl" : "w-full rounded-lg px-3 py-1.5";

function ComingSoonLeaf({ item, collapsed }: RowProps) {
  const { title, icon: Icon } = item;
  const t = useShellT();
  return (
    <button
      type="button"
      onClick={() => toast.info(t(title), { description: t("Coming soon.") })}
      title={collapsed ? t(title) : undefined}
      className={cn(rowBase, rowShape(collapsed), "text-foreground/50 hover:bg-muted hover:text-foreground/70")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <NavLabel text={t(title)} className="flex-1 text-start" />
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {t("Coming soon")}
          </span>
        </>
      )}
    </button>
  );
}

function Leaf({ item, onNavigate, collapsed, activePath }: RowProps) {
  const { title, icon: Icon, path, href, comingSoon, chevron, activeOnPrefix } = item;
  const t = useShellT();
  const location = useLocation();

  if (comingSoon) return <ComingSoonLeaf item={item} collapsed={collapsed} />;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={collapsed ? t(title) : undefined}
        className={cn(
          rowBase,
          rowShape(collapsed),
          "group relative text-foreground/80 hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <NavLabel text={t(title)} className="flex-1 text-start" />}
      </a>
    );
  }

  // NavLink's own isActive is true for every ancestor path too, so the row
  // uses the single most specific match worked out for the whole menu — except
  // where the row names an area rather than a page, and stays lit throughout it.
  const here = normalizePath(location.pathname);
  const mine = normalizePath(path!);
  const isActive = path === activePath || (!!activeOnPrefix && (here === mine || here.startsWith(`${mine}/`)));
  return (
    <NavLink
      to={path!}
      end={path!.endsWith("/")}
      onClick={onNavigate}
      title={collapsed ? t(title) : undefined}
      className={cn(
        /* This row spells its own classes out rather than sharing rowBase, so
           it takes the same focus treatment explicitly. */
        "group relative flex items-center gap-3 text-[13px] transition-colors",
        rowFocus,
        collapsed ? "mx-auto size-9 justify-center rounded-xl" : "w-full rounded-lg px-3 py-2",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      {(
        <>
          {/* The active marker is its own element rather than an inset
              box-shadow: a shadow is drawn inside the border box and the row's
              rounded corners would clip it into a curve. Square ends. */}
          {isActive && !collapsed && (
            <span
              aria-hidden
              /* On the side the row starts on: the right in Persian and
                 Arabic, the left in English. */
              className="absolute top-1 bottom-1 w-[3px] rounded-full bg-primary ltr:left-px rtl:right-px"
            />
          )}
          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
          {!collapsed && <NavLabel text={t(title)} className="flex-1 text-start" />}
          {/* Marks a row that leaves this nav for another product's; it points
              the way the text runs, so it flips in RTL like the group's. */}
          {!collapsed && chevron && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />}
        </>
      )}
    </NavLink>
  );
}

/* `onExpand` un-collapses the rail: a group has nowhere to put its children on
   an icon-only rail, so clicking one opens the sidebar back up rather than
   doing nothing. */
function Group({ item, onNavigate, collapsed, onExpand, activePath }: RowProps & { onExpand?: () => void }) {
  const location = useLocation();
  const isGroupActive = item.children!.some((c) => c.path && location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isGroupActive || !!item.defaultOpen);
  const Icon = item.icon;
  const t = useShellT();

  if (item.comingSoon) {
    return (
      <div
        title={collapsed ? t(item.title) : undefined}
        className={cn(rowBase, rowShape(collapsed), "text-foreground/40")}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <NavLabel text={t(item.title)} className="flex-1 text-start" />
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {t("Coming Soon")}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (collapsed) {
            onExpand?.();
            setOpen(true);
            return;
          }
          setOpen((o) => !o);
        }}
        title={collapsed ? t(item.title) : undefined}
        className={cn(rowBase, rowShape(collapsed), "text-foreground hover:bg-muted")}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <NavLabel text={t(item.title)} className={cn("flex-1 text-start", open && "font-bold")} />
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                /* Closed, it points the way the text runs, which is left in
                   RTL. Open, it points down, the same turn either way. */
                open ? "rotate-90" : "rtl:rotate-180",
              )}
            />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="mt-0.5 space-y-0.5 ltr:ml-[22px] rtl:mr-[22px] border-border ltr:border-l rtl:border-r ltr:pl-2 rtl:pr-2">
          {item.children!.map((c) => (
            <Leaf key={c.title} item={c} onNavigate={onNavigate} activePath={activePath} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarContentProps {
  section: NavSection;
  onNavigate?: () => void;
  /** Desktop icon-only rail. */
  collapsed?: boolean;
  onExpand?: () => void;
}

export function SidebarContent({ section, onNavigate, collapsed, onExpand }: SidebarContentProps) {
  const SectionIcon = section.icon;
  const t = useShellT();
  const footerItems = section.footerItems ?? [];
  const location = useLocation();
  const activePath = activeNavPath(location.pathname, [...section.items, ...footerItems]);
  /* A footer row lights for its own page even when the list above has a row
     for that page too: it is the row that was clicked, and leaving it dark
     while only the area row (Cloud Management) lit read as having landed
     somewhere else. */
  const footerActivePath = activePath;
  return (
    /* data-sidebar-nav: one row size per language — see the matching block in
       src/index.css for what was pulling the group rows out of line. */
    <div data-sidebar-nav className="flex h-full flex-col bg-card">
      <div className="px-2 pt-3">
        <div
          title={collapsed ? t(section.title) : undefined}
          className={cn(
            "flex items-center gap-2.5 bg-primary/10 text-sm font-bold text-foreground",
            collapsed ? "mx-auto size-9 justify-center rounded-xl" : "rounded-2xl px-3 py-2.5",
          )}
        >
          <SectionIcon className="size-4 shrink-0 text-primary" />
          {!collapsed && <NavLabel text={t(section.title)} />}
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {section.items.map((item) =>
          item.children ? (
            <Group key={item.title} item={item} onNavigate={onNavigate} collapsed={collapsed} onExpand={onExpand} activePath={activePath} />
          ) : (
            <Leaf key={item.title} item={item} onNavigate={onNavigate} collapsed={collapsed} activePath={activePath} />
          ),
        )}
      </nav>
      {/* The divider is full-bleed, so the padding lives on the row list
          rather than on the bordered container. */}
      {footerItems.length > 0 && (
        <div className="border-t border-border">
          <div className="space-y-1 px-2 py-3">
            {footerItems.map((item) => (
              <Leaf key={item.title} item={item} onNavigate={onNavigate} collapsed={collapsed} activePath={footerActivePath} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
