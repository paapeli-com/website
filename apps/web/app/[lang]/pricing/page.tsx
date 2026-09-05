"use client";

import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  CircleUserRound,
  CreditCard,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { CtaSection } from "@/components/CtaSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactHref } from "@/lib/contact-link";
import { PANEL_URL } from "@/lib/panel";
import { PRICING_COPY, type Plan, type PricingCopy, type PricingTabKey } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pricing page (Figma "Pricing" 4:3). Desktop layout is 1280px wide   */
/* with the four plan cards rendered as one bordered container split   */
/* by 1px dividers. Copy typos in the design ("AloT", "Al modules")    */
/* are corrected here.                                                 */
/*                                                                    */
/* Every string comes from lib/pricing.ts, one block per locale, so    */
/* the English, Persian and Arabic pages share this one template.      */
/* ------------------------------------------------------------------ */

const TAB_ICONS: { key: PricingTabKey; icon: LucideIcon }[] = [
  { key: "subscription", icon: CreditCard },
  { key: "payg", icon: SlidersHorizontal },
  { key: "onpremise", icon: CircleUserRound },
];

const SECONDARY_BUTTON_CLASSES =
  "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-[#4a5565] drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]";

const BillingToggle = ({ plan, copy }: { plan: Plan; copy: PricingCopy }) => {
  if (plan.billing === "monthly-yearly") {
    return (
      <div className="flex h-9 items-center gap-0.5 rounded-xl bg-[#f3f4f6] p-1.5">
        <button className="flex h-6 items-center justify-center rounded-md bg-white px-2 py-1 text-xs font-medium text-[#101828]">
          {copy.billing.monthly}
        </button>
        <button className="flex h-6 items-center justify-center rounded-lg px-2 py-1 text-xs font-medium text-[#4a5565]">
          {copy.billing.yearly}
        </button>
      </div>
    );
  }

  return (
    /* "none" keeps an invisible pill so price rows stay aligned (per Figma). */
    <div
      className={cn(
        "flex h-9 items-center gap-0.5 rounded-xl bg-[#f3f4f6] p-1.5",
        plan.billing === "none" && "opacity-0",
      )}
      aria-hidden={plan.billing === "none"}
    >
      <span className="flex h-6 items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-[#101828]">
        {copy.billing.onlyMonthly}
      </span>
    </div>
  );
};

const PlanCard = ({ plan, copy, language }: { plan: Plan; copy: PricingCopy; language: string }) => {
  const ctaLabel = (
    <>
      {plan.cta.icon === "briefcase" && <Briefcase className="size-4" />}
      {plan.cta.label}
      {plan.cta.icon === "arrow" && <ArrowRight className="size-4 rtl:rotate-180" />}
    </>
  );

  /* The panel lives on another origin, so it is a plain <a>; the sales
     form is a page on this site, reached with the visitor's locale. */
  const href = plan.cta.action === "panel" ? PANEL_URL : contactHref(language, "pricing");

  return (
    <div className="flex flex-col border-b border-[#e5e7eb] last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 rtl:lg:border-l rtl:lg:border-r-0 rtl:lg:last:border-l-0">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 border-b border-[#e5e7eb] p-6">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-2xl font-semibold text-[#101828]">{plan.name}</h3>
          {plan.badge && (
            <span className="flex h-5 items-center justify-center rounded-md border border-[#ffccd3] bg-[#fef0f2] px-1.5 py-0.5 text-xs font-medium text-[#8b0836]">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="flex items-baseline">
            {/* Persian and Arabic prices carry their currency word, so the
                figure is set a step smaller to keep it on one line. */}
            <span className="text-[40px] font-bold leading-normal text-[#101828] rtl:text-[32px]">
              {plan.price}
            </span>
            {plan.pricePeriod && (
              /* "$20/month" is set tight per Figma; a currency word needs the
                 gap, so RTL pushes the period off the figure. */
              <span className="text-base text-[#6a7282] rtl:ms-1.5 rtl:text-sm">
                {plan.pricePeriod}
              </span>
            )}
          </div>
          <BillingToggle plan={plan} copy={copy} />
        </div>

        {/* Two lines' worth, so a one-line description in any locale still
            leaves the four CTAs and feature lists on the same baseline.
            globals.css gives Persian and Arabic paragraphs line-height 1.85
            rather than the 1.5 text-base assumes, hence the second value. */}
        <p className="min-h-12 text-base text-[#4a5565] rtl:min-h-[3.7rem]">{plan.description}</p>

        <a
          href={href}
          target={plan.cta.action === "panel" ? "_blank" : undefined}
          rel={plan.cta.action === "panel" ? "noopener noreferrer" : undefined}
          className={
            plan.cta.variant === "primary"
              ? "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff7900] px-4 py-2.5 text-sm font-medium text-white drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#e66d00]"
              : SECONDARY_BUTTON_CLASSES
          }
        >
          {ctaLabel}
        </a>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col gap-4 p-6">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-1.5">
            {feature.disabled ? (
              <CircleMinus className="size-5 shrink-0 text-[#99a1af]" />
            ) : (
              <CircleCheck className="size-5 shrink-0 text-[#d56300]" />
            )}
            {feature.disabled ? (
              <span className="text-base text-[#99a1af]">{feature.label}</span>
            ) : (
              <span className="text-base text-[#4a5565]">
                {feature.label}:{" "}
                <span className="font-medium text-[#101828]">{feature.value}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PricingSection = ({ copy, language }: { copy: PricingCopy; language: string }) => {
  const [activeTab, setActiveTab] = useState<PricingTabKey>("subscription");

  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold text-[#101828] sm:text-[40px] sm:leading-normal rtl:text-2xl rtl:sm:text-[34px]">
            {copy.hero.title}
          </h1>
          <p className="text-lg text-[#4a5565] rtl:text-base">{copy.hero.subtitle}</p>
        </div>

        <div className="flex w-full flex-col items-center gap-10">
          {/* Pricing type tabs */}
          <div className="flex flex-wrap items-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)]">
            {TAB_ICONS.map(({ key, icon: Icon }, index) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#101828] transition-colors",
                  index < TAB_ICONS.length - 1 && "border-r border-[#e5e7eb] rtl:border-l rtl:border-r-0",
                  activeTab === key ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]/60",
                )}
              >
                <Icon className={cn("size-4", activeTab === key ? "text-[#101828]" : "text-[#4a5565]")} />
                {copy.tabs[key]}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div className="grid w-full grid-cols-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white md:grid-cols-2 lg:grid-cols-4">
            {copy.plans.map((plan) => (
              <PlanCard key={plan.key} plan={plan} copy={copy} language={language} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const FaqSection = ({ copy }: { copy: PricingCopy }) => {
  /* The design shows the third question expanded by default. */
  const [openIndex, setOpenIndex] = useState<number | null>(2);

  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        <h2 className="text-center text-3xl font-semibold leading-[1.25] tracking-[-0.4px] text-[#101828] sm:text-[40px] rtl:text-2xl rtl:sm:text-[34px]">
          {copy.faq.heading}
        </h2>

        <div className="flex w-full max-w-[695px] flex-col gap-4">
          {copy.faq.items.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={faq.question} className="flex w-full flex-col drop-shadow-[0px_1px_1px_rgba(29,41,61,0.05)]">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    "flex w-full items-center gap-6 border border-[#e5e7eb] px-6 py-5 text-left rtl:text-right transition-colors",
                    isOpen ? "rounded-t-xl bg-[#f3f4f6]" : "rounded-xl bg-white hover:bg-[#f9fafb]",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <CircleHelp
                      className={cn("size-5 shrink-0", isOpen ? "text-[#101828]" : "text-[#4a5565]")}
                    />
                    <span
                      className={cn(
                        "text-base font-medium",
                        isOpen ? "text-[#101828]" : "text-[#4a5565]",
                      )}
                    >
                      {faq.question}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="size-5 shrink-0 text-[#4a5565]" />
                  ) : (
                    <ChevronDown className="size-5 shrink-0 text-[#4a5565]" />
                  )}
                </button>
                {isOpen && (
                  <div className="rounded-b-xl border-x border-b border-[#e5e7eb] bg-white px-6 py-5">
                    <p className="text-base text-[#4a5565]">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const { isRTL, language } = useLanguage();
  const copy = PRICING_COPY[language] ?? PRICING_COPY.en;

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar />

      <main>
        <PricingSection copy={copy} language={language} />
        <FaqSection copy={copy} />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default function PricingPage() {
  return <Pricing />;
}
