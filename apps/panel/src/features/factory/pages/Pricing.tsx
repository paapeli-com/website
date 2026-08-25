import { useMemo, useState } from "react";
import { Navigation } from "@/features/factory/components/Navigation";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Check, Minus, Calculator, Server, CreditCard, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";

type Billing = "monthly" | "yearly";
type Mode = "subscription" | "payg" | "onprem";

const Pricing = () => {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const langPrefix = language === "en" ? "" : `/${language}`;

  const [mode, setMode] = useState<Mode>("subscription");
  const [billing, setBilling] = useState<Billing>("monthly");

  const tr = {
    en: {
      title: "Simple, transparent pricing",
      subtitle: "Choose a subscription, pay only for what you use, or deploy fully on-premise.",
      subscription: "Subscription",
      payg: "Pay-as-you-Go",
      onprem: "On-Premise",
      subscriptionDesc: "Predictable monthly plans with included quotas.",
      paygDesc: "No fixed fee. Pay only for actual usage, billed monthly.",
      onpremDesc: "Self-hosted deployment for Enterprise customers.",
      monthly: "Monthly",
      yearly: "Yearly",
      save: "Save 20%",
      perMonth: "/month",
      custom: "Custom",
      mostPopular: "Most Popular",
      contactSales: "Contact Sales",
      getStarted: "Get Started",
      startFree: "Start Free",
      comparison: "Compare subscription plans",
      feature: "Feature",
      plans: {
        free: { name: "Free", desc: "For personal projects and evaluation" },
        growth: { name: "Growth", desc: "For small teams getting started with AIoT" },
        pro: { name: "Professional", desc: "For scaling industrial operations" },
        ent: { name: "Enterprise", desc: "For large-scale, mission-critical deployments" },
      },
      features: {
        devices: "Connected devices",
        storage: "Data retention",
        dashboards: "Dashboards",
        users: "Team members",
        alerts: "Alert rules",
        api: "API access",
        ota: "OTA updates",
        ai: "AI modules (Anomaly, Forecast, Co-Pilot)",
        rbac: "Role-based access control",
        sso: "SSO / SAML",
        support: "Support",
        sla: "SLA",
        onpremDeploy: "On-Premise deployment",
        audit: "Audit logs",
      },
      values: {
        community: "Community",
        email: "Email",
        priority: "Priority",
        dedicated: "24/7 Dedicated",
        unlimited: "Unlimited",
        custom: "Custom",
        basic: "Basic",
        advanced: "Advanced",
      },
      // PAYG
      paygTitle: "Pay only for what you use",
      paygIntro: "No minimums, no commitments. Usage is metered and billed at the end of each month. Benchmarked against AWS IoT Core, Datacake and Ubidots.",
      meter: "Metered resource",
      unit: "Unit",
      price: "Price (USD)",
      paygRows: [
        { k: "device", label: "Connected device", unit: "per device / month", price: "$0.80" },
        { k: "messages", label: "Device messages (telemetry)", unit: "per 1M messages", price: "$1.00" },
        { k: "storage", label: "Time-series data storage", unit: "per GB / month", price: "$0.10" },
        { k: "api", label: "API requests", unit: "per 1M calls", price: "$1.50" },
        { k: "rules", label: "Alert rule evaluations", unit: "per 1M evaluations", price: "$0.20" },
        { k: "ai", label: "AI inferences (Anomaly / Forecast)", unit: "per 1K inferences", price: "$2.00" },
        { k: "ota", label: "OTA bandwidth", unit: "per GB delivered", price: "$0.09" },
        { k: "egress", label: "Data egress", unit: "per GB", price: "$0.05" },
      ],
      paygNote: "Free tier: 3 devices, 100K messages, 1 GB storage and 10K API calls every month — at no cost.",
      // Calculator
      calcTitle: "Estimate your monthly cost",
      calcDesc: "Adjust the sliders to your expected usage.",
      calcDevices: "Connected devices",
      calcMessages: "Messages per month (millions)",
      calcStorage: "Storage (GB)",
      calcApi: "API calls per month (millions)",
      calcAi: "AI inferences per month (thousands)",
      calcTotal: "Estimated monthly cost",
      calcDisclaimer: "Estimate only. Final invoice depends on exact metered usage.",
      // On-prem
      onpremTitle: "On-Premise deployment",
      onpremBody: "Run the full Paapeli AIoT stack inside your own data center or private cloud. Includes air-gapped install, hardware sizing, SLA, dedicated support and a perpetual or annual license.",
      onpremIncludes: "What's included",
      onpremItems: [
        "Air-gapped installer & helm charts",
        "Unlimited devices, users and dashboards",
        "Full AI module suite (Anomaly, Forecast, Co-Pilot)",
        "SSO / SAML / LDAP, full RBAC and audit logs",
        "Custom SLA up to 99.99% with 24/7 dedicated support",
        "Annual or perpetual license, on-site training",
      ],
    },
    fa: {
      title: "قیمت‌گذاری ساده و شفاف",
      subtitle: "یک اشتراک انتخاب کنید، فقط برای مصرف واقعی پرداخت کنید، یا به‌صورت کامل روی زیرساخت خودتان نصب کنید.",
      subscription: "اشتراک",
      payg: "پرداخت به‌ازای مصرف",
      onprem: "نصب داخلی",
      subscriptionDesc: "پلن‌های ماهانه با سقف مصرف مشخص و قیمت ثابت.",
      paygDesc: "بدون هزینه ثابت. فقط برای مصرف واقعی پرداخت می‌کنید و در پایان ماه صورت‌حساب می‌شود.",
      onpremDesc: "نصب اختصاصی روی زیرساخت سازمان شما، ویژه مشتریان Enterprise.",
      monthly: "ماهانه",
      yearly: "سالانه",
      save: "۲۰٪ تخفیف",
      perMonth: "/ماه",
      custom: "سفارشی",
      mostPopular: "پرطرفدارترین",
      contactSales: "تماس با فروش",
      getStarted: "شروع کنید",
      startFree: "شروع رایگان",
      comparison: "مقایسه پلن‌های اشتراکی",
      feature: "ویژگی",
      plans: {
        free: { name: "رایگان", desc: "برای پروژه‌های شخصی و ارزیابی" },
        growth: { name: "Growth", desc: "برای تیم‌های کوچک در شروع AIoT" },
        pro: { name: "Professional", desc: "برای توسعه عملیات صنعتی" },
        ent: { name: "Enterprise", desc: "برای استقرارهای بزرگ و حیاتی" },
      },
      features: {
        devices: "تعداد دستگاه‌های متصل",
        storage: "نگهداری داده",
        dashboards: "داشبوردها",
        users: "اعضای تیم",
        alerts: "قوانین هشدار",
        api: "دسترسی API",
        ota: "به‌روزرسانی OTA",
        ai: "ماژول‌های هوش مصنوعی (ناهنجاری، پیش‌بینی، Co-Pilot)",
        rbac: "کنترل دسترسی نقش‌محور",
        sso: "ورود یکپارچه / SAML",
        support: "پشتیبانی",
        sla: "SLA",
        onpremDeploy: "نصب داخلی (On-Premise)",
        audit: "گزارش‌های ممیزی",
      },
      values: {
        community: "انجمن",
        email: "ایمیل",
        priority: "اولویت‌دار",
        dedicated: "۲۴/۷ اختصاصی",
        unlimited: "نامحدود",
        custom: "سفارشی",
        basic: "پایه",
        advanced: "پیشرفته",
      },
      paygTitle: "فقط برای آنچه استفاده می‌کنید، پرداخت کنید",
      paygIntro: "بدون حداقل مصرف و بدون تعهد. مصرف به‌صورت متری اندازه‌گیری و در پایان هر ماه محاسبه می‌شود. نرخ‌ها بر اساس بنچ‌مارک AWS IoT Core، Datacake و Ubidots تعیین شده‌اند.",
      meter: "منبع متری",
      unit: "واحد",
      price: "قیمت (USD)",
      paygRows: [
        { k: "device", label: "هر دستگاه متصل", unit: "به ازای هر دستگاه / ماه", price: "$0.80" },
        { k: "messages", label: "پیام دستگاه (تله‌متری)", unit: "به ازای هر ۱ میلیون پیام", price: "$1.00" },
        { k: "storage", label: "ذخیره‌سازی داده سری‌زمانی", unit: "به ازای هر GB / ماه", price: "$0.10" },
        { k: "api", label: "درخواست‌های API", unit: "به ازای هر ۱ میلیون فراخوانی", price: "$1.50" },
        { k: "rules", label: "ارزیابی قوانین هشدار", unit: "به ازای هر ۱ میلیون ارزیابی", price: "$0.20" },
        { k: "ai", label: "استنتاج هوش مصنوعی (ناهنجاری/پیش‌بینی)", unit: "به ازای هر ۱۰۰۰ استنتاج", price: "$2.00" },
        { k: "ota", label: "پهنای باند OTA", unit: "به ازای هر GB ارسالی", price: "$0.09" },
        { k: "egress", label: "خروج داده", unit: "به ازای هر GB", price: "$0.05" },
      ],
      paygNote: "سقف رایگان ماهانه: ۳ دستگاه، ۱۰۰ هزار پیام، ۱ گیگابایت ذخیره‌سازی و ۱۰ هزار فراخوانی API — بدون هزینه.",
      calcTitle: "هزینه ماهانه خود را تخمین بزنید",
      calcDesc: "مقادیر مورد انتظار مصرف خود را وارد کنید.",
      calcDevices: "دستگاه‌های متصل",
      calcMessages: "پیام در ماه (میلیون)",
      calcStorage: "ذخیره‌سازی (GB)",
      calcApi: "فراخوانی API در ماه (میلیون)",
      calcAi: "استنتاج هوش مصنوعی در ماه (هزار)",
      calcTotal: "تخمین هزینه ماهانه",
      calcDisclaimer: "این فقط یک تخمین است. صورت‌حساب نهایی بر اساس مصرف دقیق متری محاسبه می‌شود.",
      onpremTitle: "نصب داخلی (On-Premise)",
      onpremBody: "کل پشته AIoT پاپلی را در دیتاسنتر یا فضای ابری خصوصی خود اجرا کنید. شامل نصب Air-gapped، طراحی ظرفیت سخت‌افزاری، SLA، پشتیبانی اختصاصی و لایسنس سالانه یا دائمی.",
      onpremIncludes: "شامل موارد زیر",
      onpremItems: [
        "نصاب Air-gapped و Helm chart",
        "دستگاه‌ها، کاربران و داشبوردهای نامحدود",
        "تمام ماژول‌های هوش مصنوعی (ناهنجاری، پیش‌بینی، Co-Pilot)",
        "SSO / SAML / LDAP، RBAC کامل و گزارش‌های ممیزی",
        "SLA سفارشی تا ۹۹٫۹۹٪ با پشتیبانی اختصاصی ۲۴/۷",
        "لایسنس سالانه یا دائمی و آموزش حضوری",
      ],
    },
    ar: {
      title: "تسعير بسيط وشفاف",
      subtitle: "اختر اشتراكاً، أو ادفع حسب الاستخدام، أو انشر الحل بالكامل على بنيتك التحتية.",
      subscription: "اشتراك",
      payg: "ادفع حسب الاستخدام",
      onprem: "النشر المحلي",
      subscriptionDesc: "باقات شهرية ثابتة بحصص محددة.",
      paygDesc: "بدون رسوم ثابتة. ادفع فقط مقابل الاستخدام الفعلي شهرياً.",
      onpremDesc: "نشر مخصص داخل بنيتك التحتية، حصرياً لعملاء المؤسسات.",
      monthly: "شهري",
      yearly: "سنوي",
      save: "وفّر 20%",
      perMonth: "/شهر",
      custom: "مخصص",
      mostPopular: "الأكثر شيوعاً",
      contactSales: "تواصل مع المبيعات",
      getStarted: "ابدأ الآن",
      startFree: "ابدأ مجاناً",
      comparison: "مقارنة باقات الاشتراك",
      feature: "الميزة",
      plans: {
        free: { name: "مجاني", desc: "للمشاريع الشخصية والتقييم" },
        growth: { name: "Growth", desc: "للفرق الصغيرة التي تبدأ مع AIoT" },
        pro: { name: "Professional", desc: "لتوسيع العمليات الصناعية" },
        ent: { name: "Enterprise", desc: "للنشر الكبير والحرج" },
      },
      features: {
        devices: "الأجهزة المتصلة",
        storage: "الاحتفاظ بالبيانات",
        dashboards: "لوحات المعلومات",
        users: "أعضاء الفريق",
        alerts: "قواعد التنبيه",
        api: "وصول API",
        ota: "تحديثات OTA",
        ai: "وحدات الذكاء الاصطناعي (الشذوذ، التنبؤ، Co-Pilot)",
        rbac: "التحكم بالوصول حسب الدور",
        sso: "تسجيل دخول موحد / SAML",
        support: "الدعم",
        sla: "اتفاقية مستوى الخدمة",
        onpremDeploy: "النشر المحلي",
        audit: "سجلات التدقيق",
      },
      values: {
        community: "المجتمع",
        email: "البريد الإلكتروني",
        priority: "أولوية",
        dedicated: "24/7 مخصص",
        unlimited: "غير محدود",
        custom: "مخصص",
        basic: "أساسي",
        advanced: "متقدم",
      },
      paygTitle: "ادفع فقط مقابل ما تستخدمه",
      paygIntro: "بدون حد أدنى وبدون التزامات. يُحتسب الاستخدام شهرياً. الأسعار مبنية على معايير AWS IoT Core وDatacake وUbidots.",
      meter: "المورد المُقاس",
      unit: "الوحدة",
      price: "السعر (USD)",
      paygRows: [
        { k: "device", label: "جهاز متصل", unit: "لكل جهاز / شهر", price: "$0.80" },
        { k: "messages", label: "رسائل الأجهزة (التلميتري)", unit: "لكل مليون رسالة", price: "$1.00" },
        { k: "storage", label: "تخزين بيانات السلاسل الزمنية", unit: "لكل GB / شهر", price: "$0.10" },
        { k: "api", label: "طلبات API", unit: "لكل مليون طلب", price: "$1.50" },
        { k: "rules", label: "تقييمات قواعد التنبيه", unit: "لكل مليون تقييم", price: "$0.20" },
        { k: "ai", label: "استدلالات الذكاء الاصطناعي", unit: "لكل 1000 استدلال", price: "$2.00" },
        { k: "ota", label: "نطاق OTA", unit: "لكل GB مُسلَّم", price: "$0.09" },
        { k: "egress", label: "خروج البيانات", unit: "لكل GB", price: "$0.05" },
      ],
      paygNote: "الطبقة المجانية الشهرية: 3 أجهزة، 100 ألف رسالة، 1 GB تخزين و10 آلاف طلب API — بدون تكلفة.",
      calcTitle: "احسب تكلفتك الشهرية المتوقعة",
      calcDesc: "أدخل قيم الاستخدام المتوقعة.",
      calcDevices: "الأجهزة المتصلة",
      calcMessages: "الرسائل شهرياً (مليون)",
      calcStorage: "التخزين (GB)",
      calcApi: "طلبات API شهرياً (مليون)",
      calcAi: "استدلالات AI شهرياً (آلاف)",
      calcTotal: "التكلفة الشهرية المقدّرة",
      calcDisclaimer: "تقدير فقط. الفاتورة النهائية تعتمد على الاستخدام المُقاس الفعلي.",
      onpremTitle: "النشر المحلي",
      onpremBody: "شغّل منصة Paapeli AIoT بالكامل داخل مركز البيانات الخاص بك أو سحابتك الخاصة. يشمل التثبيت المعزول، تصميم السعة، SLA، الدعم المخصص ورخصة سنوية أو دائمة.",
      onpremIncludes: "ما هو متضمن",
      onpremItems: [
        "مثبّت معزول وHelm charts",
        "أجهزة ومستخدمون ولوحات غير محدودة",
        "جميع وحدات الذكاء الاصطناعي (الشذوذ، التنبؤ، Co-Pilot)",
        "SSO / SAML / LDAP، RBAC كامل وسجلات تدقيق",
        "SLA مخصص حتى 99.99% مع دعم مخصص 24/7",
        "رخصة سنوية أو دائمة وتدريب في الموقع",
      ],
    },
  } as const;

  const L = tr[language as "en" | "fa" | "ar"] ?? tr.en;

  // Subscription prices
  const monthly = { free: 0, growth: 49, pro: 199 };
  const yearlyDisplay = {
    free: 0,
    growth: Math.round((monthly.growth * 10) / 12),
    pro: Math.round((monthly.pro * 10) / 12),
  };
  const price = billing === "monthly" ? monthly : yearlyDisplay;

  const plans = [
    { key: "free", name: L.plans.free.name, desc: L.plans.free.desc, price: price.free, cta: L.startFree, featured: false },
    { key: "growth", name: L.plans.growth.name, desc: L.plans.growth.desc, price: price.growth, cta: L.getStarted, featured: false },
    { key: "pro", name: L.plans.pro.name, desc: L.plans.pro.desc, price: price.pro, cta: L.getStarted, featured: true },
    { key: "ent", name: L.plans.ent.name, desc: L.plans.ent.desc, price: null as number | null, cta: L.contactSales, featured: false },
  ];

  const planFeatures: Record<string, string[]> = {
    free: ["5", "7 days", "2", "1", "5", L.values.basic, "—", "—", "—", "—", L.values.community, "—", "—", "—"],
    growth: ["50", "30 days", "10", "5", "50", "✓", "✓", L.values.basic, "✓", "—", L.values.email, "—", "—", "✓"],
    pro: ["500", "1 year", L.values.unlimited, "25", L.values.unlimited, "✓", "✓", L.values.advanced, "✓", "✓", L.values.priority, "99.9%", "—", "✓"],
    ent: [L.values.unlimited, L.values.custom, L.values.unlimited, L.values.unlimited, L.values.unlimited, "✓", "✓", L.values.advanced, "✓", "✓", L.values.dedicated, L.values.custom, "✓", "✓"],
  };

  const featureRows = [
    L.features.devices, L.features.storage, L.features.dashboards, L.features.users,
    L.features.alerts, L.features.api, L.features.ota, L.features.ai,
    L.features.rbac, L.features.sso, L.features.support, L.features.sla,
    L.features.onpremDeploy, L.features.audit,
  ];

  const handleCTA = (planKey: string) => {
    if (planKey === "free") navigate(`${langPrefix}/login`);
    else navigate(`${langPrefix}/request-demo`);
  };

  // ---- PAYG calculator ----
  const [calc, setCalc] = useState({ devices: 50, messages: 5, storage: 10, api: 1, ai: 20 });
  const rates = { device: 0.8, messages: 1.0, storage: 0.1, api: 1.5, ai: 2.0 };
  const total = useMemo(() => {
    const v =
      calc.devices * rates.device +
      calc.messages * rates.messages +
      calc.storage * rates.storage +
      calc.api * rates.api +
      calc.ai * rates.ai;
    return Math.max(0, v);
  }, [calc]);

  const modeTabs: { key: Mode; label: string; icon: typeof CreditCard; desc: string }[] = [
    { key: "subscription", label: L.subscription, icon: CreditCard, desc: L.subscriptionDesc },
    { key: "payg", label: L.payg, icon: Calculator, desc: L.paygDesc },
    { key: "onprem", label: L.onprem, icon: Server, desc: L.onpremDesc },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navigation />

      <section className="pt-28 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{L.title}</h1>
            <p className="text-lg text-muted-foreground">{L.subtitle}</p>
          </div>

          {/* 3-way Mode toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-full border border-border">
              {modeTabs.map((t) => {
                const Icon = t.icon;
                const active = mode === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setMode(t.key)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== SUBSCRIPTION ===== */}
          {mode === "subscription" && (
            <>
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-full border border-border">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      billing === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {L.monthly}
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      billing === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {L.yearly}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{L.save}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
                {plans.map((plan) => (
                  <Card
                    key={plan.key}
                    className={`relative p-6 flex flex-col transition-all ${
                      plan.featured ? "border-primary border-2 shadow-lg" : "border-border hover:shadow-md"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                          {L.mostPopular}
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground min-h-[40px]">{plan.desc}</p>
                    </div>
                    <div className="mb-6">
                      {plan.price === null ? (
                        <div className="text-3xl font-bold text-foreground">{L.custom}</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                          <span className="text-sm text-muted-foreground">{L.perMonth}</span>
                        </div>
                      )}
                      {billing === "yearly" && plan.price !== null && plan.price > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">${plan.price * 12}/yr</div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCTA(plan.key)}
                      variant={plan.featured ? "default" : "outline"}
                      className="w-full mb-6"
                    >
                      {plan.cta}
                    </Button>
                    <ul className="space-y-2.5 text-sm">
                      {planFeatures[plan.key].slice(0, 8).map((val, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {val === "—" ? (
                            <Minus className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-foreground">
                            <span className="text-muted-foreground">{featureRows[i]}: </span>
                            {val !== "—" && val !== "✓" ? val : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* ===== PAY AS YOU GO ===== */}
          {mode === "payg" && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{L.paygTitle}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">{L.paygIntro}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Rate table */}
                <Card className="lg:col-span-3 p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className={`p-4 ${isRTL ? "text-right" : "text-left"} font-semibold text-foreground`}>{L.meter}</th>
                          <th className={`p-4 ${isRTL ? "text-right" : "text-left"} font-semibold text-foreground`}>{L.unit}</th>
                          <th className={`p-4 ${isRTL ? "text-left" : "text-right"} font-semibold text-foreground`}>{L.price}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {L.paygRows.map((r) => (
                          <tr key={r.k} className="border-t border-border">
                            <td className={`p-4 ${isRTL ? "text-right" : "text-left"} text-foreground`}>{r.label}</td>
                            <td className={`p-4 ${isRTL ? "text-right" : "text-left"} text-muted-foreground`}>{r.unit}</td>
                            <td className={`p-4 ${isRTL ? "text-left" : "text-right"} font-mono font-semibold text-foreground`} dir="ltr">{r.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-border bg-primary/5 text-sm text-foreground">
                    {L.paygNote}
                  </div>
                </Card>

                {/* Calculator */}
                <Card className="lg:col-span-2 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">{L.calcTitle}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">{L.calcDesc}</p>

                  <div className="space-y-4 flex-1">
                    {[
                      { k: "devices", label: L.calcDevices, step: 1 },
                      { k: "messages", label: L.calcMessages, step: 0.1 },
                      { k: "storage", label: L.calcStorage, step: 1 },
                      { k: "api", label: L.calcApi, step: 0.1 },
                      { k: "ai", label: L.calcAi, step: 1 },
                    ].map((f) => (
                      <div key={f.k}>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</Label>
                        <Input
                          type="number"
                          min={0}
                          step={f.step}
                          dir="ltr"
                          value={(calc as any)[f.k]}
                          onChange={(e) => setCalc({ ...calc, [f.k]: Math.max(0, Number(e.target.value) || 0) })}
                          className="font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">{L.calcTotal}</div>
                    <div className="flex items-baseline gap-1" dir="ltr">
                      <span className="text-3xl font-bold text-primary">${total.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">{L.perMonth}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">{L.calcDisclaimer}</p>
                    <Button onClick={() => navigate(`${langPrefix}/login`)} className="w-full mt-4">
                      {L.startFree}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ===== ON-PREMISE ===== */}
          {mode === "onprem" && (
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 border-primary/30">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{L.onpremTitle}</h2>
                    <p className="text-muted-foreground">{L.onpremBody}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{L.onpremIncludes}</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {L.onpremItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{L.custom}</div>
                    <div className="text-sm text-muted-foreground">{L.plans.ent.desc}</div>
                  </div>
                  <Button size="lg" onClick={() => navigate(`${langPrefix}/request-demo`)}>
                    {L.contactSales}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Comparison table (only for subscription mode) */}
      {mode === "subscription" && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">{L.comparison}</h2>
            <div className="max-w-6xl mx-auto overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className={`p-4 ${isRTL ? "text-right" : "text-left"} font-semibold text-foreground`}>{L.feature}</th>
                    {plans.map((p) => (
                      <th key={p.key} className="p-4 text-center font-semibold text-foreground">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className={`p-4 ${isRTL ? "text-right" : "text-left"} text-muted-foreground`}>{row}</td>
                      {plans.map((p) => {
                        const v = planFeatures[p.key][i];
                        return (
                          <td key={p.key} className="p-4 text-center text-foreground">
                            {v === "✓" ? (
                              <Check className="h-4 w-4 text-primary mx-auto" />
                            ) : v === "—" ? (
                              <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            ) : (
                              v
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Pricing;
