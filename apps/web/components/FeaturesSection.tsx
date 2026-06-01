"use client";

import Image, { type StaticImageData } from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import featurePattern from "@/src/assets/feature-pattern.svg";
import heroRobot from "@/src/assets/hero-robot.png";
import featureChart from "@/src/assets/feature-chart.png";
import featureShield from "@/src/assets/feature-shield.png";
import featureServer from "@/src/assets/feature-server.png";

/* ------------------------------------------------------------------ */
/* Feature cards (English copy from Figma).                           */
/* `wide` cards grow to fill the row; the others are a fixed 448px.    */
/* `imageClass` positions the bleed illustration in the card corner.   */
/* ------------------------------------------------------------------ */

type Feature = {
  title: string;
  description: string;
  image: StaticImageData;
  imageClass: string;
  wide: boolean;
};

const FEATURES: Feature[] = [
  {
    title: "Asset Connectivity",
    description: "Connect machines, sensors, and systems into a unified industrial data layer.",
    image: heroRobot,
    imageClass: "size-[200px] sm:size-[340px] sm:-right-[24px] sm:-bottom-[66px]",
    wide: true,
  },
  {
    title: "Real-Time Operations",
    description: "Gain real-time visibility and control over your operations to improve reliability.",
    image: featureChart,
    imageClass: "size-[200px] sm:size-[340px] sm:-right-[30px] sm:-bottom-[80px]",
    wide: false,
  },
  {
    title: "Operations Optimization",
    description: "Improve efficiency and reduce downtime through data-driven operational insights.",
    image: featureShield,
    imageClass: "size-[190px] sm:size-[330px] sm:-right-[50px] sm:-bottom-[28px]",
    wide: false,
  },
  {
    title: "AI Performance",
    description: "Leverage AI to predict failures, optimize performance, and enable smarter decisions.",
    image: featureServer,
    imageClass: "size-[200px] sm:size-[330px] sm:-right-[36px] sm:-bottom-[6px]",
    wide: true,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      className={`relative h-[348px] overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb] pt-8 ${
        feature.wide ? "lg:flex-1" : "lg:w-[448px] lg:shrink-0"
      }`}
    >
      {/* Decorative diagonal-line pattern bleeding off the top-right corner */}
      <Image
        src={featurePattern}
        alt=""
        aria-hidden
        width={768}
        height={768}
        className="pointer-events-none absolute left-[60%] top-[31px] size-[768px] max-w-none"
      />

      <div className="relative flex flex-col gap-2 px-8">
        <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
        <p className="text-base text-muted-foreground">{feature.description}</p>
      </div>

      {/* Bleed illustration anchored to the bottom-right corner */}
      <Image
        src={feature.image}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 max-w-none object-contain sm:bottom-auto sm:left-auto sm:translate-x-0 ${feature.imageClass}`}
      />
    </div>
  );
}

export const FeaturesSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-10 bg-white px-6 pb-14 pt-10 sm:gap-12 sm:pb-20"
    >
      {/* Block heading */}
      <div className="flex w-full max-w-[896px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Drive Performance Across Your Operations</h2>
        <p className="text-lg text-muted-foreground">
          Paapeli helps industrial teams unlock efficiency, reduce operational losses, and make smarter
          decisions at scale.
        </p>
      </div>

      {/* Grid: two rows with alternating wide/narrow cards */}
      <div className="flex w-full max-w-[1024px] flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <FeatureCard feature={FEATURES[0]} />
          <FeatureCard feature={FEATURES[1]} />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <FeatureCard feature={FEATURES[2]} />
          <FeatureCard feature={FEATURES[3]} />
        </div>
      </div>
    </section>
  );
};
