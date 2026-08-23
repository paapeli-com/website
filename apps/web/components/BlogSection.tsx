"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import blogFeatured from "@/src/assets/blog-featured.jpg";
import blogAvatar from "@/src/assets/blog-avatar.jpg";
import blog1 from "@/src/assets/blog-1.jpg";
import blog2 from "@/src/assets/blog-2.jpg";
import blog3 from "@/src/assets/blog-3.jpg";

/* ------------------------------------------------------------------ */
/* Blog section. Copy below the featured article is from a Figma       */
/* template (UI/UX-themed); swap for real Paapeli articles later.      */
/* ------------------------------------------------------------------ */

const FEATURED_IMAGE = blogFeatured;
const ARTICLE_IMAGES = [blog1, blog2, blog3];
const AUTHOR = { name: "Jese Leos", avatar: blogAvatar };
const ARTICLE_HREFS = ["#", "#", "#"];
const FEATURED_HREF = "#";

type Article = { title: string; description: string };

type Copy = {
  heading: string;
  subheading: string;
  viewMore: string;
  readMore: string;
  date: string;
  featured: Article;
  articles: Article[];
};

const COPY: Record<string, Copy> = {
  en: {
    heading: "Explore insights, real-world use cases, and best practices in AIoT.",
    subheading: "Learn how to turn data into operational value and scale your industrial systems.",
    viewMore: "View more",
    readMore: "Read more",
    date: "March 26, 2020",
    featured: {
      title: "Paapeli unveils updated logo & brand guidelines website",
      description: "A digital home for all our brand guidelines, serving as both a super-functional resource and a celebration of our Design team’s creativity, craft, and commitment to pushing boundaries.",
    },
    articles: [
      { title: "The difference between UI & UX and best practices", description: "Understanding the difference between UI and UX is crucial for creating effective & modern digital products." },
      { title: "Top web development trends to watch in 2025", description: "Web development is constantly evolving, with new technologies shaping the future of the industry." },
      { title: "How to design intuitive navigation for better UX", description: "A well-structured navigation system helps users find what they need quickly and easily, reducing frustration." },
    ],
  },
  fa: {
    heading: "بینش‌ها، کاربردهای واقعی و بهترین شیوه‌ها در AIoT را کشف کنید",
    subheading: "یاد بگیرید چطور داده را به ارزش عملیاتی تبدیل کنید و سامانه‌های صنعتی خود را مقیاس دهید",
    viewMore: "موارد بیشتر",
    readMore: "ادامهٔ مطلب",
    date: "۲۶ مارس ۲۰۲۰",
    featured: {
      title: "پاپلی از لوگوی به‌روزشده و وب‌سایت راهنمای برند رونمایی کرد",
      description: "خانه‌ای دیجیتال برای همهٔ راهنماهای برند ما؛ هم یک منبع کاملاً کاربردی و هم جشنی برای خلاقیت، مهارت و جسارت تیم طراحی",
    },
    articles: [
      { title: "تفاوت UI و UX و بهترین شیوه‌ها", description: "درک تفاوت UI و UX برای ساخت محصولات دیجیتال مؤثر و مدرن ضروری است" },
      { title: "مهم‌ترین روندهای توسعهٔ وب در ۲۰۲۵", description: "توسعهٔ وب پیوسته در حال تحول است و فناوری‌های تازه آیندهٔ این صنعت را شکل می‌دهند" },
      { title: "چگونه ناوبری شهودی برای تجربهٔ کاربری بهتر طراحی کنیم", description: "ساختار ناوبری خوب کمک می‌کند کاربران سریع و آسان آنچه را می‌خواهند پیدا کنند" },
    ],
  },
  ar: {
    heading: "استكشف الرؤى وحالات الاستخدام الواقعية وأفضل الممارسات في AIoT",
    subheading: "تعلّم كيف تحوّل البيانات إلى قيمة تشغيلية وتوسّع أنظمتك الصناعية",
    viewMore: "عرض المزيد",
    readMore: "اقرأ المزيد",
    date: "26 مارس 2020",
    featured: {
      title: "بابيلي تكشف عن شعار محدّث وموقع لإرشادات الهوية",
      description: "بيت رقمي لكل إرشادات هويتنا؛ مورد عملي بالكامل واحتفاء بإبداع فريق التصميم وحرفيته وجرأته",
    },
    articles: [
      { title: "الفرق بين UI وUX وأفضل الممارسات", description: "فهم الفرق بين UI وUX ضروري لبناء منتجات رقمية فعّالة وحديثة" },
      { title: "أبرز اتجاهات تطوير الويب في 2025", description: "تطوير الويب يتطور باستمرار، وتقنيات جديدة تشكّل مستقبل هذا المجال" },
      { title: "كيف تصمم تنقلًا بديهيًا لتجربة أفضل", description: "نظام تنقل جيد البناء يساعد المستخدمين على إيجاد ما يريدون بسرعة وسهولة" },
    ],
  },
};
const READ_MORE_BTN =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]";

function ReadMoreButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={READ_MORE_BTN}>
      <BookOpen className="size-4" />
      {label}
    </Link>
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

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-8 pt-10 sm:pt-14"
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
          <Link
            href="#"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f9fafb]"
          >
            {copy.viewMore}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
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
              <ReadMoreButton href={FEATURED_HREF} label={copy.readMore} />
            </div>
          </article>

          {/* 3-column grid */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.articles.map((article, i) => (
              <ArticleCard
                key={article.title}
                article={article}
                image={ARTICLE_IMAGES[i]}
                href={ARTICLE_HREFS[i]}
                readMore={copy.readMore}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
