import type { FeatureConfig } from "@/components/feature/types";

import img1 from "@/src/assets/f-deploy-1.jpg";
import img2 from "@/src/assets/f-deploy-2.jpg";
import img3 from "@/src/assets/f-deploy-3.jpg";
import hero from "@/src/assets/f-deploy-hero.jpg";
import panel from "@/src/assets/panel.jpg";

export const flexibleDeploymentConfig: FeatureConfig = {
  slug: "flexible-deployment",
  hero,
  images: [img1, img2, img3],
  panel,
  usedIn: ["oil-gas", "smart-manufacturing", "energy-monitoring", "smart-buildings"],
  related: ["device-management", "realtime-monitoring", "alerts-events", "ota-updates"],

  copy: {
    en: {
      hero: {
        badge: "AIoT platform feature",
        title: "Flexible deployment, cloud or on-premise",
        description:
          "Deploy Paapeli on our cloud or on your own servers, based on your infrastructure, security and compliance requirements. Same platform, same panel, your choice of where the data lives.",
        primary: "View the AIoT platform",
        secondary: "Request Demo",
      },
      offer: {
        heading: "What this feature gives you",
        subheading: "A complete workflow inside one platform, from field data to daily operations.",
        cards: [
          {
            title: "Identical experience in both models",
            description:
              "Dashboards, AI services, alerting and user roles behave the same whether the platform runs on our cloud or yours.",
            items: ["Same panel and APIs", "Same AI services", "No feature downgrade on-premise"],
          },
          {
            title: "Multi-site, multi-tenant by design",
            description:
              "A strict location, unit, asset and device hierarchy keeps each site, contractor or client isolated inside one deployment.",
            items: ["Location-aware access control", "Per-site data separation", "White-label for contractors"],
          },
          {
            title: "Edge-friendly, network tolerant",
            description:
              "Gateways buffer data during connectivity loss and sync when the link returns, so remote sites do not lose history.",
            items: ["Store-and-forward buffering", "Local processing at the edge", "Works over cellular links"],
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
            icon: "cloud",
            title: "Start on our cloud",
            description: "Go live without procuring servers, then scale device count and retention as the project grows.",
          },
          {
            icon: "server",
            title: "Or keep the data inside",
            description:
              "Run the same platform inside your plant network or private data center when data must not leave the site.",
          },
          {
            icon: "shield",
            title: "One migration path",
            description: "Move between models later without rebuilding dashboards, rules or device profiles.",
          },
        ],
      },
      usedIn: "Where it is used",
      related: "Other platform capabilities",
      cta: {
        heading: "Choose the deployment that fits your policy",
        description:
          "Tell us your infrastructure and compliance constraints and we will map them to a cloud, on-premise or hybrid setup.",
        button: "Talk to Sales",
      },
    },

    fa: {
      hero: {
        badge: "قابلیت پلتفرم AIoT",
        title: "استقرار انعطاف‌پذیر، ابری یا داخلی",
        description:
          "پاپلی را بر اساس زیرساخت، الزامات امنیتی و انطباق سازمان خود، روی ابر ما یا روی سرورهای خودتان مستقر کنید. پلتفرم و پنل یکسان است و انتخاب محل نگهداری داده با شماست.",
        primary: "مشاهدهٔ پلتفرم AIoT",
        secondary: "درخواست دمو",
      },
      offer: {
        heading: "این قابلیت چه چیزی به شما می‌دهد",
        subheading: "یک گردش‌کار کامل در یک پلتفرم، از دادهٔ میدانی تا عملیات روزمره.",
        cards: [
          {
            title: "تجربهٔ یکسان در هر دو مدل",
            description:
              "داشبوردها، سرویس‌های هوش مصنوعی، هشدارها و نقش‌های کاربری در هر دو حالت دقیقاً یکسان کار می‌کنند.",
            items: ["همان پنل و همان APIها", "همان سرویس‌های هوش مصنوعی", "بدون کاهش قابلیت در نسخهٔ داخلی"],
          },
          {
            title: "چندسایتی و چندمستأجری از پایه",
            description:
              "سلسله‌مراتب مکان، واحد، دارایی و دستگاه، هر سایت، پیمانکار یا مشتری را در یک استقرار از هم جدا نگه می‌دارد.",
            items: ["کنترل دسترسی بر پایهٔ مکان", "تفکیک دادهٔ هر سایت", "ارائه با برند پیمانکار"],
          },
          {
            title: "سازگار با لبه و شبکهٔ ناپایدار",
            description:
              "گیت‌وی‌ها هنگام قطع ارتباط داده را نگه می‌دارند و پس از وصل شدن هم‌گام می‌کنند، پس تاریخچهٔ سایت‌های دور از دست نمی‌رود.",
            items: ["بافر ذخیره و ارسال", "پردازش محلی در لبه", "کار روی لینک سلولی"],
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
            icon: "cloud",
            title: "شروع روی ابر ما",
            description:
              "بدون تأمین سرور به بهره‌برداری برسید و با رشد پروژه، تعداد دستگاه و مدت نگهداشت داده را افزایش دهید.",
          },
          {
            icon: "server",
            title: "یا داده در شبکهٔ خودتان",
            description:
              "وقتی داده نباید سایت را ترک کند، همان پلتفرم را در شبکهٔ کارخانه یا دیتاسنتر خصوصی اجرا کنید.",
          },
          {
            icon: "shield",
            title: "یک مسیر مهاجرت",
            description: "بعداً می‌توانید بین دو مدل جابه‌جا شوید، بدون بازسازی داشبورد، قاعده و پروفایل دستگاه.",
          },
        ],
      },
      usedIn: "کجا به کار می‌آید",
      related: "سایر قابلیت‌های پلتفرم",
      cta: {
        heading: "استقراری را انتخاب کنید که با سیاست شما بخواند",
        description:
          "محدودیت‌های زیرساخت و انطباق خود را بگویید تا آن را به یک ساخت ابری، داخلی یا ترکیبی نگاشت کنیم.",
        button: "تماس با فروش",
      },
    },

    ar: {
      hero: {
        badge: "ميزة منصة AIoT",
        title: "نشر مرن، سحابي أو داخلي",
        description:
          "انشر بابيلي على سحابتنا أو على خوادمك وفق متطلبات بنيتك التحتية والأمن والامتثال. المنصة نفسها واللوحة نفسها، وأنت تختار مكان بقاء البيانات.",
        primary: "استعرض منصة AIoT",
        secondary: "طلب عرض توضيحي",
      },
      offer: {
        heading: "ما تمنحه هذه الميزة",
        subheading: "سير عمل كامل داخل منصة واحدة، من بيانات الميدان إلى العمليات اليومية.",
        cards: [
          {
            title: "تجربة متطابقة في النموذجين",
            description:
              "اللوحات وخدمات الذكاء الاصطناعي والتنبيهات وأدوار المستخدمين تعمل بالطريقة نفسها في الحالتين.",
            items: ["اللوحة وواجهات البرمجة نفسها", "خدمات الذكاء نفسها", "دون تقليل الميزات محليًا"],
          },
          {
            title: "متعدد المواقع والمستأجرين بالتصميم",
            description:
              "تسلسل الموقع والوحدة والأصل والجهاز يفصل كل موقع أو مقاول أو عميل داخل نشر واحد.",
            items: ["تحكم بالوصول حسب الموقع", "فصل بيانات كل موقع", "علامة خاصة للمقاولين"],
          },
          {
            title: "ملائم للحافة ومتحمّل لتقطع الشبكة",
            description:
              "تخزّن البوابات البيانات عند انقطاع الاتصال وتزامنها عند العودة، فلا تفقد المواقع النائية سجلّها.",
            items: ["تخزين وإعادة إرسال", "معالجة محلية على الحافة", "يعمل عبر شبكات الجوال"],
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
            icon: "cloud",
            title: "ابدأ على سحابتنا",
            description: "ابدأ التشغيل دون شراء خوادم، ثم وسّع عدد الأجهزة ومدة الاحتفاظ مع نمو المشروع.",
          },
          {
            icon: "server",
            title: "أو أبقِ البيانات داخليًا",
            description: "شغّل المنصة نفسها داخل شبكة المصنع أو مركز بيانات خاص عندما يجب ألا تخرج البيانات.",
          },
          {
            icon: "shield",
            title: "مسار ترحيل واحد",
            description: "انتقل بين النموذجين لاحقًا دون إعادة بناء اللوحات والقواعد وملفات الأجهزة.",
          },
        ],
      },
      usedIn: "أين تُستخدم",
      related: "قدرات أخرى للمنصة",
      cta: {
        heading: "اختر النشر الذي يناسب سياستك",
        description: "أخبرنا بقيود بنيتك التحتية والامتثال وسنحوّلها إلى إعداد سحابي أو داخلي أو هجين.",
        button: "تحدّث إلى المبيعات",
      },
    },
  },
};
