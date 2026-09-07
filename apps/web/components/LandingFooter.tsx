"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { BLOG_URL, localizeDocsUrl } from "@/lib/blog-link";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";
import { localePath } from "@/lib/seo";

/* ------------------------------------------------------------------ */
/* Landing footer. Link text matches Figma (typos in the design like   */
/* "ntelligence Hub" / "Platform Statu" corrected here).               */
/* ------------------------------------------------------------------ */

/* One href list per column, in the same order as the labels below.
   Docs, the SDK reference, GitHub and the blog live off-site.

   This is the only place on the site that links every page from every
   page, so it doubles as the crawl path. Both navbars build their menus
   in the browser, on hover or on tap, which means none of those links
   reach the served HTML: without the footer, a page that no other page
   mentions in its body is reachable only through the sitemap, and Google
   reads it, shrugs, and files it under "crawled, currently not indexed".
   Nine pages were in exactly that state.

   Every entry points at a page that exists. The four "#" placeholders
   that used to sit here (About, Partners, Careers, Platform Status) were
   dead ends for readers and gave the crawler nothing. */
const COLUMN_HREFS: string[][] = [
  [
    "/aiot-platform",
    "/operations-hub",
    "/edge-hub",
    "/intelligence-hub",
    "/infrastructure-hub",
    "/gps-tracking",
  ],
  [
    "/smart-manufacturing",
    "/smart-cities",
    "/smart-buildings",
    "/smart-agriculture",
    "/oil-gas",
    "/energy-monitoring",
  ],
  [
    "https://docs.paapeli.com/",
    "https://docs.paapeli.com/docs/category/sdks",
    "https://github.com/paapeli-com",
    "/makers-developers",
    "/status",
  ],
  [BLOG_URL, "/AI-Readiness-Assessment", "/pricing", "/request-demo", "/inotex-2026", "/contact"],
];

type Copy = {
  about: string;
  rights: (year: number) => string;
  columns: { title: string; labels: string[] }[];
};

const COPY: Record<string, Copy> = {
  en: {
    about:
      "Paapeli is an AI-powered industrial IoT platform that helps organizations monitor assets, optimize operations, and unlock real-time insights from their data.",
    rights: (year) => `© ${year} Paapeli, Inc. All rights reserved.`,
    columns: [
      { title: "Platform", labels: ["AIoT Platform", "Operations Hub", "Edge Hub", "Intelligence Hub", "Infrastructure Hub", "Tracking Hub"] },
      { title: "Solutions", labels: ["Smart Manufacturing", "Smart Cities", "Smart Buildings", "Smart Agriculture", "Oil & Gas", "Energy Monitoring"] },
      { title: "Developers", labels: ["Documentation", "SDKs", "GitHub", "Makers & Developers", "Platform Status"] },
      { title: "Resources", labels: ["Blog", "AI Readiness Assessment", "Pricing", "Request a Demo", "INOTEX 2026", "Contact"] },
    ],
  },
  fa: {
    about:
      "پاپلی یک پلتفرم صنعتی اینترنت اشیا مبتنی بر هوش مصنوعی است که به سازمان‌ها کمک می‌کند دارایی‌ها را پایش کنند، عملیات را بهینه کنند و از داده‌های خود بینش لحظه‌ای بگیرند",
    rights: (year) => `© ${year} پاپلی. تمامی حقوق محفوظ است.`,
    columns: [
      { title: "پلتفرم", labels: ["پلتفرم AIoT", "هاب عملیات", "هاب لبه", "هاب هوشمندی", "هاب زیرساخت", "هاب ردیابی"] },
      { title: "راهکارها", labels: ["تولید هوشمند", "شهرهای هوشمند", "ساختمان‌های هوشمند", "کشاورزی هوشمند", "نفت و گاز", "پایش انرژی"] },
      { title: "توسعه‌دهندگان", labels: ["مستندات", "SDK ها", "گیت‌هاب", "سازندگان و توسعه‌دهندگان", "وضعیت پلتفرم"] },
      { title: "منابع", labels: ["بلاگ", "ارزیابی آمادگی هوش مصنوعی", "تعرفه‌ها", "درخواست دمو", "اینوتکس ۲۰۲۶", "تماس با ما"] },
    ],
  },
  ar: {
    about:
      "بابيلي منصة إنترنت أشياء صناعية مدعومة بالذكاء الاصطناعي تساعد المؤسسات على مراقبة أصولها وتحسين عملياتها واستخلاص رؤى لحظية من بياناتها",
    rights: (year) => `© ${year} بابيلي. جميع الحقوق محفوظة.`,
    columns: [
      { title: "المنصة", labels: ["منصة AIoT", "مركز العمليات", "مركز الحافة", "مركز الذكاء", "مركز البنية التحتية", "مركز التتبع"] },
      { title: "الحلول", labels: ["التصنيع الذكي", "المدن الذكية", "المباني الذكية", "الزراعة الذكية", "النفط والغاز", "مراقبة الطاقة"] },
      { title: "المطورون", labels: ["التوثيق", "حِزم SDK", "GitHub", "الصناع والمطورون", "حالة المنصة"] },
      { title: "المصادر", labels: ["المدونة", "تقييم الجاهزية للذكاء الاصطناعي", "الأسعار", "اطلب عرضاً توضيحياً", "إينوتكس 2026", "اتصل بنا"] },
    ],
  },
};
const SOCIALS = [
  { label: "GitHub", href: "https://github.com/paapeli-com", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/paapeli/", icon: Linkedin },
];

/* ------------------------------------------------------------------ */
/* The e-Namad trust seal.                                             */
/*                                                                     */
/* e-Namad issues this markup per site and checks that the page serves
   it unaltered, so it is injected exactly as they gave it rather than
   transcribed into JSX: the id and the code appear in both the link and
   the image, and their crawler matches on them. Do not reformat it, do
   not add attributes to it, and do not size the image from the inside.

   It is a constant in this file, never anything a visitor supplies, so
   there is nothing here for dangerouslySetInnerHTML to be dangerous
   with. Its wrapper scales it down from the outside instead, because
   the seal ships at a size that would tower over the footer column.  */
/* ------------------------------------------------------------------ */
const ENAMAD_SEAL =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7625246&Code=DkFd7cma8GcgSc8O9bPaq4RlrWrCX0Ls'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7625246&Code=DkFd7cma8GcgSc8O9bPaq4RlrWrCX0Ls' alt='' style='cursor:pointer' code='DkFd7cma8GcgSc8O9bPaq4RlrWrCX0Ls'></a>";

export const LandingFooter = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const year = new Date().getFullYear();

  /* Prefix internal routes with the active locale. Documentation, the
     SDK reference and the blog are off-site, but the docs host carries a
     locale prefix of its own, so they follow the language the visitor is
     reading in too. */
  const localize = (href: string) =>
    href.startsWith("/") ? localePath(language, href) : localizeDocsUrl(language, href);

  return (
    <footer dir={isRTL ? "rtl" : "ltr"} className="flex w-full flex-col items-center bg-white">
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-12 px-6 pb-8 pt-16">
        {/* Top content */}
        <div className="flex w-full flex-col items-start gap-12 lg:flex-row lg:gap-24">
          {/* Logo, description, socials */}
          <div className="flex w-full max-w-[384px] flex-col items-start gap-6 lg:shrink-0">
            <Link href={localize("/")} className="flex items-center gap-1.5">
              <Image src={paapeliLogo} alt="Paapeli" width={30} height={30} />
              <span className="font-poppins text-xl font-semibold text-foreground">Paapeli</span>
            </Link>
            <p className="text-base text-muted-foreground rtl:text-sm">{copy.about}</p>
            <div className="flex items-center gap-4">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="size-5" />
                </Link>
              ))}
            </div>

            {/* e-Namad certifies the business to Iranian visitors, so it
                belongs on the Persian footer and nowhere else. The
                height is set here, on the outside; width follows it so
                the seal keeps its own proportions whatever size
                e-Namad serves it at. */}
            {language === "fa" && (
              <div
                className="[&_img]:h-[88px] [&_img]:w-auto"
                dangerouslySetInnerHTML={{ __html: ENAMAD_SEAL }}
              />
            )}
          </div>

          {/* Nav columns */}
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:flex-1 lg:justify-between">
            {copy.columns.map((col, ci) => (
              <div key={col.title} className="flex w-full max-w-[176px] flex-col items-start gap-5">
                <h3 className="w-full text-base font-medium text-foreground rtl:text-sm">{col.title}</h3>
                <ul className="flex w-full flex-col items-start gap-4">
                  {col.labels.map((label, li) => (
                    <li key={label}>
                      <Link
                        href={localize(COLUMN_HREFS[ci][li])}
                        target={COLUMN_HREFS[ci][li].startsWith("http") ? "_blank" : undefined}
                        rel={COLUMN_HREFS[ci][li].startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-base text-muted-foreground transition-colors hover:text-foreground rtl:text-sm"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="flex w-full flex-col items-start border-t border-[#f3f4f6] pt-8">
          <p className="w-full text-center text-base text-muted-foreground rtl:text-sm">
            {copy.rights(year)}
          </p>
        </div>
      </div>
    </footer>
  );
};
