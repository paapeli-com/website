"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Check } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import trustSimple from "@/src/assets/trust-simple.jpg";
import trustScalable from "@/src/assets/trust-scalable.jpg";
import trustSecure from "@/src/assets/trust-secure.jpg";

/* ------------------------------------------------------------------ */
/* "Trusted by" carousel. Figma only specifies the "Easy" slide; the   */
/* two others carry placeholder copy in the same shape so the carousel */
/* dots work end-to-end. Swap in real copy/images per slide later.     */
/* ------------------------------------------------------------------ */

const SLIDE_IMAGES: StaticImageData[] = [trustSimple, trustScalable, trustSecure];

type Slide = {
  heading: string;
  description: string;
  items: { title: string; description: string }[];
};

type Copy = {
  heading: string;
  subheading: string;
  showSlide: (name: string) => string;
  slides: Slide[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "Trusted by leading companies and organisations",
    subheading:
      "Helping organizations raise reliability and reach operational intelligence, simply and securely.",
    showSlide: (name) => `Show ${name}`,
    slides: [
      {
        heading: "Easy",
        description: "Deploy industrial AIoT solutions faster with a platform designed for simplicity and operational efficiency.",
        items: [
          { title: "Fast Onboarding", description: "Connect devices and gateways in minutes." },
          { title: "Ready-to-Use Templates", description: "Accelerate deployment using industrial solution templates." },
          { title: "Built-in Operations", description: "Monitoring, alerts, OTA, and AI capabilities included out of the box." },
        ],
      },
      {
        heading: "Scalable",
        description: "Grow from a single site to thousands of connected assets without re-architecting your platform.",
        items: [
          { title: "Multi-datacentre management", description: "Spread load across datacentres and scale as the fleet grows." },
          { title: "Single unified console", description: "Operate distributed sites from a single control plane." },
          { title: "High Throughput", description: "Ingest millions of data points with consistent performance." },
        ],
      },
      {
        heading: "Secure",
        description: "Protect your operations end to end with enterprise-grade security and compliance built in.",
        items: [
          { title: "End-to-End Encryption", description: "Secure data in transit and at rest by default." },
          { title: "Role-Based Access", description: "Control who can see and act on every resource." },
          { title: "Compliance Ready", description: "Meet industry standards with a complete audit trail." },
        ],
      },
    ],
  },
  fa: {
    heading: "مورد اعتماد شرکت‌ها و سازمان‌های پیشرو",
    subheading:
      "به سازمان‌ها کمک می‌کنیم به سادگی و به شکل امن، قابلیت اطمینان را بالا ببرند و به هوشمندی عملیاتی برسند",
    showSlide: (name) => `نمایش ${name}`,
    slides: [
      {
        heading: "ساده",
        description: "راهکارهای AIoT صنعتی را سریع‌تر مستقر کنید، با پلتفرمی که برای سادگی و بهره‌وری عملیاتی طراحی شده",
        items: [
          { title: "راه‌اندازی سریع", description: "دستگاه‌ها و گیت‌وی‌ها را در چند دقیقه متصل کنید" },
          { title: "قالب‌های آمادهٔ استفاده", description: "با قالب‌های راهکار صنعتی، استقرار را سریع‌تر کنید" },
          { title: "عملیات درون‌ساخت", description: "پایش، هشدار، به‌روزرسانی OTA و هوش مصنوعی از همان ابتدا در دسترس است" },
        ],
      },
      {
        heading: "مقیاس‌پذیر",
        description: "از یک سایت تا هزاران دارایی متصل رشد کنید، بدون اینکه پلتفرم را از نو بسازید",
        items: [
          { title: "مدیریت چند دیتاسنتری (Multi-site)", description: "بار را میان چند دیتاسنتر پخش کنید و با رشد ناوگان مقیاس بگیرید" },
          { title: "مدیریت واحد و یکپارچه", description: "سایت‌های پراکنده را از یک کنسول واحد اداره کنید" },
          { title: "توان عبور بالا", description: "میلیون‌ها نقطهٔ داده را با کارایی پایدار دریافت کنید" },
        ],
      },
      {
        heading: "امن",
        description: "عملیات خود را سرتاسر، با امنیت و انطباق در سطح سازمانی محافظت کنید",
        items: [
          { title: "رمزنگاری سرتاسری", description: "داده در حال انتقال و در حال سکون به‌صورت پیش‌فرض امن است" },
          { title: "دسترسی مبتنی بر نقش", description: "تعیین کنید چه کسی هر منبع را ببیند و روی آن اقدام کند" },
          { title: "آمادهٔ انطباق", description: "با ردگیری کامل ممیزی، استانداردهای صنعتی را برآورده کنید" },
        ],
      },
    ],
  },
  ar: {
    heading: "موثوق به من شركات ومؤسسات رائدة",
    subheading: "نساعد المؤسسات على رفع الموثوقية وتحقيق الذكاء التشغيلي ببساطة وأمان",
    showSlide: (name) => `عرض ${name}`,
    slides: [
      {
        heading: "سهل",
        description: "انشر حلول AIoT الصناعية بسرعة أكبر عبر منصة مصممة للبساطة والكفاءة التشغيلية",
        items: [
          { title: "إعداد سريع", description: "اربط الأجهزة والبوابات في دقائق" },
          { title: "قوالب جاهزة للاستخدام", description: "سرّع النشر باستخدام قوالب الحلول الصناعية" },
          { title: "عمليات مدمجة", description: "المراقبة والتنبيهات وتحديثات OTA وقدرات الذكاء الاصطناعي متاحة منذ البداية" },
        ],
      },
      {
        heading: "قابل للتوسع",
        description: "انمُ من موقع واحد إلى آلاف الأصول المتصلة دون إعادة بناء منصتك",
        items: [
          { title: "إدارة متعددة مراكز البيانات", description: "وزّع الحمل بين مراكز البيانات وتوسّع مع نمو الأسطول" },
          { title: "إدارة موحدة", description: "أدِر المواقع الموزعة من لوحة تحكم واحدة" },
          { title: "إنتاجية عالية", description: "استقبل ملايين نقاط البيانات بأداء ثابت" },
        ],
      },
      {
        heading: "آمن",
        description: "احمِ عملياتك من طرف إلى طرف بأمن وامتثال بمستوى المؤسسات",
        items: [
          { title: "تشفير من طرف إلى طرف", description: "تأمين البيانات أثناء النقل والتخزين افتراضيًا" },
          { title: "وصول قائم على الأدوار", description: "تحكّم في من يرى كل مورد ويتصرف فيه" },
          { title: "جاهز للامتثال", description: "استوفِ معايير القطاع مع سجل تدقيق كامل" },
        ],
      },
    ],
  },
};

export const TrustedSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = copy.slides[active];
  const slideCount = copy.slides.length;

  /* Advance on its own, but restart the clock whenever someone picks a
     slide, and hold while the pointer rests on the card. */
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slideCount), 5000);
    return () => window.clearInterval(id);
  }, [active, paused, slideCount]);

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-10 pt-10 sm:pb-16 sm:pt-14"
    >
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        {/* Block heading */}
        <div className="flex w-full max-w-[960px] flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="max-w-[960px] text-lg text-muted-foreground rtl:text-base">{copy.subheading}</p>
        </div>

        {/* Image + content */}
        <div className="flex w-full max-w-[1152px] flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16">
          {/* Image card with carousel dots */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative flex h-[448px] w-full max-w-[384px] shrink-0 flex-col items-center justify-end overflow-hidden rounded-xl border border-[#e5e7eb] py-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]"
          >
            <Image
              key={active}
              src={SLIDE_IMAGES[active]}
              alt={slide.heading}
              fill
              sizes="384px"
              className="object-cover"
            />
            {/* Subtle radial vignette to match the design */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />

            {/* A visible control bar reads as clickable on any photo. */}
            <div className="relative flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-2 backdrop-blur-sm">
              {copy.slides.map((s, i) => (
                <button
                  key={s.heading}
                  type="button"
                  aria-label={copy.showSlide(s.heading)}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className="group flex h-6 cursor-pointer items-center px-1 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "block h-2.5 rounded-full transition-all duration-300",
                      i === active
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/55 group-hover:w-4 group-hover:bg-white/90"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Left content */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
                >
                  {(active + 1).toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
                </span>
                <h3 className="text-3xl font-semibold text-foreground rtl:text-2xl">{slide.heading}</h3>
              </div>
              <p className="text-base text-muted-foreground rtl:text-sm">{slide.description}</p>
            </div>

            <ul className="flex w-full flex-col gap-8 border-t border-[#f3f4f6] pt-8">
              {slide.items.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fff6ef]">
                    <Check className="size-7 text-primary" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold text-foreground rtl:text-base">{item.title}</p>
                    <p className="text-base text-muted-foreground rtl:text-sm">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
