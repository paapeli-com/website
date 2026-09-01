import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { startIdleWatch } from "@paapeli/brand/session";
import { solutionPath } from "@paapeli/brand/config";
import { cn } from "@/shared/lib/utils";
import { Header } from "./Header";
import { SidebarContent } from "./Sidebar";
import { factoryNav } from "@/shell/nav/factoryNav";
import { trackNav } from "@/shell/nav/trackNav";
import { cloudManagementNav } from "@/shell/nav/cloudManagementNav";

/* Persistent shell: header on top, [sidebar | content] below. The sidebar's
   item set follows whichever solution's URL prefix is currently active —
   this is the one place idle-session-watch runs now (it used to be
   duplicated inside every remote's own layout). */
const COLLAPSED_KEY = "sidebar_collapsed";

export function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(COLLAPSED_KEY) === "1");

  useEffect(() => startIdleWatch(), []);

  /* One header button, two jobs: below lg the sidebar is a drawer that has to
     be opened before it can be anything, and at lg and up it's always on
     screen, so the button toggles it down to an icon-only rail instead. */
  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((c) => {
        window.localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
        return !c;
      });
      return;
    }
    setMobileOpen(true);
  };

  const expandSidebar = () => {
    window.localStorage.setItem(COLLAPSED_KEY, "0");
    setCollapsed(false);
  };

  const navSection = location.pathname.startsWith("/CloudManagement")
    ? cloudManagementNav
    : location.pathname.startsWith(solutionPath("GPSTracking"))
      ? trackNav
      : factoryNav;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header onMenu={toggleSidebar} />

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "hidden shrink-0 border-border transition-[width] duration-200 lg:block ltr:border-r rtl:border-l",
            collapsed ? "lg:w-14" : "lg:w-60",
          )}
        >
          <SidebarContent section={navSection} collapsed={collapsed} onExpand={expandSidebar} />
        </aside>

        <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
          <div
            onClick={() => setMobileOpen(false)}
            className={cn("absolute inset-0 bg-black/40 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
          />
          <div
            className={cn(
              "absolute inset-y-0 w-60 bg-card transition-transform duration-300 ltr:left-0 rtl:right-0",
              mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
            )}
          >
            <div className="flex h-12 items-center justify-end px-3">
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <SidebarContent section={navSection} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
