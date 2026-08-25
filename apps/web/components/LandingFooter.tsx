"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import paapeliLogo from "@/src/assets/paapeli-logo.svg";

/* ------------------------------------------------------------------ */
/* Landing footer. Link text matches Figma (typos in the design like   */
/* "ntelligence Hub" / "Platform Statu" corrected here).               */
/* ------------------------------------------------------------------ */

/* One href list per column, in the same order as the labels below. */
const COLUMN_HREFS: string[][] = [
  ["/operations-hub", "/edge-hub", "/intelligence-hub", "/gps-tracking", "/features/ota-updates"],
  ["#", "#", "#", "#"],
  ["#", "#", "#", "#"],
  ["#", "#", "#", "/pricing"],
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
      { title: "Platform", labels: ["Operations Hub", "Edge Hub", "Intelligence Hub", "Tracking Hub", "OTA Updates"] },
      { title: "Developers", labels: ["Documentation", "SDK & APIs", "GitHub", "Platform Status"] },
      { title: "Resources", labels: ["Blog", "Case Studies", "Use Cases", "Contact"] },
      { title: "Company", labels: ["About", "Partners", "Careers", "Pricing"] },
    ],
  },
  fa: {
    about:
      "پاپلی یک پلتفرم صنعتی اینترنت اشیا مبتنی بر هوش مصنوعی است که به سازمان‌ها کمک می‌کند دارایی‌ها را پایش کنند، عملیات را بهینه کنند و از داده‌های خود بینش لحظه‌ای بگیرند",
    rights: (year) => `© ${year} پاپلی. تمامی حقوق محفوظ است.`,
    columns: [
      { title: "پلتفرم", labels: ["هاب عملیات", "هاب لبه", "هاب هوشمندی", "هاب ردیابی", "به‌روزرسانی OTA"] },
      { title: "توسعه‌دهندگان", labels: ["مستندات", "SDK و APIها", "گیت‌هاب", "وضعیت پلتفرم"] },
      { title: "منابع", labels: ["بلاگ", "مطالعات موردی", "کاربردها", "تماس با ما"] },
      { title: "شرکت", labels: ["دربارهٔ ما", "شرکا", "فرصت‌های شغلی", "تعرفه‌ها"] },
    ],
  },
  ar: {
    about:
      "بابيلي منصة إنترنت أشياء صناعية مدعومة بالذكاء الاصطناعي تساعد المؤسسات على مراقبة أصولها وتحسين عملياتها واستخلاص رؤى لحظية من بياناتها",
    rights: (year) => `© ${year} بابيلي. جميع الحقوق محفوظة.`,
    columns: [
      { title: "المنصة", labels: ["مركز العمليات", "مركز الحافة", "مركز الذكاء", "مركز التتبع", "تحديثات OTA"] },
      { title: "المطورون", labels: ["التوثيق", "SDK وواجهات API", "GitHub", "حالة المنصة"] },
      { title: "المصادر", labels: ["المدونة", "دراسات الحالة", "حالات الاستخدام", "اتصل بنا"] },
      { title: "الشركة", labels: ["من نحن", "الشركاء", "الوظائف", "الأسعار"] },
    ],
  },
};
const SOCIALS = [
  { label: "GitHub", href: "#", icon: Github },
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "LinkedIn", href: "#", icon: Linkedin },
];

export const LandingFooter = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const year = new Date().getFullYear();

  /* Prefix internal routes with the active locale; leave "#" links as-is. */
  const localize = (href: string) =>
    href.startsWith("/") ? `/${language}${href === "/" ? "" : href}` : href;

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
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="size-5" />
                </Link>
              ))}
            </div>
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
