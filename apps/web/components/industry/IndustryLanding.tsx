"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
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
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import type { IndustryCard, IndustryConfig, StatIcon } from "./types";

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

function CheckList({ items, tone }: { items: string[]; tone: "light" | "dark" }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn("flex items-start gap-2 text-sm", tone === "light" ? "text-white/85" : "text-foreground/80")}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A photograph that steps aside on hover to make room for the detail. */
function RevealCard({ card, image }: { card: IndustryCard; image: IndustryConfig["images"][number] }) {
  return (
    <div
      tabIndex={0}
      className="group relative flex h-[360px] overflow-hidden rounded-2xl bg-[hsl(215_60%_13%)] outline-none ring-primary/60 focus-visible:ring-2"
    >
      <div className="relative h-full w-full shrink-0 transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-1/5 group-focus-visible:w-1/5">
        <Image src={image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[hsl(215_60%_8%)]/90 via-[hsl(215_60%_8%)]/25 to-transparent"
        />
        <h3 className="absolute inset-x-0 bottom-0 p-5 text-lg font-semibold text-white transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
          {card.title}
        </h3>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6 opacity-0 transition-opacity delay-200 duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <h3 className="text-xl font-bold text-white">{card.title}</h3>
        <p className="text-sm leading-relaxed text-white/70">{card.description}</p>
        <CheckList items={card.items} tone="light" />
      </div>
    </div>
  );
}

export function IndustryLanding({ config }: { config: IndustryConfig }) {
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const copy = config.copy[language] ?? config.copy.en;

  const goToDemo = () => router.push(`/${language}/request-demo`);

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
              <p className="mb-8 text-lg text-white/80 md:text-xl">{copy.hero.description}</p>
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
                <RevealCard key={card.title} card={card} image={config.images[i]} />
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
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                  <CheckList items={card.items} tone="dark" />
                </div>
              ))}
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
