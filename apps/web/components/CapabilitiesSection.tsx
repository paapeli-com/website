"use client";

import Image, { type StaticImageData } from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import capDeployment from "@/src/assets/card-4-deployment.png";
import capDevices from "@/src/assets/card-3-devices-gateway.png";
import capRealtime from "@/src/assets/card-2-realtime.png";
import capAlerts from "@/src/assets/card-1-alerts.png";
import capOta from "@/src/assets/card-8-ota.png";
import capAnomaly from "@/src/assets/card-7-anomaly.png";
import capForecast from "@/src/assets/card-6-forecast.png";
import capTemplates from "@/src/assets/card-5-templates.png";

/* ------------------------------------------------------------------ */
/* Core platform capabilities. One 3D icon per card, in the same order */
/* as the copy below.                                                 */
/* ------------------------------------------------------------------ */

const ICONS: StaticImageData[] = [
  capDeployment,
  capDevices,
  capRealtime,
  capAlerts,
  capOta,
  capAnomaly,
  capForecast,
  capTemplates,
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
      className="flex w-full flex-col items-center gap-8 bg-white px-6 py-10 sm:gap-10 sm:py-14"
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
            className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]"
          >
            <div className="flex items-center gap-3">
              <Image
                src={ICONS[i]}
                alt=""
                aria-hidden
                width={72}
                height={72}
                className="size-[72px] shrink-0 object-contain"
              />
              <h3 className="text-lg font-semibold leading-snug text-foreground rtl:text-base">
                {card.title}
              </h3>
            </div>
            <p className="text-base text-muted-foreground rtl:text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
