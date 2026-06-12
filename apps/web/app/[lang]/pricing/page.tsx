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
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pricing page (Figma "Pricing" 4:3). Desktop layout is 1280px wide   */
/* with the four plan cards rendered as one bordered container split   */
/* by 1px dividers. Copy typos in the design ("AloT", "Al modules")    */
/* are corrected here.                                                 */
/* ------------------------------------------------------------------ */

type PricingTabKey = "subscription" | "payg" | "onpremise";

const PRICING_TABS: { key: PricingTabKey; label: string; icon: LucideIcon }[] = [
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "payg", label: "Pay-as-you-Go", icon: SlidersHorizontal },
  { key: "onpremise", label: "On-Premise", icon: CircleUserRound },
];

type Feature = { label: string; value?: string; disabled?: boolean };

type Plan = {
  name: string;
  badge?: string;
  price: string;
  pricePeriod?: string;
  billing: "monthly-yearly" | "only-monthly" | "none";
  description: string;
  cta: { label: string; variant: "primary" | "secondary"; icon: "arrow" | "briefcase" };
  features: Feature[];
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    pricePeriod: "/month",
    billing: "none",
    description: "For personal projects and evaluation",
    cta: { label: "Try for free", variant: "secondary", icon: "arrow" },
    features: [
      { label: "Connected devices", value: "5" },
      { label: "Data retention", value: "7 days" },
      { label: "Dashboards", value: "2" },
      { label: "Team members", value: "1" },
      { label: "Alert rules", value: "5" },
      { label: "Messages", value: "100,000" },
      { label: "OTA updates", disabled: true },
      { label: "AI modules", disabled: true },
    ],
  },
  {
    name: "Growth",
    badge: "Most popular",
    price: "$49",
    pricePeriod: "/month",
    billing: "monthly-yearly",
    description: "For small teams getting started with AIoT",
    cta: { label: "Get started", variant: "primary", icon: "arrow" },
    features: [
      { label: "Connected devices", value: "50" },
      { label: "Data retention", value: "30 days" },
      { label: "Dashboards", value: "10" },
      { label: "Team members", value: "5" },
      { label: "Alert rules", value: "50" },
      { label: "Messages", value: "2,000,000" },
      { label: "OTA updates", value: "Available" },
      { label: "AI modules", value: "Basic" },
    ],
  },
  {
    name: "Professional",
    price: "$199",
    pricePeriod: "/month",
    billing: "monthly-yearly",
    description: "For strategic scaling industrial operations",
    cta: { label: "Get started", variant: "secondary", icon: "arrow" },
    features: [
      { label: "Connected devices", value: "500" },
      { label: "Data retention", value: "1 year" },
      { label: "Dashboards", value: "Unlimited" },
      { label: "Team members", value: "25" },
      { label: "Alert rules", value: "Unlimited" },
      { label: "Messages", value: "25,000,000" },
      { label: "OTA updates", value: "Available" },
      { label: "AI modules", value: "Advanced" },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    billing: "only-monthly",
    description: "For large-scale, mission-critical deployments",
    cta: { label: "Contact sales", variant: "secondary", icon: "briefcase" },
    features: [
      { label: "Connected devices", value: "Unlimited" },
      { label: "Data retention", value: "Custom" },
      { label: "Dashboards", value: "Unlimited" },
      { label: "Team members", value: "Unlimited" },
      { label: "Alert rules", value: "Unlimited" },
      { label: "Messages", value: "Custom" },
      { label: "OTA updates", value: "Available" },
      { label: "AI modules", value: "Advanced" },
    ],
  },
];

const STATS = [
  { value: "73M+", label: "Developers" },
  { value: "1B+", label: "Contributors" },
  { value: "90+", label: "Top companies" },
  { value: "4M+", label: "Organizations" },
];

/* Only the third answer exists in the design; the rest follow the same voice. */
const FAQS = [
  {
    question: "Which plan is right for my organization?",
    answer:
      "Free is ideal for evaluation, Growth fits small teams starting with AIoT, and Professional supports scaling industrial operations. For mission-critical deployments, talk to us about Enterprise.",
  },
  {
    question: "Can I upgrade my plan as my deployment grows?",
    answer:
      "Yes. You can upgrade at any time and your devices, dashboards, and data carry over seamlessly. Changes take effect immediately and billing is prorated.",
  },
  {
    question: "Do you offer on-premise deployment?",
    answer:
      "Yes. Enterprise customers can deploy Paapeli on-premise, in private cloud environments, or in a hybrid architecture.",
  },
  {
    question: "What happens if I exceed my device limit?",
    answer:
      "Your devices keep running. We will notify you when you approach your limit so you can upgrade to a plan that fits your deployment.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes. The Free plan lets you evaluate Paapeli with up to 5 connected devices, no credit card required.",
  },
];

const SECONDARY_BUTTON_CLASSES =
  "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-medium text-[#4a5565] drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]";

const BillingToggle = ({ plan }: { plan: Plan }) => {
  if (plan.billing === "monthly-yearly") {
    return (
      <div className="flex h-9 items-center gap-0.5 rounded-xl bg-[#f3f4f6] p-1.5">
        <button className="flex h-6 items-center justify-center rounded-md bg-white px-2 py-1 text-xs font-medium text-[#101828]">
          Monthly
        </button>
        <button className="flex h-6 items-center justify-center rounded-lg px-2 py-1 text-xs font-medium text-[#4a5565]">
          Yearly
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
        Only monthly
      </span>
    </div>
  );
};

const PlanCard = ({ plan }: { plan: Plan }) => (
  <div className="flex flex-col border-b border-[#e5e7eb] last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
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
          <span className="text-[40px] font-bold leading-normal text-[#101828]">{plan.price}</span>
          {plan.pricePeriod && (
            <span className="text-base text-[#6a7282]">{plan.pricePeriod}</span>
          )}
        </div>
        <BillingToggle plan={plan} />
      </div>

      <p className="text-base text-[#4a5565]">{plan.description}</p>

      {plan.cta.variant === "primary" ? (
        <button className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff7900] px-4 py-2.5 text-sm font-medium text-white drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#e66d00]">
          {plan.cta.label}
          <ArrowRight className="size-4" />
        </button>
      ) : (
        <button className={SECONDARY_BUTTON_CLASSES}>
          {plan.cta.icon === "briefcase" && <Briefcase className="size-4" />}
          {plan.cta.label}
          {plan.cta.icon === "arrow" && <ArrowRight className="size-4" />}
        </button>
      )}
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

const PricingSection = () => {
  const [activeTab, setActiveTab] = useState<PricingTabKey>("subscription");

  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold text-[#101828] sm:text-[40px] sm:leading-normal">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[#4a5565]">
            We believe in a dynamic approach where continuous testing and audience engagement
            drive innovation, helping us refine ideas.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-10">
          {/* Pricing type tabs */}
          <div className="flex flex-wrap items-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)]">
            {PRICING_TABS.map(({ key, label, icon: Icon }, index) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#101828] transition-colors",
                  index < PRICING_TABS.length - 1 && "border-r border-[#e5e7eb]",
                  activeTab === key ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]/60",
                )}
              >
                <Icon className={cn("size-4", activeTab === key ? "text-[#101828]" : "text-[#4a5565]")} />
                {label}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div className="grid w-full grid-cols-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => (
  <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
    <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
      <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-[#101828] sm:text-[40px] sm:leading-normal">
          Why Paapeli
        </h2>
        <p className="text-lg text-[#4a5565]">
          Built for industrial operations, designed to transform data into actionable
          intelligence.
        </p>
      </div>

      <div className="grid w-full max-w-[1024px] grid-cols-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-6 drop-shadow-[0px_1px_1px_rgba(29,41,61,0.05)] sm:grid-cols-4">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col items-center gap-1 text-center",
              index < STATS.length - 1 && "sm:border-r sm:border-[#e5e7eb]",
              index % 2 === 0 && "border-r border-[#e5e7eb] sm:border-r",
              index === STATS.length - 1 && "sm:border-r-0",
            )}
          >
            <p className="text-[32px] font-semibold leading-normal text-[#101828]">{stat.value}</p>
            <p className="text-base text-[#4a5565]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FaqSection = () => {
  /* The design shows the third question expanded by default. */
  const [openIndex, setOpenIndex] = useState<number | null>(2);

  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        <h2 className="text-center text-3xl font-semibold leading-[1.25] tracking-[-0.4px] text-[#101828] sm:text-[40px]">
          Pricing FAQs
        </h2>

        <div className="flex w-full max-w-[695px] flex-col gap-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={faq.question} className="flex w-full flex-col drop-shadow-[0px_1px_1px_rgba(29,41,61,0.05)]">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    "flex w-full items-center gap-6 border border-[#e5e7eb] px-6 py-5 text-left transition-colors",
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
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar />

      <main>
        <PricingSection />
        <SocialProofSection />
        <FaqSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default function PricingPage() {
  return <Pricing />;
}
