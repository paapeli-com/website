import { useState } from "react";
import { Check, Plus, Sprout } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { useWorkOrderTemplates } from "@/features/factory/hooks/useWorkOrderTasks";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { useGreenhouseText } from "./i18n";

/* Ready-made work order templates for a greenhouse: the rounds a grower
   repeats. Adding one makes an ordinary template of the workspace through
   the work-order API, in the reader's language, which they can then change
   or delete like any other. Nothing is added unasked. */

type Lang = "en" | "fa" | "ar";
interface Ready {
  key: string;
  name: Record<Lang, string>;
  tasks: { title: Record<Lang, string>; required?: boolean }[];
}

const READY: Ready[] = [
  {
    key: "irrigation",
    name: { en: "Irrigation check", fa: "بازدید آبیاری", ar: "فحص الري" },
    tasks: [
      { title: { en: "Check drippers for blockage", fa: "بررسی گرفتگی قطره‌چکان‌ها", ar: "فحص انسداد النقاطات" } },
      { title: { en: "Check substrate moisture in three spots", fa: "بررسی رطوبت بستر در سه نقطه", ar: "فحص رطوبة الركيزة في ثلاث نقاط" } },
      { title: { en: "Measure drain volume and EC", fa: "اندازه‌گیری حجم و EC زه‌آب", ar: "قياس حجم الصرف وEC" } },
      { title: { en: "Record irrigation run times", fa: "ثبت زمان‌های آبیاری", ar: "تسجيل أوقات الري" }, required: false },
    ],
  },
  {
    key: "scouting",
    name: { en: "Pest and disease scouting", fa: "پایش آفات و بیماری", ar: "رصد الآفات والأمراض" },
    tasks: [
      { title: { en: "Inspect yellow sticky traps", fa: "بررسی کارت‌های زرد چسبنده", ar: "فحص المصائد اللاصقة الصفراء" } },
      { title: { en: "Check leaf undersides for whitefly, thrips and mites", fa: "بررسی پشت برگ برای سفیدبالک، تریپس و کنه", ar: "فحص أسفل الأوراق بحثًا عن الذبابة البيضاء والتربس والعناكب" } },
      { title: { en: "Look for mildew and leaf spots", fa: "بررسی سفیدک و لکه‌برگی", ar: "البحث عن البياض وتبقع الأوراق" } },
      { title: { en: "Photograph and record findings", fa: "عکس و ثبت مشاهدات", ar: "تصوير وتسجيل الملاحظات" }, required: false },
    ],
  },
  {
    key: "climate",
    name: { en: "Climate check", fa: "بازدید اقلیم گلخانه", ar: "فحص المناخ" },
    tasks: [
      { title: { en: "Check vents and fans work", fa: "بررسی کارکرد دریچه‌ها و فن‌ها", ar: "التحقق من عمل الفتحات والمراوح" } },
      { title: { en: "Check heating and cooling set points", fa: "بررسی تنظیمات گرمایش و سرمایش", ar: "التحقق من إعدادات التدفئة والتبريد" } },
      { title: { en: "Check the shade screen", fa: "بررسی پرده سایه‌انداز", ar: "فحص ستارة التظليل" } },
      { title: { en: "Compare a sensor with a handheld meter", fa: "مقایسه یک حسگر با دستگاه دستی", ar: "مقارنة مستشعر بجهاز قياس يدوي" }, required: false },
    ],
  },
  {
    key: "nutrients",
    name: { en: "Nutrient solution check", fa: "بررسی محلول غذایی", ar: "فحص المحلول المغذي" },
    tasks: [
      { title: { en: "Measure EC", fa: "اندازه‌گیری EC", ar: "قياس EC" } },
      { title: { en: "Measure pH", fa: "اندازه‌گیری pH", ar: "قياس pH" } },
      { title: { en: "Top up the stock tanks", fa: "پر کردن مخازن محلول", ar: "تعبئة خزانات المحلول" } },
      { title: { en: "Calibrate the EC and pH probes", fa: "کالیبره کردن پراب‌های EC و pH", ar: "معايرة مجسات EC وpH" }, required: false },
    ],
  },
  {
    key: "harvest",
    name: { en: "Harvest round", fa: "نوبت برداشت", ar: "جولة الحصاد" },
    tasks: [
      { title: { en: "Pick the ripe fruit", fa: "چیدن محصول رسیده", ar: "قطف الثمار الناضجة" } },
      { title: { en: "Weigh and record the harvest", fa: "وزن کردن و ثبت برداشت", ar: "وزن الحصاد وتسجيله" } },
      { title: { en: "Remove damaged fruit", fa: "جدا کردن میوه‌های آسیب‌دیده", ar: "إزالة الثمار التالفة" } },
      { title: { en: "Clean the crates", fa: "تمیز کردن جعبه‌ها", ar: "تنظيف الصناديق" }, required: false },
    ],
  },
  {
    key: "sensors",
    name: { en: "Sensor maintenance", fa: "نگهداری حسگرها", ar: "صيانة المستشعرات" },
    tasks: [
      { title: { en: "Clean the sensor housings", fa: "تمیز کردن محفظه حسگرها", ar: "تنظيف أغلفة المستشعرات" } },
      { title: { en: "Check batteries and power", fa: "بررسی باتری و برق", ar: "فحص البطاريات والتغذية" } },
      { title: { en: "Check the gateway is connected", fa: "بررسی اتصال گیت‌وی", ar: "التحقق من اتصال البوابة" } },
      { title: { en: "Check readings look right", fa: "بررسی درستی داده‌ها", ar: "التحقق من صحة القراءات" }, required: false },
    ],
  },
];

const TEXT: Record<Lang, { title: string; add: string; added: string; addAll: string }> = {
  en: { title: "Ready-made for greenhouses", add: "Add", added: "Added", addAll: "Add all" },
  fa: { title: "قالب‌های آماده گلخانه", add: "افزودن", added: "اضافه شد", addAll: "افزودن همه" },
  ar: { title: "قوالب جاهزة للدفيئات", add: "إضافة", added: "مضاف", addAll: "إضافة الكل" },
};

/** The ready-made templates, each added with one click; one already added (by name) shows as added. */
export function GreenhouseTemplateSuggestions() {
  const { language } = useGreenhouseText();
  const { templates, save } = useWorkOrderTemplates();
  const [busy, setBusy] = useState(false);
  const names = new Set(templates.map((t) => t.name.trim()));
  const text = TEXT[language];
  const missing = READY.filter((r) => !names.has(r.name[language]));

  const add = async (items: Ready[]) => {
    setBusy(true);
    try {
      for (const r of items) {
        await save({
          name: r.name[language],
          tasks: r.tasks.map((task) => ({ title: task.title[language], required: task.required ?? true })),
        });
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, text.add));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900 dark:bg-emerald-950/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Sprout className="h-4 w-4 text-emerald-600" /> {text.title}
        </span>
        {missing.length > 1 && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => add(missing)}>
            {text.addAll}
          </Button>
        )}
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {READY.map((r) => {
          const added = names.has(r.name[language]);
          return (
            <li key={r.key} className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5 text-sm">
              <span className="truncate">{r.name[language]}</span>
              {added ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> {text.added}
                </span>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 shrink-0 gap-1 px-2 text-xs text-primary" disabled={busy} onClick={() => add([r])}>
                  <Plus className="h-3.5 w-3.5" /> {text.add}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
