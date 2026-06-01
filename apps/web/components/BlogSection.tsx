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

type Author = { name: string; avatar: StaticImageData };

type FeaturedArticle = {
  title: string;
  description: string;
  image: StaticImageData;
  author: Author;
  date: string;
  href: string;
};

type Article = {
  title: string;
  description: string;
  image: StaticImageData;
  href: string;
};

const FEATURED: FeaturedArticle = {
  title: "Paapeli unveils updated logo & brand guidelines website",
  description:
    "A digital home for all our brand guidelines, serving as both a super-functional resource and a celebration of our Design team’s creativity, craft, and commitment to pushing boundaries.",
  image: blogFeatured,
  author: { name: "Jese Leos", avatar: blogAvatar },
  date: "March 26, 2020",
  href: "#",
};

const ARTICLES: Article[] = [
  {
    title: "The difference between UI & UX and best practices",
    description:
      "Understanding the difference between UI and UX is crucial for creating effective & modern digital products.",
    image: blog1,
    href: "#",
  },
  {
    title: "Top web development trends to watch in 2025",
    description:
      "Web development is constantly evolving, with new technologies shaping the future of the industry.",
    image: blog2,
    href: "#",
  },
  {
    title: "How to design intuitive navigation for better UX",
    description:
      "A well-structured navigation system helps users find what they need quickly and easily, reducing frustration.",
    image: blog3,
    href: "#",
  },
];

const READ_MORE_BTN =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]";

function ReadMoreButton({ href }: { href: string }) {
  return (
    <Link href={href} className={READ_MORE_BTN}>
      <BookOpen className="size-4" />
      Read more
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="flex flex-1 flex-col items-start gap-6 overflow-hidden">
      <div className="relative h-[208px] w-full overflow-hidden rounded-xl">
        <Image src={article.image} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full flex-col gap-3">
          <h3 className="text-xl font-semibold text-foreground">{article.title}</h3>
          <p className="text-base text-muted-foreground">{article.description}</p>
        </div>
        <ReadMoreButton href={article.href} />
      </div>
    </article>
  );
}

export const BlogSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-10 pt-14 sm:pt-20"
    >
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-12">
        {/* Heading + View more */}
        <div className="flex w-full flex-col items-start justify-between gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col items-start gap-4">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Explore insights, real-world use cases, and best practices in AIoT.
            </h2>
            <p className="max-w-[731px] text-lg text-muted-foreground">
              Learn how to turn data into operational value and scale your industrial systems.
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f9fafb]"
          >
            View more
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* Articles */}
        <div className="flex w-full flex-col gap-8">
          {/* Featured (horizontal) */}
          <article className="flex w-full flex-col items-stretch gap-8 overflow-hidden lg:flex-row lg:items-center">
            <div className="relative h-[260px] w-full overflow-hidden rounded-xl lg:h-[264px] lg:w-[320px] lg:shrink-0">
              <Image
                src={FEATURED.image}
                alt={FEATURED.title}
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />
            </div>
            <div className="flex w-full flex-col items-start gap-6 lg:max-w-[768px]">
              <div className="flex w-full flex-col items-start gap-4">
                <h3 className="text-3xl font-semibold text-foreground">{FEATURED.title}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={FEATURED.author.avatar}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-foreground">{FEATURED.author.name}</span>
                  </div>
                  <span className="size-1.5 rounded-full bg-[#d1d5dc]" aria-hidden />
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{FEATURED.date}</span>
                  </div>
                </div>
                <p className="text-base text-muted-foreground">{FEATURED.description}</p>
              </div>
              <ReadMoreButton href={FEATURED.href} />
            </div>
          </article>

          {/* 3-column grid */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <ArticleCard key={article.title} article={article} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
