"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Check } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import trustedGreenhouse from "@/src/assets/trusted-greenhouse.jpg";

/* ------------------------------------------------------------------ */
/* "Trusted by" carousel. Figma only specifies the "Easy" slide; the   */
/* two others carry placeholder copy in the same shape so the carousel */
/* dots work end-to-end. Swap in real copy/images per slide later.     */
/* ------------------------------------------------------------------ */

type SlideItem = { title: string; description: string };

type Slide = {
  heading: string;
  description: string;
  image: StaticImageData;
  items: SlideItem[];
};

const SLIDES: Slide[] = [
  {
    heading: "Easy",
    description:
      "Deploy industrial AIoT solutions faster with a platform designed for simplicity and operational efficiency.",
    image: trustedGreenhouse,
    items: [
      { title: "Fast Onboarding", description: "Connect devices and gateways in minutes." },
      {
        title: "Ready-to-Use Templates",
        description: "Accelerate deployment using industrial solution templates.",
      },
      {
        title: "Built-in Operations",
        description: "Monitoring, alerts, OTA, and AI capabilities included out of the box.",
      },
    ],
  },
  {
    heading: "Scalable",
    description:
      "Grow from a single site to thousands of connected assets without re-architecting your platform.",
    image: trustedGreenhouse,
    items: [
      { title: "Elastic Infrastructure", description: "Scale compute and storage as your fleet grows." },
      { title: "Multi-Site Management", description: "Operate distributed sites from a single control plane." },
      { title: "High Throughput", description: "Ingest millions of data points with consistent performance." },
    ],
  },
  {
    heading: "Secure",
    description:
      "Protect your operations end to end with enterprise-grade security and compliance built in.",
    image: trustedGreenhouse,
    items: [
      { title: "End-to-End Encryption", description: "Secure data in transit and at rest by default." },
      { title: "Role-Based Access", description: "Control who can see and act on every resource." },
      { title: "Compliance Ready", description: "Meet industry standards with a complete audit trail." },
    ],
  },
];

export const TrustedSection = () => {
  const { isRTL } = useLanguage();
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center bg-white px-6 pb-16 pt-14 sm:pb-28 sm:pt-20"
    >
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
        {/* Block heading */}
        <div className="flex w-full max-w-[768px] flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Trusted by leading industrial teams</h2>
          <p className="max-w-[672px] text-lg text-muted-foreground">
            Enabling organizations to improve reliability, reduce downtime, and unlock operational
            intelligence.
          </p>
        </div>

        {/* Image + content */}
        <div className="flex w-full max-w-[1152px] flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16">
          {/* Image card with carousel dots */}
          <div className="relative flex h-[448px] w-full max-w-[384px] shrink-0 flex-col items-center justify-end overflow-hidden rounded-xl border border-[#e5e7eb] py-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
            <Image
              src={slide.image}
              alt={slide.heading}
              fill
              sizes="384px"
              className="object-cover"
            />
            {/* Subtle radial vignette to match the design */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.30)_100%)]" />

            <div className="relative flex items-center gap-1.5">
              {SLIDES.map((s, i) => (
                <button
                  key={s.heading}
                  type="button"
                  aria-label={`Show ${s.heading}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === active ? "h-2 w-3 bg-white" : "size-2 bg-[#d1d5dc] hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Left content */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-3xl font-semibold text-foreground">{slide.heading}</h3>
              <p className="text-base text-muted-foreground">{slide.description}</p>
            </div>

            <ul className="flex w-full flex-col gap-8 border-t border-[#f3f4f6] pt-8">
              {slide.items.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fff6ef]">
                    <Check className="size-7 text-primary" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
