'use client';

import { Cloud, Database, Network, Settings, Shield, Zap, type LucideIcon } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LinkedText } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* The AIoT Platform product page. Copy lives in one table per         */
/* language rather than as hardcoded English with a few translated     */
/* fragments, which is what left the Persian and Arabic builds showing */
/* English buttons and a navigation tooltip as the hero paragraph.     */
/* ------------------------------------------------------------------ */

const ICONS: LucideIcon[] = [Cloud, Shield, Zap, Database, Network, Settings];

type Copy = {
  title: string;
  lead: string;
  primary: string;
  secondary: string;
  featuresHeading: string;
  features: { title: string; description: string }[];
  ctaHeading: string;
  ctaLead: string;
  ctaButton: string;
};

const COPY: Record<string, Copy> = {
  en: {
    title: "AIoT Platform",
    lead: "One cloud platform to connect devices, store their data and act on it. Device management, real-time monitoring, alerts and AI services sit in the same panel, so an operations team works in one place instead of five.",
    primary: "Request Demo",
    secondary: "Talk to Sales",
    featuresHeading: "Platform features",
    features: [
      { title: "Cloud-native architecture", description: "Built on scalable cloud infrastructure that grows with your device count and your retention window." },
      { title: "End-to-end encryption", description: "Strong encryption for all data in transit and at rest, with per-location access control." },
      { title: "Real-time processing", description: "Ingest and evaluate high-frequency telemetry so rules and dashboards react as values arrive." },
      { title: "Flexible data storage", description: "Store and query long histories of IoT data efficiently, with retention you set per project." },
      { title: "Multi-protocol support", description: "MQTT, HTTP, CoAP, LoRaWAN, Modbus, OPC-UA and more, handled by device & gateway management." },
      { title: "Custom integrations", description: "Open APIs and webhooks connect the platform to the ERP, CMMS and BI tools you already run." },
    ],
    ctaHeading: "Ready to build on the platform?",
    ctaLead: "Bring a handful of devices and we will stand up your first operational dashboard with your team.",
    ctaButton: "Request Demo",
  },

  fa: {
    title: "پلتفرم AIoT",
    lead: "یک پلتفرم ابری برای اتصال دستگاه‌ها، نگهداری داده‌شان و اقدام بر پایهٔ آن. مدیریت دستگاه، پایش لحظه‌ای، هشدارها و سرویس‌های هوش مصنوعی در یک پنل قرار دارند، پس تیم عملیات به‌جای پنج ابزار، در یک جا کار می‌کند.",
    primary: "درخواست دمو",
    secondary: "تماس با فروش",
    featuresHeading: "قابلیت‌های پلتفرم",
    features: [
      { title: "معماری ابری بومی", description: "بر بستر زیرساخت ابری مقیاس‌پذیر ساخته شده که همراه با تعداد دستگاه و مدت نگهداشت داده رشد می‌کند." },
      { title: "رمزنگاری سرتاسری", description: "رمزنگاری قوی برای دادهٔ در حال انتقال و ذخیره‌شده، همراه با کنترل دسترسی به تفکیک مکان." },
      { title: "پردازش لحظه‌ای", description: "تله‌متری پرتناوب را دریافت و ارزیابی می‌کند تا قواعد و داشبوردها همان لحظهٔ رسیدن داده واکنش دهند." },
      { title: "ذخیره‌سازی منعطف داده", description: "تاریخچه‌های بلند دادهٔ اینترنت اشیا را کارآمد ذخیره و پرس‌وجو کنید، با نگهداشتی که خودتان برای هر پروژه تعیین می‌کنید." },
      { title: "پشتیبانی از چند پروتکل", description: "MQTT، HTTP، CoAP، LoRaWAN، Modbus، OPC-UA و بیشتر، از طریق مدیریت دستگاه و گیت‌وی." },
      { title: "یکپارچه‌سازی سفارشی", description: "APIهای باز و وب‌هوک، پلتفرم را به ERP، CMMS و ابزارهای هوش تجاری موجود شما وصل می‌کنند." },
    ],
    ctaHeading: "آمادهٔ ساختن روی پلتفرم هستید؟",
    ctaLead: "چند دستگاه بیاورید تا نخستین داشبورد عملیاتی را با تیم شما راه بیندازیم.",
    ctaButton: "درخواست دمو",
  },

  ar: {
    title: "منصة AIoT",
    lead: "منصة سحابية واحدة لربط الأجهزة وتخزين بياناتها والتصرف بناءً عليها. إدارة الأجهزة والمراقبة الفورية والتنبيهات وخدمات الذكاء الاصطناعي في اللوحة نفسها، فيعمل فريق العمليات في مكان واحد بدل خمسة.",
    primary: "طلب عرض توضيحي",
    secondary: "تحدّث إلى المبيعات",
    featuresHeading: "ميزات المنصة",
    features: [
      { title: "بنية سحابية أصلية", description: "مبنية على بنية سحابية قابلة للتوسع تنمو مع عدد أجهزتك ومدة احتفاظك بالبيانات." },
      { title: "تشفير من الطرف إلى الطرف", description: "تشفير قوي للبيانات أثناء النقل وفي التخزين، مع تحكم بالوصول حسب الموقع." },
      { title: "معالجة لحظية", description: "استقبال وتقييم القياسات عالية التردد لتتفاعل القواعد واللوحات مع وصول القيم." },
      { title: "تخزين مرن للبيانات", description: "خزّن واستعلم سجلات طويلة لبيانات إنترنت الأشياء بكفاءة، بمدة احتفاظ تحددها لكل مشروع." },
      { title: "دعم بروتوكولات متعددة", description: "MQTT وHTTP وCoAP وLoRaWAN وModbus وOPC-UA وغيرها، عبر إدارة الأجهزة والبوابات." },
      { title: "تكاملات مخصصة", description: "واجهات API مفتوحة وويب هوك تربط المنصة بأنظمة ERP وCMMS وأدوات ذكاء الأعمال لديك." },
    ],
    ctaHeading: "جاهز للبناء على المنصة؟",
    ctaLead: "أحضر بضعة أجهزة وسنُطلق أول لوحة تشغيلية مع فريقك.",
    ctaButton: "طلب عرض توضيحي",
  },
};

const AIoTPlatform = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const localize = (href: string) => "/" + language + href;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">{copy.title}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              <LinkedText text={copy.lead} />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href={localize("/contact?from=aiot-platform")}>{copy.primary}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={localize("/contact")}>{copy.secondary}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">{copy.featuresHeading}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {copy.features.map((feature, index) => {
              const Icon = ICONS[index];
              return (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-all duration-300 border-border">
                  <Icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    <LinkedText text={feature.description} />
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">{copy.ctaHeading}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{copy.ctaLead}</p>
          <Button size="lg" asChild>
            <a href={localize("/contact?from=aiot-platform")}>{copy.ctaButton}</a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default function AIoTPlatformPage() {
  return <AIoTPlatform />;
}
