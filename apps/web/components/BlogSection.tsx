"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { BRICS_2026_POST, blogHref, blogPostHref } from "@/lib/blog-link";
import blogAuthorEric from "@/src/assets/blog-author-eric.jpg";
import blogBricsGold from "@/src/assets/blog-brics-2026-gold.jpg";
import blogColdChain from "@/src/assets/blog-smart-cold-chain.jpg";
import blogAgentic from "@/src/assets/blog-agentic-industrial-iot.jpg";
import blogInotex from "@/src/assets/blog-inotex-2026.jpg";

/* ------------------------------------------------------------------ */
/* Blog section.                                                       */
/*                                                                     */
/* The four latest posts from docs.paapeli.com/blog: the newest one    */
/* featured, then the next three as cards, newest first. Titles and    */
/* descriptions are each post's own, in the language the reader is in, */
/* and every card links to that language's copy of the post, so a      */
/* Persian reader gets /fa/blog/<slug>, not the English one. The slug  */
/* is identical in all three locales, so only blogPostHref() differs   */
/* per language.                                                       */
/*                                                                     */
/* This replaces a Figma placeholder set (UI/UX articles by a "Jese    */
/* Leos" dated 2020) whose four "Read more" buttons all pointed at     */
/* href="#".                                                           */
/*                                                                     */
/* Every post here carries its own cover image, copied from the post.  */
/* ------------------------------------------------------------------ */

const FEATURED_SLUG = BRICS_2026_POST;
const FEATURED_IMAGE = blogBricsGold;

const ARTICLE_SLUGS = [
  "smart-cold-chain-food-waste-branches",
  "from-dashboards-to-decisions-agentic-ai-industrial-iot",
  "paapeli-at-inotex-2026",
];
const ARTICLE_IMAGES = [blogColdChain, blogAgentic, blogInotex];

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
    subheading: "Learn how to turn data into operational value, from the factory and the farm to the fleet.",
    viewMore: "Read Blog",
    readMore: "Read more",
    date: "November 18, 2026",
    featured: {
      title: "Paapeli Wins Gold in Artificial Intelligence at the 2026 Belt & Road and BRICS Technology Innovation Competition",
      description: "Paapeli secured first place in the Artificial Intelligence category at the international competition in Russia, earning the only gold medal awarded to an Iranian entry across the event's four technology tracks.",
    },
    articles: [
      { title: "How Can a Smart Cold Chain Reduce Food Waste Across Restaurant Branches?", description: "Refrigerator temperature monitoring, power alerts and a clear response workflow turn cold chain monitoring from a paper log into something a multi-branch team can act on." },
      { title: "From Dashboards to Decisions: How Agentic AI Is Changing Industrial IoT", description: "Industrial IoT has made operations visible. Agentic AI could make them responsive, turning live equipment data into recommendations, workflows, and governed action." },
      { title: "Paapeli at INOTEX 2026, Booth 665", description: "Paapeli is taking part in INOTEX 2026, one of the country’s specialist events for innovation and technology, from 2 to 5 September at Pardis Technology Park." },
    ],
  },
  fa: {
    heading: "بینش‌ها، کاربردهای واقعی و بهترین شیوه‌ها در AIoT را کشف کنید",
    subheading: "یاد بگیرید چطور داده را به ارزش عملیاتی تبدیل کنید، از کارخانه و مزرعه تا ناوگان حمل‌ونقل",
    viewMore: "بلاگ پاپلی را بخوانید",
    readMore: "ادامهٔ مطلب",
    date: "۲۷ آبان ۱۴۰۵",
    featured: {
      title: "پاپلی مدال طلای بخش هوش مصنوعی رقابت‌های بین‌المللی نوآوری فناورانه بریکس ۲۰۲۶ را کسب کرد",
      description: "تیم پاپلی با کسب رتبه نخست در بخش هوش مصنوعی رقابت‌های بین‌المللی نوآوری فناورانه بریکس ۲۰۲۶ در روسیه، مدال طلا گرفت؛ تنها طلای نمایندگان ایران در چهار بخش این رقابت",
    },
    articles: [
      { title: "زنجیره سرد هوشمند چگونه از اتلاف مواد غذایی در شعب جلوگیری می‌کند؟", description: "پایش دمای یخچال، هشدار قطعی برق و یک فرایند پاسخ روشن، پایش زنجیره سرد را از یک دفتر ثبت دستی به چیزی تبدیل می‌کند که تیم چندشعبه‌ای می‌تواند بر اساس آن اقدام کند" },
      { title: "از داشبورد تا تصمیم: هوش مصنوعی عامل‌محور چگونه اینترنت اشیای صنعتی را دگرگون می‌کند", description: "اینترنت اشیای صنعتی عملیات را قابل مشاهده کرده است. هوش مصنوعی عامل‌محور می‌تواند آن را پاسخ‌گو کند و داده‌های زنده تجهیزات را به توصیه، گردش کار و اقدام کنترل‌شده تبدیل کند" },
      { title: "پاپِلی در نمایشگاه اینوتکس ۲۰۲۶، غرفه ۶۶۵", description: "پاپِلی در اینوتکس ۲۰۲۶، از رویدادهای تخصصی نوآوری و فناوری کشور، حضور دارد؛ از ۱۱ تا ۱۴ شهریور ۱۴۰۵ در پارک فناوری پردیس" },    ],
  },
  ar: {
    heading: "استكشف الرؤى وحالات الاستخدام الواقعية وأفضل الممارسات في AIoT",
    subheading: "تعلّم كيف تحوّل البيانات إلى قيمة تشغيلية، من المصنع والمزرعة إلى أسطول النقل",
    viewMore: "اقرأ مدونة بابيلي",
    readMore: "اقرأ المزيد",
    date: "18 نوفمبر 2026",
    featured: {
      title: "بابيلي تفوز بالميدالية الذهبية في الذكاء الاصطناعي بمسابقة الحزام والطريق والبريكس للابتكار التكنولوجي 2026",
      description: "حصد فريق بابيلي المركز الأول والميدالية الذهبية في فئة الذكاء الاصطناعي خلال المسابقة الدولية التي أقيمت في روسيا، محققا الميدالية الذهبية الوحيدة لمشاركة إيرانية ضمن المسارات التكنولوجية الأربعة للمسابقة",
    },
    articles: [
      { title: "كيف تساعد سلسلة التبريد الذكية على تقليل هدر الطعام في فروع المطاعم؟", description: "مراقبة حرارة الثلاجات وتنبيهات انقطاع الكهرباء وإجراء استجابة واضح تحوّل مراقبة سلسلة التبريد من سجل ورقي إلى أداة عمل حقيقية لفرق الفروع المتعددة" },
      { title: "من لوحات المعلومات إلى القرارات: كيف يغيّر الذكاء الاصطناعي الوكيل إنترنت الأشياء الصناعي", description: "جعل إنترنت الأشياء الصناعي العمليات مرئية، ويمكن للذكاء الاصطناعي الوكيل أن يجعلها أكثر استجابة عبر تحويل بيانات المعدات الحية إلى توصيات وسير عمل وإجراءات منضبطة" },
      { title: "بابِلي في معرض إينوتكس 2026، الجناح 665", description: "تشارك بابِلي في معرض إينوتكس 2026، أحد أبرز الفعاليات المتخصصة في الابتكار والتكنولوجيا، من 2 إلى 5 سبتمبر في مجمع بارديس التكنولوجي" },    ],
  },
};
const READ_MORE_BTN =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] dark:border-border bg-[#f9fafb] dark:bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6] dark:hover:bg-muted";

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
      className="flex w-full flex-col items-center border-y border-[#eef0f3] dark:border-border bg-[#f8fafc] dark:bg-background px-6 pb-12 pt-12 sm:pb-16 sm:pt-16"
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
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] dark:border-border bg-white dark:bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f9fafb] dark:hover:bg-background"
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
                  <span className="size-1.5 rounded-full bg-[#d1d5dc] dark:bg-muted" aria-hidden />
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
