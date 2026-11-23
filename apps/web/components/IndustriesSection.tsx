"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { localePath } from "@/lib/seo";
import { cn } from "@/lib/utils";
import industryManufacturing from "@/src/assets/industry-manufacturing.jpg";
import industryOilGas from "@/src/assets/industry-oil-gas.jpg";
import industrySmartInfrastructure from "@/src/assets/industry-smart-infrastructure.jpg";
import industryFleetTracking from "@/src/assets/industry-fleet-tracking.jpg";
import industrySmartAgriculture from "@/src/assets/industry-smart-agriculture.jpg";

/* ------------------------------------------------------------------ */
/* Industries (tabbed). Figma only specifies the "Manufacturing" tab;  */
/* the other three carry placeholder copy in the same shape so the     */
/* tabs work end-to-end. Swap in real copy/images per industry later.  */
/* ------------------------------------------------------------------ */

/* One image per tab, in the same order as the copy below. */
const TAB_IMAGES: StaticImageData[] = [
  industryManufacturing,
  industryOilGas,
  industrySmartInfrastructure,
  industryFleetTracking,
  industrySmartAgriculture,
];

/* Where "Learn More" goes, per tab, in the same order again. Each tab
   already has a page arguing its case; the button used to be href="#",
   so five industry pitches ended in a button that did nothing. */
const TAB_HREFS: string[] = [
  "/smart-manufacturing",
  "/oil-gas",
  "/smart-buildings",
  "/fleet-tracking",
  "/smart-agriculture",
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
        tab: "Smart Infrastructure",
        heading: "Make buildings and facilities run smarter",
        description: "Bring HVAC, energy, and safety systems into one platform to cut costs, improve comfort, and extend the life of critical infrastructure.",
        features: [
          { title: "Unified building data", description: "Connect disparate systems into a single operational view across every facility." },
          { title: "Energy efficiency", description: "Identify waste and optimize consumption to reduce costs and carbon footprint." },
          { title: "Proactive maintenance", description: "Detect issues before they escalate and keep critical systems running reliably." },
        ],
      },
      {
        tab: "Asset & Fleet Tracking",
        heading: "Know where every asset is, and how it is doing",
        description: "Follow vehicles, equipment, and mobile assets across sites with live location, geofences, and alerts that reach the right people.",
        features: [
          { title: "Live location", description: "Follow elderly family members, vehicles, and even pets across every site on a single map." },
          { title: "Geofence alerts", description: "Know the moment an asset leaves or enters an area you care about." },
          { title: "Utilisation insight", description: "See what is working, what is idle, and what is due for servicing." },
        ],
      },
      {
        tab: "Smart Agriculture",
        heading: "Grow more with less guesswork",
        description: "Monitor climate, soil, and irrigation across greenhouses and fields, and act on what the sensors are actually telling you.",
        features: [
          { title: "Climate monitoring", description: "Track temperature, humidity, and light in every growing zone." },
          { title: "Irrigation control", description: "Water on data rather than on a fixed schedule." },
          { title: "Crop protection", description: "Catch stress conditions early, before they cost you a harvest." },
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
        tab: "زیرساخت هوشمند",
        heading: "ساختمان‌ها و تأسیسات را هوشمندتر اداره کنید",
        description: "سامانه‌های تهویه، انرژی و ایمنی را در یک پلتفرم گرد هم بیاورید تا هزینه کم شود، آسایش بالا برود و عمر زیرساخت حیاتی بیشتر شود",
        features: [
          { title: "دادهٔ یکپارچهٔ ساختمان", description: "سامانه‌های پراکنده را در یک نمای عملیاتی واحد برای هر ساختمان به هم وصل کنید" },
          { title: "بهره‌وری انرژی", description: "اتلاف را شناسایی و مصرف را بهینه کنید تا هزینه و ردپای کربن کم شود" },
          { title: "نگهداری پیشگیرانه", description: "مشکلات را پیش از بحرانی شدن تشخیص دهید و سامانه‌های حیاتی را پایدار نگه دارید" },
        ],
      },
      {
        tab: "ردیابی ناوگان و دارایی‌ها",
        heading: "بدانید هر دارایی کجاست و در چه وضعیتی است",
        description: "خودروها، تجهیزات و دارایی‌های متحرک را در همهٔ سایت‌ها با موقعیت زنده، ژئوفنس و هشدارهایی که به دست فرد درست می‌رسد دنبال کنید",
        features: [
          { title: "موقعیت زنده", description: "سالمندان، خودروها و حتی حیوانات خانگی را در همهٔ سایت‌ها روی یک نقشه دنبال کنید" },
          { title: "هشدار ژئوفنس", description: "همان لحظه که دارایی از محدودهٔ موردنظر خارج یا وارد شد باخبر شوید" },
          { title: "بینش بهره‌برداری", description: "ببینید چه چیزی کار می‌کند، چه چیزی بیکار است و چه چیزی نوبت سرویسش رسیده" },
        ],
      },
      {
        tab: "کشاورزی هوشمند",
        heading: "بیشتر برداشت کنید، کمتر حدس بزنید",
        description: "اقلیم، خاک و آبیاری را در گلخانه‌ها و مزارع پایش کنید و بر پایهٔ چیزی که حسگرها واقعاً می‌گویند تصمیم بگیرید",
        features: [
          { title: "پایش اقلیم", description: "دما، رطوبت و نور را در هر ناحیهٔ کشت دنبال کنید" },
          { title: "کنترل آبیاری", description: "بر پایهٔ داده آبیاری کنید، نه بر پایهٔ زمان‌بندی ثابت" },
          { title: "حفاظت از محصول", description: "شرایط تنش را زود تشخیص دهید، پیش از آنکه به برداشت آسیب بزند" },
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
        tab: "البنية التحتية الذكية",
        heading: "أدِر المباني والمنشآت بذكاء أكبر",
        description: "اجمع أنظمة التكييف والطاقة والسلامة في منصة واحدة لخفض التكاليف وتحسين الراحة وإطالة عمر البنية التحتية الحرجة",
        features: [
          { title: "بيانات مبنى موحدة", description: "اربط الأنظمة المتفرقة في رؤية تشغيلية واحدة لكل منشأة" },
          { title: "كفاءة الطاقة", description: "حدّد الهدر وحسّن الاستهلاك لخفض التكاليف والبصمة الكربونية" },
          { title: "صيانة استباقية", description: "اكتشف المشكلات قبل تفاقمها وحافظ على تشغيل الأنظمة الحرجة بثبات" },
        ],
      },
      {
        tab: "تتبع الأصول والأساطيل",
        heading: "اعرف أين كل أصل وما حالته",
        description: "تابع المركبات والمعدات والأصول المتنقلة عبر المواقع بموقع لحظي وسياج جغرافي وتنبيهات تصل إلى الشخص المناسب",
        features: [
          { title: "موقع لحظي", description: "تابع كبار السن والمركبات وحتى الحيوانات الأليفة عبر كل المواقع على خريطة واحدة" },
          { title: "تنبيهات السياج الجغرافي", description: "اعرف لحظة خروج أصل من منطقة تهمك أو دخوله إليها" },
          { title: "رؤية الاستخدام", description: "اعرف ما يعمل وما هو متوقف وما حان موعد صيانته" },
        ],
      },
      {
        tab: "الزراعة الذكية",
        heading: "احصد أكثر بتخمين أقل",
        description: "راقب المناخ والتربة والري في البيوت المحمية والحقول، واتخذ قرارك بناءً على ما تقوله المستشعرات فعليًا",
        features: [
          { title: "مراقبة المناخ", description: "تابع الحرارة والرطوبة والإضاءة في كل منطقة زراعية" },
          { title: "التحكم في الري", description: "اسقِ بناءً على البيانات لا على جدول ثابت" },
          { title: "حماية المحصول", description: "اكتشف ظروف الإجهاد مبكرًا قبل أن تكلفك الموسم" },
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
                aria-current={isActive}
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
              href={localePath(language, TAB_HREFS[activeTab] ?? TAB_HREFS[0])}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              {copy.learnMore}
            </Link>
          </div>

          <div className="relative aspect-[600/332] w-full flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] lg:aspect-auto lg:h-[332px]">
            <Image
              key={activeTab}
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
                <p className="text-base text-muted-foreground rtl:text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
