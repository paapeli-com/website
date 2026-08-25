'use client';

import { Globe, Network, Server, Shield, TrendingDown, Zap, type LucideIcon } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LinkedText } from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* The Edge Computing product page. Copy is held per language so the    */
/* Persian and Arabic builds stop falling back to English headings and  */
/* buttons partway down the page.                                       */
/* ------------------------------------------------------------------ */

const ICONS: LucideIcon[] = [Zap, TrendingDown, Shield, Network, Globe, Server];

type Entry = { title: string; description: string };

type Copy = {
  title: string;
  lead: string;
  primary: string;
  secondary: string;
  featuresHeading: string;
  features: Entry[];
  useCasesHeading: string;
  useCases: Entry[];
  ctaHeading: string;
  ctaLead: string;
  ctaButton: string;
};

const COPY: Record<string, Copy> = {
  en: {
    title: "Edge Computing",
    lead: "Process data next to the equipment that produces it. Rules run and anomalies surface on the gateway, so a site keeps working through a network outage and only meaningful data travels to the cloud.",
    primary: "Request Demo",
    secondary: "Talk to Sales",
    featuresHeading: "What edge computing gives you",
    features: [
      { title: "Ultra-low latency", description: "Decisions are made on the gateway in milliseconds, without a round trip to the cloud." },
      { title: "Reduced bandwidth", description: "Aggregate and filter locally so a metered or satellite link carries far less traffic." },
      { title: "Keeps working offline", description: "Gateways buffer readings during an outage and sync when the link returns, so no history is lost." },
      { title: "Distributed architecture", description: "Run the same workloads across many sites and manage them all from one panel." },
      { title: "Data stays close to source", description: "Sensitive process data can be processed on site and never leave the plant network." },
      { title: "Scales with the site", description: "From a single gateway on one line up to hundreds across a portfolio of sites." },
    ],
    useCasesHeading: "Where edge computing is used",
    useCases: [
      { title: "Smart Manufacturing", description: "Real-time monitoring and control of production equipment, with feedback loops that do not wait on the network." },
      { title: "Oil & Gas", description: "Remote wellheads and pipelines keep recording and evaluating rules while the link is down." },
      { title: "Energy Monitoring", description: "Meter data is aggregated on site, so only the intervals and events you need reach the cloud." },
      { title: "Smart Buildings", description: "Comfort and ventilation logic keeps running locally even when the building loses its uplink." },
    ],
    ctaHeading: "Ready to push processing to the edge?",
    ctaLead: "Tell us about your sites and connectivity and we will map out what should run locally and what belongs in the cloud.",
    ctaButton: "Request Demo",
  },

  fa: {
    title: "رایانش لبه",
    lead: "داده را کنار همان تجهیزی که تولیدش می‌کند پردازش کنید. قواعد روی گیت‌وی اجرا می‌شوند و ناهنجاری همان‌جا آشکار می‌شود، پس سایت در قطعی شبکه به کار ادامه می‌دهد و فقط دادهٔ بامعنا به ابر می‌رود.",
    primary: "درخواست دمو",
    secondary: "تماس با فروش",
    featuresHeading: "رایانش لبه چه چیزی به شما می‌دهد",
    features: [
      { title: "تأخیر بسیار کم", description: "تصمیم‌ها در چند میلی‌ثانیه روی گیت‌وی گرفته می‌شوند، بدون رفت و برگشت به ابر." },
      { title: "پهنای باند کمتر", description: "تجمیع و فیلتر محلی باعث می‌شود لینک حجمی یا ماهواره‌ای ترافیک بسیار کمتری حمل کند." },
      { title: "در حالت آفلاین هم کار می‌کند", description: "گیت‌وی‌ها در قطعی، داده را نگه می‌دارند و پس از وصل شدن هم‌گام می‌کنند، پس تاریخچه از دست نمی‌رود." },
      { title: "معماری توزیع‌شده", description: "همان بار کاری را در چندین سایت اجرا کنید و همه را از یک پنل مدیریت کنید." },
      { title: "داده نزدیک به منبع می‌ماند", description: "دادهٔ حساس فرآیند می‌تواند در محل پردازش شود و هرگز از شبکهٔ کارخانه بیرون نرود." },
      { title: "همراه سایت مقیاس می‌گیرد", description: "از یک گیت‌وی روی یک خط تا صدها گیت‌وی در مجموعه‌ای از سایت‌ها." },
    ],
    useCasesHeading: "رایانش لبه کجا به کار می‌آید",
    useCases: [
      { title: "تولید هوشمند", description: "پایش و کنترل لحظه‌ای تجهیزات تولید، با حلقه‌های بازخوردی که منتظر شبکه نمی‌مانند." },
      { title: "نفت و گاز", description: "سرچاه‌ها و خطوط لولهٔ دوردست در زمان قطعی لینک هم ثبت و ارزیابی قواعد را ادامه می‌دهند." },
      { title: "پایش انرژی", description: "دادهٔ کنتور در محل تجمیع می‌شود، پس فقط بازه‌ها و رویدادهای موردنیاز به ابر می‌رسند." },
      { title: "ساختمان‌های هوشمند", description: "منطق آسایش و تهویه حتی وقتی ساختمان لینک خود را از دست می‌دهد، محلی اجرا می‌شود." },
    ],
    ctaHeading: "آمادهٔ بردن پردازش به لبه هستید؟",
    ctaLead: "از سایت‌ها و وضعیت ارتباطی خود بگویید تا مشخص کنیم چه چیزی باید محلی اجرا شود و چه چیزی جایش در ابر است.",
    ctaButton: "درخواست دمو",
  },

  ar: {
    title: "الحوسبة الطرفية",
    lead: "عالج البيانات بجانب المعدات التي تنتجها. تعمل القواعد ويظهر الشذوذ على البوابة، فيواصل الموقع عمله أثناء انقطاع الشبكة ولا يسافر إلى السحابة سوى البيانات المفيدة.",
    primary: "طلب عرض توضيحي",
    secondary: "تحدّث إلى المبيعات",
    featuresHeading: "ما تمنحه الحوسبة الطرفية",
    features: [
      { title: "زمن استجابة منخفض جدًا", description: "تُتخذ القرارات على البوابة خلال أجزاء من الثانية دون رحلة إلى السحابة." },
      { title: "عرض نطاق أقل", description: "التجميع والفلترة محليًا يجعلان الوصلة المحدودة أو الفضائية تحمل حركة أقل بكثير." },
      { title: "يعمل دون اتصال", description: "تخزّن البوابات القراءات أثناء الانقطاع وتزامنها عند العودة، فلا يضيع السجل." },
      { title: "بنية موزعة", description: "شغّل الأحمال نفسها عبر مواقع كثيرة وأدِرها جميعًا من لوحة واحدة." },
      { title: "البيانات قرب مصدرها", description: "يمكن معالجة بيانات العملية الحساسة في الموقع دون أن تغادر شبكة المصنع." },
      { title: "يتوسع مع الموقع", description: "من بوابة واحدة على خط واحد إلى مئات البوابات عبر محفظة مواقع." },
    ],
    useCasesHeading: "أين تُستخدم الحوسبة الطرفية",
    useCases: [
      { title: "التصنيع الذكي", description: "مراقبة وتحكم لحظيان في معدات الإنتاج بحلقات تغذية راجعة لا تنتظر الشبكة." },
      { title: "النفط والغاز", description: "تواصل رؤوس الآبار وخطوط الأنابيب النائية التسجيل وتقييم القواعد أثناء انقطاع الوصلة." },
      { title: "مراقبة الطاقة", description: "تُجمَّع بيانات العدادات في الموقع، فلا يصل إلى السحابة سوى الفترات والأحداث التي تحتاجها." },
      { title: "المباني الذكية", description: "يستمر منطق الراحة والتهوية محليًا حتى عند فقدان المبنى لوصلته." },
    ],
    ctaHeading: "جاهز لنقل المعالجة إلى الحافة؟",
    ctaLead: "أخبرنا عن مواقعك وحالة الاتصال لديك ونحدد ما ينبغي تشغيله محليًا وما مكانه السحابة.",
    ctaButton: "طلب عرض توضيحي",
  },
};

const EdgeComputing = () => {
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
                <a href={localize("/request-demo")}>{copy.primary}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={localize("/contact")}>{copy.secondary}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {copy.featuresHeading}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {copy.features.map((feature, index) => {
              const Icon = ICONS[index];
              return (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    <LinkedText text={feature.description} />
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {copy.useCasesHeading}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {copy.useCases.map((useCase) => (
              <Card key={useCase.title} className="p-6">
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {/* The industry name is the link, so the card doubles as a way in. */}
                  <LinkedText text={useCase.title} />
                </h3>
                <p className="text-muted-foreground">
                  <LinkedText text={useCase.description} />
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto p-12 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">{copy.ctaHeading}</h2>
            <p className="text-xl text-muted-foreground mb-8">{copy.ctaLead}</p>
            <Button size="lg" asChild>
              <a href={localize("/request-demo")}>{copy.ctaButton}</a>
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default function EdgeComputingPage() {
  return <EdgeComputing />;
}
