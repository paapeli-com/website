import { useEffect, useRef, useState } from "react";
import { Blocks, Boxes, ChevronDown, ChevronRight, LayoutTemplate, Menu, Sparkles, X, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { APP_LANGUAGES, setAppLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useCopy, type LoginCopy } from "./copy";

/* The marketing site's header, ported from apps/web's LandingNavbar for the
   login page — same five nav items, same mega menus with their promo panel,
   same Dashboard button and language control.

   Deliberately NOT an import from apps/web: that component is a Next.js client
   component (next/link, next/image) wired to that app's LanguageContext. The
   panel is Vite, so the markup is reproduced here with plain <a> tags to the
   marketing site.

   The parts that do not apply are dropped rather than faked: the transparent
   over-a-dark-hero variant (there is no hero here — this header is always
   solid) and the locale-prefixed internal routes (every destination is
   absolute, on another origin).

   Nav labels and the language control are translated; the mega-menu entries
   are not. Those are marketing copy for English pages on another origin —
   translating the link text while the page it opens stays English would be a
   worse lie than leaving it. */

const SITE = "https://paapeli.com";
const PANEL_URL = "/";

type MenuItem = { href: string; title: string; description: string; isNew?: boolean };
type MenuKey = "Products" | "Solution" | "Ecosystem" | "Resources";

const MENUS: Record<MenuKey, MenuItem[][]> = {
  Products: [
    [
      { href: `${SITE}/aiot-platform`, title: "AIoT Platform", description: "AI-powered IoT cloud platform" },
      { href: `${SITE}/edge-computing`, title: "Edge Computing", description: "Process data at the edge for faster insights" },
      { href: `${SITE}/features/ota-updates`, title: "OTA", description: "Over-the-air firmware updates" },
    ],
    [
      { href: `${SITE}/ddos-protection`, title: "DDoS Protection", description: "Secure your infrastructure from DDoS attacks" },
      { href: `${SITE}/intelligence-insight`, title: "Intelligence Insight", description: "AI-powered analytics and insights" },
    ],
  ],
  Solution: [
    [
      { href: `${SITE}/smart-manufacturing`, title: "Smart Manufacturing", description: "Connect machines, monitor production, and improve industrial performance." },
      { href: `${SITE}/smart-buildings`, title: "Smart Buildings", description: "Connect building systems and monitor energy, environment, and equipment." },
      { href: `${SITE}/fleet-tracking`, title: "Asset & Fleet Tracking", description: "Track vehicles, equipment, and mobile assets with real-time location and alerts." },
    ],
    [
      { href: `${SITE}/oil-gas`, title: "Oil & Gas Monitoring", description: "Monitor distributed assets, operational conditions, and critical equipment." },
      { href: `${SITE}/smart-agriculture`, title: "Smart Agriculture", description: "Monitor environmental conditions, irrigation, and connected agricultural assets." },
      { href: `${SITE}/energy-monitoring`, title: "Energy Monitoring", description: "Measure consumption, detect anomalies, and improve energy efficiency." },
    ],
  ],
  Ecosystem: [
    [
      { href: "https://api.paapeli.com/swagger-ui/index.html", title: "Developer APIs", description: "Build industrial applications and integrations on top of the Paapeli platform." },
      { href: "https://docs.paapeli.com/docs/category/sdks", title: "SDKs", description: "Access SDKs and integration tools for connecting devices, systems, and external services." },
      { href: `${SITE}/contact`, title: "Partners", description: "Collaborate with Paapeli as a technology partner, system integrator, or hardware provider." },
    ],
    [
      { href: `${SITE}/contact`, title: "White-Label Platform", description: "Launch your own branded industrial platform powered by Paapeli infrastructure." },
      { href: "https://github.com/paapeli-com", title: "GitHub", description: "Explore open-source components, code examples, and developer resources." },
    ],
  ],
  Resources: [
    [
      { href: `${SITE}/AI-Readiness-Assessment`, title: "AI Readiness Assessment", description: "Measure how ready your organisation is to create real value with AI across seven dimensions, free, in about 10 minutes.", isNew: true },
      { href: "https://docs.paapeli.com/", title: "Documentation", description: "Technical docs and implementation guides." },
      { href: `${SITE}/AI-Readiness-Assessment/report`, title: "Reports & Insights", description: "Industry reports and data-driven insights." },
    ],
    [
      { href: `${SITE}/blog`, title: "Blog", description: "Industry insights and platform updates." },
      { href: "https://docs.paapeli.com/docs/category/getting-started", title: "Guide", description: "Step-by-step guides to get you started." },
    ],
  ],
};

const PROMO: Record<MenuKey, { title: string; description: string; cta: string; href: string; icon: LucideIcon }> = {
  Products: {
    title: "Build Intelligent Operations at Scale",
    description: "Connect devices, manage infrastructure, and turn operational data into AI-powered decisions.",
    cta: "Explore Platform",
    href: `${SITE}/aiot-platform`,
    icon: Boxes,
  },
  Solution: {
    title: "One platform, six industries",
    description: "Manufacturing, oil & gas, energy, buildings, fleet and agriculture, each with a solution template that is ready on day one.",
    cta: "See the templates",
    href: `${SITE}/features/solution-templates`,
    icon: LayoutTemplate,
  },
  Ecosystem: {
    title: "Build on Paapeli",
    description: "APIs, SDKs and a white-label platform for integrators who ship an industrial product under their own brand.",
    cta: "Talk to Sales",
    href: `${SITE}/contact`,
    icon: Blocks,
  },
  Resources: {
    title: "How ready are you for AI?",
    description: "Seven dimensions, about 10 minutes, free. Get a score for your organisation and a plan for what to fix first.",
    cta: "Start the assessment",
    href: `${SITE}/AI-Readiness-Assessment`,
    icon: Sparkles,
  },
};

const NAV_ITEMS: Array<{ key: keyof LoginCopy; menu?: MenuKey; href?: string }> = [
  { key: "navProducts", menu: "Products" },
  { key: "navSolution", menu: "Solution" },
  { key: "navEcosystem", menu: "Ecosystem" },
  { key: "navResources", menu: "Resources" },
  { key: "navPricing", href: `${SITE}/pricing` },
];

const PaapeliMark = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7C11 9.20914 9.20914 11 7 11C4.79086 11 3 9.20914 3 7Z" fill="#FF7900" />
    <path d="M17 3C19.2091 3 21 4.79086 21 7C21 8.94683 19.6088 10.5671 17.7666 10.9248L14.6015 11.774C13.2218 12.1441 12.1443 13.2219 11.7744 14.6016L10.9238 17.7744C10.5631 19.6128 8.94411 21 7 21C4.79086 21 3 19.2091 3 17C3 15.0613 4.37913 13.4438 6.20996 13.0771L9.39678 12.2227C10.7763 11.8528 11.854 10.7754 12.2242 9.39594L13.0742 6.22852C13.4337 4.38852 15.0548 3 17 3Z" fill="#111111" />
  </svg>
);

function MegaMenuItem({ item }: { item: MenuItem }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-full flex-col gap-1 rounded-lg border border-transparent p-3 transition-colors hover:border-[#ffcda1] hover:bg-[#fff7f0]"
    >
      <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        {item.title}
        <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        {item.isNew && (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
            New
          </span>
        )}
      </p>
      <p className="text-[13px] leading-snug text-muted-foreground">{item.description}</p>
    </a>
  );
}

function PromoCard({ menuKey }: { menuKey: MenuKey }) {
  const copy = PROMO[menuKey];
  const Icon = copy.icon;
  return (
    <aside className="hidden w-[280px] shrink-0 self-stretch xl:block">
      <div className="flex h-full flex-col items-start gap-4 rounded-xl border border-[#e5e7eb] bg-[#fbfcfd] p-6">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#fff1e6]">
          <Icon className="size-5 text-primary" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold leading-snug text-foreground">{copy.title}</p>
          <p className="text-[13px] leading-snug text-muted-foreground">{copy.description}</p>
        </div>
        <a
          href={copy.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-primary px-4 text-[13px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {copy.cta}
          <ChevronRight className="size-4" />
        </a>
      </div>
    </aside>
  );
}

/* Always mounted so the panel can tween its height between menus and fade out
   on close instead of vanishing — same three animations as the original. */
function MegaMenuDropdown({ openMenu }: { openMenu: MenuKey | null }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [displayed, setDisplayed] = useState<MenuKey | null>(openMenu);

  useEffect(() => {
    if (openMenu) setDisplayed(openMenu);
  }, [openMenu]);

  useEffect(() => {
    if (openMenu && contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, [openMenu, displayed]);

  return (
    <div
      aria-hidden={!openMenu}
      style={{ height: openMenu ? height : 0 }}
      className={cn(
        "absolute inset-x-0 top-full overflow-hidden bg-white transition-[height,opacity] duration-300 ease-out",
        openMenu
          ? "border-b border-[#e5e7eb] opacity-100 shadow-[0px_4px_6px_-4px_rgba(29,41,61,0.1),0px_10px_15px_-3px_rgba(29,41,61,0.1)]"
          : "pointer-events-none opacity-0",
      )}
    >
      <div ref={contentRef}>
        {displayed && (
          <div className="mx-auto w-full max-w-[1280px] px-6 py-9">
            <div className="flex items-start gap-12">
              {MENUS[displayed].map((col, i) => (
                <div key={i} className="flex flex-1 flex-col gap-3">
                  {col.map((item) => (
                    <MegaMenuItem key={item.title} item={item} />
                  ))}
                </div>
              ))}
              <PromoCard menuKey={displayed} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* The switcher writes the panel-wide language store, which is what actually
   re-renders this page and flips <html lang dir>. It used to be presentational
   — three links to `paapeli.com/<code>` — so picking a language navigated off
   the login page to the marketing site instead of translating anything. */
function LanguageMenu() {
  const language = useAppLanguage();
  const current = APP_LANGUAGES.find((l) => l.code === language) ?? APP_LANGUAGES[0];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className="size-[18px] transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute end-0 top-full z-50 mt-2 w-44 rounded-lg border border-[#e5e7eb] bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {APP_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setAppLanguage(lang.code)}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2 text-start text-sm transition-colors hover:bg-[#f9fafb]",
              lang.code === language ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SiteNav() {
  const copy = useCopy();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      onMouseLeave={() => setOpenMenu(null)}
      className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-white"
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-6 py-3">
        <a href={SITE} className="flex shrink-0 items-center gap-1.5">
          <PaapeliMark />
          <span className="text-xl font-semibold text-foreground">Paapeli</span>
        </a>

        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.menu ? (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setOpenMenu(item.menu!)}
                className="flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {copy[item.key]}
                <ChevronDown
                  className={cn("size-[18px] transition-transform", openMenu === item.menu && "rotate-180")}
                />
              </button>
            ) : (
              <a
                key={item.key}
                href={item.href}
                onMouseEnter={() => setOpenMenu(null)}
                className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {copy[item.key]}
              </a>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {/* On the marketing site this points at the panel. We are already on
              the panel, so it goes to its root — which lands the visitor back
              here until they sign in. */}
          <a
            href={PANEL_URL}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
          >
            {copy.dashboard}
          </a>

          <div className="hidden h-5 w-px bg-[#e5e7eb] lg:block" />
          <div className="hidden lg:block">
            <LanguageMenu />
          </div>

          <button
            type="button"
            aria-label={copy.toggleMenu}
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#f9fafb] lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <MegaMenuDropdown openMenu={openMenu} />

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-100%)] overflow-y-auto border-t border-[#e5e7eb] bg-white px-6 py-4 shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1)] lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href ?? `${SITE}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f9fafb] hover:text-foreground"
              >
                {copy[item.key]}
              </a>
            ))}
            <div className="mt-3 border-t border-[#e5e7eb] pt-3">
              <LanguageMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
