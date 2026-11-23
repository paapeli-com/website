"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronRight, ChevronsDown } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { BRICS_2026_POST, blogPostHref } from "@/lib/blog-link";
import { PANEL_URL } from "@/lib/panel";
import { HOW_IT_WORKS_ID, glideToSection } from "@/lib/scroll-to-section";

/* ------------------------------------------------------------------ */
/* Hero section: full-bleed network photo, centred copy on top. The    */
/* announcement pill links to the BRICS 2026 gold medal blog post, and */
/* "Learn More" glides down to the product video.                      */
/* ------------------------------------------------------------------ */

const COPY: Record<
  string,
  {
    badge: string;
    announcement: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
    scroll: string;
  }
> = {
  en: {
    badge: "BRICS 2026",
    announcement: "Paapeli wins gold in Artificial Intelligence",
    title: "Build, Connect, and Manage IoT Infrastructure Intelligently",
    description:
      "Paapeli is an AI-powered IoT cloud (AIoT) for factories, farms, fleets and buildings. Connect your devices, turn their data into insight, and stay in control from anywhere.",
    primary: "Start Free",
    secondary: "Learn More",
    scroll: "Scroll down",
  },
  fa: {
    badge: "بریکس ۲۰۲۶",
    announcement: "پاپلی مدال طلای هوش مصنوعی را گرفت",
    title: "ساخت، اتصال و مدیریت هوشمند زیرساخت‌های اینترنت اشیا",
    description:
      "از کارخانه و گلخانه تا ناوگان حمل‌ونقل و ساختمان، با پلتفرم ابری AIoT پاپلی دستگاه‌های خود را متصل کنید، داده‌ها را به بینش تبدیل کنید و همه‌چیز را با کمک هوش مصنوعی، یکپارچه پایش و کنترل کنید.",
    primary: "شروع رایگان",
    secondary: "بیشتر بدانید",
    scroll: "رفتن به پایین صفحه",
  },
  ar: {
    badge: "بريكس 2026",
    announcement: "بابيلي تفوز بذهبية الذكاء الاصطناعي",
    title: "اربط كل جهاز، وحوّل كل بيانات إلى قرار",
    description:
      "من المصنع والبيت المحمي إلى أسطول النقل والمبنى، اربط أجهزتك بمنصة بابيلي السحابية AIoT، وحوّل البيانات إلى رؤى، وراقب كل شيء وتحكم فيه بمساعدة الذكاء الاصطناعي.",
    primary: "ابدأ مجانًا",
    secondary: "اعرف المزيد",
    scroll: "انتقل إلى الأسفل",
  },
};

export const HeroSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const pillRef = useRef<HTMLAnchorElement>(null);
  const [pillOffset, setPillOffset] = useState(0);

  const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useIsomorphicLayoutEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(headline);
      const lines = range.getClientRects();
      if (!lines.length) return;
      const block = headline.getBoundingClientRect();
      const first = lines[0];
      /* how far the first line sits inside the block, on the reading side */
      const inset = isRTL ? block.right - first.right : first.left - block.left;
      const room = block.width - (pillRef.current?.offsetWidth ?? 0);
      setPillOffset(Math.max(0, Math.min(Math.round(inset), Math.round(room))));
    };

    measure();
    window.addEventListener("resize", measure);
    /* the web font lands after first paint and changes the line breaks */
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [isRTL, copy.title, copy.description]);

  return (
    <section
      ref={heroRef}
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
          {/* Announcement pill. The post lives on the docs host, so this is a
              plain <a> to another origin rather than a client-side route. */}
          <a
            ref={pillRef}
            style={{ marginInlineStart: pillOffset }}
            href={blogPostHref(language, BRICS_2026_POST)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-2 backdrop-blur-sm transition-colors hover:bg-white/20 rtl:pl-2 rtl:pr-1"
          >
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {copy.badge}
            </span>
            <span className="flex items-center gap-0.5 text-sm text-white/90">
              {copy.announcement}
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </span>
          </a>

          <h1 ref={headlineRef} className="text-balance text-center text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
        </div>

        <p className="max-w-[680px] text-base leading-relaxed text-white/80 sm:text-lg rtl:sm:text-[17px]">
          {copy.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          {/* Straight to the dashboard on its own host, so it has to be a full
              navigation rather than a client-side route. */}
          <a
            href={PANEL_URL}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copy.primary}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </a>
          {/* Plain anchor: without JS it still jumps to the section, and the
              handler only upgrades that jump to an eased glide. */}
          <a
            href={`#${HOW_IT_WORKS_ID}`}
            onClick={(event) => {
              if (glideToSection(HOW_IT_WORKS_ID)) event.preventDefault();
            }}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            {copy.secondary}
          </a>
        </div>
      </div>

      {/* Scroll cue. The hero fills the screen, so nothing below it peeks in
          to say the page goes on; this does, breathing softly in the corner,
          and a click carries the reader to the first section under it. */}
      <button
        type="button"
        aria-label={copy.scroll}
        onClick={() => {
          const hero = heroRef.current;
          if (!hero) return;
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top: hero.offsetTop + hero.offsetHeight - 72, behavior: reduce ? "auto" : "smooth" });
        }}
        className="absolute bottom-8 end-8 hidden size-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
      >
        <ChevronsDown className="size-6 motion-safe:animate-pulse" />
      </button>
    </section>
  );
};
