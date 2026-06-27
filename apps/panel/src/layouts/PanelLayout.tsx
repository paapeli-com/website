import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  PieChart,
  LayoutDashboard,
  Package,
  HardDrive,
  Router,
  MapPin,
  Bell,
  ClipboardList,
  Sparkles,
  Download,
  Users,
  Code2,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Activity,
  Bot,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
// LanguageSwitcher removed from footer — language is accessible only from the header globe icon
import { Globe } from "lucide-react";
import { Language } from "@/i18n/translations";
import sinaProfileImg from "@/assets/sina-profile.png";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import paapeliLogo from "@/assets/paapeli-logo.svg";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import paapeliLogoDark from "@/assets/paapeli-logo-dark.svg";
import paapeliLogoFa from "@/assets/paapeli-logo-fa.svg";
import { GlobalSearch } from "@/components/GlobalSearch";
import { QuickCreatePanel } from "@/components/QuickCreatePanel";

interface MenuItem {
  title: string;
  icon: any;
  path?: string;
  href?: string;
  disabled?: boolean;
  children?: MenuItem[];
  key?: string;
}

interface PanelLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  onAddClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const PanelPageSkeleton = ({ isRTL, loadingText }: { isRTL: boolean; loadingText: string }) => (
  <div className="fixed inset-0 z-[70] bg-background" dir={isRTL ? "rtl" : "ltr"} aria-live="polite" aria-busy="true">
    <div className="h-16 border-b border-border px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="hidden sm:block h-9 w-36 rounded-lg" />
        <Skeleton className="hidden md:block h-9 w-48 rounded-lg" />
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="hidden md:block h-3 w-96 max-w-[28vw] rounded-full" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>

    <div className="p-4 lg:p-6 space-y-4 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card p-3 shadow-sm space-y-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className={`h-7 w-20 rounded-lg ${isRTL ? "mr-auto" : "ml-auto"}`} />
            <Skeleton className={`h-3 w-16 rounded-full ${isRTL ? "mr-auto" : "ml-auto"}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-52 rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
            <Skeleton className={`h-4 w-32 rounded-full ${isRTL ? "mr-auto" : "ml-auto"}`} />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className={`h-3 w-24 rounded-full ${isRTL ? "mr-auto" : "ml-auto"}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
            <Skeleton className={`h-4 w-32 rounded-full ${isRTL ? "mr-auto" : "ml-auto"}`} />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>

    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="min-h-36 w-48 rounded-lg border border-border bg-card/95 shadow-lg flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm text-muted-foreground">{loadingText}</span>
      </div>
    </div>
  </div>
);

export const PanelLayout = ({ children }: PanelLayoutProps) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { signOut, user } = useAuth();
  const username = user?.getUsername?.() || "";
  const isSina = username === "sina";
  const accountDisplayName = isSina ? "هلدینگ هوشمند سینا" : username || "User";
  const avatarInitial = isSina ? "س" : (username?.[0]?.toUpperCase() || "U");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("paapeli.profile.avatar." + (username || "anon"));
      if (stored) setCustomAvatar(stored);
      else if (isSina) setCustomAvatar(sinaProfileImg);
      else setCustomAvatar(null);
    } catch {}
    const onStorage = () => {
      try {
        const stored = localStorage.getItem("paapeli.profile.avatar." + (username || "anon"));
        if (stored) setCustomAvatar(stored);
        else if (isSina) setCustomAvatar(sinaProfileImg);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [username, isSina]);

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    setPageLoading(true);
    const t = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("paapeli-theme");
    const dark = stored === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    const storedCollapsed = localStorage.getItem("paapeli-sidebar-collapsed");
    if (storedCollapsed === "1") setCollapsed(true);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("paapeli-theme", next ? "dark" : "light");
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(true);
    } else {
      setCollapsed((v) => {
        const next = !v;
        localStorage.setItem("paapeli-sidebar-collapsed", next ? "1" : "0");
        return next;
      });
    }
  };

  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const mainItems: MenuItem[] = [
    { title: t("overview"), icon: PieChart, path: lp("/home") },
    { title: t("dashboards"), icon: LayoutDashboard, path: lp("/dashboard") },
    {
      title: t("assets"),
      icon: Package,
      key: "assets",
      children: [
        { title: t("devices"), icon: HardDrive, path: lp("/devices") },
        { title: t("gateways"), icon: Router, path: lp("/devices/gateways") },
      ],
    },
    { title: t("location"), icon: MapPin, path: lp("/locations") },
    { title: t("alarm"), icon: Bell, path: lp("/alarms") },
    
    {
      title: t("aiAnalytics"),
      icon: Sparkles,
      key: "ai-analytics",
      children: [
        { title: t("forecastFailures"), icon: AlertTriangle, path: lp("/aiot/forecast-failures") },
        { title: t("detectAnomalies"), icon: Activity, path: lp("/aiot/detect-anomalies") },
        { title: t("analyzeTrends"), icon: TrendingUp, path: lp("/aiot/analyze-trends") },
        { title: t("aiCoPilot"), icon: Bot, path: lp("/aiot/co-pilot") },
      ],
    },
    { title: t("ota"), icon: Download, path: lp("/firmware") },
    {
      title: t("operations"),
      icon: Wrench,
      key: "operations",
      children: [
        { title: t("workOrders"), icon: ClipboardList, path: lp("/work-orders") },
      ],
    },
  ];

  const secondaryItems: MenuItem[] = [
    { title: t("member"), icon: Users, path: lp("/members") },
    { title: t("devCenterHelp"), icon: Code2, href: "https://docs.paapeli.com/" },
    { title: t("settings"), icon: Settings, path: lp("/account-settings") },
  ];

  const footerItems: MenuItem[] = [];

  const stripLang = (p: string) => p.replace(/^\/(en|ar|fa)/, "");

  // Determine the single best-matching menu path for the current route.
  // "Most specific wins" so sibling routes that share a prefix (e.g. /devices vs
  // /devices/gateways) never both light up — only the longest match is active.
  const activePath = (() => {
    const current = stripLang(location.pathname);
    const collect = (items: MenuItem[], acc: string[] = []): string[] => {
      items.forEach((it) => {
        if (it.path) acc.push(stripLang(it.path));
        if (it.children) collect(it.children, acc);
      });
      return acc;
    };
    const paths = collect([...mainItems, ...secondaryItems, ...footerItems]);
    let best = "";
    for (const p of paths) {
      const matches = current === p || (p !== "/" && current.startsWith(p + "/"));
      if (matches && p.length > best.length) best = p;
    }
    return best;
  })();

  const isActive = (path?: string) => {
    if (!path) return false;
    return !!activePath && stripLang(path) === activePath;
  };

  const handleLogout = async () => {
    await signOut(false);
    navigate("/login");
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isGroupActive = (item: MenuItem) =>
    !!item.children?.some((c) => isActive(c.path));

  useEffect(() => {
    mainItems.forEach((it) => {
      if (it.children && isGroupActive(it) && !openGroups[it.key || ""]) {
        setOpenGroups((p) => ({ ...p, [it.key || ""]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const renderLeaf = (item: MenuItem, idx: number, isCollapsed: boolean, isSub = false) => {
    const active = isActive(item.path);
    const btn = (
      <button
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled) return;
          if (item.href) {
            window.open(item.href, "_blank", "noopener,noreferrer");
            setMobileOpen(false);
            return;
          }
          if (item.path) {
            navigate(item.path);
            setMobileOpen(false);
          }
        }}
        className={`group relative flex items-center ${isCollapsed ? "justify-center px-2" : isSub ? (isRTL ? "gap-3 pr-9 pl-3" : "gap-3 pl-9 pr-3") : "gap-3 px-3"} w-full py-1.5 rounded-md text-[13px] transition-colors ${
          active
            ? "bg-primary/5 text-primary font-medium"
            : item.disabled
            ? "text-muted-foreground/60 cursor-not-allowed"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
      >
        {active && (
          <span
            className={`absolute top-1 bottom-1 ${isRTL ? "right-0" : "left-0"} w-[3px] rounded-full bg-primary`}
            aria-hidden
          />
        )}
        <item.icon className={`h-[16px] w-[16px] shrink-0 ${active ? "text-primary" : ""}`} />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
      </button>
    );

    if (isCollapsed || item.disabled) {
      return (
        <TooltipProvider key={idx} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block">{btn}</span>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? "left" : "right"}>
              {item.disabled
                ? language === "en" ? "Coming soon" : language === "ar" ? "قريباً" : "به‌زودی"
                : item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <div key={idx}>{btn}</div>;
  };

  const renderItem = (item: MenuItem, idx: number, isCollapsed: boolean) => {
    if (item.children) {
      const groupActive = isGroupActive(item);
      const open = openGroups[item.key || ""] ?? groupActive;

      if (isCollapsed) {
        // collapsed: show parent icon + render each child as icon button via tooltip
        return (
          <div key={idx} className="space-y-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => item.children?.[0]?.path && navigate(item.children[0].path!)}
                    className={`flex items-center justify-center px-2 w-full py-2 rounded-md text-sm transition-colors ${
                      groupActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "left" : "right"}>{item.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }

      return (
        <div key={idx}>
          <button
            onClick={() => setOpenGroups((p) => ({ ...p, [item.key || ""]: !open }))}
            className={`group flex items-center gap-3 px-3 w-full py-1.5 rounded-md text-[13px] transition-colors ${
              groupActive ? "text-primary font-medium" : "text-foreground/80 hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className={`h-[16px] w-[16px] shrink-0 ${groupActive ? "text-primary" : ""}`} />
            <span className="truncate flex-1 text-start">{item.title}</span>
            {open ? <ChevronDown className="h-4 w-4" /> : isRTL ? <ChevronRight className="h-4 w-4 rotate-180" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {open && (
            <div className="mt-1 space-y-1">
              {item.children.map((c, ci) => renderLeaf(c, ci, false, true))}
            </div>
          )}
        </div>
      );
    }
    return renderLeaf(item, idx, isCollapsed);
  };

  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="flex flex-col h-full bg-card">
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {mainItems.map((it, i) => renderItem(it, i, isCollapsed))}
      </nav>
      <nav className="shrink-0 px-2 py-3 border-t border-border space-y-1">
        {secondaryItems.map((it, i) => renderItem(it, i + 100, isCollapsed))}
      </nav>
    </div>
  );

  const sidebarWidth = collapsed ? "lg:w-16" : "lg:w-60";

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col" data-panel-page dir={isRTL ? "rtl" : "ltr"}>
      {pageLoading && (
        <PanelPageSkeleton
          isRTL={isRTL}
          loadingText={language === "en" ? "Loading dashboard..." : language === "ar" ? "جارٍ تحميل لوحة التحكم..." : "در حال بارگذاری داشبورد..."}
        />
      )}

      {/* Top Bar */}
      <header className="shrink-0 z-40 h-16 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-3 lg:px-4">
        {/* Left cluster: hamburger + logo */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button
          onClick={() => navigate(lp("/home"))}
          className="flex items-center gap-2 shrink-0"
        >
          {language === "fa" || language === "ar" ? (
            <img src={paapeliLogoFa} alt="Paapeli" className="h-10 w-auto block" />
          ) : (
            <>
              <img src={paapeliLogo} alt="Paapeli" className="h-7 w-auto block dark:hidden" />
              <img src={paapeliLogoDark} alt="Paapeli" className="h-7 w-auto hidden dark:block" />
            </>
          )}
          <span
            className={`panel-wordmark font-bold text-primary hidden sm:inline leading-none ${language === "fa" ? "!text-[22px]" : ""}`}
            style={{ fontSize: language === "fa" ? "22px" : language === "ar" ? "1.6rem" : "1.125rem" }}
          >
            {language === "fa" ? "پـــاپـــلـــی" : language === "ar" ? "پـــاپـــلـــی" : "Paapeli"}
          </span>
        </button>

        {/* Global Search */}
        <GlobalSearch />

        {/* Right cluster */}
        <div className="flex items-center gap-1 ms-auto">
          <TooltipProvider delayDuration={200}>
            <QuickCreatePanel />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDark
                  ? (language === "en" ? "Light mode" : language === "ar" ? "الوضع الفاتح" : "حالت روشن")
                  : (language === "en" ? "Dark mode" : language === "ar" ? "الوضع الداكن" : "حالت تاریک")}
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Language">
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {language === "en" ? "Language" : language === "ar" ? "اللغة" : "زبان"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="bg-background">
                {([
                  { code: "en", label: "English" },
                  { code: "ar", label: "العربية" },
                  { code: "fa", label: "فارسی" },
                ] as { code: Language; label: string }[]).map((l) => {
                  const pathWithoutLang = location.pathname.replace(/^\/(en|ar|fa)/, "");
                  const target = l.code === "en" ? (pathWithoutLang || "/") : `/${l.code}${pathWithoutLang || ""}`;
                  return (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => { setLanguage(l.code); navigate(target); }}
                      className={language === l.code ? "bg-primary/10 text-primary font-medium" : ""}
                    >
                      {l.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>


            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {language === "en" ? "Notifications · Coming soon" : language === "ar" ? "التنبيهات · قريباً" : "اعلان‌ها · به‌زودی"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {customAvatar ? (
                    <img src={customAvatar} alt={accountDisplayName} className="h-full w-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </div>

                {isSina && (
                  <span
                    className="hidden md:inline text-sm font-medium max-w-[200px] truncate"
                    dir="rtl"
                    style={{ fontFamily: "'Vazirmatn', sans-serif" }}
                  >
                    {accountDisplayName}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background min-w-[220px]">
              <div
                className="px-2 py-1.5 text-sm font-semibold truncate"
                dir={isSina ? "rtl" : "ltr"}
                style={{ fontFamily: isSina ? "'Vazirmatn', sans-serif" : "'Poppins', sans-serif" }}
              >
                {accountDisplayName}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(lp("/account-settings"))}>
                <Settings className="h-4 w-4 mr-2" />
                {t("accountSettings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                {language === "en" ? "Sign out" : language === "ar" ? "تسجيل الخروج" : "خروج"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:block shrink-0 ${sidebarWidth} ${
            isRTL ? "border-l" : "border-r"
          } border-border transition-[width] duration-200 ease-in-out h-full`}
        >
          <div className="h-full">
            <SidebarContent isCollapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
            <SidebarContent isCollapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 lg:p-6">{children}</main>

          <footer className="border-t border-border px-4 lg:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} Paapeli. {t("allRightsReserved")}</div>
            <div className="flex items-center gap-4">
              <button className="hover:text-foreground underline-offset-4 hover:underline">{t("privacyPolicy")}</button>
              <button className="hover:text-foreground underline-offset-4 hover:underline">{t("api")}</button>
              <button onClick={() => navigate("/contact")} className="hover:text-foreground underline-offset-4 hover:underline">
                {t("contact")}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
