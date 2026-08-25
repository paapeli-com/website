"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BellRing,
  Boxes,
  CalendarClock,
  ChartLine,
  Cloud,
  Gauge,
  GitBranch,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  Package,
  Plug,
  Radar,
  RefreshCw,
  SearchCheck,
  Send,
  Server,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { LandingFooter } from "@/components/LandingFooter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { RevealCard } from "@/components/RevealCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactHref } from "@/lib/contact-link";
import {
  LinkedText,
  featureHref,
  featureName,
  industryHref,
  industryName,
} from "@/lib/site-links";
import { cn } from "@/lib/utils";

import type { CapabilityIcon, FeatureConfig } from "./types";

/* ------------------------------------------------------------------ */
/* <FeatureLanding/> : one template for every platform-feature page.   */
/*                                                                    */
/* It deliberately keeps the industry landings' rhythm (full-bleed     */
/* hero, three reveal cards, a dark inset, a closing CTA) so the two   */
/* families read as one site. What it adds is the panel screenshot     */
/* and the two link rails at the foot: the industries this feature is  */
/* used by, and the sibling features next to it.                       */
/* ------------------------------------------------------------------ */

const CAPABILITY_ICONS: Record<CapabilityIcon, LucideIcon> = {
  bell: BellRing,
  branch: GitBranch,
  send: Send,
  radar: Radar,
  search: SearchCheck,
  warning: TriangleAlert,
  boxes: Boxes,
  plug: Plug,
  checklist: ListChecks,
  cloud: Cloud,
  server: Server,
  shield: ShieldCheck,
  layers: Layers,
  refresh: RefreshCw,
  package: Package,
  calendar: CalendarClock,
  chart: ChartLine,
  wrench: Wrench,
  pulse: Activity,
  gauge: Gauge,
  dashboard: LayoutDashboard,
  timer: Timer,
  template: LayoutTemplate,
};

export function FeatureLanding({ config }: { config: FeatureConfig }) {
  const { isRTL, language } = useLanguage();
  const router = useRouter();

  const copy = config.copy[language] ?? config.copy.en;
  const self = featureHref(config.slug);
  const localize = (href: string) => "/" + language + href;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar overlay />

      <main>
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pt-16">
          <Image src={config.hero} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#081020]/[0.74]" />

          <div className="container relative z-10 mx-auto px-4 py-20">
            <div className="max-w-3xl">
              <span className="mb-5 inline-block rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                {copy.hero.badge}
              </span>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">{copy.hero.title}</h1>
              <p className="mb-8 text-lg text-white/80 md:text-xl">
                <LinkedText
                  text={copy.hero.description}
                  self={self}
                  className="font-medium text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
                />
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => router.push(localize("/aiot-platform"))}>
                  {copy.hero.primary}
                  <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white/10 px-8 py-6 text-lg text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  onClick={() => router.push(contactHref(language, config.slug))}
                >
                  {copy.hero.secondary}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------- What this feature gives you ----------------- */}
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

        {/* -------------------------- Inside the panel ----------------------- */}
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">{copy.panel.heading}</h2>
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
                  src={config.panel}
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
            <h2 className="mb-3 text-center text-2xl font-bold text-foreground md:text-3xl">
              {copy.capabilities.heading}
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
              {copy.capabilities.subheading}
            </p>

            <div
              className={cn(
                "grid gap-4 sm:grid-cols-2",
                copy.capabilities.cards.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
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
                      <LinkedText text={card.description} self={self} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------- Where it is used + the other capabilities ----------- */}
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="mb-5 text-xl font-bold text-foreground md:text-2xl">{copy.usedIn}</h2>
                <div className="flex flex-wrap gap-2.5">
                  {config.usedIn.map((slug) => (
                    <Link
                      key={slug}
                      href={localize(industryHref(slug))}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {industryName(slug, language)}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-5 text-xl font-bold text-foreground md:text-2xl">{copy.related}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {config.related.map((slug) => {
                    const named = featureName(slug, language);
                    return (
                      <Link
                        key={slug}
                        href={localize(featureHref(slug))}
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
            </div>
          </div>
        </section>

        {/* -------------------------------- CTA ------------------------------ */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{copy.cta.heading}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">{copy.cta.description}</p>
            <Button size="lg" className="px-8 py-6 text-lg" onClick={() => router.push(contactHref(language, config.slug))}>
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
