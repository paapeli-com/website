"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  DollarSign,
  Droplets,
  Leaf,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CountUp } from "@/components/CountUp";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { CheckList, RevealCard } from "@/components/RevealCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactHref } from "@/lib/contact-link";
import { CAPABILITIES_RAIL, LinkedText, featureHref, featureName, industryHref } from "@/lib/site-links";
import { cn } from "@/lib/utils";

import type { IndustryConfig, StatIcon } from "./types";

/* ------------------------------------------------------------------ */
/* <IndustryLanding/> : one template for every industry page.         */
/*                                                                    */
/* Photography carries the page: a full-bleed hero, three cards whose */
/* image slides aside on hover to make room for the detail, the       */
/* industry's impact figures, and a partner-facing block. Everything  */
/* it renders comes from an IndustryConfig, so a new industry is a    */
/* data file rather than another copy of this JSX.                    */
/* ------------------------------------------------------------------ */

const STAT_ICONS: Record<StatIcon, LucideIcon> = {
  downtime: TrendingDown,
  growth: TrendingUp,
  money: DollarSign,
  water: Droplets,
  people: Users,
  leaf: Leaf,
  shield: ShieldCheck,
};

export function IndustryLanding({ config }: { config: IndustryConfig }) {
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const copy = config.copy[language] ?? config.copy.en;
  /* Own href, so the page never links its industry name back to itself. */
  const self = industryHref(config.slug);

  const goToDemo = () => router.push(contactHref(language, config.slug));

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar overlay />

      <main>
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative isolate flex min-h-[75vh] items-center overflow-hidden pt-16">
          <Image
            src={config.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className={cn("-z-20 object-cover", config.mirrorHeroInLtr && !isRTL && "scale-x-[-1]")}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#081020]/[0.72]" />

          <div className="container relative z-10 mx-auto px-4 py-20">
            <div className="max-w-3xl">
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">{copy.hero.title}</h1>
              <p className="mb-8 text-lg text-white/80 md:text-xl">
                <LinkedText
                  text={copy.hero.description}
                  self={self}
                  className="font-medium text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
                />
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={goToDemo}>
                  {copy.hero.primary}
                  <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white/10 px-8 py-6 text-lg text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  onClick={goToDemo}
                >
                  {copy.hero.secondary}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------ What we deliver -------------------------- */}
        <section className="bg-card py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-3 text-center text-3xl font-bold text-foreground md:text-4xl">{copy.offer.heading}</h2>
            <p className="mb-12 text-center text-muted-foreground">{copy.offer.subheading}</p>

            <div className="grid gap-6 md:grid-cols-3">
              {copy.offer.cards.map((card, i) => (
                <RevealCard key={card.title} card={card} image={config.images[i]} self={self} />
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------- Impact -------------------------------- */}
        <section className="bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="rounded-2xl bg-[hsl(215_60%_19%)] p-8 md:p-10">
                <h3 className="mb-8 text-2xl font-bold italic text-white md:text-3xl">{copy.impact.heading}</h3>

                <div className="space-y-6">
                  {copy.impact.stats.map((stat) => {
                    const Icon = STAT_ICONS[stat.icon];
                    return (
                      <div
                        key={stat.label}
                        className="flex items-center gap-4 border-t border-white/20 pt-6 first:border-t-0 first:pt-0"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <p className="flex-1 text-sm text-white/80 md:text-base">{stat.label}</p>
                        <div className="text-right">
                          <p className="text-sm text-white/70">{stat.prefix}</p>
                          <p className="!text-5xl font-black leading-none tracking-tight text-primary md:!text-7xl">
                            <CountUp value={stat.value} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-border bg-background p-8 text-center md:p-10">
                <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">{copy.impact.roiHeading}</h3>
                <p className="mb-4 !text-8xl font-black leading-none tracking-tighter text-primary md:!text-9xl">
                  <CountUp value={copy.impact.roiValue} duration={2000} />
                </p>
                <p className="text-xl font-semibold text-foreground md:text-2xl">{copy.impact.roiCaption}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------- Why partners choose us --------------------- */}
        <section className="bg-card py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">{copy.why.heading}</h2>

            <div className="grid gap-6 md:grid-cols-3">
              {copy.why.cards.map((card, i) => (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-border bg-background p-6 transition-shadow duration-300 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      src={config.images[config.whyOrder[i]]}
                      alt=""
                      width={112}
                      height={112}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <h3 className="text-lg font-bold leading-snug text-foreground">{card.title}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    <LinkedText text={card.description} self={self} />
                  </p>
                  <CheckList items={card.items} tone="dark" self={self} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------- The capabilities this solution is built on ---------- */}
        <section className="bg-background py-14 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-xl font-bold text-foreground md:text-2xl">
              {CAPABILITIES_RAIL[language] ?? CAPABILITIES_RAIL.en}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {config.features.map((slug) => {
                const named = featureName(slug, language);
                return (
                  <Link
                    key={slug}
                    href={`/${language}${featureHref(slug)}`}
                    className="group rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/50"
                  >
                    <p className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary">
                      {named.title}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{named.tagline}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------- CTA ------------------------------ */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{copy.cta.heading}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">{copy.cta.description}</p>
            <Button size="lg" className="px-8 py-6 text-lg" onClick={goToDemo}>
              {copy.cta.button}
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
