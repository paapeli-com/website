import {
  Baby,
  BatteryCharging,
  Bell,
  Car,
  Dog,
  History,
  MapPin,
  Radar,
  Siren,
} from "lucide-react";

import { LiveMapVisual } from "@/components/vertical/visuals";
import { PANEL_URL } from "@/lib/panel";
import type { VerticalConfig } from "@/components/vertical/types";

/* Tracking Hub: consumer GPS tracking for pets, kids and vehicles.   */
/* To use real photography, add `image: importedPhoto` to any segment; */
/* it will bleed edge-to-edge and replace the gradient placeholder.    */

export const gpsTrackingConfig: VerticalConfig = {
  slug: "gps-tracking",

  badge: "New",
  eyebrow: "Now tracking pets, kids & vehicles",
  titleTop: "Real-time GPS tracking for",
  titleBottom: "everything you love",
  subtitle:
    "One app to locate your pets, kids, and vehicles in real time, with geofencing, instant alerts, and full location history. Powered by Paapeli’s AIoT platform.",
  primaryCta: { label: "Start Free", href: PANEL_URL },
  secondaryCta: { label: "Contact Sales", href: "/contact" },
  chips: [
    { icon: Dog, label: "Pets" },
    { icon: Baby, label: "Kids" },
    { icon: Car, label: "Vehicles & Assets" },
  ],
  heroVisual: <LiveMapVisual className="max-w-[600px]" />,

  segments: {
    heading: "Built for the people and things you care about",
    subtitle:
      "One platform, three peace-of-mind use cases. Add a tracker, open the app, and stay connected to what matters most.",
    items: [
      {
        icon: Dog,
        eyebrow: "For Pets",
        title: "Never lose a furry friend",
        description:
          "A lightweight collar tracker keeps you connected to your pet, indoors and out, with live location and escape alerts.",
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
          "A discreet tracker guards your car, motorbike, or high-value gear, with tamper alerts and full trip history.",
        points: ["Real-time vehicle location", "Tamper & movement alerts", "Detailed trip history"],
        gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
      },
    ],
  },

  features: {
    heading: "Everything you need to never lose track",
    subtitle:
      "A complete tracking toolkit, built on the same reliable infrastructure that powers Paapeli’s industrial IoT platform.",
    items: [
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
    ],
  },

  showcase: {
    heading: "See everything on one live map",
    subtitle:
      "Whether it’s your dog in the backyard, your child on the way home, or your car across town, the whole family shows up on a single, real-time map you can check at a glance.",
    points: [
      { icon: MapPin, title: "Everyone on one map", description: "Pets, kids, and vehicles side by side in a single live view, with no app-switching." },
      { icon: Radar, title: "Safe zones that just work", description: "Set it once and let automatic geofencing do the watching for you." },
      { icon: Bell, title: "Alerts you can trust", description: "Get the right notification at the right moment, without the noise." },
    ],
    cta: { label: "Explore the app", href: PANEL_URL },
    visual: <LiveMapVisual className="max-w-[560px]" />,
  },

  stats: [
    { stat: "8 m", label: "Location accuracy" },
    { stat: "7-day", label: "Battery life" },
    { stat: "99.9%", label: "Network uptime" },
    { stat: "24/7", label: "Real-time alerts" },
  ],

  steps: {
    heading: "Up and running in minutes",
    subtitle: "No technical setup, no contracts. Three simple steps to complete peace of mind.",
    items: [
      { title: "Attach the tracker", description: "Clip it to a collar, slip it into a backpack, or hide it in your car. Setup takes under a minute." },
      { title: "Open the app", description: "Pair the device, name it, and draw your safe zones. Everything lives in one simple dashboard." },
      { title: "Stay in the loop", description: "Watch live locations and get instant alerts whenever something needs your attention." },
    ],
  },

  faq: {
    heading: "Frequently asked questions",
    subtitle: "Everything you need to know about tracking with Paapeli.",
    items: [
      { q: "How accurate is the location?", a: "Outdoors, trackers reach roughly 8 metres of accuracy using GPS. Indoors, Wi-Fi and cell positioning keep you within the right building or block." },
      { q: "How long does the battery last?", a: "Up to 7 days on a single charge depending on how often you request live updates. You’ll get a reminder before it runs low." },
      { q: "Does it work for pets, kids, and cars?", a: "Yes, the same app manages every tracker. Choose a collar tracker for pets, a compact tag for kids, and a hardwired or magnetic tracker for vehicles." },
      { q: "Is my family’s data secure?", a: "All location data is encrypted in transit and at rest, and only people you invite to your circle can see it." },
    ],
  },

  cta: {
    title: "Start tracking what matters today",
    subtitle: "Set up your first tracker in minutes and keep your pets, kids, and vehicles safe, all from one app.",
    primary: { label: "Start Free", href: PANEL_URL },
    secondary: { label: "Contact Sales", href: "/contact" },
  },
};
