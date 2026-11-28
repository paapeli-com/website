import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-anomaly-1.jpg";
import hero from "@/src/assets/f-anomaly-2.jpg";
import img3 from "@/src/assets/f-anomaly-3.jpg";
import img2 from "@/src/assets/f-anomaly-hero.jpg";
import panel from "@/src/assets/1-panel.jpg";

export const anomalyDetectionConfig: FeatureConfig = {
  slug: "anomaly-detection",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["smart-manufacturing", "oil-gas", "energy-monitoring", "smart-buildings"],
  related: ["predictive-analytics", "alerts-events", "realtime-monitoring", "device-management"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Anomaly detection on live data",
        description:
          "Identify abnormal data patterns to catch problems early and prevent sudden failures, including the slow drifts no fixed threshold would ever trigger.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "An anomaly queue engineers can work",
            description:
              "Findings are ranked by severity and confidence, each with the affected asset, the signal and a suggested next step.",
            items: ["Severity and confidence per finding", "Affected asset and signal", "Dismiss or escalate a finding"],
          },
          {
            title: "Anomalies inside the operational picture",
            description:
              "AI findings appear beside plant health and availability, so a detection is read together with its business impact.",
            items: ["Root cause and impact summary", "Assets-at-risk count", "Model status always visible"],
          },
          {
            title: "From detection to action",
            description: "A confirmed anomaly becomes an alarm or a work order that links back to it.",
            items: ["Escalate to an alarm", "Create a work order", "Feedback loop on false positives"],
          },
        ],
      },
      panel: {
        heading: "Inside the platform",
        description: "A real screen from the Paapeli panel, not concept art.",
      },
      capabilities: {
        heading: "Key capabilities",
        subheading: "What changes in daily operations once this feature is in place.",
        cards: [
          {
            icon: "radar",
            title: "Catches slow drift",
            description:
              "Gradual deviations in vibration, temperature or consumption surface long before a hard limit is crossed.",
          },
          {
            icon: "search",
            title: "Explained, not a black box",
            description: "Each anomaly shows the signal, the deviating window and a confidence score, so engineers can judge it.",
          },
          {
            icon: "warning",
            title: "Fewer nuisance alarms",
            description:
              "Because detection follows the asset's own normal behaviour, seasonal and load-driven swings stop paging the team.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Find the failure while it is still cheap",
        description:
          "Share a sample of historical signals and we will show which anomalies the platform would have surfaced.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "تشخیص ناهنجاری روی دادهٔ زنده",
        description:
          "الگوهای غیرعادی داده را شناسایی کنید تا مشکل را زود بگیرید و از خرابی ناگهانی جلوگیری کنید، از جمله انحراف‌های آرامی که هیچ آستانهٔ ثابتی آن‌ها را نمی‌گیرد.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "فهرست ناهنجاری‌ها، آمادهٔ بررسی مهندس",
            description:
              "یافته‌ها بر پایهٔ اهمیت و اطمینان رتبه می‌گیرند، هر یک همراه با دارایی درگیر، سیگنال و گام پیشنهادی بعدی.",
            items: ["اهمیت و اطمینان برای هر یافته", "دارایی و سیگنال درگیر", "رد کردن یا تشدید یک یافته"],
          },
          {
            title: "ناهنجاری‌ها در دل تصویر عملیاتی",
            description:
              "یافته‌های هوش مصنوعی کنار سلامت و دسترس‌پذیری کارخانه دیده می‌شوند، پس هر تشخیص همراه با اثر کسب‌وکاری‌اش خوانده می‌شود.",
            items: ["خلاصهٔ ریشه و اثر", "شمار دارایی‌های در معرض خطر", "وضعیت مدل همیشه در دید"],
          },
          {
            title: "از تشخیص تا اقدام",
            description: "ناهنجاری تأییدشده به هشدار یا دستور کاری تبدیل می‌شود که به همان ناهنجاری پیوند دارد.",
            items: ["تشدید به هشدار", "ایجاد دستور کار", "بازخورد روی موارد نادرست"],
          },
        ],
      },
      panel: {
        heading: "داخل پلتفرم",
        description: "نمایی واقعی از پنل پاپلی، نه تصویر مفهومی.",
      },
      capabilities: {
        heading: "قابلیت‌های کلیدی",
        subheading: "با فعال شدن این قابلیت، چه چیزی در عملیات روزمره تغییر می‌کند.",
        cards: [
          {
            icon: "radar",
            title: "انحراف‌های تدریجی را تشخیص می‌دهد",
            description: "انحراف تدریجی در لرزش، دما یا مصرف، مدت‌ها پیش از عبور از حد مجاز آشکار می‌شود.",
          },
          {
            icon: "search",
            title: "قابل توضیح، نه جعبهٔ سیاه",
            description:
              "هر ناهنجاری سیگنال، بازهٔ انحراف و امتیاز اطمینان را نشان می‌دهد تا مهندس بتواند دربارهٔ آن قضاوت کند.",
          },
          {
            icon: "warning",
            title: "هشدار کاذب کمتر",
            description:
              "چون تشخیص بر پایهٔ رفتار عادی خود دارایی است، نوسان‌های فصلی و باری دیگر تیم را بی‌دلیل خبر نمی‌کنند.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "خرابی را وقتی هنوز ارزان است پیدا کنید",
        description:
          "نمونه‌ای از سیگنال‌های تاریخی خود را بدهید تا نشان دهیم پلتفرم کدام ناهنجاری‌ها را آشکار می‌کرد.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "كشف الشذوذ على البيانات الحيّة",
        description:
          "حدّد الأنماط غير الطبيعية لالتقاط المشكلات مبكرًا ومنع الأعطال المفاجئة، بما فيها الانحرافات البطيئة التي لا تلتقطها أي عتبة ثابتة.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "قائمة شذوذ يعمل عليها المهندسون",
            description:
              "تُرتَّب النتائج حسب الخطورة والثقة، ومع كل واحدة الأصل المتأثر والإشارة والخطوة المقترحة.",
            items: ["خطورة وثقة لكل نتيجة", "الأصل والإشارة المتأثران", "تجاهل النتيجة أو تصعيدها"],
          },
          {
            title: "الشذوذ داخل الصورة التشغيلية",
            description:
              "تظهر نتائج الذكاء بجانب صحة المصنع وجهوزيته، فيُقرأ كل كشف مع أثره التجاري.",
            items: ["ملخص السبب والأثر", "عدد الأصول المعرضة", "حالة النموذج مرئية دائمًا"],
          },
          {
            title: "من الكشف إلى الإجراء",
            description: "يتحول الشذوذ المؤكد إلى إنذار أو أمر عمل مرتبط به.",
            items: ["تصعيد إلى إنذار", "إنشاء أمر عمل", "تغذية راجعة على الإنذارات الخاطئة"],
          },
        ],
      },
      panel: {
        heading: "داخل المنصة",
        description: "شاشة حقيقية من لوحة بابيلي، لا صورة تصورية.",
      },
      capabilities: {
        heading: "القدرات الرئيسية",
        subheading: "ما يتغير في العمليات اليومية بعد تفعيل هذه الميزة.",
        cards: [
          {
            icon: "radar",
            title: "يلتقط الانحراف البطيء",
            description: "تظهر الانحرافات التدريجية في الاهتزاز أو الحرارة أو الاستهلاك قبل تجاوز الحد بوقت طويل.",
          },
          {
            icon: "search",
            title: "قابل للتفسير لا صندوق أسود",
            description: "كل شذوذ يعرض الإشارة ونافذة الانحراف ودرجة الثقة ليحكم عليه المهندس.",
          },
          {
            icon: "warning",
            title: "إنذارات مزعجة أقل",
            description: "لأن الكشف يتبع السلوك الطبيعي للأصل نفسه، تتوقف التقلبات الموسمية والحملية عن إزعاج الفريق.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "اكتشف العطل وهو ما زال رخيصًا",
        description: "شارك عينة من إشاراتك التاريخية ونعرض أي شذوذ كانت المنصة ستكشفه.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
