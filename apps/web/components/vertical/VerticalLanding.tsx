"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, ChevronRight, CircleCheck, Minus, Plus } from "lucide-react";

import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import ctaGradient from "@/src/assets/cta-gradient.png";
import type { CTA, FeatureItem, Segment, VerticalConfig } from "./types";

/* ------------------------------------------------------------------ */
/* <VerticalLanding/> — one template, every solution page.            */
/* Renders the shared navbar/footer and a fixed section order driven   */
/* entirely by a VerticalConfig. Built on the homepage design system   */
/* (white sections, max-w-[1280px], orange primary, rounded-xl cards). */
/* ------------------------------------------------------------------ */

const SECTION = "flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20";
const HEADING = "text-3xl font-semibold text-foreground sm:text-4xl";

function useLocalize() {
  const { language } = useLanguage();
  return (href: string) =>
    href.startsWith("/") ? `/${language}${href === "/" ? "" : href}` : href;
}

function PrimaryButton({ cta, dark }: { cta: CTA; dark?: boolean }) {
  const localize = useLocalize();
  const { isRTL } = useLanguage();
  return (
    <Link
      href={localize(cta.href)}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-base font-medium shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors",
        dark
          ? "bg-[#1e2939] text-white hover:bg-[#101828]"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {cta.label}
      <ArrowRight className={cn("size-4", isRTL && "rotate-180")} />
    </Link>
  );
}

function GhostButton({ cta }: { cta: CTA }) {
  const localize = useLocalize();
  return (
    <Link
      href={localize(cta.href)}
      className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-3 text-base font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]"
    >
      <Briefcase className="size-4" />
      {cta.label}
    </Link>
  );
}

function SectionHeading({ heading, subtitle, max = "672px" }: { heading: string; subtitle: string; max?: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center" style={{ maxWidth: max }}>
      <h2 className={HEADING}>{heading}</h2>
      <p className="text-lg text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/* ------------------------------- Hero ------------------------------ */

function Hero({ config }: { config: VerticalConfig }) {
  const localize = useLocalize();
  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden px-0 py-16 sm:py-24">
      {/* Soft, chic hero backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fff7f0] via-white to-white" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.6]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(29,41,61,0.06) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="relative flex w-full max-w-[1280px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16">
        <div className="flex flex-col items-start gap-8 lg:max-w-[560px] lg:flex-1">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#ffcda1] bg-[#fff6ef] py-1 pl-1 pr-2 transition-colors hover:bg-[#ffe9d6]"
          >
            {config.badge && (
              <span className="rounded-full bg-[#ffe1c4] px-2 py-0.5 text-xs font-medium text-[#9a4a00]">
                {config.badge}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-sm text-[#9a4a00]">
              {config.eyebrow}
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </span>
          </Link>

          <div className="flex w-full flex-col gap-3">
            <h1 className="flex flex-col text-foreground">
              <span className="text-3xl font-light leading-tight sm:text-4xl">{config.titleTop}</span>
              <span className="text-4xl font-semibold leading-tight sm:text-5xl">{config.titleBottom}</span>
            </h1>
            <p className="text-lg text-muted-foreground">{config.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={localize(config.primaryCta.href)}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              {config.primaryCta.label}
            </Link>
            {config.secondaryCta && <GhostButton cta={config.secondaryCta} />}
          </div>

          {config.chips && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {config.chips.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">{config.heroVisual}</div>
      </div>
    </section>
  );
}

/* ----------------------------- Segments ---------------------------- */

function SegmentCard({ segment }: { segment: Segment }) {
  const { icon: Icon } = segment;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] transition-shadow hover:shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1)]">
      <div className={cn("relative h-52 w-full overflow-hidden bg-gradient-to-br", segment.gradient)}>
        {/* soft map-grid texture so the placeholder reads as intentional */}
        <svg viewBox="0 0 400 208" className="absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="white" strokeWidth="1.5">
            <line x1="0" y1="52" x2="400" y2="52" />
            <line x1="0" y1="104" x2="400" y2="104" />
            <line x1="0" y1="156" x2="400" y2="156" />
            <line x1="100" y1="0" x2="100" y2="208" />
            <line x1="200" y1="0" x2="200" y2="208" />
            <line x1="300" y1="0" x2="300" y2="208" />
          </g>
        </svg>
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
          {segment.eyebrow}
        </span>
        <Icon className="absolute -bottom-2 -right-2 size-28 text-white/90 drop-shadow-lg" strokeWidth={1.25} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-foreground">{segment.title}</h3>
          <p className="text-sm text-muted-foreground">{segment.description}</p>
        </div>
        <ul className="mt-auto flex flex-col gap-2.5 border-t border-[#f3f4f6] pt-4">
          {segment.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Segments({ config }: { config: VerticalConfig }) {
  return (
    <section className={cn(SECTION, "gap-10 sm:gap-12")}>
      <SectionHeading heading={config.segments.heading} subtitle={config.segments.subtitle} max="768px" />
      <div className="grid w-full max-w-[1152px] grid-cols-1 gap-6 md:grid-cols-3">
        {config.segments.items.map((segment) => (
          <SegmentCard key={segment.title} segment={segment} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Features ---------------------------- */

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const { icon: Icon } = feature;
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-7 text-left shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#fff6ef]">
        <Icon className="size-6 text-primary" />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>
    </div>
  );
}

function Features({ config }: { config: VerticalConfig }) {
  return (
    <section className={cn(SECTION, "gap-10 bg-[#fafafa] sm:gap-12")}>
      <SectionHeading heading={config.features.heading} subtitle={config.features.subtitle} />
      <div className="grid w-full max-w-[1152px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {config.features.items.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Showcase ---------------------------- */

function Showcase({ config }: { config: VerticalConfig }) {
  if (!config.showcase) return null;
  const s = config.showcase;
  return (
    <section className={SECTION}>
      <div className="flex w-full max-w-[1152px] flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col items-start gap-8">
          <div className="flex flex-col gap-5">
            <h2 className={HEADING}>{s.heading}</h2>
            <p className="text-base text-muted-foreground">{s.subtitle}</p>
          </div>
          <ul className="flex w-full flex-col gap-6">
            {s.points.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff6ef]">
                  <Icon className="size-6 text-primary" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>
          {s.cta && <PrimaryButton cta={s.cta} />}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center">{s.visual}</div>
      </div>
    </section>
  );
}

/* ------------------------------ Stats ------------------------------ */

function Stats({ config }: { config: VerticalConfig }) {
  if (!config.stats?.length) return null;
  return (
    <section className={cn(SECTION, "py-6 sm:py-10")}>
      <div className="w-full max-w-[1152px] rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {config.stats.map(({ stat, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="text-4xl font-bold text-primary sm:text-5xl">{stat}</span>
              <span className="text-sm text-muted-foreground sm:text-base">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Steps ------------------------------ */

function Steps({ config }: { config: VerticalConfig }) {
  if (!config.steps) return null;
  return (
    <section className={cn(SECTION, "gap-10 sm:gap-12")}>
      <SectionHeading heading={config.steps.heading} subtitle={config.steps.subtitle} />
      <div className="grid w-full max-w-[1024px] grid-cols-1 gap-8 md:grid-cols-3">
        {config.steps.items.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)]">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-xl font-semibold text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ------------------------------- */

function Faq({ config }: { config: VerticalConfig }) {
  const [open, setOpen] = useState(0);
  if (!config.faq) return null;
  return (
    <section className={cn(SECTION, "gap-10 bg-[#fafafa] sm:gap-12")}>
      <SectionHeading heading={config.faq.heading} subtitle={config.faq.subtitle} />
      <div className="flex w-full max-w-[768px] flex-col gap-3">
        {config.faq.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              >
                <span className="text-base font-semibold text-foreground">{item.q}</span>
                {isOpen ? (
                  <Minus className="size-5 shrink-0 text-primary" />
                ) : (
                  <Plus className="size-5 shrink-0 text-muted-foreground" />
                )}
              </button>
              <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------- CTA ------------------------------- */

function Cta({ config }: { config: VerticalConfig }) {
  return (
    <section className={SECTION}>
      <div className="flex w-full max-w-[1280px] items-center justify-center">
        <div
          className="relative flex w-full max-w-[1024px] flex-col items-start gap-8 overflow-hidden rounded-2xl border border-[#ffcda1] bg-white bg-cover bg-center p-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:p-14"
          style={{ backgroundImage: `url(${ctaGradient.src})` }}
        >
          <div className="relative flex w-full max-w-[640px] flex-col items-start gap-4 text-[#101828]">
            <h2 className="max-w-[560px] text-3xl font-semibold sm:text-[40px] sm:leading-normal">
              {config.cta.title}
            </h2>
            <p className="max-w-[600px] text-lg">{config.cta.subtitle}</p>
          </div>
          <div className="relative flex flex-wrap items-start gap-4">
            <PrimaryButton cta={config.cta.primary} dark />
            {config.cta.secondary && <GhostButton cta={config.cta.secondary} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Page ------------------------------- */

export function VerticalLanding({
  config,
  beforeCta,
}: {
  config: VerticalConfig;
  /** Optional extra section rendered before the closing CTA (per-vertical). */
  beforeCta?: ReactNode;
}) {
  const { isRTL } = useLanguage();
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar />
      <main>
        <Hero config={config} />
        <Segments config={config} />
        <Features config={config} />
        <Showcase config={config} />
        <Stats config={config} />
        <Steps config={config} />
        {beforeCta}
        <Faq config={config} />
        <Cta config={config} />
      </main>
      <LandingFooter />
    </div>
  );
}
