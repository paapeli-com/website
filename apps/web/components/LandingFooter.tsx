"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";

/* ------------------------------------------------------------------ */
/* Landing footer. Link text matches Figma (typos in the design like   */
/* "ntelligence Hub" / "Platform Statu" corrected here).               */
/* ------------------------------------------------------------------ */

type FooterColumn = { title: string; links: { label: string; href: string }[] };

const COLUMNS: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Operations Hub", href: "#" },
      { label: "Edge Hub", href: "#" },
      { label: "Intelligence Hub", href: "#" },
      { label: "Device Management", href: "#" },
      { label: "OTA Updates", href: "#" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "#" },
      { label: "SDK & APIs", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Platform Status", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Case Studies", href: "#" },
      { label: "Use Cases", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Partners", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
];

const SOCIALS = [
  { label: "GitHub", href: "#", icon: Github },
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "LinkedIn", href: "#", icon: Linkedin },
];

export const LandingFooter = () => {
  const { isRTL } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer dir={isRTL ? "rtl" : "ltr"} className="flex w-full flex-col items-center bg-white">
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-12 px-6 pb-8 pt-16">
        {/* Top content */}
        <div className="flex w-full flex-col items-start gap-12 lg:flex-row lg:gap-24">
          {/* Logo, description, socials */}
          <div className="flex w-full max-w-[384px] flex-col items-start gap-6 lg:shrink-0">
            <Link href="#" className="flex items-center gap-1.5">
              <Image src={paapeliLogo} alt="Paapeli" width={30} height={30} />
              <span className="text-xl font-semibold text-foreground">Paapeli</span>
            </Link>
            <p className="text-base text-muted-foreground">
              Paapeli is an AI-powered industrial IoT platform that helps organizations monitor assets,
              optimize operations, and unlock real-time insights from their data.
            </p>
            <div className="flex items-center gap-4">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="size-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:flex-1 lg:justify-between">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex w-full max-w-[176px] flex-col items-start gap-5">
                <h3 className="w-full text-base font-medium text-foreground">{col.title}</h3>
                <ul className="flex w-full flex-col items-start gap-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-base text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="flex w-full flex-col items-start border-t border-[#f3f4f6] pt-8">
          <p className="w-full text-center text-base text-muted-foreground">
            © {year} Paapeli, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
