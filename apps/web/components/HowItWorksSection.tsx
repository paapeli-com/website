"use client";

import Image from "next/image";
import { BadgePercent, Headphones, LayoutGrid, Play, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import howDashboard from "@/src/assets/how-dashboard.png";
import howBg from "@/src/assets/how-bg.svg";
import howFrameBezel from "@/src/assets/how-frame-bezel.svg";
import howCameraMic from "@/src/assets/how-camera-mic.svg";

/* ------------------------------------------------------------------ */
/* "How Paapeli works": heading, a dashboard preview styled as an      */
/* iPad with a play button, and three action items beneath.            */
/* ------------------------------------------------------------------ */

const ACTION_ICONS: LucideIcon[] = [BadgePercent, LayoutGrid, Headphones];

type Copy = {
  heading: string;
  subheading: string;
  previewAlt: string;
  playLabel: string;
  actions: { title: string; description: string }[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "How Paapeli works",
    subheading:
      "A quick look at how you connect, monitor, and optimize your operations in real time.",
    previewAlt: "Paapeli dashboard preview",
    playLabel: "Play product overview",
    actions: [
      { title: "Book a Demo", description: "See how Paapeli works for your use case\nSchedule a live demo with our team." },
      { title: "Explore Use Cases", description: "Discover real-world applications\nSee how Paapeli is used across industries." },
      { title: "Talk to an Expert", description: "Get guidance for your project\nDiscuss your requirements with our team." },
    ],
  },
  fa: {
    heading: "پاپلی چطور کار می‌کند",
    subheading: "نگاهی سریع به اینکه چگونه عملیات خود را متصل، پایش و لحظه‌ای بهینه می‌کنید",
    previewAlt: "پیش‌نمایش داشبورد پاپلی",
    playLabel: "پخش معرفی محصول",
    actions: [
      { title: "درخواست دمو", description: "ببینید پاپلی برای کاربرد شما چه می‌کند\nیک دموی زنده با تیم ما رزرو کنید" },
      { title: "بررسی کاربردها", description: "کاربردهای واقعی را کشف کنید\nببینید پاپلی در صنایع مختلف چگونه به کار می‌رود" },
      { title: "گفت‌وگو با کارشناس", description: "برای پروژهٔ خود راهنمایی بگیرید\nنیازمندی‌هایتان را با تیم ما در میان بگذارید" },
    ],
  },
  ar: {
    heading: "كيف يعمل بابيلي",
    subheading: "نظرة سريعة على كيفية ربط عملياتك ومراقبتها وتحسينها في الوقت الفعلي",
    previewAlt: "معاينة لوحة تحكم بابيلي",
    playLabel: "تشغيل نظرة عامة على المنتج",
    actions: [
      { title: "احجز عرضًا توضيحيًا", description: "شاهد كيف يعمل بابيلي لحالتك\nاحجز عرضًا مباشرًا مع فريقنا" },
      { title: "استكشف حالات الاستخدام", description: "اكتشف تطبيقات واقعية\nشاهد كيف يُستخدم بابيلي عبر القطاعات" },
      { title: "تحدث إلى خبير", description: "احصل على إرشاد لمشروعك\nناقش متطلباتك مع فريقنا" },
    ],
  },
};

export const HowItWorksSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex w-full flex-col items-center overflow-hidden bg-white"
    >
      {/* Faint background decoration */}
      <Image
        src={howBg}
        alt=""
        aria-hidden
        width={1440}
        height={608}
        priority={false}
        className="pointer-events-none absolute left-1/2 top-0 h-[608px] w-[1440px] max-w-none -translate-x-1/2 select-none"
      />

      <div className="relative flex w-full max-w-[1152px] flex-col items-center gap-8 px-6 py-10 sm:gap-10 sm:py-14">
        {/* Heading */}
        <div className="flex max-w-[672px] flex-col items-start gap-4 text-center">
          <h2 className="w-full text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="w-full text-lg text-muted-foreground rtl:text-base">{copy.subheading}</p>
        </div>

        {/* iPad mockup with dashboard preview */}
        <div className="relative mx-auto aspect-[772/540] w-full max-w-[772px]">
          {/* Inner screen: dashboard + light dark overlay, clipped to the bezel radius */}
          <div className="absolute inset-0 overflow-hidden rounded-[40px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(29,41,61,0.1),0px_1px_2px_-1px_rgba(29,41,61,0.1)]">
            <Image
              src={howDashboard}
              alt={copy.previewAlt}
              fill
              priority={false}
              sizes="(max-width: 772px) 100vw, 772px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* iPad frame & bezel overlay (slightly larger than the screen) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={howFrameBezel.src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -inset-y-1 -inset-x-1 h-[calc(100%+8px)] w-[calc(100%+8px)] max-w-none select-none"
          />

          {/* Camera & mic dot near top-center */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={howCameraMic.src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[3.5%] h-[3%] -translate-x-1/2 select-none"
          />

          {/* Play button */}
          <button
            type="button"
            aria-label={copy.playLabel}
            className="absolute left-1/2 top-1/2 inline-flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
          >
            <Play className="size-5 fill-current" />
          </button>
        </div>

        {/* Three action items */}
        <div className="flex w-full flex-col items-center justify-center gap-10 pt-8 mt-2 lg:flex-row lg:gap-16 lg:pt-2">
          {copy.actions.map(({ title, description }, i) => {
            const Icon = ACTION_ICONS[i];
            return (
            <div key={title} className="flex flex-1 flex-col items-center gap-4 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#f3f4f6]">
                <Icon className="size-9 text-foreground" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xl font-semibold text-foreground rtl:text-lg">{title}</p>
                <p className="max-w-[328px] whitespace-pre-line text-base text-muted-foreground rtl:text-sm">
                  {description}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
