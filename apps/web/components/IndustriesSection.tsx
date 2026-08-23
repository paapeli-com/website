"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import industryManufacturing from "@/src/assets/industry-manufacturing.jpg";

/* ------------------------------------------------------------------ */
/* Industries (tabbed). Figma only specifies the "Manufacturing" tab;  */
/* the other three carry placeholder copy in the same shape so the     */
/* tabs work end-to-end. Swap in real copy/images per industry later.  */
/* ------------------------------------------------------------------ */

/* One image per tab, in the same order as the copy below. */
const TAB_IMAGES: StaticImageData[] = [
  industryManufacturing,
  industryManufacturing,
  industryManufacturing,
  industryManufacturing,
];

type Industry = {
  tab: string;
  heading: string;
  description: string;
  features: { title: string; description: string }[];
};

type Copy = { heading: string; subheading: string; learnMore: string; industries: Industry[] };

const COPY: Record<string, Copy> = {
  en: {
    heading: "Built for Every Industrial Environment",
    subheading:
      "Explore how Paapeli supports different industries with solutions that improve efficiency, reliability, and operational visibility.",
    learnMore: "Learn More",
    industries: [
      {
        tab: "Manufacturing",
        heading: "Reduce downtime and maximize production efficiency",
        description: "Gain full visibility into your production lines to identify bottlenecks early, reduce unplanned downtime, and continuously improve overall equipment effectiveness.",
        features: [
          { title: "Real-time production visibility", description: "Track machine performance and production status across all lines in real time." },
          { title: "Downtime & OEE optimization", description: "Identify root causes of downtime and improve efficiency with continuous performance analysis." },
          { title: "Predictive maintenance", description: "Anticipate equipment failures before they happen and reduce costly production interruptions." },
        ],
      },
      {
        tab: "Oil & Gas",
        heading: "Operate safely and efficiently across remote sites",
        description: "Monitor wells, pipelines, and field assets in real time to improve safety, prevent leaks, and keep production flowing across distributed operations.",
        features: [
          { title: "Remote asset monitoring", description: "Track pressure, flow, and equipment health across every site from a single view." },
          { title: "Leak & anomaly detection", description: "Detect abnormal conditions early to protect people, assets, and the environment." },
          { title: "Regulatory compliance", description: "Automate reporting and maintain a complete audit trail of operational data." },
        ],
      },
      {
        tab: "Energy & Utilities",
        heading: "Balance supply and demand with confidence",
        description: "Connect grid assets and metering infrastructure to improve reliability, reduce losses, and respond to demand changes in real time.",
        features: [
          { title: "Grid visibility", description: "Monitor distribution assets and consumption patterns across the network in real time." },
          { title: "Outage prevention", description: "Predict faults and prioritize maintenance to minimize service interruptions." },
          { title: "Demand optimization", description: "Use data-driven insights to balance load and reduce operational losses." },
        ],
      },
      {
        tab: "Smart Infrastructure",
        heading: "Make buildings and facilities run smarter",
        description: "Bring HVAC, energy, and safety systems into one platform to cut costs, improve comfort, and extend the life of critical infrastructure.",
        features: [
          { title: "Unified building data", description: "Connect disparate systems into a single operational view across every facility." },
          { title: "Energy efficiency", description: "Identify waste and optimize consumption to reduce costs and carbon footprint." },
          { title: "Proactive maintenance", description: "Detect issues before they escalate and keep critical systems running reliably." },
        ],
      },
    ],
  },
  fa: {
    heading: "ساخته‌شده برای هر محیط صنعتی",
    subheading:
      "ببینید پاپلی چگونه با راهکارهایی که کارایی، قابلیت اطمینان و دید عملیاتی را بالا می‌برند از صنایع مختلف پشتیبانی می‌کند",
    learnMore: "بیشتر بدانید",
    industries: [
      {
        tab: "تولید",
        heading: "توقف تولید را کم و بهره‌وری خط تولید را بیشینه کنید",
        description: "دید کاملی از خطوط تولید به دست آورید تا گلوگاه‌ها را زود شناسایی کنید، توقف‌های ناخواسته را کم کنید و اثربخشی کلی تجهیزات را پیوسته بهبود دهید",
        features: [
          { title: "دید لحظه‌ای تولید", description: "کارایی ماشین و وضعیت تولید را در همهٔ خطوط لحظه‌ای دنبال کنید" },
          { title: "بهینه‌سازی توقف و OEE", description: "ریشهٔ توقف‌ها را بیابید و با تحلیل مستمر کارایی، بهره‌وری را بالا ببرید" },
          { title: "نگهداری پیش‌بینانه", description: "خرابی تجهیزات را پیش از وقوع پیش‌بینی کنید و وقفه‌های پرهزینهٔ تولید را کم کنید" },
        ],
      },
      {
        tab: "نفت و گاز",
        heading: "در سایت‌های دوردست، ایمن و کارآمد کار کنید",
        description: "چاه‌ها، خطوط لوله و تجهیزات میدانی را لحظه‌ای پایش کنید تا ایمنی بالا برود، از نشتی پیشگیری شود و تولید در عملیات پراکنده جاری بماند",
        features: [
          { title: "پایش از راه دور دارایی", description: "فشار، جریان و سلامت تجهیزات همهٔ سایت‌ها را در یک نما ببینید" },
          { title: "تشخیص نشتی و ناهنجاری", description: "شرایط غیرعادی را زود تشخیص دهید تا از افراد، دارایی‌ها و محیط زیست محافظت شود" },
          { title: "انطباق با مقررات", description: "گزارش‌دهی را خودکار کنید و ردگیری کامل داده‌های عملیاتی را نگه دارید" },
        ],
      },
      {
        tab: "انرژی و خدمات شهری",
        heading: "عرضه و تقاضا را با اطمینان متعادل کنید",
        description: "دارایی‌های شبکه و زیرساخت کنتورخوانی را متصل کنید تا قابلیت اطمینان بالا برود، تلفات کم شود و لحظه‌ای به تغییر تقاضا پاسخ دهید",
        features: [
          { title: "دید شبکه", description: "دارایی‌های توزیع و الگوهای مصرف را در کل شبکه لحظه‌ای پایش کنید" },
          { title: "پیشگیری از قطعی", description: "خطاها را پیش‌بینی و نگهداری را اولویت‌بندی کنید تا وقفهٔ خدمات کمینه شود" },
          { title: "بهینه‌سازی تقاضا", description: "با تحلیل داده‌محور، بار را متعادل و تلفات عملیاتی را کم کنید" },
        ],
      },
      {
        tab: "زیرساخت هوشمند",
        heading: "ساختمان‌ها و تأسیسات را هوشمندتر اداره کنید",
        description: "سامانه‌های تهویه، انرژی و ایمنی را در یک پلتفرم گرد هم بیاورید تا هزینه کم شود، آسایش بالا برود و عمر زیرساخت حیاتی بیشتر شود",
        features: [
          { title: "دادهٔ یکپارچهٔ ساختمان", description: "سامانه‌های پراکنده را در یک نمای عملیاتی واحد برای هر ساختمان به هم وصل کنید" },
          { title: "بهره‌وری انرژی", description: "اتلاف را شناسایی و مصرف را بهینه کنید تا هزینه و ردپای کربن کم شود" },
          { title: "نگهداری پیشگیرانه", description: "مشکلات را پیش از بحرانی شدن تشخیص دهید و سامانه‌های حیاتی را پایدار نگه دارید" },
        ],
      },
    ],
  },
  ar: {
    heading: "مصمم لكل بيئة صناعية",
    subheading:
      "اكتشف كيف يدعم بابيلي قطاعات مختلفة بحلول ترفع الكفاءة والموثوقية والوضوح التشغيلي",
    learnMore: "اعرف المزيد",
    industries: [
      {
        tab: "التصنيع",
        heading: "قلّل التوقفات وارفع كفاءة الإنتاج إلى أقصاها",
        description: "احصل على رؤية كاملة لخطوط الإنتاج لاكتشاف الاختناقات مبكرًا وتقليل التوقفات غير المخططة وتحسين الفعالية الكلية للمعدات باستمرار",
        features: [
          { title: "رؤية إنتاج فورية", description: "تابع أداء الآلات وحالة الإنتاج عبر كل الخطوط لحظيًا" },
          { title: "تحسين التوقفات وOEE", description: "حدّد الأسباب الجذرية للتوقفات وارفع الكفاءة بتحليل أداء مستمر" },
          { title: "صيانة تنبؤية", description: "توقّع أعطال المعدات قبل حدوثها وقلّل انقطاعات الإنتاج المكلفة" },
        ],
      },
      {
        tab: "النفط والغاز",
        heading: "شغّل مواقعك النائية بأمان وكفاءة",
        description: "راقب الآبار وخطوط الأنابيب وأصول الحقل لحظيًا لتعزيز السلامة ومنع التسربات والحفاظ على تدفق الإنتاج عبر عمليات موزعة",
        features: [
          { title: "مراقبة الأصول عن بُعد", description: "تابع الضغط والتدفق وسلامة المعدات في كل موقع من نافذة واحدة" },
          { title: "كشف التسربات والشذوذ", description: "اكتشف الظروف غير الطبيعية مبكرًا لحماية الأشخاص والأصول والبيئة" },
          { title: "الامتثال التنظيمي", description: "أتمت التقارير واحتفظ بسجل تدقيق كامل للبيانات التشغيلية" },
        ],
      },
      {
        tab: "الطاقة والمرافق",
        heading: "وازِن بين العرض والطلب بثقة",
        description: "اربط أصول الشبكة والبنية التحتية للقياس لرفع الموثوقية وتقليل الفاقد والاستجابة لتغيرات الطلب لحظيًا",
        features: [
          { title: "رؤية الشبكة", description: "راقب أصول التوزيع وأنماط الاستهلاك عبر الشبكة لحظيًا" },
          { title: "منع الانقطاعات", description: "تنبّأ بالأعطال ورتّب أولويات الصيانة لتقليل انقطاع الخدمة" },
          { title: "تحسين الطلب", description: "استخدم رؤى قائمة على البيانات لموازنة الحمل وتقليل الفاقد التشغيلي" },
        ],
      },
      {
        tab: "البنية التحتية الذكية",
        heading: "أدِر المباني والمنشآت بذكاء أكبر",
        description: "اجمع أنظمة التكييف والطاقة والسلامة في منصة واحدة لخفض التكاليف وتحسين الراحة وإطالة عمر البنية التحتية الحرجة",
        features: [
          { title: "بيانات مبنى موحدة", description: "اربط الأنظمة المتفرقة في رؤية تشغيلية واحدة لكل منشأة" },
          { title: "كفاءة الطاقة", description: "حدّد الهدر وحسّن الاستهلاك لخفض التكاليف والبصمة الكربونية" },
          { title: "صيانة استباقية", description: "اكتشف المشكلات قبل تفاقمها وحافظ على تشغيل الأنظمة الحرجة بثبات" },
        ],
      },
    ],
  },
};
export const IndustriesSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const [activeTab, setActiveTab] = useState(0);
  const active = copy.industries[activeTab] ?? copy.industries[0];

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-8 bg-white px-6 py-10 sm:gap-10 sm:py-14"
    >
      {/* Block heading */}
      <div className="flex w-full max-w-[768px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
          {copy.heading}
        </h2>
        <p className="text-lg text-muted-foreground rtl:text-base">{copy.subheading}</p>
      </div>

      <div className="flex w-full max-w-[1280px] flex-col items-center gap-10">
        {/* Nav tabs */}
        {/* justify-center only from sm up: centering an overflowing flex row clips its start edge on small screens. */}
        <div className="no-scrollbar flex w-full gap-6 overflow-x-auto border-b border-[#e5e7eb] sm:justify-center">
          {copy.industries.map((industry, i) => {
            const isActive = i === activeTab;
            return (
              <button
                key={industry.tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={cn(
                  "-mb-px shrink-0 whitespace-nowrap border-b pb-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#d56300] text-[#d56300]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {industry.tab}
              </button>
            );
          })}
        </div>

        {/* Heading & image */}
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:gap-20">
          <div className="flex flex-1 flex-col items-start gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-3xl font-semibold text-foreground rtl:text-2xl">{active.heading}</h3>
              <p className="text-base text-muted-foreground rtl:text-sm">{active.description}</p>
            </div>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              {copy.learnMore}
            </Link>
          </div>

          <div className="relative aspect-[600/332] w-full flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] lg:aspect-auto lg:h-[332px]">
            <Image
              src={TAB_IMAGES[activeTab]}
              alt={active.tab}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
            {/* Subtle inner vignette to match the design */}
            <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0px_0px_60px_20px_rgba(0,0,0,0.18)]" />
          </div>
        </div>

        {/* Features */}
        <div className="flex w-full flex-col items-start justify-center gap-8 lg:flex-row lg:gap-12">
          {active.features.map((feature) => (
            <div key={feature.title} className="flex flex-1 items-start gap-2.5">
              <CircleCheck className="size-7 shrink-0 text-primary" />
              <div className="flex flex-col gap-2.5">
                <p className="text-xl font-semibold text-foreground rtl:text-lg">{feature.title}</p>
                <p className="text-sm text-muted-foreground rtl:text-[13px]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
