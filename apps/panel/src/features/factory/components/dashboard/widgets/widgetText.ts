import type { WidgetDefinition } from "@paapeli/api";
import type { WidgetLang } from "./types";

/* The widget catalog comes from the gateway in English: names, descriptions
   and the names of each widget's options. This is the panel's wording for the
   ones it knows, in its three languages. Anything not listed here (a widget
   type or an option added on the server later) falls back to what the server
   sent, so a new one is never blank. */

type Text = Record<WidgetLang, string>;

const WIDGETS: Record<string, { name: Text; description: Text }> = {
  kpi: {
    name: { en: "KPI", ar: "مؤشر", fa: "شاخص" },
    description: {
      en: "One current value: a reading, a device count, an alarm count or a formula, with optional threshold colors.",
      ar: "قيمة حالية واحدة: قراءة، عدد أجهزة، عدد إنذارات أو معادلة، مع ألوان حد اختيارية.",
      fa: "یک مقدار فعلی: یک داده، تعداد دستگاه‌ها، تعداد هشدارها یا یک محاسبه، با رنگ آستانه‌ی اختیاری.",
    },
  },
  "timeseries-chart": {
    name: { en: "Line chart", ar: "مخطط خطي", fa: "نمودار خطی" },
    description: {
      en: "One or more telemetry series over time.",
      ar: "سلسلة قياسات واحدة أو أكثر عبر الزمن.",
      fa: "یک یا چند سری تله‌متری در طول زمان.",
    },
  },
  "bar-chart": {
    name: { en: "Bar chart", ar: "مخطط أعمدة", fa: "نمودار میله‌ای" },
    description: {
      en: "One telemetry key, aggregated over the time range or over successive intervals, for one or more devices.",
      ar: "مفتاح قياس واحد مجمّع على النطاق الزمني أو على فترات متتالية، لجهاز واحد أو أكثر.",
      fa: "یک کلید تله‌متری، تجمیع‌شده روی کل بازه یا بازه‌های پی‌درپی، برای یک یا چند دستگاه.",
    },
  },
  "donut-chart": {
    name: { en: "Donut chart", ar: "مخطط حلقي", fa: "نمودار دایره‌ای" },
    description: {
      en: "Device or alarm counts as shares of a whole.",
      ar: "أعداد الأجهزة أو الإنذارات كنسب من الكل.",
      fa: "تعداد دستگاه‌ها یا هشدارها به‌صورت سهم از کل.",
    },
  },
  gauge: {
    name: { en: "Gauge", ar: "عدّاد", fa: "گیج" },
    description: {
      en: "The latest value of one telemetry key on a scale, with optional colored ranges.",
      ar: "أحدث قيمة لمفتاح قياس واحد على مقياس، مع نطاقات ملونة اختيارية.",
      fa: "آخرین مقدار یک کلید تله‌متری روی مقیاس، با بازه‌های رنگی اختیاری.",
    },
  },
  "device-table": {
    name: { en: "Device table", ar: "جدول الأجهزة", fa: "جدول دستگاه‌ها" },
    description: {
      en: "Devices with the latest value, or the most recent readings, of the chosen telemetry keys.",
      ar: "الأجهزة مع أحدث قيمة أو أحدث القراءات لمفاتيح القياس المختارة.",
      fa: "دستگاه‌ها با آخرین مقدار یا آخرین داده‌های کلیدهای تله‌متری انتخاب‌شده.",
    },
  },
  "device-map": {
    name: { en: "Device map", ar: "خريطة الأجهزة", fa: "نقشه دستگاه‌ها" },
    description: {
      en: "Devices at their latest reported position.",
      ar: "الأجهزة في آخر موقع أرسلته.",
      fa: "دستگاه‌ها در آخرین موقعیتی که فرستاده‌اند.",
    },
  },
  "alarm-list": {
    name: { en: "Alarm list", ar: "قائمة الإنذارات", fa: "فهرست هشدارها" },
    description: {
      en: "Current alarms, optionally narrowed by severity and status.",
      ar: "الإنذارات الحالية، مع إمكانية التصفية حسب الشدة والحالة.",
      fa: "هشدارهای فعلی، با امکان فیلتر بر اساس شدت و وضعیت.",
    },
  },
  "process-diagram": {
    name: { en: "Process diagram", ar: "مخطط العملية", fa: "نمودار فرایندی" },
    description: {
      en: "An animated picture of a process, driven by telemetry, with its readings beside it.",
      ar: "صورة متحركة لعملية تقودها القياسات، مع قراءاتها بجانبها.",
      fa: "تصویر متحرک یک فرایند که با تله‌متری کار می‌کند، همراه با مقادیر آن.",
    },
  },
  "level-bar": {
    name: { en: "Level bar", ar: "شريط المستوى", fa: "نوار عمودی" },
    description: {
      en: "The latest value of one telemetry key on a vertical scale, with optional colored ranges.",
      ar: "أحدث قيمة لمفتاح قياس واحد على مقياس رأسي، مع نطاقات ملونة اختيارية.",
      fa: "آخرین مقدار یک کلید تله‌متری روی مقیاس عمودی، با بازه‌های رنگی اختیاری.",
    },
  },
  "status-panel": {
    name: { en: "Status panel", ar: "لوحة الحالة", fa: "پنل وضعیت" },
    description: {
      en: "The on or off state of equipment. Display only: it sends nothing to a device.",
      ar: "حالة تشغيل المعدات أو إيقافها. للعرض فقط: لا يرسل شيئًا إلى الجهاز.",
      fa: "وضعیت روشن یا خاموش تجهیزات. فقط نمایشی است و دستوری به دستگاه نمی‌فرستد.",
    },
  },
};

export const widgetName = (def: Pick<WidgetDefinition, "type" | "name">, lang: WidgetLang): string =>
  WIDGETS[def.type]?.name[lang] ?? def.name;

export const widgetDescription = (def: Pick<WidgetDefinition, "type" | "description">, lang: WidgetLang): string =>
  WIDGETS[def.type]?.description[lang] ?? def.description ?? "";

/* Option names, as the definitions' configuration schemas spell them. */
const OPTIONS: Record<string, Text> = {
  showLegend: { en: "Show legend", ar: "إظهار وسيلة الإيضاح", fa: "نمایش راهنما" },
  yAxis: { en: "Y axis", ar: "المحور الرأسي", fa: "محور عمودی" },
  min: { en: "Min", ar: "الحد الأدنى", fa: "کمینه" },
  max: { en: "Max", ar: "الحد الأقصى", fa: "بیشینه" },
  decimals: { en: "Decimals", ar: "المنازل العشرية", fa: "تعداد اعشار" },
  ranges: { en: "Colored ranges", ar: "النطاقات الملونة", fa: "بازه‌های رنگی" },
  from: { en: "From", ar: "من", fa: "از" },
  to: { en: "To", ar: "إلى", fa: "تا" },
  color: { en: "Color", ar: "اللون", fa: "رنگ" },
  aggregation: { en: "Aggregation", ar: "التجميع", fa: "نوع تجمیع" },
  interval: { en: "Interval", ar: "الفترة", fa: "بازه تجمیع" },
  backgroundColor: { en: "Background color", ar: "لون الخلفية", fa: "رنگ پس‌زمینه" },
  foregroundColor: { en: "Text color", ar: "لون النص", fa: "رنگ متن" },
  threshold: { en: "Threshold (optional)", ar: "الحد (اختياري)", fa: "آستانه (اختیاری)" },
  condition: { en: "Condition", ar: "الشرط", fa: "شرط" },
  value: { en: "Value", ar: "القيمة", fa: "مقدار" },
  readings: { en: "Recent readings per device", ar: "أحدث القراءات لكل جهاز", fa: "تعداد داده‌های اخیر هر دستگاه" },
  showStatus: { en: "Show status", ar: "إظهار الحالة", fa: "نمایش وضعیت" },
  pageSize: { en: "Rows per page", ar: "الصفوف في الصفحة", fa: "تعداد سطر در هر صفحه" },
  sortBy: { en: "Sort by", ar: "ترتيب حسب", fa: "مرتب‌سازی بر اساس" },
  latitudeKey: { en: "Latitude key", ar: "مفتاح خط العرض", fa: "کلید عرض جغرافیایی" },
  longitudeKey: { en: "Longitude key", ar: "مفتاح خط الطول", fa: "کلید طول جغرافیایی" },
  showLabels: { en: "Show device names", ar: "إظهار أسماء الأجهزة", fa: "نمایش نام دستگاه‌ها" },
  showTotal: { en: "Show total", ar: "إظهار الإجمالي", fa: "نمایش مجموع" },
  showDevice: { en: "Show device", ar: "إظهار الجهاز", fa: "نمایش دستگاه" },
  thresholds: { en: "Threshold lines", ar: "خطوط الحد", fa: "خطوط آستانه" },
  label: { en: "Label", ar: "التسمية", fa: "برچسب" },
  scene: { en: "Picture", ar: "الصورة", fa: "تصویر" },
};

/** The label of an option, or undefined when the panel has no wording for it. */
export const optionLabel = (name: string, lang: WidgetLang): string | undefined => OPTIONS[name]?.[lang];

/* The values an option may take, where they are a fixed set. */
const VALUES: Record<string, Text> = {
  MIN: { en: "Minimum", ar: "الأدنى", fa: "کمینه" },
  MAX: { en: "Maximum", ar: "الأقصى", fa: "بیشینه" },
  AVG: { en: "Average", ar: "المتوسط", fa: "میانگین" },
  SUM: { en: "Sum", ar: "المجموع", fa: "جمع" },
  COUNT: { en: "Count", ar: "العدد", fa: "تعداد" },
  above: { en: "Above", ar: "أعلى من", fa: "بیشتر از" },
  below: { en: "Below", ar: "أقل من", fa: "کمتر از" },
  name: { en: "Name", ar: "الاسم", fa: "نام" },
  status: { en: "Status", ar: "الحالة", fa: "وضعیت" },
};

export const optionValueLabel = (value: unknown, lang: WidgetLang): string => VALUES[String(value)]?.[lang] ?? String(value);
