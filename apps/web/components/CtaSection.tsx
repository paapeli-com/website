"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import ctaGroup from "@/src/assets/cta-group.svg";

/* ------------------------------------------------------------------ */
/* Closing CTA. Full orange-gradient bento card with faint white leaf   */
/* outlines bleeding off the top-right corner (per Figma 158:2157).     */
/* ------------------------------------------------------------------ */

export const CtaSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20"
    >
      <div className="flex w-full max-w-[1280px] items-center justify-center">
        <div className="relative flex w-full max-w-[1024px] flex-col items-start gap-8 overflow-hidden rounded-2xl border border-[#ffcda1] bg-[radial-gradient(125%_140%_at_18%_8%,#fcdfbb_0%,#f9c585_42%,#f4a647_78%,#f0993a_100%)] p-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:p-14">
          {/* Faint white leaf outlines in the top-right corner. */}
          {/* `brightness-0 invert` recolors the SVG strokes to white.        */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ctaGroup.src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-[150px] -top-[230px] h-[680px] w-auto max-w-none select-none opacity-50 brightness-0 invert"
          />

          {/* Left content */}
          <div className="relative flex w-full max-w-[640px] flex-col items-start gap-4 text-[#101828]">
            <h2 className="text-3xl font-semibold sm:text-4xl">Start building smarter operations today</h2>
            <p className="text-lg text-[#1e2939]">
              See how Paapeli can help you monitor, optimize, and scale your industrial systems.
            </p>
          </div>

          {/* Buttons */}
          <div className="relative flex flex-wrap items-start gap-4">
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1e2939] px-5 py-3 text-base font-medium text-white shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#101828]"
            >
              Book a Demo
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
      </div>
    </section>
  );
};
