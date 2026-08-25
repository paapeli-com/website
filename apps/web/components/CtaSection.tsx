"use client";

import Link from "next/link";

import { useLanguage } from "@/contexts/LanguageContext";
import ctaGradient from "@/src/assets/cta-gradient.png";
import ctaLeaves from "@/src/assets/cta-leaves.svg";

/* ------------------------------------------------------------------ */
/* Closing CTA (Figma 158:2157). The soft orange gradient and the leaf */
/* outlines are exported straight from the design: the gradient as a   */
/* card-sized PNG (the Figma original is a stack of blurred blobs),    */
/* the leaves as the clipped 349x350 top-right overlay.                */
/* ------------------------------------------------------------------ */

const COPY: Record<string, { heading: string; body: string; demo: string }> = {
  en: {
    heading: "Start building smarter operations today",
    body: "See how Paapeli cloud can help you monitor, optimize, and scale your industrial systems.",
    demo: "Book a Demo",
  },
  fa: {
    heading: "از امروز عملیات هوشمندتری بسازید",
    body: "ببینید پلتفرم ابری پاپلی چطور کمک می‌کند سامانه‌های صنعتی خود را پایش، بهینه و مقیاس‌پذیر کنید",
    demo: "درخواست دمو",
  },
  ar: {
    heading: "ابدأ ببناء عمليات أذكى اليوم",
    body: "اكتشف كيف تساعدك منصة بابيلي السحابية على مراقبة أنظمتك الصناعية وتحسينها وتوسيع نطاقها",
    demo: "احجز عرضًا توضيحيًا",
  },
};

export const CtaSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 py-10 sm:py-14"
    >
      <div className="flex w-full max-w-[1280px] items-center justify-center">
        <div
          className="relative flex w-full max-w-[1024px] flex-col items-start gap-8 overflow-hidden rounded-2xl border border-[#ffcda1] bg-white bg-cover bg-center p-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:p-14"
          style={{ backgroundImage: `url(${ctaGradient.src})` }}
        >
          {/* White leaf outlines clipped to the top-right corner. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ctaLeaves.src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-[350px] w-[349px] max-w-none select-none"
          />

          {/* Left content */}
          <div className="relative flex w-full max-w-[640px] flex-col items-start gap-4 text-[#101828]">
            {/* Width caps reproduce the design's line breaks ("…smarter / operations today" and "…your / industrial systems."). */}
            <h2 className="max-w-[560px] text-3xl font-semibold sm:text-[40px] sm:leading-normal rtl:text-2xl rtl:sm:text-[34px]">
              {copy.heading}
            </h2>
            <p className="max-w-[600px] text-lg rtl:text-base">{copy.body}</p>
          </div>

          {/* Button */}
          <div className="relative flex flex-wrap items-start gap-4">
            <Link
              href={`/${language}/contact?from=home`}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1e2939] px-5 py-3 text-base font-medium text-white drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#101828]"
            >
              {copy.demo}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
