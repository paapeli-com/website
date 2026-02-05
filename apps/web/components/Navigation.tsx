'use client';

import { MouseEvent, MouseEventHandler, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

import { Settings, LogOut } from 'lucide-react';
import paapeliLogo from '@/src/assets/paapeli-logo.svg';
import { cn } from '@/lib/utils';

export const Navigation = () => {
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const { isAuthenticated, signOut, user } = useAuth();

  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  const isPanelDomain =
    hostname === 'panel.paapeli.com' || hostname?.includes('panel-');

  const isMainDomain =
    hostname === 'paapeli.com' ||
    hostname === 'www.paapeli.com' ||
    hostname === 'localhost';

  // const language = language === 'en' ? '' : `/${language}`;

  const getBlogUrl = () =>
    language === 'en'
      ? 'https://docs.paapeli.com/blog/'
      : `https://docs.paapeli.com/${language}/blog/`;

  const handleLogin = () => {
    if (isMainDomain && !isPanelDomain) {
      window.location.href = 'https://panel.paapeli.com/login';
    } else {
      navigate('/login');
    }
  };
const pathname = usePathname();
  const handleLogout = () => {
    signOut(true);
  };
const navigate = (path: string) => {
  const cleanPath = path.replace(/^\/(en|ar|fa)/, '');
  const target =
    language === 'en'
      ? `/${cleanPath}`.replace('//', '/')
      : `/${language}/${cleanPath}`.replace('//', '/');

  router.push(target);
};
  const handleAccountSettings = () => {
    navigate('/account-settings');
  };


  const [currentl, setCurrentL] = useState<DOMRect>()

  function hoveMr(e:MouseEvent<HTMLButtonElement>){
    const el = e.target as HTMLElement
    const rect = el.getBoundingClientRect()
    setCurrentL(rect)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-[68px]">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src={paapeliLogo}
              alt="Paapeli Logo"
              height={40}
              priority
            />
            <span className="text-2xl font-bold text-primary">Paapeli</span>
          </button>

          {/* Desktop Navigation */}
          <div className={cn('hidden md:flex items-center gap-6', isRTL && 'flex-row-reverse')}>
            <NavigationMenu currentl={currentl}>
              <NavigationMenuList className={isRTL ? 'flex-row-reverse' : ''}>
                {/* Products */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-base" onMouseEnter={hoveMr}>
                    {t('products')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px]">
                      {[
                        ['aiot-platform', 'aiotPlatform', 'aiotPlatformNavDesc'],
                        ['ddos-protection', 'ddosProtection', 'ddosProtectionNavDesc'],
                        ['edge-computing', 'edgeComputing', 'edgeComputingNavDesc'],
                        ['intelligence-insight', 'intelligenceInsight', 'intelligenceInsightNavDesc'],
                        ['ota', 'ota', 'otaNavDesc'],
                      ].map(([path, title, desc]) => (
                        <li key={path} dir='rtl'>
                          <NavigationMenuLink asChild>
                            
                            <button
                              onClick={() => navigate(`${language}/${path}`)}
                              className={cn(
                                'block w-full rounded-md p-3 text-left transition-colors',
                                'hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <div className="text-sm font-medium" dir={isRTL ? "rtl": "ltr"}>
                                {t(title)}
                              </div>
                              <p className="text-xs text-muted-foreground" dir={isRTL ? "rtl": "ltr"}>
                                {t(desc)}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {/* Use Cases */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-base" onMouseEnter={hoveMr}>
                    {t('useCases')}
                  </NavigationMenuTrigger>
                   <NavigationMenuContent >
                    <ul className="grid gap-2 p-4 w-[280px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                          dir={isRTL ? "rtl": "ltr"}
                            onClick={() => navigate(`${language}/makers-developers`)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('makersDevelopers')}
                          </button>
                        </NavigationMenuLink>
                      </li>
                      <li >
                        <NavigationMenuLink asChild>
                          <button
                          dir={isRTL ? "rtl": "ltr"}
                            onClick={() => navigate(`${language}/oil-gas`)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('oilGas')}
                          </button>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                          dir={isRTL ? "rtl": "ltr"}
                            onClick={() => navigate(`${language}/smart-cities`)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('smartCities')}
                          </button>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                          dir={isRTL ? "rtl": "ltr"}
                            onClick={() => navigate(`${language}/smart-agriculture`)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('smartAgriculture')}
                          </button>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                          dir={isRTL ? "rtl": "ltr"}
                            onClick={() => navigate(`${language}/smart-buildings`)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('smartBuildings')}
                          </button>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {/* Docs Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-base" onMouseEnter={hoveMr}>
                    {t('docs')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-4 w-[220px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="https://docs.paapeli.com/"
                            className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('features')}
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="https://docs.paapeli.com/"
                            className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('apis')}
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="https://docs.paapeli.com/"
                            className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            {t('sdks')}
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {/* Pricing Link */}
                <NavigationMenuItem>
                  <button
                 onClick={() => navigate(`${language}/pricing`)}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                  >
                    {t('pricing')}
                  </button>
                </NavigationMenuItem>
                {/* Blog Link */}
                <NavigationMenuItem>
                  <a
                    href={getBlogUrl()}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                  >
                    {t('blog')}
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
                {t('dashboard')}
              </Button>
            ) : !isAuthenticated ? (
              <Button onClick={handleLogin} size="sm">
                {t('login')}
              </Button>
            ) : (
              <div className="relative group">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('account')}</span>
                </Button>

                <div className="absolute right-0 top-full mt-2 w-48 hidden group-hover:block rounded-md border bg-popover shadow-lg">
                  {user?.getUsername() && (
                    <div className="px-3 py-2 border-b text-xs text-muted-foreground truncate">
                      {user.getUsername()}
                    </div>
                  )}

                  <button
                    onClick={handleAccountSettings}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    {t('accountSettings')}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
