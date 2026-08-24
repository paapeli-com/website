"use client";

import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { PredictiveMaintenanceStats } from "@/components/PredictiveMaintenanceStats";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import oilgasHero from "@/src/assets/oilgas-hero.jpg";
import oilgasPipeline from "@/src/assets/oilgas-pipeline.jpg";
import oilgasRefinery from "@/src/assets/oilgas-refinery.jpg";
import oilgasTank from "@/src/assets/oilgas-tank.jpg";

/* ------------------------------------------------------------------ */
/* Oil & Gas solution page.                                           */
/* Photography carries the page: a full-bleed hero, three cards whose */
/* image collapses on hover to make room for the detail, the shared   */
/* predictive-maintenance figures, and a partner-facing block.        */
/* ------------------------------------------------------------------ */

type Card = { title: string; description: string; items: string[] };

type Copy = {
  hero: { title: string; description: string; primary: string; secondary: string };
  offer: { heading: string; subheading: string; cards: Card[] };
  why: { heading: string; cards: Card[] };
  cta: { heading: string; description: string; button: string };
};

/* Same order in both blocks: refinery, pipeline, tank. */
const OFFER_IMAGES: StaticImageData[] = [oilgasRefinery, oilgasPipeline, oilgasTank];
const WHY_IMAGES: StaticImageData[] = [oilgasRefinery, oilgasPipeline, oilgasTank];

const COPY: Record<string, Copy> = {
  en: {
    hero: {
      title: "AIoT technology for oil and gas",
      description:
        "Paapeli is an AIoT technology provider. Oil and gas operators and EPC or field-service contractors alike can build on our cloud infrastructure, edge computing, and IoT stack to deliver smarter, safer energy services.",
      primary: "Request Demo",
      secondary: "Contact Sales",
    },
    offer: {
      heading: "What Paapeli delivers for oil and gas",
      subheading:
        "A complete AIoT stack that operators and contractors can deliver under their own brand or fold into an existing service portfolio.",
      cards: [
        {
          title: "Asset and process monitoring",
          description: "A live view of pumps, compressors, and process units across every site.",
          items: ["Vibration and temperature trends", "Threshold and anomaly alerts", "A work order from any alert"],
        },
        {
          title: "Pipeline and wellhead telemetry",
          description: "Pressure, flow, and leak signals from remote sites over cellular, satellite, or LoRaWAN.",
          items: ["Works offline and syncs later", "Leak and pressure-drop detection", "OTA updates across the fleet"],
        },
        {
          title: "Predictive maintenance and AI",
          description: "Models learn normal behaviour and flag failures weeks before a shutdown.",
          items: ["Failure prediction", "Anomaly detection", "Maintenance scheduling"],
        },
      ],
    },
    why: {
      heading: "Why partners choose Paapeli",
      cards: [
        {
          title: "Technology you can resell or white-label",
          description:
            "Paapeli is the engine behind your service, not a competing operator. Deliver Paapeli-based digitalisation under your own brand and contracts.",
          items: ["Ready to deliver under your brand", "API-based integration", "No conflict of interest"],
        },
        {
          title: "Fast deployment for contractors",
          description:
            "Pre-integrated protocols, edge gateways, and device templates let you roll out smart field services for customers in weeks, not years.",
          items: ["Modbus, OPC UA, MQTT", "Cellular, satellite, LoRaWAN", "Reusable project templates"],
        },
        {
          title: "A flexible commercial model",
          description:
            "Start on our pay-as-you-go cloud or run the same platform inside your own network. Scale per project, per asset, or per end customer.",
          items: ["Pay-as-you-go cloud", "Private network deployment", "Per-project scalability"],
        },
      ],
    },
    cta: {
      heading: "Strengthen your oil and gas services with Paapeli",
      description:
        "Whether you operate assets directly or deliver smart services to the industry, our AIoT platform is ready to grow with you.",
      button: "Contact Sales",
    },
  },

  fa: {
    hero: {
      title: "فناوری AIoT برای نفت و گاز",
      description:
        "پاپلی یک ارائه‌دهندهٔ فناوری AIoT است. بهره‌برداران نفت و گاز و پیمانکاران EPC و خدمات میدانی، هر دو می‌توانند از زیرساخت ابری، محاسبات لبه و IoT ما برای ارائهٔ خدمات انرژی هوشمندتر و ایمن‌تر استفاده کنند.",
      primary: "درخواست دمو",
      secondary: "تماس با فروش",
    },
    offer: {
      heading: "آنچه پاپلی برای نفت و گاز ارائه می‌دهد",
      subheading:
        "یک پشتهٔ کامل AIoT که بهره‌برداران و پیمانکاران می‌توانند با برند خود ارائه دهند یا در سبد خدمات خود یکپارچه کنند.",
      cards: [
        {
          title: "پایش دارایی و فرایند",
          description: "یک نمای زنده از پمپ‌ها، کمپرسورها و واحدهای فرایندی در همهٔ سایت‌ها.",
          items: ["روند لرزش و دما", "هشدار آستانه و ناهنجاری", "دستور کار از هر هشدار"],
        },
        {
          title: "تله‌متری خط لوله و سرچاهی",
          description: "سیگنال فشار، جریان و نشت از سایت‌های دور روی سلولی، ماهواره یا LoRaWAN.",
          items: ["کار آفلاین و هم‌گام‌سازی بعدی", "تشخیص نشت و افت فشار", "به‌روزرسانی OTA در کل ناوگان"],
        },
        {
          title: "نگهداشت پیش‌بینانه و هوش مصنوعی",
          description: "مدل‌ها رفتار عادی را یاد می‌گیرند و خرابی را هفته‌ها پیش از توقف اعلام می‌کنند.",
          items: ["پیش‌بینی خرابی", "تشخیص ناهنجاری", "برنامه‌ریزی نگهداشت"],
        },
      ],
    },
    why: {
      heading: "چرا همکاران پاپلی را انتخاب می‌کنند",
      cards: [
        {
          title: "فناوری قابل فروش مجدد یا ارائه با برند شما",
          description:
            "پاپلی موتور پشت خدمت شماست، نه یک بهره‌بردار رقیب. دیجیتالی‌سازی مبتنی بر پاپلی را با برند و قراردادهای خودتان ارائه دهید.",
          items: ["آمادهٔ ارائه با برند شما", "یکپارچه‌سازی مبتنی بر API", "بدون تضاد منافع"],
        },
        {
          title: "استقرار سریع برای پیمانکاران",
          description:
            "پروتکل‌های از پیش یکپارچه، گیت‌وی‌های لبه و قالب‌های دستگاه به شما امکان می‌دهند خدمات میدانی هوشمند را برای مشتریان در هفته‌ها، نه سال‌ها، مستقر کنید.",
          items: ["Modbus، OPC UA، MQTT", "سلولی، ماهواره، LoRaWAN", "قالب‌های پروژهٔ قابل استفادهٔ مجدد"],
        },
        {
          title: "مدل تجاری انعطاف‌پذیر",
          description:
            "با پرداخت به‌اندازهٔ مصرف روی کلاد ما شروع کنید یا همان پلتفرم را در شبکهٔ خودتان اجرا کنید. به ازای هر پروژه، دارایی یا مشتری نهایی مقیاس بگیرید.",
          items: ["کلاد با پرداخت به‌اندازهٔ مصرف", "استقرار در شبکهٔ خصوصی", "مقیاس‌پذیری مبتنی بر پروژه"],
        },
      ],
    },
    cta: {
      heading: "خدمات نفت و گاز خود را با پاپلی تقویت کنید",
      description:
        "چه دارایی‌ها را مستقیماً بهره‌برداری کنید و چه خدمات هوشمند را به صنعت ارائه دهید، پلتفرم AIoT ما آمادهٔ رشد همراه شماست.",
      button: "تماس با فروش",
    },
  },

  ar: {
    hero: {
      title: "تقنية AIoT للنفط والغاز",
      description:
        "بابيلي مزوّد لتقنية AIoT. يمكن لمشغّلي النفط والغاز ولمقاولي EPC والخدمات الميدانية الاعتماد على بنيتنا السحابية والحوسبة الطرفية وإنترنت الأشياء لتقديم خدمات طاقة أذكى وأكثر أماناً.",
      primary: "طلب عرض توضيحي",
      secondary: "اتصل بالمبيعات",
    },
    offer: {
      heading: "ما تقدّمه بابيلي للنفط والغاز",
      subheading:
        "منظومة AIoT متكاملة يمكن للمشغّلين والمقاولين تقديمها بعلامتهم التجارية أو دمجها في محفظة خدماتهم.",
      cards: [
        {
          title: "مراقبة الأصول والعمليات",
          description: "رؤية حيّة للمضخات والضواغط ووحدات المعالجة في كل المواقع.",
          items: ["اتجاهات الاهتزاز والحرارة", "تنبيهات العتبة والشذوذ", "أمر عمل من أي تنبيه"],
        },
        {
          title: "قياس عن بُعد لخطوط الأنابيب ورؤوس الآبار",
          description: "إشارات الضغط والتدفق والتسرب من المواقع النائية عبر الشبكة الخلوية أو الأقمار الصناعية أو LoRaWAN.",
          items: ["يعمل دون اتصال ويتزامن لاحقاً", "كشف التسرب وهبوط الضغط", "تحديثات OTA عبر الأسطول"],
        },
        {
          title: "الصيانة التنبؤية والذكاء الاصطناعي",
          description: "تتعلّم النماذج السلوك الطبيعي وتنذر بالأعطال قبل التوقف بأسابيع.",
          items: ["التنبؤ بالأعطال", "كشف الشذوذ", "جدولة الصيانة"],
        },
      ],
    },
    why: {
      heading: "لماذا يختار الشركاء بابيلي",
      cards: [
        {
          title: "تقنية قابلة لإعادة البيع أو للعلامة الخاصة",
          description:
            "بابيلي هو المحرّك خلف خدمتك، وليس مشغّلاً منافساً. قدّم التحول الرقمي المبني على بابيلي بعلامتك وعقودك.",
          items: ["جاهزة للتقديم بعلامتك", "تكامل عبر واجهات API", "بلا تضارب مصالح"],
        },
        {
          title: "نشر سريع للمقاولين",
          description:
            "بروتوكولات مدمجة مسبقاً وبوابات طرفية وقوالب أجهزة تتيح لك إطلاق خدمات ميدانية ذكية لعملائك خلال أسابيع لا سنوات.",
          items: ["Modbus وOPC UA وMQTT", "خلوي وأقمار صناعية وLoRaWAN", "قوالب مشاريع قابلة لإعادة الاستخدام"],
        },
        {
          title: "نموذج تجاري مرن",
          description:
            "ابدأ على سحابتنا بنظام الدفع حسب الاستخدام أو شغّل المنصة نفسها داخل شبكتك. توسّع لكل مشروع أو أصل أو عميل نهائي.",
          items: ["سحابة بالدفع حسب الاستخدام", "نشر داخل شبكة خاصة", "قابلية توسّع حسب المشروع"],
        },
      ],
    },
    cta: {
      heading: "عزّز خدمات النفط والغاز لديك مع بابيلي",
      description:
        "سواء كنت تشغّل الأصول مباشرة أو تقدّم خدمات ذكية للقطاع، منصة AIoT لدينا جاهزة للنمو معك.",
      button: "اتصل بالمبيعات",
    },
  },
};

function CheckList({ items, tone }: { items: string[]; tone: "light" | "dark" }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn("flex items-start gap-2 text-sm", tone === "light" ? "text-white/85" : "text-foreground/80")}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function OilGasPage() {
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const copy = COPY[language] ?? COPY.en;

  const goToDemo = () => router.push(`/${language}/request-demo`);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navigation />

      {/* ------------------------------- Hero ------------------------------ */}
      <section className="relative isolate flex min-h-[75vh] items-center overflow-hidden pt-16">
        <Image src={oilgasHero} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#081020]/[0.72]" />

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">{copy.hero.title}</h1>
            <p className="mb-8 text-lg text-white/80 md:text-xl">{copy.hero.description}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="px-8 py-6 text-lg" onClick={goToDemo}>
                {copy.hero.primary}
                <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white/10 px-8 py-6 text-lg text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                onClick={goToDemo}
              >
                {copy.hero.secondary}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------- What Paapeli delivers ----------------------- */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-3 text-center text-3xl font-bold text-foreground md:text-4xl">{copy.offer.heading}</h2>
          <p className="mb-12 text-center text-muted-foreground">{copy.offer.subheading}</p>

          <div className="grid gap-6 md:grid-cols-3">
            {copy.offer.cards.map((card, i) => (
              <div
                key={card.title}
                tabIndex={0}
                className="group relative flex h-[360px] overflow-hidden rounded-2xl bg-[hsl(215_60%_13%)] outline-none ring-primary/60 focus-visible:ring-2"
              >
                {/* The photograph steps aside to make room for the detail. */}
                <div className="relative h-full w-full shrink-0 transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-1/5 group-focus-visible:w-1/5">
                  <Image
                    src={OFFER_IMAGES[i]}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[hsl(215_60%_8%)]/90 via-transparent to-transparent"
                  />
                  <h3 className="absolute inset-x-0 bottom-0 p-5 text-lg font-semibold text-white transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
                    {card.title}
                  </h3>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6 opacity-0 transition-opacity delay-200 duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{card.description}</p>
                  <CheckList items={card.items} tone="light" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- Predictive maintenance figures ---------------- */}
      <section className="bg-muted/30">
        <PredictiveMaintenanceStats />
      </section>

      {/* ---------------------- Why partners choose us --------------------- */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">{copy.why.heading}</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {copy.why.cards.map((card, i) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-border bg-background p-6 transition-shadow duration-300 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-4">
                  <Image
                    src={WHY_IMAGES[i]}
                    alt=""
                    width={112}
                    height={112}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <h3 className="text-lg font-bold leading-snug text-foreground">{card.title}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                <CheckList items={card.items} tone="dark" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA ------------------------------ */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{copy.cta.heading}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">{copy.cta.description}</p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={goToDemo}>
            {copy.cta.button}
          </Button>
        </div>
      </section>
    </div>
  );
}
