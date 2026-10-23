import { useAppLanguage } from "@/shared/i18n/appLanguage";

/* The White Label page's own copy, kept beside it rather than in the shell's
   table, for the same reason Members keeps its own: the wording is all this
   page's and there is a lot of it. Same shape as members/dictionary.ts. */

export type Lang = "en" | "ar" | "fa";

export const D: Record<string, Record<Lang, string>> = {
  // Page chrome
  whiteLabel: { en: "White Label", ar: "العلامة التجارية الخاصة", fa: "برند اختصاصی" },
  subAppearance: {
    en: "Your customers see this panel as your own product",
    ar: "يرى عملاؤك هذه اللوحة كأنها منتجك",
    fa: "مشتریان شما این پنل را محصول خودتان می‌بینند",
  },
  subDomain: {
    en: "Your own panel and mail domain instead of paapeli.com",
    ar: "نطاق لوحتك وبريدك بدلاً من paapeli.com",
    fa: "دامنهٔ پنل و ایمیل خودتان به جای paapeli.com",
  },
  subMessages: {
    en: "Wording your customers receive from the platform",
    ar: "الصياغة التي يتلقاها عملاؤك من المنصة",
    fa: "متنی که مشتریان شما از سامانه دریافت می‌کنند",
  },
  sendTest: { en: "Send test", ar: "إرسال اختبار", fa: "ارسال تست" },
  saveChanges: { en: "Save changes", ar: "حفظ التغييرات", fa: "ذخیرهٔ تغییرات" },
  comingSoon: { en: "Coming soon", ar: "قريبًا", fa: "به‌زودی" },
  comingSoonDesc: { en: "Coming soon.", ar: "قريبًا.", fa: "به‌زودی." },
  optional: { en: "Optional", ar: "اختياري", fa: "اختیاری" },
  replaceLogo: { en: "Replace", ar: "استبدال", fa: "جایگزینی" },
  removeLogo: { en: "Remove", ar: "إزالة", fa: "حذف" },
  logoTooLarge: { en: "The logo must be 2 MB or smaller.", ar: "يجب ألا يتجاوز حجم الشعار ٢ ميغابايت.", fa: "حجم لوگو باید حداکثر ۲ مگابایت باشد." },
  backendNote: {
    en: "White label has no endpoint yet, so nothing on this page is stored and the tables report no data. The layout is settled; each field is wired the moment the API lands.",
    ar: "العلامة التجارية الخاصة لا تملك خدمة بعد، لذلك لا يُحفظ أي شيء في هذه الصفحة وتعرض الجداول لا توجد بيانات. التصميم نهائي، وسيُربط كل حقل فور توفر الواجهة البرمجية.",
    fa: "برند اختصاصی هنوز اندپوینتی ندارد، بنابراین هیچ‌چیز در این صفحه ذخیره نمی‌شود و جدول‌ها «فاقد دیتا» نشان می‌دهند. طراحی نهایی است و به محض آماده شدن API هر فیلد وصل می‌شود.",
  },

  // Tabs
  tabAppearance: { en: "Appearance", ar: "المظهر", fa: "ظاهر" },
  tabDomain: { en: "Custom Domain", ar: "نطاق مخصص", fa: "دامنهٔ اختصاصی" },
  tabMessages: { en: "Messages", ar: "الرسائل", fa: "پیام‌ها" },

  // Appearance
  panelLogo: { en: "Panel logo", ar: "شعار اللوحة", fa: "لوگوی پنل" },
  logoHint: {
    en: "SVG or PNG, at least 120 × 40",
    ar: "SVG أو PNG، بحد أدنى 120 × 40",
    fa: "SVG یا PNG، دست‌کم ۱۲۰ × ۴۰",
  },
  primaryColour: { en: "Primary colour", ar: "اللون الأساسي", fa: "رنگ اصلی" },
  productName: {
    en: "Product name shown to customers",
    ar: "اسم المنتج الظاهر للعملاء",
    fa: "نام محصول که به مشتریان نشان داده می‌شود",
  },
  productNamePh: { en: "Your product name", ar: "اسم منتجك", fa: "نام محصول شما" },
  productNameHint: {
    en: "Replaces Paapeli in the panel, emails and SMS",
    ar: "يحل محل Paapeli في اللوحة والبريد والرسائل",
    fa: "به جای Paapeli در پنل، ایمیل‌ها و پیامک‌ها می‌نشیند",
  },
  preview: { en: "Preview", ar: "معاينة", fa: "پیش‌نمایش" },
  previewAction: { en: "Primary action", ar: "إجراء أساسي", fa: "اقدام اصلی" },

  // Custom domain
  panelDomain: { en: "Panel domain", ar: "نطاق اللوحة", fa: "دامنهٔ پنل" },
  panelDomainHint: {
    en: "Customers sign in here instead of panel.paapeli.com",
    ar: "يسجل العملاء الدخول من هنا بدلاً من panel.paapeli.com",
    fa: "مشتریان به جای panel.paapeli.com از این نشانی وارد می‌شوند",
  },
  mailDomain: { en: "Mail domain", ar: "نطاق البريد", fa: "دامنهٔ ایمیل" },
  mailDomainHint: {
    en: "Used as the sender domain for invitations and alerts",
    ar: "يُستخدم كنطاق المرسل للدعوات والتنبيهات",
    fa: "به عنوان دامنهٔ فرستنده برای دعوت‌نامه‌ها و هشدارها به کار می‌رود",
  },
  dnsRecords: { en: "DNS records", ar: "سجلات DNS", fa: "رکوردهای DNS" },
  colType: { en: "Type", ar: "النوع", fa: "نوع" },
  colHost: { en: "Host", ar: "المضيف", fa: "میزبان" },
  colValue: { en: "Value", ar: "القيمة", fa: "مقدار" },
  colStatus: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  noRecords: { en: "No records yet", ar: "لا توجد سجلات بعد", fa: "هنوز رکوردی نیست" },
  noRecordsDesc: {
    en: "Add a domain and the records to create at your DNS provider appear here.",
    ar: "أضف نطاقًا لتظهر هنا السجلات التي ينبغي إنشاؤها لدى مزود DNS.",
    fa: "دامنه‌ای اضافه کنید تا رکوردهایی که باید نزد ارائه‌دهندهٔ DNS بسازید اینجا نشان داده شوند.",
  },

  // Messages
  smsSender: { en: "SMS sender name", ar: "اسم مرسل الرسائل", fa: "نام فرستندهٔ پیامک" },
  smsSenderHint: { en: "Up to 11 characters", ar: "حتى 11 حرفًا", fa: "حداکثر ۱۱ نویسه" },
  emailFrom: { en: "Email sender name", ar: "اسم مرسل البريد", fa: "نام فرستندهٔ ایمیل" },
  emailFromHint: {
    en: "Shown as the sender in every email",
    ar: "يظهر كمرسل في كل بريد",
    fa: "در همهٔ ایمیل‌ها به عنوان فرستنده دیده می‌شود",
  },
  replyTo: { en: "Reply address", ar: "عنوان الرد", fa: "نشانی پاسخ" },
  replyToHint: {
    en: "Replies from customers land here",
    ar: "ترد رسائل العملاء هنا",
    fa: "پاسخ مشتریان به این نشانی می‌رسد",
  },
  supportLink: { en: "Support link", ar: "رابط الدعم", fa: "لینک پشتیبانی" },
  supportLinkHint: {
    en: "Added to the footer of every message",
    ar: "يُضاف إلى تذييل كل رسالة",
    fa: "به پاورقی همهٔ پیام‌ها افزوده می‌شود",
  },
  availableVariables: { en: "Available variables", ar: "المتغيرات المتاحة", fa: "متغیرهای در دسترس" },
  templates: { en: "Message templates", ar: "قوالب الرسائل", fa: "قالب‌های پیام" },
  searchTemplates: { en: "Search in templates", ar: "البحث في القوالب", fa: "جستجو در قالب‌ها" },
  colTemplate: { en: "Template", ar: "القالب", fa: "قالب" },
  colChannel: { en: "Channel", ar: "القناة", fa: "کانال" },
  colSubject: { en: "Subject or text", ar: "الموضوع أو النص", fa: "موضوع یا متن" },
  colActions: { en: "Actions", ar: "إجراءات", fa: "اقدامات" },
  filterState: { en: "State", ar: "الحالة", fa: "وضعیت" },
  optAll: { en: "All", ar: "الكل", fa: "همه" },
  channelEmail: { en: "Email", ar: "البريد الإلكتروني", fa: "ایمیل" },
  channelSms: { en: "SMS", ar: "رسالة نصية", fa: "پیامک" },
  stateDefault: { en: "Default", ar: "افتراضي", fa: "پیش‌فرض" },
  stateCustomized: { en: "Customized", ar: "مخصص", fa: "سفارشی‌شده" },
  sortNameAsc: { en: "Name A to Z", ar: "الاسم أ إلى ي", fa: "نام، الف تا ی" },
  actionExport: { en: "Export CSV", ar: "تصدير CSV", fa: "خروجی CSV" },
  noTemplates: { en: "No templates yet", ar: "لا توجد قوالب بعد", fa: "هنوز قالبی نیست" },
  noTemplatesDesc: {
    en: "Templates appear here once white label is available on your plan.",
    ar: "تظهر القوالب هنا بمجرد توفر العلامة التجارية الخاصة في خطتك.",
    fa: "قالب‌ها به محض فعال شدن برند اختصاصی روی پلن شما اینجا دیده می‌شوند.",
  },
};

/** The page's own translator, over the dictionary above. */
export function useTr() {
  const language = useAppLanguage() as Lang;
  return (key: string) => {
    const row = D[key];
    return row ? row[language] ?? row.en : key;
  };
}
