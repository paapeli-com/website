"use client";

import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { useLanguage } from "@/contexts/LanguageContext";

/* Placeholder for the INOTEX 2026 campaign landing. The hero announcement
   pill already links here; the page content is designed later. */

export default function Inotex2026Page() {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-24" />
      <LandingFooter />
    </div>
  );
}
