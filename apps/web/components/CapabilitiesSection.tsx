"use client";

import Image, { type StaticImageData } from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import capCompass from "@/src/assets/cap-compass.png";
import capGears from "@/src/assets/cap-gears.png";
import capRocket from "@/src/assets/cap-rocket.png";
import capClipboard from "@/src/assets/cap-clipboard.png";

/* ------------------------------------------------------------------ */
/* Core platform capabilities (English copy from Figma).              */
/* The four 3D icons are reused across the eight cards. Each icon is   */
/* centered and clipped inside a 116px box at its design size.         */
/* ------------------------------------------------------------------ */

type Capability = {
  title: string;
  description: string;
  icon: StaticImageData;
  iconSize: number;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Flexible Deployment",
    description:
      "Deploy Paapeli on cloud or on-premise based on your infrastructure, security, and compliance requirements.",
    icon: capCompass,
    iconSize: 132,
  },
  {
    title: "Device & Gateway Management",
    description:
      "Manage devices and gateways at scale with support for industrial protocols such as MQTT, OPC-UA, and Modbus.",
    icon: capGears,
    iconSize: 132,
  },
  {
    title: "Real-Time Monitoring",
    description:
      "Track device data and system performance in real time to gain full visibility across your operations.",
    icon: capRocket,
    iconSize: 132,
  },
  {
    title: "Alerts & Event Management",
    description:
      "Detect critical events instantly and trigger alerts to respond quickly before issues escalate.",
    icon: capClipboard,
    iconSize: 124,
  },
  {
    title: "OTA Updates",
    description: "We ensure Paapeli stays secure, spam-free, and protected for your safety.",
    icon: capCompass,
    iconSize: 132,
  },
  {
    title: "Anomaly Detection",
    description:
      "Identify abnormal patterns in your data to detect issues early and prevent unexpected failures.",
    icon: capGears,
    iconSize: 132,
  },
  {
    title: "Predictive Analytics",
    description:
      "Analyze trends and predict equipment failures to optimize maintenance and improve reliability.",
    icon: capRocket,
    iconSize: 132,
  },
  {
    title: "Solution Templates",
    description:
      "Use ready-to-deploy templates tailored for different industries to accelerate implementation and reduce time to value.",
    icon: capClipboard,
    iconSize: 124,
  },
];

function CapabilityCard({ capability }: { capability: Capability }) {
  return (
    <div className="flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-7 text-center shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:items-start sm:text-left">
      <div className="relative size-[116px] shrink-0 overflow-hidden">
        <Image
          src={capability.icon}
          alt=""
          aria-hidden
          width={capability.iconSize}
          height={capability.iconSize}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-foreground">{capability.title}</h3>
        <p className="text-sm text-muted-foreground">{capability.description}</p>
      </div>
    </div>
  );
}

export const CapabilitiesSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20"
    >
      {/* Block heading */}
      <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Core Platform Capabilities</h2>
        <p className="text-lg text-muted-foreground">
          Explore the key features that power Paapeli and enable efficient, reliable, and scalable
          operations.
        </p>
      </div>

      {/* 4×2 capability grid */}
      <div className="grid w-full max-w-[1280px] grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((capability) => (
          <CapabilityCard key={capability.title} capability={capability} />
        ))}
      </div>
    </section>
  );
};
