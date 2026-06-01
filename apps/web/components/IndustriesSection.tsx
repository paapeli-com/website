"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import industryManufacturing from "@/src/assets/industry-manufacturing.jpg";

/* ------------------------------------------------------------------ */
/* Industries (tabbed). Figma only specifies the "Manufacturing" tab;  */
/* the other three carry placeholder copy in the same shape so the     */
/* tabs work end-to-end. Swap in real copy/images per industry later.  */
/* ------------------------------------------------------------------ */

type IndustryFeature = { title: string; description: string };

type Industry = {
  tab: string;
  heading: string;
  description: string;
  image: StaticImageData;
  features: IndustryFeature[];
};

const INDUSTRIES: Industry[] = [
  {
    tab: "Manufacturing",
    heading: "Reduce downtime and maximize production efficiency",
    description:
      "Gain full visibility into your production lines to identify bottlenecks early, reduce unplanned downtime, and continuously improve overall equipment effectiveness.",
    image: industryManufacturing,
    features: [
      {
        title: "Real-time production visibility",
        description: "Track machine performance and production status across all lines in real time.",
      },
      {
        title: "Downtime & OEE optimization",
        description:
          "Identify root causes of downtime and improve efficiency with continuous performance analysis.",
      },
      {
        title: "Predictive maintenance",
        description:
          "Anticipate equipment failures before they happen and reduce costly production interruptions.",
      },
    ],
  },
  {
    tab: "Oil & Gas",
    heading: "Operate safely and efficiently across remote sites",
    description:
      "Monitor wells, pipelines, and field assets in real time to improve safety, prevent leaks, and keep production flowing across distributed operations.",
    image: industryManufacturing,
    features: [
      {
        title: "Remote asset monitoring",
        description: "Track pressure, flow, and equipment health across every site from a single view.",
      },
      {
        title: "Leak & anomaly detection",
        description: "Detect abnormal conditions early to protect people, assets, and the environment.",
      },
      {
        title: "Regulatory compliance",
        description: "Automate reporting and maintain a complete audit trail of operational data.",
      },
    ],
  },
  {
    tab: "Energy & Utilities",
    heading: "Balance supply and demand with confidence",
    description:
      "Connect grid assets and metering infrastructure to improve reliability, reduce losses, and respond to demand changes in real time.",
    image: industryManufacturing,
    features: [
      {
        title: "Grid visibility",
        description: "Monitor distribution assets and consumption patterns across the network in real time.",
      },
      {
        title: "Outage prevention",
        description: "Predict faults and prioritize maintenance to minimize service interruptions.",
      },
      {
        title: "Demand optimization",
        description: "Use data-driven insights to balance load and reduce operational losses.",
      },
    ],
  },
  {
    tab: "Smart Infrastructure",
    heading: "Make buildings and facilities run smarter",
    description:
      "Bring HVAC, energy, and safety systems into one platform to cut costs, improve comfort, and extend the life of critical infrastructure.",
    image: industryManufacturing,
    features: [
      {
        title: "Unified building data",
        description: "Connect disparate systems into a single operational view across every facility.",
      },
      {
        title: "Energy efficiency",
        description: "Identify waste and optimize consumption to reduce costs and carbon footprint.",
      },
      {
        title: "Proactive maintenance",
        description: "Detect issues before they escalate and keep critical systems running reliably.",
      },
    ],
  },
];

export const IndustriesSection = () => {
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState(INDUSTRIES[0].tab);
  const active = INDUSTRIES.find((i) => i.tab === activeTab) ?? INDUSTRIES[0];

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20"
    >
      {/* Block heading */}
      <div className="flex w-full max-w-[768px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Built for Every Industrial Environment</h2>
        <p className="text-lg text-muted-foreground">
          Explore how Paapeli supports different industries with solutions that improve efficiency,
          reliability, and operational visibility.
        </p>
      </div>

      <div className="flex w-full max-w-[1280px] flex-col items-center gap-10">
        {/* Nav tabs */}
        <div className="flex w-full gap-6 overflow-x-auto border-b border-[#e5e7eb]" >
          {INDUSTRIES.map((industry) => {
            const isActive = industry.tab === activeTab;
            return (
              <button
                key={industry.tab}
                type="button"
                onClick={() => setActiveTab(industry.tab)}
                className={cn(
                  "-mb-px shrink-0 whitespace-nowrap border-b pb-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#d56300] text-[#d56300]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {industry.tab}
              </button>
            );
          })}
        </div>

        {/* Heading & image */}
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:gap-20">
          <div className="flex flex-1 flex-col items-start gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-3xl font-semibold text-foreground">{active.heading}</h3>
              <p className="text-base text-muted-foreground">{active.description}</p>
            </div>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              Learn More
            </Link>
          </div>

          <div className="relative aspect-[600/332] w-full flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] lg:aspect-auto lg:h-[332px]">
            <Image
              src={active.image}
              alt={active.tab}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
            {/* Subtle inner vignette to match the design */}
            <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0px_0px_60px_20px_rgba(0,0,0,0.18)]" />
          </div>
        </div>

        {/* Features */}
        <div className="flex w-full flex-col items-start justify-center gap-8 lg:flex-row lg:gap-12">
          {active.features.map((feature) => (
            <div key={feature.title} className="flex flex-1 items-start gap-2.5">
              <CircleCheck className="size-7 shrink-0 text-primary" />
              <div className="flex flex-col gap-2.5">
                <p className="text-xl font-semibold text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
