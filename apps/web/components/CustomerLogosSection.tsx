"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import logoCocaCola from "@/src/assets/logo-cocacola.svg";
import logoIntel from "@/src/assets/logo-intel.svg";
import logoTesla from "@/src/assets/logo-tesla.svg";
import logoStripe from "@/src/assets/logo-stripe.svg";
import logoShell from "@/src/assets/logo-shell.svg";
import logoFord from "@/src/assets/logo-ford.svg";
import logoPepsi from "@/src/assets/logo-pepsi.svg";

/* ------------------------------------------------------------------ */
/* Customer logos. Logos are Figma placeholder brands — swap for real  */
/* customer logos when available.                                      */
/* ------------------------------------------------------------------ */

type Logo = { name: string; src: StaticImageData; width: number };

const ROW_1: Logo[] = [
  { name: "Coca-Cola", src: logoCocaCola, width: 96 },
  { name: "Intel", src: logoIntel, width: 87 },
  { name: "Tesla", src: logoTesla, width: 153 },
];

const ROW_2: Logo[] = [
  { name: "Stripe", src: logoStripe, width: 80 },
  { name: "Shell", src: logoShell, width: 115 },
  { name: "Ford", src: logoFord, width: 97 },
  { name: "Pepsi", src: logoPepsi, width: 112 },
];

function LogoCard({ logo }: { logo: Logo }) {
  return (
    <div className="flex h-[107px] flex-1 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">
      <Image src={logo.src} alt={logo.name} width={logo.width} height={48} className="h-12 w-auto" />
    </div>
  );
}

export const CustomerLogosSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-16 pt-14 sm:pb-28 sm:pt-20"
    >
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        {/* Block heading */}
        <div className="flex w-full max-w-[768px] flex-col items-center gap-4">
          <h2 className="w-full text-center text-3xl font-semibold text-foreground sm:text-4xl">
            Trusted by leading industrial teams
          </h2>
          <p className="w-full max-w-[672px] text-center text-lg text-muted-foreground">
            Enabling organizations to improve reliability, reduce downtime, and unlock operational
            intelligence.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1447e6] transition-opacity hover:opacity-80"
          >
            Explore our integrations
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* Two rows of logo cards */}
        <div className="flex w-full max-w-[1024px] flex-col gap-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {ROW_1.map((logo) => (
              <LogoCard key={logo.name} logo={logo} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {ROW_2.map((logo) => (
              <LogoCard key={logo.name} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
