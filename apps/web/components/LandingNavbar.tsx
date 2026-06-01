"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowRight, Menu, X, AppWindow } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Mega-menu data (English copy from Figma; links are placeholders).  */
/* ------------------------------------------------------------------ */

type MenuItem = { title: string; description: string; href: string };
type MegaMenu = { columns: MenuItem[][] };

const MENUS: Record<string, MegaMenu> = {
  Platform: {
    columns: [
      [
        {
          title: "Device & Gateway Management",
          description:
            "Manage industrial assets and gateways at scale with support for MQTT, OPC-UA, Modbus, and HTTP.",
          href: "#",
        },
        {
          title: "Real-Time Operations",
          description: "Monitor industrial processes and operational data in real time.",
          href: "#",
        },
        {
          title: "AI & Anomaly Detection",
          description:
            "Detect abnormal patterns, predict failures, and optimize operations using AI.",
          href: "#",
        },
      ],
      [
        {
          title: "OTA Updates",
          description: "Securely manage firmware and edge software updates remotely.",
          href: "#",
        },
        {
          title: "Edge & Hybrid Deployment",
          description:
            "Deploy on cloud, on-premise, or edge environments based on operational needs.",
          href: "#",
        },
        {
          title: "Solution Templates",
          description:
            "Accelerate deployment using pre-built industrial templates and workflows.",
          href: "#",
        },
      ],
    ],
  },
  Solution: {
    columns: [
      [
        {
          title: "Operations Hub",
          description:
            "Unified operational visibility, monitoring, and AI-driven insights for industrial environments.",
          href: "#",
        },
        {
          title: "Edge Hub",
          description:
            "Connect, manage, and monitor industrial assets and edge devices at scale.",
          href: "#",
        },
      ],
      [
        {
          title: "Intelligence Hub",
          description:
            "Predict failures, detect anomalies, and optimize industrial performance using AI.",
          href: "#",
        },
        {
          title: "Infrastructure Hub",
          description:
            "Operational intelligence for modern infrastructure and mission-critical environments.",
          href: "#",
        },
      ],
    ],
  },
  Ecosystem: {
    columns: [
      [
        {
          title: "Developers",
          description: "Build industrial applications and integrations on top of the Paapeli platform.",
          href: "#",
        },
        {
          title: "SDK & APIs",
          description:
            "Access APIs, SDKs, and integration tools for connecting devices, systems, and external services.",
          href: "#",
        },
        {
          title: "Partners",
          description:
            "Collaborate with Paapeli as a technology partner, system integrator, or hardware provider.",
          href: "#",
        },
      ],
      [
        {
          title: "White-Label Platform",
          description:
            "Launch your own branded industrial platform powered by Paapeli infrastructure.",
          href: "#",
        },
        {
          title: "GitHub",
          description: "Explore open-source components, code examples, and developer resources.",
          href: "#",
        },
      ],
    ],
  },
  Resources: {
    columns: [
      [
        {
          title: "Documentation",
          description: "Technical docs and implementation guides.",
          href: "#",
        },
        {
          title: "Blog",
          description: "Industry insights and platform updates.",
          href: "#",
        },
      ],
      [
        {
          title: "Use Case",
          description: "Real-world industrial implementations.",
          href: "#",
        },
        {
          title: "Case Studies",
          description: "Business outcomes and transformation stories.",
          href: "#",
        },
      ],
    ],
  },
};

/* Top-level items, in display order. `menu` links to a MEGA_MENU key. */
const NAV_ITEMS: { label: string; href?: string; menu?: keyof typeof MENUS }[] = [
  { label: "Home", href: "#" },
  { label: "Platform", menu: "Platform" },
  { label: "Solution", menu: "Solution" },
  { label: "Ecosystem", menu: "Ecosystem" },
  { label: "Resources", menu: "Resources" },
  { label: "Pricing", href: "#" },
];

const LANGS = [
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
] as const;

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MegaMenuItem({ item }: { item: MenuItem }) {
  return (
    <Link
      href={item.href}
      className="flex w-full items-start gap-1.5 rounded-lg p-2 transition-colors hover:bg-[#f9fafb]"
    >
      <ChevronRight className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold leading-none text-foreground">{item.title}</p>
        <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
      </div>
    </Link>
  );
}

/* The promo card is identical across every mega-menu. The Figma uses a
   multi-layer illustration served from the Figma dev server; here it is a
   lightweight placeholder to be swapped for the final asset. */
function PromoCard() {
  return (
    <div className="hidden w-[576px] shrink-0 self-stretch xl:block">
      <div style={{height:'fit-content'}} className="flex h-full items-stretch gap-6 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
        <div className="flex w-[160px] shrink-0 items-center justify-center bg-[#f9fafb]">
          <AppWindow className="size-12 text-primary/70" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 flex-col items-start gap-4 py-5 pr-5">
          <div className="flex flex-col gap-2">
            <p className="text-base font-bold leading-tight text-foreground">Build your website fast</p>
            <p className="text-sm leading-snug text-muted-foreground">
              In today&rsquo;s fast-paced digital landscape, fostering seamless collaboration among
              Developers.
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#f3f4f6]"
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MegaMenuPanel({ menu }: { menu: MegaMenu }) {
  return (
    <div className="absolute inset-x-0 top-full border-b border-[#e5e7eb] bg-white shadow-[0px_4px_6px_-4px_rgba(29,41,61,0.1),0px_10px_15px_-3px_rgba(29,41,61,0.1)]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-9">
        <div className="flex items-start gap-12">
          {menu.columns.map((col, i) => (
            <div key={i} className="flex flex-1 flex-col gap-3">
              {col.map((item) => (
                <MegaMenuItem key={item.title} item={item} />
              ))}
            </div>
          ))}
          <PromoCard />
        </div>
      </div>
    </div>
  );
}

function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className="size-[18px] transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-[#e5e7eb] bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {LANGS.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[#f9fafb]",
              language === lang.code ? "font-medium text-primary" : "text-muted-foreground"
            )}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main navbar                                                        */
/* ------------------------------------------------------------------ */

export const LandingNavbar = () => {
  const { isRTL } = useLanguage();
  const [openMenu, setOpenMenu] = useState<keyof typeof MENUS | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      onMouseLeave={() => setOpenMenu(null)}
      className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-white"
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-6 py-6">
        {/* Logo */}
        <Link href="#" className="flex shrink-0 items-center gap-1.5">
          <Image src={paapeliLogo} alt="Paapeli" width={30} height={30} priority />
          <span className="text-xl font-semibold text-foreground">Paapeli</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.menu ? (
              <button
                key={item.label}
                type="button"
                onMouseEnter={() => setOpenMenu(item.menu!)}
                className="flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
                <ChevronDown
                  className={cn(
                    "size-[18px] transition-transform",
                    openMenu === item.menu && "rotate-180"
                  )}
                />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                onMouseEnter={() => setOpenMenu(null)}
                className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <Link
            href="#"
            className="hidden h-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6] sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="#"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
          >
            Sign up
          </Link>

          <div className="hidden h-5 w-px bg-[#e5e7eb] lg:block" />
          <div className="hidden lg:block">
            <LanguageMenu />
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#f9fafb] lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {openMenu && <MegaMenuPanel menu={MENUS[openMenu]} />}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-100%)] overflow-y-auto border-t border-[#e5e7eb] bg-white px-6 py-4 shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1)] lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f9fafb] hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="#"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2 py-2.5 text-center text-sm font-medium text-muted-foreground sm:hidden"
            >
              Login
            </Link>
            <div className="mt-3 border-t border-[#e5e7eb] pt-3">
              <LanguageMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
