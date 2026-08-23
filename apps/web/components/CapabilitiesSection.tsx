"use client";

import Image, { type StaticImageData } from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import capCompass from "@/src/assets/cap-compass.png";
import capGears from "@/src/assets/cap-gears.png";
import capRocket from "@/src/assets/cap-rocket.png";
import capClipboard from "@/src/assets/cap-clipboard.png";

/* ------------------------------------------------------------------ */
/* Core platform capabilities. The four 3D icons are reused across the */
/* eight cards, each centred and clipped inside a 116px box.          */
/* ------------------------------------------------------------------ */

const ICONS: { icon: StaticImageData; iconSize: number }[] = [
  { icon: capCompass, iconSize: 132 },
  { icon: capGears, iconSize: 132 },
  { icon: capRocket, iconSize: 132 },
  { icon: capClipboard, iconSize: 124 },
  { icon: capCompass, iconSize: 132 },
  { icon: capGears, iconSize: 132 },
  { icon: capRocket, iconSize: 132 },
  { icon: capClipboard, iconSize: 124 },
];

type Copy = {
  heading: string;
  subheading: string;
  cards: { title: string; description: string }[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "Core Platform Capabilities",
    subheading:
      "Explore the key features that power Paapeli and enable efficient, reliable, and scalable operations.",
    cards: [
      { title: "Flexible Deployment", description: "Deploy Paapeli on cloud or on-premise based on your infrastructure, security, and compliance requirements." },
      { title: "Device & Gateway Management", description: "Manage devices and gateways at scale with support for industrial protocols such as MQTT, OPC-UA, and Modbus." },
      { title: "Real-Time Monitoring", description: "Track device data and system performance in real time to gain full visibility across your operations." },
      { title: "Alerts & Event Management", description: "Detect critical events instantly and trigger alerts to respond quickly before issues escalate." },
      { title: "OTA Updates", description: "We ensure Paapeli stays secure, spam-free, and protected for your safety." },
      { title: "Anomaly Detection", description: "Identify abnormal patterns in your data to detect issues early and prevent unexpected failures." },
      { title: "Predictive Analytics", description: "Analyze trends and predict equipment failures to optimize maintenance and improve reliability." },
      { title: "Solution Templates", description: "Use ready-to-deploy templates tailored for different industries to accelerate implementation and reduce time to value." },
    ],
  },
  fa: {
    heading: "قابلیت‌های اصلی پلتفرم",
    subheading:
      "ویژگی‌های کلیدی که پاپلی را توانمند می‌کنند و عملیات کارآمد، قابل‌اتکا و مقیاس‌پذیر را ممکن می‌سازند",
    cards: [
      { title: "استقرار انعطاف‌پذیر", description: "پاپلی را بر اساس زیرساخت، امنیت و الزامات انطباق خود، روی ابر یا سرور داخلی مستقر کنید" },
      { title: "مدیریت دستگاه و گیت‌وی", description: "دستگاه‌ها و گیت‌وی‌ها را در مقیاس بزرگ و با پشتیبانی از پروتکل‌های صنعتی مانند MQTT، OPC-UA و Modbus مدیریت کنید" },
      { title: "پایش لحظه‌ای", description: "داده‌های دستگاه و کارایی سامانه را لحظه‌ای دنبال کنید تا دید کاملی از عملیات داشته باشید" },
      { title: "هشدارها و مدیریت رویداد", description: "رویدادهای حیاتی را بی‌درنگ تشخیص دهید و پیش از بحرانی شدن، هشدار بگیرید" },
      { title: "به‌روزرسانی OTA", description: "فرم‌ور و نرم‌افزار دستگاه‌ها را از راه دور و به‌صورت امن به‌روز نگه دارید" },
      { title: "تشخیص ناهنجاری", description: "الگوهای غیرعادی داده را شناسایی کنید تا مشکلات را زود تشخیص دهید و از خرابی ناگهانی جلوگیری کنید" },
      { title: "تحلیل پیش‌بین", description: "روندها را تحلیل و خرابی تجهیزات را پیش‌بینی کنید تا نگهداری بهینه و قابلیت اطمینان بیشتر شود" },
      { title: "قالب‌های آمادهٔ راهکار", description: "از قالب‌های آمادهٔ صنایع مختلف استفاده کنید تا پیاده‌سازی سریع‌تر و زمان رسیدن به ارزش کوتاه‌تر شود" },
    ],
  },
  ar: {
    heading: "القدرات الأساسية للمنصة",
    subheading:
      "استكشف الميزات الرئيسية التي تشغّل بابيلي وتتيح عمليات فعّالة وموثوقة وقابلة للتوسع",
    cards: [
      { title: "نشر مرن", description: "انشر بابيلي على السحابة أو داخل مقرك وفق متطلبات بنيتك التحتية والأمن والامتثال" },
      { title: "إدارة الأجهزة والبوابات", description: "أدِر الأجهزة والبوابات على نطاق واسع مع دعم بروتوكولات صناعية مثل MQTT وOPC-UA وModbus" },
      { title: "المراقبة الفورية", description: "تابع بيانات الأجهزة وأداء النظام لحظيًا للحصول على رؤية كاملة عبر عملياتك" },
      { title: "التنبيهات وإدارة الأحداث", description: "اكتشف الأحداث الحرجة فورًا وأطلق التنبيهات للاستجابة قبل تفاقم المشكلات" },
      { title: "تحديثات OTA", description: "حافظ على تحديث البرامج الثابتة وبرمجيات الأجهزة عن بُعد وبأمان" },
      { title: "كشف الشذوذ", description: "حدّد الأنماط غير الطبيعية في بياناتك لاكتشاف المشكلات مبكرًا ومنع الأعطال المفاجئة" },
      { title: "التحليلات التنبؤية", description: "حلّل الاتجاهات وتنبّأ بأعطال المعدات لتحسين الصيانة ورفع الموثوقية" },
      { title: "قوالب الحلول", description: "استخدم قوالب جاهزة مخصصة لقطاعات مختلفة لتسريع التنفيذ وتقليل الوقت حتى تحقيق القيمة" },
    ],
  },
};

export const CapabilitiesSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20"
    >
      {/* Block heading */}
      <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
          {copy.heading}
        </h2>
        <p className="text-lg text-muted-foreground rtl:text-base">{copy.subheading}</p>
      </div>

      {/* 4x2 capability grid */}
      <div className="grid w-full max-w-[1280px] grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {copy.cards.map((card, i) => (
          <div
            key={card.title}
            className="flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-7 text-center shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:items-start sm:text-start"
          >
            <div className="relative size-[116px] shrink-0 overflow-hidden">
              <Image
                src={ICONS[i].icon}
                alt=""
                aria-hidden
                width={ICONS[i].iconSize}
                height={ICONS[i].iconSize}
                className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-foreground rtl:text-base">{card.title}</h3>
              <p className="text-sm text-muted-foreground rtl:text-[13px]">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
