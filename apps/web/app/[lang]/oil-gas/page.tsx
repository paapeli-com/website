import { Navigation } from "@/components/Navigation";
import { getTranslation, isRTL as checkRTL } from "@/lib/i18n/server";
import type { Language } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplet, Activity, AlertTriangle, TrendingUp, Shield, Gauge } from "lucide-react";
import { PredictiveMaintenanceStats } from "@/components/PredictiveMaintenanceStats";
import Link from "next/link";

function localePath(lang: string, path: string) {
  const cleanPath = path.replace(/^\/(en|ar|fa)/, '');
  return `/${lang}/${cleanPath}`.replace('//', '/');
}

export default async function OilGasPage({ params }: { params: { lang: Language } }) {
  const { lang } = await params;
  const t = getTranslation(lang);
  const isRTL = checkRTL(lang);

  const features = [
    { icon: Activity, title: "Real-Time Monitoring", titleFa: "نظارت بی‌درنگ", titleAr: "المراقبة في الوقت الفعلي", description: "Monitor pipelines, wells, and equipment 24/7", descriptionFa: "نظارت بر خطوط لوله، چاه‌ها و تجهیزات ۲۴/۷", descriptionAr: "مراقبة خطوط الأنابيب والآبار والمعدات على مدار الساعة" },
    { icon: AlertTriangle, title: "Leak Detection", titleFa: "تشخیص نشت", titleAr: "اكتشاف التسرب", description: "Instantly detect and locate pipeline leaks", descriptionFa: "تشخیص و مکان‌یابی فوری نشت در خطوط لوله", descriptionAr: "كشف وتحديد تسربات خطوط الأنابيب على الفور" },
    { icon: Gauge, title: "Pressure Monitoring", titleFa: "نظارت بر فشار", titleAr: "مراقبة الضغط", description: "Track pressure levels across your infrastructure", descriptionFa: "ردیابی سطوح فشار در زیرساخت شما", descriptionAr: "تتبع مستويات الضغط عبر البنية التحتية الخاصة بك" },
    { icon: Droplet, title: "Flow Measurement", titleFa: "اندازه‌گیری جریان", titleAr: "قياس التدفق", description: "Accurate flow rate measurement and analytics", descriptionFa: "اندازه‌گیری دقیق نرخ جریان و تحلیل", descriptionAr: "قياس دقيق لمعدل التدفق والتحليلات" },
    { icon: Shield, title: "Safety Compliance", titleFa: "انطباق ایمنی", titleAr: "الامتثال للسلامة", description: "Meet industry safety and regulatory standards", descriptionFa: "رعایت استانداردهای ایمنی و نظارتی صنعت", descriptionAr: "تلبية معايير السلامة والتنظيم الصناعي" },
    { icon: TrendingUp, title: "Predictive Maintenance", titleFa: "نگهداری پیش‌بینی‌کننده", titleAr: "الصيانة التنبؤية", description: "Predict equipment failures before they happen", descriptionFa: "پیش‌بینی خرابی تجهیزات قبل از وقوع", descriptionAr: "التنبؤ بأعطال المعدات قبل حدوثها" }
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">{lang === 'en' ? 'Oil & Gas IoT Solutions' : lang === 'fa' ? 'راهکارهای IoT نفت و گاز' : 'حلول إنترنت الأشياء للنفط والغاز'}</h1>
            <p className="text-xl text-muted-foreground mb-8">{lang === 'en' ? 'Optimize operations, enhance safety, and reduce costs with industrial-grade IoT monitoring for oil and gas infrastructure. Monitor remote assets and prevent costly failures.' : lang === 'fa' ? 'عملیات را بهینه کنید، ایمنی را افزایش دهید و هزینه‌ها را با نظارت IoT درجه صنعتی برای زیرساخت نفت و گاز کاهش دهید. دارایی‌های دور را نظارت کنید و از خرابی‌های پرهزینه جلوگیری کنید.' : 'قم بتحسين العمليات وتعزيز السلامة وخفض التكاليف من خلال مراقبة إنترنت الأشياء الصناعية للبنية التحتية للنفط والغاز. راقب الأصول البعيدة ومنع الأعطال المكلفة.'}</p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild><Link href={localePath(lang, 'request-demo')}>{lang === 'en' ? 'Request Demo' : lang === 'fa' ? 'درخواست دمو' : 'طلب عرض توضيحي'}</Link></Button>
              <Button size="lg" variant="outline" asChild><Link href={localePath(lang, 'request-demo')}>{lang === 'en' ? 'View Case Studies' : lang === 'fa' ? 'مشاهده مطالعات موردی' : 'عرض دراسات الحالة'}</Link></Button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">{lang === 'en' ? 'Industrial-Grade Monitoring' : lang === 'fa' ? 'نظارت درجه صنعتی' : 'المراقبة الصناعية'}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><feature.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{lang === 'en' ? feature.title : lang === 'fa' ? feature.titleFa : feature.titleAr}</h3>
                <p className="text-muted-foreground">{lang === 'en' ? feature.description : lang === 'fa' ? feature.descriptionFa : feature.descriptionAr}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <PredictiveMaintenanceStats />
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">{lang === 'en' ? 'Why Choose Paapeli for Oil & Gas' : lang === 'fa' ? 'چرا پاپلی را برای نفت و گاز انتخاب کنیم' : 'لماذا تختار Paapeli للنفط والغاز'}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6"><h3 className="text-xl font-bold mb-3 text-foreground">{lang === 'en' ? 'Harsh Environment Ready' : lang === 'fa' ? 'آماده برای محیط‌های سخت' : 'جاهز للبيئات القاسية'}</h3><p className="text-muted-foreground">{lang === 'en' ? 'Devices designed to withstand extreme temperatures, vibration, and conditions' : lang === 'fa' ? 'دستگاه‌های طراحی شده برای تحمل دماهای شدید، لرزش و شرایط' : 'أجهزة مصممة لتحمل درجات الحرارة الشديدة والاهتزاز والظروف'}</p></Card>
            <Card className="p-6"><h3 className="text-xl font-bold mb-3 text-foreground">{lang === 'en' ? 'Remote Connectivity' : lang === 'fa' ? 'اتصال از راه دور' : 'الاتصال عن بعد'}</h3><p className="text-muted-foreground">{lang === 'en' ? 'Cellular, satellite, and LoRaWAN options for remote locations' : lang === 'fa' ? 'گزینه‌های سلولی، ماهواره‌ای و LoRaWAN برای مکان‌های دور' : 'خيارات الخلوية والأقمار الصناعية و LoRaWAN للمواقع النائية'}</p></Card>
            <Card className="p-6"><h3 className="text-xl font-bold mb-3 text-foreground">{lang === 'en' ? 'Enterprise Security' : lang === 'fa' ? 'امنیت سازمانی' : 'أمن المؤسسات'}</h3><p className="text-muted-foreground">{lang === 'en' ? 'End-to-end encryption and compliance with industry standards' : lang === 'fa' ? 'رمزگذاری سرتاسری و انطباق با استانداردهای صنعت' : 'التشفير من طرف إلى طرف والامتثال لمعايير الصناعة'}</p></Card>
            <Card className="p-6"><h3 className="text-xl font-bold mb-3 text-foreground">{lang === 'en' ? 'Scalable Architecture' : lang === 'fa' ? 'معماری مقیاس‌پذیر' : 'بنية قابلة للتوسع'}</h3><p className="text-muted-foreground">{lang === 'en' ? 'From pilot projects to enterprise-wide deployments' : lang === 'fa' ? 'از پروژه‌های آزمایشی تا استقرارهای سراسری سازمان' : 'من المشاريع التجريبية إلى النشر على مستوى المؤسسة'}</p></Card>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto p-12 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">{lang === 'en' ? 'Ready to Transform Your Operations?' : lang === 'fa' ? 'آماده برای تحول عملیات خود هستید؟' : 'هل أنت مستعد لتحويل عملياتك؟'}</h2>
            <p className="text-xl text-muted-foreground mb-8">{lang === 'en' ? 'Contact our team to discuss your oil & gas IoT requirements' : lang === 'fa' ? 'با تیم ما تماس بگیرید تا در مورد نیازهای IoT نفت و گاز خود صحبت کنید' : 'اتصل بفريقنا لمناقشة متطلبات إنترنت الأشياء للنفط والغاز'}</p>
            <Button size="lg" asChild><Link href={localePath(lang, 'request-demo')}>{lang === 'en' ? 'Contact Sales' : lang === 'fa' ? 'تماس با فروش' : 'اتصل بالمبيعات'}</Link></Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
