"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Mail, Phone, Send, Users } from "lucide-react";
import { toast } from "sonner";

import { LandingFooter } from "@/components/LandingFooter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FEATURE_INDEX,
  INDUSTRY_INDEX,
  featureName,
  industryName,
  type FeatureSlug,
  type IndustrySlug,
} from "@/lib/site-links";

/* ------------------------------------------------------------------ */
/* One page for every "book a demo", "contact sales" and "talk to an   */
/* expert" on the site. Whoever sent the visitor here passes ?from=,   */
/* which shows up as a quiet note on the form rather than as a field   */
/* the visitor has to read past.                                       */
/* ------------------------------------------------------------------ */

/** Contact details, shown on the page and used for the mailto/tel links. */
const EMAIL = "talk@paapeli.com";
const PHONE = "+98 21 5566 1372";

/* Web3Forms delivers the form to our inbox. The access key belongs in the
   page: it only lets a submission through, it reads nothing back. */
const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "131ad66a-900d-4406-ae8b-9d13562a36cc";

/** Source pages that are neither a feature nor an industry. */
const SOURCE_NAMES: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    "aiot-platform": "AIoT Platform",
    "edge-computing": "Edge Computing",
    "ddos-protection": "DDoS Protection",
    "intelligence-insight": "Intelligence Insight",
    "gps-tracking": "Tracking Hub",
    pricing: "Pricing",
    ecosystem: "Ecosystem",
  },
  fa: {
    home: "صفحهٔ اصلی",
    "aiot-platform": "پلتفرم AIoT",
    "edge-computing": "رایانش لبه",
    "ddos-protection": "حفاظت در برابر DDoS",
    "intelligence-insight": "بینش هوشمند",
    "gps-tracking": "هاب ردیابی",
    pricing: "تعرفه‌ها",
    ecosystem: "اکوسیستم",
  },
  ar: {
    home: "الصفحة الرئيسية",
    "aiot-platform": "منصة AIoT",
    "edge-computing": "الحوسبة الطرفية",
    "ddos-protection": "الحماية من DDoS",
    "intelligence-insight": "رؤى ذكية",
    "gps-tracking": "مركز التتبع",
    pricing: "الأسعار",
    ecosystem: "النظام البيئي",
  },
};

type Copy = {
  heroTitle: string;
  heroLead: string;
  formHeading: string;
  from: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  organization: string;
  organizationPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  failure: string;
  enterpriseTitle: string;
  enterpriseBody: string;
  supportTitle: string;
  supportBody: string;
  emailCard: string;
  phoneCard: string;
};

const COPY: Record<string, Copy> = {
  en: {
    heroTitle: "Start a Conversation with Paapeli",
    heroLead:
      "Use this form for contact, demos, partnerships, product questions and industrial projects. Tell us what you need and our team will come back to you.",
    formHeading: "Tell us about your request",
    from: "Coming from",
    name: "Full Name",
    namePlaceholder: "Enter name",
    email: "Email",
    emailPlaceholder: "Enter email",
    phone: "Phone",
    phonePlaceholder: "Enter phone number",
    organization: "Organization",
    organizationPlaceholder: "Enter organization name",
    description: "Project Description",
    descriptionPlaceholder: "Describe your project, request or goals",
    submit: "Submit Request",
    submitting: "Sending",
    success: "Thanks. Your request has been received and our team will be in touch.",
    failure: "That did not go through. Please try again, or email us at " + EMAIL + ".",
    enterpriseTitle: "Enterprise Solutions",
    enterpriseBody: "AIoT architecture for operators, EPC teams and technology partners",
    supportTitle: "Dedicated Support",
    supportBody: "Technical guidance from discovery to deployment",
    emailCard: "Reach us directly",
    phoneCard: "Phone",
  },
  fa: {
    heroTitle: "شروع گفت‌وگو با پاپلی",
    heroLead:
      "برای ارتباط با ما، درخواست دمو، همکاری، پرسش دربارهٔ محصول یا پروژه‌های صنعتی از همین فرم استفاده کنید. بنویسید به چه چیزی نیاز دارید تا تیم ما با شما تماس بگیرد.",
    formHeading: "دربارهٔ درخواستتان بگویید",
    from: "از صفحهٔ",
    name: "نام و نام خانوادگی",
    namePlaceholder: "نام خود را وارد کنید",
    email: "ایمیل",
    emailPlaceholder: "ایمیل را وارد کنید",
    phone: "تلفن",
    phonePlaceholder: "شمارهٔ تماس را وارد کنید",
    organization: "نام سازمان",
    organizationPlaceholder: "نام سازمان را وارد کنید",
    description: "توضیح پروژه",
    descriptionPlaceholder: "پروژه، درخواست یا هدف خود را توضیح دهید",
    submit: "ارسال درخواست",
    submitting: "در حال ارسال",
    success: "ممنون. درخواست شما ثبت شد و تیم ما با شما تماس می‌گیرد.",
    failure: "ارسال نشد. دوباره تلاش کنید یا به " + EMAIL + " ایمیل بزنید.",
    enterpriseTitle: "راهکارهای سازمانی",
    enterpriseBody: "معماری AIoT برای بهره‌برداران، تیم‌های EPC و شرکای فناوری",
    supportTitle: "پشتیبانی اختصاصی",
    supportBody: "راهنمایی فنی از شناخت نیاز تا پیاده‌سازی",
    emailCard: "ارتباط مستقیم",
    phoneCard: "تلفن",
  },
  ar: {
    heroTitle: "ابدأ محادثة مع بابيلي",
    heroLead:
      "استخدم هذا النموذج للتواصل وطلب العروض التوضيحية والشراكات وأسئلة المنتج والمشاريع الصناعية. أخبرنا بما تحتاجه وسيعاود فريقنا التواصل معك.",
    formHeading: "أخبرنا عن طلبك",
    from: "قادم من صفحة",
    name: "الاسم الكامل",
    namePlaceholder: "أدخل الاسم",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل البريد الإلكتروني",
    phone: "الهاتف",
    phonePlaceholder: "أدخل رقم الهاتف",
    organization: "اسم المؤسسة",
    organizationPlaceholder: "أدخل اسم المؤسسة",
    description: "وصف المشروع",
    descriptionPlaceholder: "اوصف مشروعك أو طلبك أو أهدافك",
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال",
    success: "شكرًا لك. وصلنا طلبك وسيتواصل معك فريقنا.",
    failure: "لم يتم الإرسال. حاول مرة أخرى أو راسلنا على " + EMAIL + ".",
    enterpriseTitle: "حلول للمؤسسات",
    enterpriseBody: "معمارية AIoT للمشغّلين وفرق EPC وشركاء التقنية",
    supportTitle: "دعم مخصص",
    supportBody: "إرشاد تقني من الاستكشاف حتى النشر",
    emailCard: "تواصل مباشر",
    phoneCard: "الهاتف",
  },
};

/** Turns a ?from= slug into something a reader recognises, or nothing. */
function sourceLabel(from: string | null, language: string): string | null {
  if (!from) return null;
  if (from in FEATURE_INDEX) return featureName(from as FeatureSlug, language).title;
  if (from in INDUSTRY_INDEX) return industryName(from as IndustrySlug, language);
  const table = SOURCE_NAMES[language] ?? SOURCE_NAMES.en;
  return table[from] ?? null;
}

const EMPTY = { name: "", email: "", phone: "", organization: "", description: "" };

export default function ContactPage() {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [from, setFrom] = useState<string | null>(null);

  /* Read ?from= off the URL rather than with useSearchParams, which would
     force this page behind a Suspense boundary for one small string. */
  useEffect(() => {
    setFrom(new URLSearchParams(window.location.search).get("from"));
  }, []);

  const source = sourceLabel(from, language);
  /* Email and phone read left to right once there is something in them, but
     while empty they should show their placeholder the way the page reads.
     Spelled out rather than left off, because browsers force type="tel" to
     LTR on their own. */
  const pageDir = isRTL ? "rtl" : "ltr";

  const set = (field: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);

    /* Field names are what lands in the email, so they read as labels
       rather than as variable names. */
    const payload = {
      access_key: ACCESS_KEY,
      from_name: "Paapeli Website",
      subject: source
        ? `New request from the Paapeli website (${source})`
        : "New request from the Paapeli website",
      "Full Name": form.name,
      Email: form.email,
      Phone: form.phone,
      Organization: form.organization,
      "Project Description": form.description,
      /* Readable name plus the raw slug, so the mail is legible and still
         sortable whatever language the visitor was browsing in. */
      "Source Page": source && from ? `${source} (${from})` : (from ?? ""),
      Language: language,
      /* Honeypot: a real person never checks a field they cannot see. */
      botcheck: new FormData(event.currentTarget).get("botcheck") ? "true" : "",
    };

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({ success: response.ok }));
      if (!response.ok || !result.success) throw new Error(result.message ?? "submit failed");
      toast.success(copy.success);
      setForm(EMPTY);
    } catch {
      toast.error(copy.failure);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar overlay />

      <main>
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative isolate flex min-h-[52vh] items-center overflow-hidden pt-16">
          <Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#081020]/[0.78]" />

          <div className="container relative z-10 mx-auto px-4 py-16">
            <div className="max-w-3xl">
              <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl">
                {copy.heroTitle}
              </h1>
              <p className="text-lg text-white/80">{copy.heroLead}</p>
            </div>
          </div>
        </section>

        {/* ------------------------------- Form ------------------------------ */}
        <section className="bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <Card className="p-6 md:p-8">
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-bold text-foreground">{copy.formHeading}</h2>
                  {/* Where they came from: context for our team, not a field. */}
                  {source ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {copy.from} {source}
                    </span>
                  ) : null}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="c-name">{copy.name}</Label>
                      <Input
                        id="c-name"
                        value={form.name}
                        onChange={set("name")}
                        placeholder={copy.namePlaceholder}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-email">{copy.email}</Label>
                      <Input
                        id="c-email"
                        type="email"
                        dir={form.email ? "ltr" : pageDir}
                        value={form.email}
                        onChange={set("email")}
                        placeholder={copy.emailPlaceholder}
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="c-phone">{copy.phone}</Label>
                      <Input
                        id="c-phone"
                        type="tel"
                        dir={form.phone ? "ltr" : pageDir}
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder={copy.phonePlaceholder}
                        maxLength={30}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-company">{copy.organization}</Label>
                      <Input
                        id="c-company"
                        value={form.organization}
                        onChange={set("organization")}
                        placeholder={copy.organizationPlaceholder}
                        maxLength={120}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="c-desc">{copy.description}</Label>
                    <Textarea
                      id="c-desc"
                      value={form.description}
                      onChange={set("description")}
                      placeholder={copy.descriptionPlaceholder}
                      maxLength={2000}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Hidden from people, offered to bots. */}
                  <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} aria-hidden />

                  <Button type="submit" size="lg" className="w-full" disabled={sending}>
                    {sending ? copy.submitting : copy.submit}
                    <Send className="h-5 w-5 rtl:-scale-x-100" />
                  </Button>
                </form>
              </Card>

              {/* What we bring */}
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <Building2 className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 text-lg font-bold text-foreground">{copy.enterpriseTitle}</h3>
                  <p className="text-sm text-muted-foreground">{copy.enterpriseBody}</p>
                </Card>
                <Card className="p-6">
                  <Users className="mb-3 h-8 w-8 text-secondary" />
                  <h3 className="mb-2 text-lg font-bold text-foreground">{copy.supportTitle}</h3>
                  <p className="text-sm text-muted-foreground">{copy.supportBody}</p>
                </Card>
              </div>

              {/* Straight lines to the team */}
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <Card className="flex items-center gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{copy.emailCard}</p>
                    <a
                      href={`mailto:${EMAIL}`}
                      dir="ltr"
                      className="block truncate text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {EMAIL}
                    </a>
                  </div>
                </Card>
                <Card className="flex items-center gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <Phone className="h-5 w-5 text-secondary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{copy.phoneCard}</p>
                    <a
                      href={`tel:${PHONE.replace(/\s/g, "")}`}
                      dir="ltr"
                      className="block truncate text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {PHONE}
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
