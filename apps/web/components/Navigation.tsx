"use client";

import { MouseEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

import { Settings, LogOut } from "lucide-react";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";
import { blogHref } from "@/lib/blog-link";
import { cn } from "@/lib/utils";
import { localePath as localeHref } from "@/lib/seo";

/* Callers pass paths with and without a leading slash, and sometimes with
   a locale already on the front; normalise before handing it over. */
function localePath(language: string, path: string) {
  const clean = path.replace(/^\/(en|ar|fa)(?=\/|$)/, "").replace(/^\/+/, "");
  return localeHref(language, clean ? `/${clean}` : "/");
}

export const Navigation = () => {
  const { t, isRTL, language } = useLanguage();
  const { isAuthenticated, signOut, user } = useAuth();
  const pathname = usePathname();

  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  const isPanelDomain =
    hostname === "panel.paapeli.com" || hostname?.includes("panel-");

  const isMainDomain =
    hostname === "paapeli.com" ||
    hostname === "www.paapeli.com" ||
    hostname === "localhost";

  const handleLogin = () => {
    if (isMainDomain && !isPanelDomain) {
      window.location.href = "https://panel.paapeli.com/login";
    } else {
      window.location.href = localePath(language, "/login");
    }
  };

  const handleLogout = () => {
    signOut(true);
  };

  const [currentl, setCurrentL] = useState<DOMRect>();

  function hoveMr(e: MouseEvent<HTMLButtonElement>) {
    const el = e.target as HTMLElement;
    const rect = el.getBoundingClientRect();
    setCurrentL(rect);
  }

  return (
    <>
      <div style={{position:'fixed',top:1,zIndex:-111,pointerEvents:'none',opacity:0}}>
        {[
          ["makers-developers", "makersDevelopers"],
          ["oil-gas", "oilGas"],
          ["smart-cities", "smartCities"],
          ["smart-agriculture", "smartAgriculture"],
          ["smart-buildings", "smartBuildings"],
        ].map(([path, titleKey]) => (
     
            <Link
            prefetch
             key={path + titleKey}
              dir={isRTL ? "rtl" : "ltr"}
              href={localePath(language, path)}
              className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              {t(titleKey)}
            </Link>
      
        ))}

        {[
          ["aiot-platform", "aiotPlatform", "aiotPlatformNavDesc"],
          ["ddos-protection", "ddosProtection", "ddosProtectionNavDesc"],
          ["edge-computing", "edgeComputing", "edgeComputingNavDesc"],
          [
            "intelligence-insight",
            "intelligenceInsight",
            "intelligenceInsightNavDesc",
          ],
          ["ota", "ota", "otaNavDesc"],
        ].map(([path, title, desc]) => (
          <Link
          prefetch
          key={path + title}
            href={localePath(language, path)}
            className={cn(
              "block w-full rounded-md p-3 text-left transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>
              {t(title)}
            </div>
       
          </Link>
        ))}
      </div>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-[68px]">
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <Link
              href={localePath(language, "/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src={paapeliLogo}
                alt="Paapeli Logo"
                height={40}
                priority
              />
              <span className="text-2xl font-bold text-primary">Paapeli</span>
            </Link>

            {/* Desktop Navigation */}
            <div
              className={cn(
                "hidden md:flex items-center gap-6",
                isRTL && "flex-row-reverse"
              )}
            >
              <NavigationMenu currentl={currentl}>
                <NavigationMenuList className={isRTL ? "flex-row-reverse" : ""}>
                  {/* Products */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className="bg-transparent text-base"
                      onMouseEnter={hoveMr}
                    >
                      {t("products")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 w-[400px]">
                        {[
                          [
                            "aiot-platform",
                            "aiotPlatform",
                            "aiotPlatformNavDesc",
                          ],
                          [
                            "ddos-protection",
                            "ddosProtection",
                            "ddosProtectionNavDesc",
                          ],
                          [
                            "edge-computing",
                            "edgeComputing",
                            "edgeComputingNavDesc",
                          ],
                          [
                            "intelligence-insight",
                            "intelligenceInsight",
                            "intelligenceInsightNavDesc",
                          ],
                          ["ota", "ota", "otaNavDesc"],
                        ].map(([path, title, desc]) => (
                          <li key={path} dir="rtl">
                            <NavigationMenuLink asChild>
                              <Link
                                href={localePath(language, path)}
                                className={cn(
                                  "block w-full rounded-md p-3 text-left transition-colors",
                                  "hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                <div
                                  className="text-sm font-medium"
                                  dir={isRTL ? "rtl" : "ltr"}
                                >
                                  {t(title)}
                                </div>
                                <p
                                  className="text-xs text-muted-foreground"
                                  dir={isRTL ? "rtl" : "ltr"}
                                >
                                  {t(desc)}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  {/* Use Cases */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className="bg-transparent text-base"
                      onMouseEnter={hoveMr}
                    >
                      {t("useCases")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-2 p-4 w-[280px]">
                        {[
                          ["makers-developers", "makersDevelopers"],
                          ["oil-gas", "oilGas"],
                          ["smart-cities", "smartCities"],
                          ["smart-agriculture", "smartAgriculture"],
                          ["smart-buildings", "smartBuildings"],
                        ].map(([path, titleKey]) => (
                          <li key={path}>
                            <NavigationMenuLink asChild>
                              <Link
                                dir={isRTL ? "rtl" : "ltr"}
                                href={localePath(language, path)}
                                className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                              >
                                {t(titleKey)}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  {/* Docs Menu */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className="bg-transparent text-base"
                      onMouseEnter={hoveMr}
                    >
                      {t("docs")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-2 p-4 w-[220px]">
                        <li>
                          <NavigationMenuLink asChild>
                            <a
                              href="https://docs.paapeli.com/"
                              className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                              {t("features")}
                            </a>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <a
                              href="https://docs.paapeli.com/"
                              className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                              {t("apis")}
                            </a>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <a
                              href="https://docs.paapeli.com/"
                              className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                              {t("sdks")}
                            </a>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  {/* Pricing Link */}
                  <NavigationMenuItem>
                    <Link
                      href={localePath(language, "pricing")}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                    >
                      {t("pricing")}
                    </Link>
                  </NavigationMenuItem>
                  {/* Blog Link */}
                  <NavigationMenuItem>
                    <a
                      href={blogHref(language)}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                    >
                      {t("blog")}
                    </a>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {isMainDomain && !isPanelDomain ? (
                <Button onClick={handleLogin} size="sm">
                  {t("dashboard")}
                </Button>
              ) : !isAuthenticated ? (
                <Button onClick={handleLogin} size="sm">
                  {t("login")}
                </Button>
              ) : (
                <div className="relative group">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("account")}</span>
                  </Button>

                  <div className="absolute right-0 top-full mt-2 w-48 hidden group-hover:block rounded-md border bg-popover shadow-lg">
                    {user?.getUsername() && (
                      <div className="px-3 py-2 border-b text-xs text-muted-foreground truncate">
                        {user.getUsername()}
                      </div>
                    )}

                    <Link
                      href={localePath(language, "account-settings")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Settings className="h-4 w-4" />
                      {t("accountSettings")}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
