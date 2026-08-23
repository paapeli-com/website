"use client";

import Image, { type StaticImageData } from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import cardConnect from "@/src/assets/vc2-1-connect.jpg";
import cardRealtime from "@/src/assets/vc2-2-realtime.jpg";
import cardOptimize from "@/src/assets/vc2-3-optimize.jpg";
import cardAi from "@/src/assets/vc2-4-ai.jpg";

/* ------------------------------------------------------------------ */
/* Four equal cards on one row: a full-bleed image, then the copy.     */
/* The artwork is 4:3 and gets centre-cropped to the 2:1 card window.  */
/* ------------------------------------------------------------------ */

const CARD_IMAGES: StaticImageData[] = [cardConnect, cardRealtime, cardOptimize, cardAi];

type Copy = {
  heading: string;
  subheading: string;
  cards: { title: string; description: string }[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "Drive Performance Across Your Operations",
    subheading:
      "Connect every asset, act in real time, and continuously improve industrial performance.",
    cards: [
      {
        title: "Asset Connectivity",
        description:
          "Connect machines, sensors, and gateways through one unified industrial data layer.",
      },
      {
        title: "Real-Time Operations",
        description:
          "Monitor production and respond to events as they happen across your operations.",
      },
      {
        title: "Operations Optimization",
        description:
          "Reduce downtime and improve throughput with data-driven operational insights.",
      },
      {
        title: "AI Performance",
        description:
          "Detect anomalies, predict failures, and make smarter decisions with industrial AI.",
      },
    ],
  },
  fa: {
    heading: "عملکرد را در سراسر زیرساخت خود ارتقا دهید",
    subheading:
      "هر دستگاهی را متصل کنید، لحظه‌ای واکنش نشان دهید و عملکرد صنعتی را پیوسته به کمک هوش مصنوعی بهبود دهید",
    cards: [
      {
        title: "اتصال تجهیزات",
        description:
          "ماشین‌ها، حسگرها و گیت‌وی‌ها را در یک لایهٔ دادهٔ صنعتی یکپارچه به هم متصل کنید",
      },
      {
        title: "عملیات لحظه‌ای",
        description:
          "تولید را پایش کنید و در همان لحظه به رویدادهای خط تولید واکنش نشان دهید",
      },
      {
        title: "بهینه‌سازی عملیات",
        description:
          "با تحلیل‌های داده‌محور، توقف تولید را کم و بازدهی را بیشتر کنید",
      },
      {
        title: "عملکرد هوش مصنوعی",
        description:
          "ناهنجاری‌ها را تشخیص دهید، خرابی را پیش‌بینی کنید و هوشمندانه‌تر تصمیم بگیرید",
      },
    ],
  },
  ar: {
    heading: "ارفع الأداء عبر كل عملياتك",
    subheading:
      "اربط كل أصل، وتفاعل في الوقت الفعلي، وحسّن الأداء الصناعي باستمرار",
    cards: [
      {
        title: "توصيل الأصول",
        description:
          "اربط الآلات وأجهزة الاستشعار والبوابات في طبقة بيانات صناعية موحدة",
      },
      {
        title: "العمليات الفورية",
        description:
          "راقب الإنتاج وتفاعل مع الأحداث لحظة وقوعها عبر عملياتك",
      },
      {
        title: "تحسين العمليات",
        description:
          "قلّل التوقفات وارفع الإنتاجية عبر رؤى تشغيلية قائمة على البيانات",
      },
      {
        title: "أداء الذكاء الاصطناعي",
        description:
          "اكتشف الشذوذ وتنبّأ بالأعطال واتخذ قرارات أذكى بالذكاء الاصطناعي الصناعي",
      },
    ],
  },
};

export const FeaturesSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-7 bg-white px-6 py-10 sm:gap-8 sm:py-12"
    >
      <div className="flex w-full max-w-[880px] flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{copy.heading}</h2>
        <p className="text-base text-muted-foreground rtl:text-[15px]">{copy.subheading}</p>
      </div>

      <div className="grid w-full max-w-[1240px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {copy.cards.map((card, i) => (
          <article
            key={card.title}
            className="flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white"
          >
            <div className="relative aspect-[2/1] w-full bg-[#0b1729]">
              <Image
                src={CARD_IMAGES[i]}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 290px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col gap-1.5 p-5">
              <h3 className="text-lg font-semibold text-foreground rtl:text-base">{card.title}</h3>
              <p className="text-base leading-snug text-muted-foreground rtl:text-sm">{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
