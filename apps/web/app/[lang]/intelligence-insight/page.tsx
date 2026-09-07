"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { LandingFooter } from "@/components/LandingFooter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { RevealCard } from "@/components/RevealCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactHref } from "@/lib/contact-link";
import { INSIGHT_COPY, RELATED_FEATURES, type CapabilityIcon } from "@/lib/intelligence-insight";
import { localePath } from "@/lib/seo";
import { LinkedText, featureHref, featureName } from "@/lib/site-links";
import { cn } from "@/lib/utils";

import img1 from "@/src/assets/Insight-1.jpg";
import img2 from "@/src/assets/Insight-2.jpg";
import img3 from "@/src/assets/Insight-3.jpg";
import hero from "@/src/assets/p-insight-hero.jpg";
import panel from "@/src/assets/panel-forecast.jpg";

/* ------------------------------------------------------------------ */
/* The Intelligence & Insight landing, the last of the four products   */
/* to move onto the shared design: full-bleed hero, three reveal       */
/* cards, the forecast workspace behind window chrome, a capability    */
/* grid, two link rails and a closing CTA. Copy lives in               */
/* lib/intelligence-insight.ts, one block per locale.                  */
/*                                                                    */
/* It replaces the older shell, whose header carried the whole menu in */
/* a zero-opacity div and whose six feature cards were the only thing  */
/* on the page.                                                        */
/* ------------------------------------------------------------------ */

const CAPABILITY_ICONS: Record<CapabilityIcon, LucideIcon> = {
  brain: Brain,
  alert: AlertTriangle,
  trending: TrendingUp,
  chart: BarChart3,
};

const IMAGES = [img1, img2, img3];

/** This page's own address, so LinkedText does not link it to itself. */
const SELF = "/intelligence-insight";

export default function IntelligenceInsightPage() {
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const copy = INSIGHT_COPY[language] ?? INSIGHT_COPY.en;

  const demoHref = contactHref(language, "intelligence-insight");

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar overlay />

      <main>
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pt-16">
          <Image src={hero} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          {/* The design darkens the photograph behind the text and lets it come
              through on the far side, so the gradient flips with the writing. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,16,32,0.92)_0%,rgba(8,16,32,0.78)_45%,rgba(8,16,32,0.45)_100%)] rtl:bg-[linear-gradient(270deg,rgba(8,16,32,0.92)_0%,rgba(8,16,32,0.78)_45%,rgba(8,16,32,0.45)_100%)]"
          />

          <div className="container relative z-10 mx-auto px-4 py-20">
            <div className="max-w-3xl">
              <span className="mb-5 inline-block rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                {copy.hero.badge}
              </span>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl rtl:text-3xl rtl:md:text-5xl">
                {copy.hero.title}
              </h1>
              <p className="mb-8 text-lg text-white/80 md:text-xl rtl:text-base rtl:md:text-lg">
                {copy.hero.description}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => router.push(demoHref)}>
                  {copy.hero.primary}
                  <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white/10 px-8 py-6 text-lg text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  onClick={() => router.push(contactHref(language))}
                >
                  {copy.hero.secondary}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------- What it does --------------------------- */}
        <section className="bg-card py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-3 text-center text-3xl font-bold text-foreground md:text-4xl rtl:text-2xl rtl:md:text-3xl">
              {copy.offer.heading}
            </h2>
            <p className="mb-12 text-center text-muted-foreground">{copy.offer.subheading}</p>

            <div className="grid gap-6 md:grid-cols-3">
              {copy.offer.cards.map((card, i) => (
                <RevealCard key={card.title} card={card} image={IMAGES[i]} self={SELF} />
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------- Inside the panel ----------------------- */}
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl rtl:text-xl rtl:md:text-2xl">
                {copy.panel.heading}
              </h2>
              <p className="mb-8 text-muted-foreground">{copy.panel.description}</p>
            </div>

            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-[hsl(215_60%_13%)] p-2 shadow-2xl">
              {/* Window chrome always reads left to right, like a real title bar. */}
              <div className="flex items-center gap-1.5 px-3 py-2" dir="ltr">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
              </div>
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src={panel}
                  alt={copy.hero.title}
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="w-full animate-panel-pan rounded-xl object-cover motion-reduce:animate-none"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 animate-scan-glow bg-gradient-to-b from-transparent via-primary/20 to-transparent motion-reduce:hidden"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- Key capabilities ---------------------- */}
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-3 text-center text-2xl font-bold text-foreground md:text-3xl rtl:text-xl rtl:md:text-2xl">
              {copy.capabilities.heading}
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
              {copy.capabilities.subheading}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {copy.capabilities.cards.map((card) => {
                const Icon = CAPABILITY_ICONS[card.icon];
                return (
                  <div
                    key={card.title}
                    className="rounded-xl border border-border bg-background p-5 transition-shadow duration-300 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </span>
                      <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <LinkedText text={card.description} self={SELF} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------- Related capabilities + the other products ----------- */}
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="mb-5 text-xl font-bold text-foreground md:text-2xl rtl:text-lg rtl:md:text-xl">
                  {copy.relatedHeading}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {RELATED_FEATURES.map((slug) => {
                    const named = featureName(slug, language);
                    return (
                      <Link
                        key={slug}
                        href={localePath(language, featureHref(slug))}
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

              <div>
                <h2 className="mb-5 text-xl font-bold text-foreground md:text-2xl rtl:text-lg rtl:md:text-xl">
                  {copy.productsHeading}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {copy.products.map((product) => (
                    <Link
                      key={product.href}
                      href={localePath(language, product.href)}
                      className="group rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/50"
                    >
                      <p className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary">
                        {product.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{product.tagline}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------- CTA ------------------------------ */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl rtl:text-2xl rtl:md:text-3xl">
              {copy.cta.heading}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground rtl:text-base">
              {copy.cta.description}
            </p>
            <Button size="lg" className="px-8 py-6 text-lg" onClick={() => router.push(demoHref)}>
              {copy.cta.button}
              <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
