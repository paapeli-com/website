import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-templates-1.jpg";
import img2 from "@/src/assets/f-templates-2.jpg";
import img3 from "@/src/assets/f-templates-3.jpg";
import hero from "@/src/assets/f-templates-hero.jpg";
import panel from "@/src/assets/3-2-1-panel.jpg";

export const solutionTemplatesConfig: FeatureConfig = {
  slug: "solution-templates",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["smart-manufacturing", "smart-buildings", "smart-agriculture", "fleet-tracking"],
  related: ["device-management", "realtime-monitoring", "alerts-events", "predictive-analytics"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Solution templates for every industry",
        description:
          "Start from a ready industry template, with device profiles, dashboards, alert rules and a location structure already in place, and reach value in days instead of quarters.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "Pick an industry template",
            description:
              "Templates for smart manufacturing, oil & gas, energy monitoring, smart buildings, fleet tracking and smart agriculture, each with its own KPI set.",
            items: ["Pre-built KPI sets", "Device profiles included", "Preview before applying"],
          },
          {
            title: "Dashboards ready on day one",
            description:
              "Applying a template creates the operational and executive dashboards, which stay fully editable afterwards.",
            items: ["Operational and executive views", "Widgets you can rearrange", "Built-in templates marked clearly"],
          },
          {
            title: "Location and asset structure included",
            description:
              "Each template proposes a location, unit, asset and device hierarchy that matches how that industry actually operates.",
            items: ["Consistent hierarchy across sites", "Role and location-aware access", "Ready for multi-site rollout"],
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
            icon: "timer",
            title: "Days, not quarters",
            description: "The first pilot goes live on a proven configuration instead of a blank platform.",
          },
          {
            icon: "boxes",
            title: "Repeatable for contractors",
            description: "System integrators clone the same template across client sites and keep delivery consistent.",
          },
          {
            icon: "template",
            title: "A starting point, not a cage",
            description: "Every template is fully editable, so you can rename, extend or remove anything after it is applied.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Start from a template built for your industry",
        description: "Tell us the sector and site count, and we will show the closest template and what would need to change.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "قالب‌های آمادهٔ راهکار برای هر صنعت",
        description:
          "از یک قالب آمادهٔ صنعتی شروع کنید که پروفایل دستگاه، داشبورد، قواعد هشدار و ساختار مکان را از پیش دارد، و در چند روز به ارزش برسید، نه چند فصل.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "یک قالب صنعتی انتخاب کنید",
            description:
              "قالب‌هایی برای تولید هوشمند، نفت و گاز، پایش انرژی، ساختمان‌های هوشمند، ردیابی ناوگان و کشاورزی هوشمند، هر یک با مجموعه شاخص‌های خود.",
            items: ["مجموعه شاخص‌های آماده", "پروفایل دستگاه‌ها همراه قالب", "پیش‌نمایش پیش از اعمال"],
          },
          {
            title: "داشبوردهای آماده از روز اول",
            description:
              "اعمال قالب، داشبوردهای عملیاتی و مدیریتی را می‌سازد که پس از آن کاملاً قابل ویرایش می‌مانند.",
            items: ["نمای عملیاتی و مدیریتی", "ویجت‌های قابل جابه‌جایی", "قالب‌های پیش‌ساخته با نشان مشخص"],
          },
          {
            title: "ساختار مکان و دارایی همراه قالب",
            description:
              "هر قالب یک سلسله‌مراتب مکان، واحد، دارایی و دستگاه پیشنهاد می‌کند که با شیوهٔ واقعی کار آن صنعت هم‌خوان است.",
            items: ["سلسله‌مراتب یکدست در همهٔ سایت‌ها", "دسترسی بر پایهٔ نقش و مکان", "آماده برای توسعهٔ چندسایتی"],
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
            icon: "timer",
            title: "چند روز، نه چند فصل",
            description: "پایلوت نخست روی یک پیکربندی آزموده‌شده اجرا می‌شود، نه یک پلتفرم خالی.",
          },
          {
            icon: "boxes",
            title: "قابل تکرار برای پیمانکاران",
            description: "مجریان سیستم می‌توانند همان قالب را برای سایت‌های مشتریان تکرار کنند و تحویل را یکدست نگه دارند.",
          },
          {
            icon: "template",
            title: "نقطهٔ شروع، نه قفس",
            description: "هر قالب کاملاً قابل ویرایش است، پس پس از اعمال می‌توانید هر بخش را تغییر نام، گسترش یا حذف کنید.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "با قالبی ساخته‌شده برای صنعت خود شروع کنید",
        description: "صنعت و تعداد سایت خود را بگویید تا نزدیک‌ترین قالب و تغییرات لازم را نشان دهیم.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "قوالب حلول لكل صناعة",
        description:
          "ابدأ من قالب صناعي جاهز يضم ملفات الأجهزة واللوحات وقواعد التنبيه وبنية المواقع، وحقّق القيمة في أيام لا في أشهر.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "اختر قالبًا صناعيًا",
            description:
              "قوالب للتصنيع الذكي والنفط والغاز ومراقبة الطاقة والمباني الذكية وتتبع الأساطيل والزراعة الذكية، لكل منها مجموعة مؤشراته.",
            items: ["مجموعات مؤشرات جاهزة", "ملفات أجهزة مضمّنة", "معاينة قبل التطبيق"],
          },
          {
            title: "لوحات جاهزة من اليوم الأول",
            description: "تطبيق القالب ينشئ اللوحات التشغيلية والتنفيذية وتبقى قابلة للتعديل بالكامل.",
            items: ["عروض تشغيلية وتنفيذية", "أدوات قابلة لإعادة الترتيب", "قوالب مدمجة مميّزة بوضوح"],
          },
          {
            title: "بنية المواقع والأصول مضمّنة",
            description:
              "يقترح كل قالب تسلسل موقع ووحدة وأصل وجهاز يطابق واقع العمل في تلك الصناعة.",
            items: ["تسلسل متسق بين المواقع", "وصول حسب الدور والموقع", "جاهز للتوسع متعدد المواقع"],
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
            icon: "timer",
            title: "أيام لا أشهر",
            description: "ينطلق أول مشروع تجريبي على إعداد مجرَّب بدل منصة فارغة.",
          },
          {
            icon: "boxes",
            title: "قابل للتكرار للمقاولين",
            description: "يكرّر مكاملو الأنظمة القالب نفسه على مواقع العملاء ويحفظون اتساق التسليم.",
          },
          {
            icon: "template",
            title: "نقطة بداية لا قفص",
            description: "كل قالب قابل للتعديل بالكامل، فأعد التسمية أو التوسيع أو الحذف بعد التطبيق.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "ابدأ من قالب مبني لصناعتك",
        description: "أخبرنا بالقطاع وعدد المواقع ونعرض أقرب قالب وما يحتاج للتغيير.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
