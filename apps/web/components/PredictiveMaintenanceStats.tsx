'use client';

import { TrendingDown, DollarSign, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { useLanguage } from "@/contexts/LanguageContext";

export const PredictiveMaintenanceStats = () => {
  const { language } = useLanguage();

  const stats = [
    {
      icon: TrendingDown,
      label: language === 'en' ? 'Reduces unplanned downtime' : language === 'fa' ? 'کاهش خرابی‌های برنامه‌ریزی نشده' : 'يقلل من التوقف غير المخطط له',
      prefix: language === 'en' ? 'up to' : language === 'fa' ? 'تا' : 'حتى',
      value: '50%',
      color: 'text-primary'
    },
    {
      icon: DollarSign,
      label: language === 'en' ? 'Reduces maintenance costs' : language === 'fa' ? 'کاهش هزینه‌های نگهداری' : 'يقلل تكاليف الصيانة',
      prefix: language === 'en' ? 'by' : language === 'fa' ? 'به میزان' : 'بنسبة',
      value: '10-40%',
      color: 'text-primary'
    },
    {
      icon: TrendingUp,
      label: language === 'en' ? 'Increases productivity (OEE)' : language === 'fa' ? 'افزایش بهره‌وری (OEE)' : 'يزيد الإنتاجية (OEE)',
      prefix: language === 'en' ? 'by' : language === 'fa' ? 'به میزان' : 'بنسبة',
      value: '15-20%',
      color: 'text-primary'
    }
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Stats */}
          <div className="bg-[#1a2a4a] rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 italic">
              {language === 'en' && 'Predictive maintenance with AIoT'}
              {language === 'fa' && 'نگهداری پیش‌بینی‌کننده با AIoT'}
              {language === 'ar' && 'الصيانة التنبؤية مع AIoT'}
            </h3>

            <div className="space-y-6">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-4 border-t border-white/20 pt-6 first:border-t-0 first:pt-0">
                  <div className="flex-shrink-0">
                    <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80 text-sm md:text-base">{stat.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-sm">{stat.prefix}</p>
                    {/* The figure is the point of the row, so it is set large. */}
                    <p className="!text-5xl md:!text-7xl font-black text-primary leading-none tracking-tight">
                      <CountUp value={stat.value} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - ROI Highlight */}
          <div className="bg-background border-2 border-border rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
              {language === 'en' && 'Approximate return on investment with AI predictive maintenance'}
              {language === 'fa' && 'بازگشت سرمایهٔ تقریبی با نگهداری پیش‌بینانهٔ هوش مصنوعی'}
              {language === 'ar' && 'العائد التقريبي على الاستثمار مع الصيانة التنبؤية بالذكاء الاصطناعي'}
            </h3>

            <p className="!text-8xl md:!text-9xl font-black text-primary mb-4 leading-none tracking-tighter">
              <CountUp value="250% ROI" duration={2000} />
            </p>

            <p className="text-xl md:text-2xl font-semibold text-foreground">
              {language === 'en' && 'Returning over twice the investment'}
              {language === 'fa' && 'بازگشت بیش از دو برابر سرمایه'}
              {language === 'ar' && 'إعادة أكثر من ضعف الاستثمار'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
