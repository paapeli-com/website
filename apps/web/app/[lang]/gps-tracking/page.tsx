"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BatteryCharging,
  Bell,
  Briefcase,
  Car,
  ChevronRight,
  CircleCheck,
  Dog,
  History,
  MapPin,
  Radar,
  Siren,
  type LucideIcon,
} from "lucide-react";

import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import ctaGradient from "@/src/assets/cta-gradient.png";

/* ------------------------------------------------------------------ */
/* Tracking Hub — consumer GPS-tracking vertical landing page.        */
/* Built entirely on the existing landing design system (white        */
/* sections, max-w-[1280px], orange primary, rounded-xl bordered      */
/* cards). The centerpiece visuals are hand-built SVG "live map"      */
/* graphics; the three audience segments expose full-bleed image      */
/* frames meant to hold real photography (see SEGMENTS below).        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Live-map visual (shared by the hero and the showcase section).     */
/* Pure SVG streets + a dashed geofence, with lucide pin markers      */
/* positioned on top. No external asset required.                     */
/* ------------------------------------------------------------------ */

type Pin = {
  icon: LucideIcon;
  label: string;
  /* position as % of the frame */
  top: string;
  left: string;
  tint: string; // marker background
};

const MAP_PINS: Pin[] = [
  { icon: Dog, label: "Buddy", top: "34%", left: "30%", tint: "bg-primary" },
  { icon: Baby, label: "Mia", top: "58%", left: "58%", tint: "bg-[#0088b3]" },
  { icon: Car, label: "Car", top: "26%", left: "70%", tint: "bg-[#1e2939]" },
];

function LiveMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[600/470] w-full overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] shadow-[0px_10px_15px_-3px_rgba(29,41,61,0.1),0px_4px_6px_-4px_rgba(29,41,61,0.1)]",
        className,
      )}
    >
      {/* Street map */}
      <svg
        viewBox="0 0 600 470"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <rect width="600" height="470" fill="#f6f7f9" />
        {/* park / block fills */}
        <rect x="40" y="60" width="150" height="110" rx="14" fill="#eef3ee" />
        <rect x="410" y="300" width="150" height="120" rx="14" fill="#eef3ee" />
        <rect x="250" y="200" width="120" height="90" rx="12" fill="#eef1f5" />
        {/* river */}
        <path
          d="M-20 360 C 120 320 180 420 320 380 S 520 300 620 340"
          fill="none"
          stroke="#dbeafe"
          strokeWidth="26"
          strokeLinecap="round"
        />
        {/* streets */}
        <g stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round">
          <line x1="0" y1="120" x2="600" y2="120" />
          <line x1="0" y1="250" x2="600" y2="250" />
          <line x1="0" y1="400" x2="600" y2="400" />
          <line x1="120" y1="0" x2="120" y2="470" />
          <line x1="300" y1="0" x2="300" y2="470" />
          <line x1="460" y1="0" x2="460" y2="470" />
        </g>
        <g stroke="#eceef1" strokeWidth="4" strokeLinecap="round">
          <line x1="0" y1="185" x2="600" y2="185" />
          <line x1="0" y1="325" x2="600" y2="325" />
          <line x1="210" y1="0" x2="210" y2="470" />
          <line x1="380" y1="0" x2="380" y2="470" />
        </g>
        {/* geofence (safe zone) */}
        <circle
          cx="185"
          cy="175"
          r="98"
          fill="hsl(28 100% 50% / 0.08)"
          stroke="hsl(28 100% 50%)"
          strokeWidth="2.5"
          strokeDasharray="7 7"
        />
        {/* route trail */}
        <path
          d="M180 165 C 250 210 300 250 360 265 S 420 130 425 128"
          fill="none"
          stroke="hsl(28 100% 50%)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="3 9"
          opacity="0.7"
        />
      </svg>

      {/* Live badge */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/70" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        Live tracking
      </div>

      {/* Pin markers */}
      {MAP_PINS.map(({ icon: Icon, label, top, left, tint }) => (
        <div
          key={label}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ top, left }}
        >
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-white shadow-[0px_4px_10px_rgba(29,41,61,0.25)] ring-2 ring-white",
                tint,
              )}
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="-mt-0.5 size-2 rotate-45 rounded-[2px] bg-white ring-1 ring-[#e5e7eb]" />
          </div>
        </div>
      ))}

      {/* Bottom status card */}
      <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white/95 p-3 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] backdrop-blur">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fff6ef]">
          <MapPin className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Buddy is inside the Home zone</p>
          <p className="truncate text-xs text-muted-foreground">Updated 12 seconds ago · 8 m accuracy</p>
        </div>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Safe</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="flex w-full flex-col items-center bg-white px-0 py-16 sm:py-24">
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16">
        {/* Left content */}
        <div className="flex flex-col items-start gap-8 lg:max-w-[560px] lg:flex-1">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#ffcda1] bg-[#fff6ef] py-1 pl-1 pr-2 transition-colors hover:bg-[#ffe9d6]"
          >
            <span className="rounded-full bg-[#ffe1c4] px-2 py-0.5 text-xs font-medium text-[#9a4a00]">New</span>
            <span className="flex items-center gap-0.5 text-sm text-[#9a4a00]">
              Now tracking pets, kids &amp; vehicles
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </span>
          </Link>

          <div className="flex w-full flex-col gap-3">
            <h1 className="flex flex-col text-foreground">
              <span className="text-3xl font-light leading-tight sm:text-4xl">Real-time GPS tracking for</span>
              <span className="text-4xl font-semibold leading-tight sm:text-5xl">everything you love</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              One app to locate your pets, kids, and vehicles in real time — with geofencing, instant
              alerts, and full location history. Powered by Paapeli&rsquo;s AIoT platform.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
            >
              Start Free
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-3 text-base font-medium text-muted-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]"
            >
              <Briefcase className="size-4" />
              Contact Sales
            </Link>
          </div>

          {/* Quick audience chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { icon: Dog, label: "Pets" },
              { icon: Baby, label: "Kids" },
              { icon: Car, label: "Vehicles & Assets" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right visual */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <LiveMap className="max-w-[600px]" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Audience segments.                                                 */
/* Each card exposes a full-bleed image frame. To use real           */
/* photography, set `photo` to an imported StaticImageData and the    */
/* frame will bleed it edge-to-edge; until then a branded gradient +  */
/* icon placeholder is shown. Suggested shots:                        */
/*   Pets     → a dog/cat wearing a collar tracker, outdoors          */
/*   Kids     → a child with a wrist/backpack tracker                 */
/*   Vehicles → a car dashboard / parked car at dusk                  */
/* ------------------------------------------------------------------ */

type Segment = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  gradient: string; // placeholder frame background
};

const SEGMENTS: Segment[] = [
  {
    icon: Dog,
    eyebrow: "For Pets",
    title: "Never lose a furry friend",
    description:
      "A lightweight collar tracker keeps you connected to your pet, indoors and out — with live location and escape alerts.",
    points: ["Live location on a map", "Escape & safe-zone alerts", "Activity & walk history"],
    gradient: "from-[#ffb877] via-[#ff8a3d] to-[#f26a1b]",
  },
  {
    icon: Baby,
    eyebrow: "For Kids",
    title: "Peace of mind, every school run",
    description:
      "Know your child made it to school or a friend’s place. Set safe zones and get notified the moment they arrive or leave.",
    points: ["Arrival & departure alerts", "One-tap SOS button", "School & home safe zones"],
    gradient: "from-[#5cc6e6] via-[#22a7d0] to-[#0088b3]",
  },
  {
    icon: Car,
    eyebrow: "For Vehicles & Assets",
    title: "Track cars, bikes & valuables",
    description:
      "A discreet tracker guards your car, motorbike, or high-value gear — with tamper alerts and full trip history.",
    points: ["Real-time vehicle location", "Tamper & movement alerts", "Detailed trip history"],
    gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
  },
];

function SegmentCard({ segment }: { segment: Segment }) {
  const { icon: Icon } = segment;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
      {/* Full-bleed image frame (photo placeholder) */}
      <div
        className={cn(
          "relative h-52 w-full overflow-hidden bg-gradient-to-br",
          segment.gradient,
        )}
      >
        {/* soft map-grid texture so the placeholder reads as intentional */}
        <svg
          viewBox="0 0 400 208"
          className="absolute inset-0 h-full w-full opacity-25"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
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
        {/* eyebrow chip */}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
          {segment.eyebrow}
        </span>
        {/* large icon */}
        <Icon className="absolute -bottom-2 -right-2 size-28 text-white/90 drop-shadow-lg" strokeWidth={1.25} />
      </div>

      {/* Body */}
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

function Segments() {
  return (
    <section className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20">
      <div className="flex w-full max-w-[768px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Built for the people &mdash; and things &mdash; you care about
        </h2>
        <p className="text-lg text-muted-foreground">
          One platform, three peace-of-mind use cases. Add a tracker, open the app, and stay connected
          to what matters most.
        </p>
      </div>

      <div className="grid w-full max-w-[1152px] grid-cols-1 gap-6 md:grid-cols-3">
        {SEGMENTS.map((segment) => (
          <SegmentCard key={segment.title} segment={segment} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature grid                                                       */
/* ------------------------------------------------------------------ */

type Feature = { icon: LucideIcon; title: string; description: string };

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: "Real-Time Location",
    description: "See exactly where your tracker is on a live map, updated every few seconds with meter-level accuracy.",
  },
  {
    icon: Radar,
    title: "Geofencing & Safe Zones",
    description: "Draw safe zones around home, school, or the office and get notified on every arrival and departure.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Push, SMS, and email alerts the moment a tracker leaves a zone, moves unexpectedly, or runs low on battery.",
  },
  {
    icon: History,
    title: "Location History",
    description: "Replay routes and review where your pet, child, or vehicle has been over the last days and weeks.",
  },
  {
    icon: BatteryCharging,
    title: "Long Battery Life",
    description: "Smart power management keeps trackers running for up to 7 days on a single charge, with low-battery reminders.",
  },
  {
    icon: Siren,
    title: "SOS & Two-Way",
    description: "A dedicated SOS button sends an instant location ping to your circle, with optional two-way voice on supported devices.",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon } = feature;
  return (
    <div className="flex flex-col items-start gap-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-7 text-left shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
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

function Features() {
  return (
    <section className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20">
      <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Everything you need to never lose track</h2>
        <p className="text-lg text-muted-foreground">
          A complete tracking toolkit, built on the same reliable infrastructure that powers Paapeli&rsquo;s
          industrial IoT platform.
        </p>
      </div>

      <div className="grid w-full max-w-[1152px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase — big live map + feature bullets                          */
/* ------------------------------------------------------------------ */

const SHOWCASE_POINTS: Feature[] = [
  {
    icon: MapPin,
    title: "Everyone on one map",
    description: "Pets, kids, and vehicles side by side in a single live view — no app-switching.",
  },
  {
    icon: Radar,
    title: "Safe zones that just work",
    description: "Set it once and let automatic geofencing do the watching for you.",
  },
  {
    icon: Bell,
    title: "Alerts you can trust",
    description: "Get the right notification at the right moment, without the noise.",
  },
];

function Showcase() {
  const { isRTL } = useLanguage();
  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1152px] flex-col items-center gap-10 lg:flex-row lg:gap-16">
        {/* Text */}
        <div className="flex flex-1 flex-col items-start gap-8">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">See everything on one live map</h2>
            <p className="text-base text-muted-foreground">
              Whether it&rsquo;s your dog in the backyard, your child on the way home, or your car across
              town, the whole family shows up on a single, real-time map you can check at a glance.
            </p>
          </div>

          <ul className="flex w-full flex-col gap-6">
            {SHOWCASE_POINTS.map(({ icon: Icon, title, description }) => (
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

          <Link
            href="#"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-primary/90"
          >
            Explore the app
            <ArrowRight className={cn("size-4", isRTL && "rotate-180")} />
          </Link>
        </div>

        {/* Visual */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <LiveMap className="max-w-[560px]" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats band                                                         */
/* ------------------------------------------------------------------ */

const STATS: { stat: string; label: string }[] = [
  { stat: "8 m", label: "Location accuracy" },
  { stat: "7-day", label: "Battery life" },
  { stat: "99.9%", label: "Network uptime" },
  { stat: "24/7", label: "Real-time alerts" },
];

function Stats() {
  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-6 sm:py-10">
      <div className="w-full max-w-[1152px] rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map(({ stat, label }) => (
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

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

const STEPS: { step: string; title: string; description: string }[] = [
  {
    step: "1",
    title: "Attach the tracker",
    description: "Clip it to a collar, slip it into a backpack, or hide it in your car — setup takes under a minute.",
  },
  {
    step: "2",
    title: "Open the app",
    description: "Pair the device, name it, and draw your safe zones. Everything lives in one simple dashboard.",
  },
  {
    step: "3",
    title: "Stay in the loop",
    description: "Watch live locations and get instant alerts whenever something needs your attention.",
  },
];

function HowItWorks() {
  return (
    <section className="flex w-full flex-col items-center gap-10 bg-white px-6 py-14 sm:gap-12 sm:py-20">
      <div className="flex w-full max-w-[672px] flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Up and running in minutes</h2>
        <p className="text-lg text-muted-foreground">
          No technical setup, no contracts. Three simple steps to complete peace of mind.
        </p>
      </div>

      <div className="grid w-full max-w-[1024px] grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map(({ step, title, description }) => (
          <div key={step} className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)]">
              {step}
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-xl font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA (mirrors the homepage CtaSection styling)              */
/* ------------------------------------------------------------------ */

function Cta() {
  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:py-20">
      <div className="flex w-full max-w-[1280px] items-center justify-center">
        <div
          className="relative flex w-full max-w-[1024px] flex-col items-start gap-8 overflow-hidden rounded-2xl border border-[#ffcda1] bg-white bg-cover bg-center p-8 shadow-[0px_1px_2px_0px_rgba(29,41,61,0.05)] sm:p-14"
          style={{ backgroundImage: `url(${ctaGradient.src})` }}
        >
          <div className="relative flex w-full max-w-[640px] flex-col items-start gap-4 text-[#101828]">
            <h2 className="max-w-[560px] text-3xl font-semibold sm:text-[40px] sm:leading-normal">
              Start tracking what matters today
            </h2>
            <p className="max-w-[600px] text-lg">
              Set up your first tracker in minutes and keep your pets, kids, and vehicles safe — all from
              one app.
            </p>
          </div>

          <div className="relative flex flex-wrap items-start gap-4">
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1e2939] px-5 py-3 text-base font-medium text-white drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#101828]"
            >
              Start Free
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-3 text-base font-medium text-[#4a5565] drop-shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors hover:bg-[#f3f4f6]"
            >
              <Briefcase className="size-4" />
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function GpsTrackingPage() {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar />
      <main>
        <Hero />
        <Segments />
        <Features />
        <Showcase />
        <Stats />
        <HowItWorks />
        <Cta />
      </main>
      <LandingFooter />
    </div>
  );
}
