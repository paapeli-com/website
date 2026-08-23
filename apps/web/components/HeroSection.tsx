"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

/* ------------------------------------------------------------------ */
/* Hero section: full-bleed network photo, centred copy on top. The    */
/* announcement pill links to the INOTEX 2026 campaign landing.        */
/* ------------------------------------------------------------------ */

/** Route for the INOTEX 2026 campaign landing, prefixed with the locale. */
const INOTEX_PATH = "/inotex-2026";

const COPY: Record<
  string,
  {
    badge: string;
    announcement: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  }
> = {
  en: {
    badge: "INOTEX 2026",
    announcement: "Meet Paapeli at INOTEX 2026",
    title: "Build, Connect, and Manage IoT Infrastructure Intelligently",
    description:
      "Paapeli is an AI-powered cloud IoT (AIoT) that helps you connect devices, collect insights, and control your infrastructure from anywhere.",
    primary: "Start Free",
    secondary: "Learn More",
  },
  fa: {
    badge: "اینوتکس ۲۰۲۶",
    announcement: "پاپلی را در اینوتکس ۲۰۲۶ از نزدیک ببینید",
    title: "ساخت، اتصال و مدیریت هوشمند زیرساخت‌های اینترنت اشیا",
    description:
      "با پلتفرم ابری AIoT پاپلی، دستگاه‌ها و تجهیزات خود را به یک پلتفرم ابری متصل کنید، داده‌های عملیاتی را به بینش تبدیل کنید و همه‌چیز را با کمک هوش مصنوعی، یکپارچه پایش و کنترل کنید.",
    primary: "شروع رایگان",
    secondary: "بیشتر بدانید",
  },
  ar: {
    badge: "إينوتكس 2026",
    announcement: "التقِ ببابيلي في إينوتكس 2026",
    title: "اربط كل جهاز، وحوّل كل بيانات إلى قرار",
    description:
      "مع منصة بابيلي السحابية AIoT، اربط أجهزتك ومعداتك بمنصة سحابية واحدة، وحوّل البيانات التشغيلية إلى رؤى، وراقب كل شيء وتحكم فيه بمساعدة الذكاء الاصطناعي.",
    primary: "ابدأ مجانًا",
    secondary: "اعرف المزيد",
  },
};

export const HeroSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#0a1420] px-6 pb-24 pt-32 sm:pb-32 sm:pt-40"
    >
      {/* Layer 1: the photo itself. */}
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover"
      />
      {/* Layer 2: readability veil over the photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b from-[#0a1420]/75 via-[#0a1420]/55 to-[#0a1420]/85"
      />
      {/* Layer 3: a blurred, screen-blended copy of the photo breathing on top
          of the veil. Screen only lifts bright pixels, so the lit nodes bloom
          while the dark background stays where it is. It has to sit ABOVE the
          veil, otherwise the veil paints the glow straight back out. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 animate-hero-glow blur-[2px] mix-blend-screen"
      >
        <Image src="/hero-bg.jpg" alt="" fill sizes="100vw" className="object-cover" />
      </div>

      <div className="relative flex w-full max-w-[1000px] flex-col items-center gap-6 text-center">
        {/* Pill + headline share a shrink-to-fit column so the pill starts
            exactly where the headline text starts. */}
        <div className="flex w-fit max-w-full flex-col items-start gap-5">
          {/* Announcement pill */}
          <Link
            href={`/${language}${INOTEX_PATH}`}
            /* On wide LTR screens the headline is two centred lines, so its first
               line starts ~150px inside the block. Nudge the pill over to sit above
               it. RTL headlines are a single line and already line up. */
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-2 backdrop-blur-sm transition-colors hover:bg-white/20 rtl:pl-2 rtl:pr-1 lg:ltr:ms-[150px]"
          >
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {copy.badge}
            </span>
            <span className="flex items-center gap-0.5 text-sm text-white/90">
              {copy.announcement}
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </span>
          </Link>

          <h1 className="text-balance text-center text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
        </div>

        <p className="max-w-[680px] text-base leading-relaxed text-white/80 sm:text-lg">
          {copy.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copy.primary}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
          <Link
            href="#"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            {copy.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
};
