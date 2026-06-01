"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Briefcase } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import heroRobot from "@/src/assets/hero-robot.png";

/* ------------------------------------------------------------------ */
/* Hero section (English copy from Figma; links are placeholders).    */
/* ------------------------------------------------------------------ */

export const HeroSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="flex w-full flex-col items-center bg-white px-0 py-16 sm:py-24">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-12">
        {/* Left content */}
        <div className="flex flex-col items-start gap-8 lg:max-w-[600px] lg:flex-1">
          {/* Announcement pill */}
          <Link
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#bedbff] bg-[#eff6ff] py-1 pl-1 pr-2 transition-colors hover:bg-[#dbeafe]"
          >
            <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1c398e]">
              New
            </span>
            <span className="flex items-center gap-0.5 text-sm text-[#1c398e]">
              Great job! You&rsquo;ve acknowledged this significant alert message.
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </span>
          </Link>

          {/* Title & description */}
          <div className="flex w-full flex-col gap-3">
            <h1 className="flex flex-col text-foreground">
              <span className="text-3xl font-light leading-tight sm:text-4xl">Build, Connect, and Manage</span>
              <span className="text-4xl font-semibold leading-tight sm:text-5xl">IoT Infrastructure Intelligently</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-powered cloud IoT (AIoT) platform to connect devices, collect insights, and control
              infrastructure, under your own white-labeled IoT platform
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              Start Free
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-3 text-base font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]"
            >
              <Briefcase className="size-4" />
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Right content */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <Image
            src={heroRobot}
            alt="AI-powered IoT platform"
            width={596}
            height={596}
            priority
            sizes="(max-width: 1024px) 80vw, 596px"
            className="aspect-square w-full max-w-[596px] object-contain"
          />
        </div>
      </div>
    </section>
  );
};
