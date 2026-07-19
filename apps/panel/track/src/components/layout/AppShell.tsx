import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { startIdleWatch } from "@paapeli/brand/session";
import { useLanguage } from "@/i18n/LanguageContext";
import { Topbar } from "./Topbar";
import { SidebarContent } from "./Sidebar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

/* Layout mirrors the panel: fixed header on top, then a row of         */
/* [sidebar | scrollable main + footer]. Structure identical; only the  */
/* nav items and page content differ.                                   */
export function AppShell() {
  const { isRTL } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep the shared session alive while active; bounce to /login when idle.
  useEffect(() => startIdleWatch(), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Topbar onMenu={() => setMobileOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden shrink-0 border-border lg:block lg:w-60 ltr:border-r rtl:border-l">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
          <div
            onClick={() => setMobileOpen(false)}
            className={cn("absolute inset-0 bg-black/40 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
          />
          <div
            className={cn(
              "absolute inset-y-0 w-60 transition-transform duration-300 ltr:left-0 rtl:right-0",
              mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
            )}
          >
            <div className="flex h-12 items-center justify-end px-3">
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
