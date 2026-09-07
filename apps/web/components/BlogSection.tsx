"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { blogHref, blogPostHref } from "@/lib/blog-link";
import blogAuthorEric from "@/src/assets/blog-author-eric.jpg";
import blogInotex from "@/src/assets/blog-inotex-2026.jpg";
import blogAiot from "@/src/assets/p-platform-hero.jpg";
import blogOilGas from "@/src/assets/oilgas-refinery.jpg";
import blogSmartHome from "@/src/assets/bld-lobby.jpg";

/* ------------------------------------------------------------------ */
/* Blog section.                                                       */
/*                                                                     */
/* Four real posts from docs.paapeli.com/blog: one featured, then      */
/* three cards. Titles and descriptions are each post's own, in the    */
/* language the reader is in, and every card links to that language's  */
/* copy of the post — a Persian reader gets /fa/blog/<slug>, not the   */
/* English one. The slug is identical in all three locales, so only    */
/* blogPostHref() differs per language.                                */
/*                                                                     */
/* This replaces a Figma placeholder set (UI/UX articles by a "Jese    */
/* Leos" dated 2020) whose four "Read more" buttons all pointed at     */
/* href="#".                                                           */
/*                                                                     */
/* Only the INOTEX post ships a cover image of its own; the other      */
/* three borrow the site photo closest to their subject, picked from   */
/* photos that appear on no other section of this page so the strip    */
/* does not repeat an image the reader has already scrolled past.      */
/* ------------------------------------------------------------------ */

const FEATURED_SLUG = "AIoT-The-New-Generation-of-Intelligent-IoT";
const FEATURED_IMAGE = blogAiot;

const ARTICLE_SLUGS = [
  "The-AIoT-Revolution-in-the-Oil-and-Gas-Industry",
  "paapeli-at-inotex-2026",
  "Smart-Home-Day",
];
const ARTICLE_IMAGES = [blogOilGas, blogInotex, blogSmartHome];

/* Every post on the blog is by the same author, in every language. */
const AUTHOR = { name: "Eric Shams", avatar: blogAuthorEric };

type Article = { title: string; description: string };

type Copy = {
  heading: string;
  subheading: string;
  viewMore: string;
  readMore: string;
  /** Publication date of the featured post, written the way that
      language's blog writes it (the Persian blog dates in Jalali). */
  date: string;
  featured: Article;
  articles: Article[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "Explore insights, real-world use cases, and best practices in AIoT.",
    subheading: "Learn how to turn data into operational value and scale your industrial systems.",
    viewMore: "Read Blog",
    readMore: "Read more",
    date: "November 15, 2025",
    featured: {
      title: "AIoT: The New Generation of Intelligent IoT",
      description: "The world of the Internet of Things has grown rapidly in recent years, but the arrival of Artificial Intelligence has taken it to an entirely new level. Devices are evolving from simple data reporters into active, intelligent decision-makers.",
    },
    articles: [
      { title: "The AIoT Revolution in the Oil and Gas Industry", description: "Integrating the Internet of Things with Artificial Intelligence has created a new path for technological transformation in critical sectors, especially oil and gas." },
      { title: "Paapeli at INOTEX 2026 — Booth 665", description: "Paapeli is taking part in INOTEX 2026, one of the country’s specialist events for innovation and technology, from 2 to 5 September at Pardis Technology Park." },
      { title: "Smart Home Day", description: "Homes are no longer just places to live: they have become intelligent entities that communicate with us, anticipate our needs, and make everyday life simpler." },
    ],
  },
  fa: {
    heading: "بینش‌ها، کاربردهای واقعی و بهترین شیوه‌ها در AIoT را کشف کنید",
    subheading: "یاد بگیرید چطور داده را به ارزش عملیاتی تبدیل کنید و سامانه‌های صنعتی خود را مقیاس دهید",
    viewMore: "بلاگ پاپلی را بخوانید",
    readMore: "ادامهٔ مطلب",
    date: "۲۴ آبان ۱۴۰۴",
    featured: {
      title: "AIoT؛ نسل جدید اینترنت اشیا با موتور هوش مصنوعی",
      description: "دنیای اینترنت اشیا (IoT) در سال‌های اخیر رشد چشمگیری داشته، اما ورود هوش مصنوعی (AI) آن را وارد مرحله‌ای کاملاً تازه کرده است؛ دستگاه‌ها از حالت «گزارش‌دهنده» به حالت «تصمیم‌گیرنده» ارتقا پیدا کرده‌اند",
    },
    articles: [
      { title: "انقلاب AIoT در صنعت نفت و گاز", description: "ترکیب اینترنت اشیا با هوش مصنوعی مسیر تازه‌ای در تحول صنایع کلیدی، به‌ویژه حوزهٔ نفت و گاز، ایجاد کرده است" },
      { title: "پاپِلی در نمایشگاه اینوتکس ۲۰۲۶، غرفه ۶۶۵", description: "پاپِلی در اینوتکس ۲۰۲۶، از رویدادهای تخصصی نوآوری و فناوری کشور، حضور دارد؛ از ۱۱ تا ۱۴ شهریور ۱۴۰۵ در پارک فناوری پردیس" },
      { title: "روز جهانی خانه‌های هوشمند مبارک!", description: "خانه‌ها دیگر فقط محل سکونت نیستند؛ به موجوداتی پویا تبدیل شده‌اند که با ما ارتباط برقرار می‌کنند و نیازهای ما را پیش‌بینی می‌کنند" },
    ],
  },
  ar: {
    heading: "استكشف الرؤى وحالات الاستخدام الواقعية وأفضل الممارسات في AIoT",
    subheading: "تعلّم كيف تحوّل البيانات إلى قيمة تشغيلية وتوسّع أنظمتك الصناعية",
    viewMore: "اقرأ مدونة بابيلي",
    readMore: "اقرأ المزيد",
    date: "15 نوفمبر 2025",
    featured: {
      title: "الذكاء الاصطناعي لإنترنت الأشياء (AIoT)",
      description: "شهد عالم إنترنت الأشياء (IoT) تطورًا كبيرًا خلال السنوات الأخيرة، لكن دخول الذكاء الاصطناعي (AI) نقله إلى مرحلة جديدة تمامًا؛ فقد انتقلت الأجهزة من دور جامعي البيانات إلى صنّاع قرارات حقيقيين",
    },
    articles: [
      { title: "ثورة AIoT في صناعة النفط والغاز", description: "دمج إنترنت الأشياء مع الذكاء الاصطناعي يقدّم مسارًا جديدًا لتطوير الصناعات الحيوية، وخاصة قطاع النفط والغاز" },
      { title: "بابِلي في معرض إينوتكس 2026 — الجناح 665", description: "تشارك بابِلي في معرض إينوتكس 2026، أحد أبرز الفعاليات المتخصصة في الابتكار والتكنولوجيا، من 2 إلى 5 سبتمبر في مجمع بارديس التكنولوجي" },
      { title: "اليوم العالمي للمنازل الذكية", description: "لم تعد المنازل مجرد أماكن للسكن، بل أصبحت كيانات ذكية تتواصل معنا وتتوقّع احتياجاتنا وتجعل حياتنا اليومية أبسط" },
    ],
  },
};
const READ_MORE_BTN =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]";

/* The blog is on the docs host, so these are plain anchors and full
   navigations rather than client-side routes. */
function ReadMoreButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={READ_MORE_BTN}>
      <BookOpen className="size-4" />
      {label}
    </a>
  );
}

function ArticleCard({
  article,
  image,
  href,
  readMore,
}: {
  article: Article;
  image: StaticImageData;
  href: string;
  readMore: string;
}) {
  return (
    <article className="flex flex-1 flex-col items-start gap-6 overflow-hidden">
      <div className="relative h-[208px] w-full overflow-hidden rounded-xl">
        <Image src={image} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full flex-col gap-3">
          <h3 className="text-xl font-semibold text-foreground rtl:text-lg">{article.title}</h3>
          <p className="text-base text-muted-foreground rtl:text-sm">{article.description}</p>
        </div>
        <ReadMoreButton href={href} label={readMore} />
      </div>
    </article>
  );
}

export const BlogSection = () => {
  const { isRTL, language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  /* Each card goes to its own post, in the reader's language; the
     heading's button goes to that language's blog index. */
  const blogIndex = blogHref(language);
  const featuredLink = blogPostHref(language, FEATURED_SLUG);

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center border-y border-[#eef0f3] bg-[#f8fafc] px-6 pb-12 pt-12 sm:pb-16 sm:pt-16"
    >
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-12">
        {/* Heading + View more */}
        <div className="flex w-full flex-col items-start justify-between gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col items-start gap-4">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl rtl:text-2xl rtl:sm:text-3xl">
              {copy.heading}
            </h2>
            <p className="max-w-[731px] text-lg text-muted-foreground rtl:text-base">
              {copy.subheading}
            </p>
          </div>
          <a
            href={blogIndex}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f9fafb]"
          >
            {copy.viewMore}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </a>
        </div>

        {/* Articles */}
        <div className="flex w-full flex-col gap-8">
          {/* Featured (horizontal) */}
          <article className="flex w-full flex-col items-stretch gap-8 overflow-hidden lg:flex-row lg:items-center">
            <div className="relative h-[260px] w-full overflow-hidden rounded-xl lg:h-[264px] lg:w-[320px] lg:shrink-0">
              <Image
                src={FEATURED_IMAGE}
                alt={copy.featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />
            </div>
            <div className="flex w-full flex-col items-start gap-6 lg:max-w-[768px]">
              <div className="flex w-full flex-col items-start gap-4">
                <h3 className="text-3xl font-semibold text-foreground rtl:text-2xl">{copy.featured.title}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={AUTHOR.avatar}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-foreground">{AUTHOR.name}</span>
                  </div>
                  <span className="size-1.5 rounded-full bg-[#d1d5dc]" aria-hidden />
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{copy.date}</span>
                  </div>
                </div>
                <p className="text-base text-muted-foreground rtl:text-sm">{copy.featured.description}</p>
              </div>
              <ReadMoreButton href={featuredLink} label={copy.readMore} />
            </div>
          </article>

          {/* 3-column grid */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.articles.map((article, i) => (
              <ArticleCard
                key={article.title}
                article={article}
                image={ARTICLE_IMAGES[i]}
                href={blogPostHref(language, ARTICLE_SLUGS[i])}
                readMore={copy.readMore}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
