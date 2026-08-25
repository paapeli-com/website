import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Cloud,
  Cpu,
  Factory,
  Gauge,
  LineChart,
  Network,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wifi,
  Workflow,
  Zap,
} from "lucide-react";

import { OrbitVisual } from "@/components/vertical/visuals";
import type { VerticalConfig } from "@/components/vertical/types";

/* ------------------------------------------------------------------ */
/* Sibling Solution hubs, all rendered through the same template.     */
/* They share the generic OrbitVisual instead of the bespoke map, so   */
/* adding another vertical is purely a matter of writing a config.     */
/* ------------------------------------------------------------------ */

const CONTACT = "/contact";

export const operationsHubConfig: VerticalConfig = {
  slug: "operations-hub",
  eyebrow: "Operations Hub",
  titleTop: "Unified operational visibility for",
  titleBottom: "industrial environments",
  subtitle:
    "Monitor every asset, process, and site in real time, with AI-driven insight that turns raw data into operational decisions.",
  primaryCta: { label: "Start Free", href: "#" },
  secondaryCta: { label: "Contact Sales", href: CONTACT },
  chips: [
    { icon: Activity, label: "Real-time monitoring" },
    { icon: AlertTriangle, label: "Alerts & events" },
    { icon: BarChart3, label: "Analytics" },
  ],
  heroVisual: <OrbitVisual icon={Gauge} nodes={[Activity, AlertTriangle, BarChart3, Workflow]} />,
  segments: {
    heading: "One control plane for your entire operation",
    subtitle: "Bring people, processes, and machines into a single operational view built for the shop floor and the field.",
    items: [
      {
        icon: Activity,
        eyebrow: "Monitor",
        title: "Real-time operations",
        description: "Track machine performance and production status across every line and site as it happens.",
        points: ["Live dashboards", "Multi-site visibility", "Custom KPIs"],
        gradient: "from-[#ffb877] via-[#ff8a3d] to-[#f26a1b]",
      },
      {
        icon: AlertTriangle,
        eyebrow: "Respond",
        title: "Alerts & event management",
        description: "Detect critical events instantly and route the right alert to the right team before issues escalate.",
        points: ["Threshold & anomaly alerts", "Escalation rules", "Full audit trail"],
        gradient: "from-[#5cc6e6] via-[#22a7d0] to-[#0088b3]",
      },
      {
        icon: BarChart3,
        eyebrow: "Improve",
        title: "Performance analytics",
        description: "Turn operational data into OEE, downtime, and efficiency insights that drive continuous improvement.",
        points: ["OEE & downtime analysis", "Trend reporting", "Data export & API"],
        gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
      },
    ],
  },
  features: {
    heading: "Everything you need to run operations at scale",
    subtitle: "A complete operational toolkit on top of the Paapeli AIoT platform.",
    items: [
      { icon: Activity, title: "Live Dashboards", description: "Configurable, real-time dashboards for every role and site." },
      { icon: AlertTriangle, title: "Smart Alerts", description: "Threshold and AI-based alerts with escalation and on-call routing." },
      { icon: BarChart3, title: "OEE & KPIs", description: "Track overall equipment effectiveness and the metrics that matter." },
      { icon: Workflow, title: "Automated Workflows", description: "Trigger actions and tickets automatically from operational events." },
      { icon: Gauge, title: "Downtime Insights", description: "Pinpoint root causes of downtime and prioritise what to fix first." },
      { icon: ShieldCheck, title: "Enterprise Security", description: "Role-based access, encryption, and a complete audit trail by default." },
    ],
  },
  showcase: {
    heading: "See your whole operation on one screen",
    subtitle: "From a single line to thousands of assets across sites, Operations Hub keeps everyone looking at the same live picture.",
    points: [
      { icon: Activity, title: "Unified visibility", description: "Every asset and process in one real-time operational view." },
      { icon: TrendingUp, title: "Measurable gains", description: "Reduce downtime and lift efficiency with data-driven decisions." },
      { icon: ShieldCheck, title: "Secure by design", description: "Enterprise-grade access control and auditability built in." },
    ],
    cta: { label: "Explore Operations Hub", href: "#" },
    visual: <OrbitVisual icon={Gauge} nodes={[Activity, BarChart3, Workflow, TrendingUp]} />,
  },
  stats: [
    { stat: "30%", label: "Less downtime" },
    { stat: "3×", label: "Faster response" },
    { stat: "99.9%", label: "Uptime" },
    { stat: "24/7", label: "Monitoring" },
  ],
  steps: {
    heading: "From data to decisions in three steps",
    subtitle: "Connect your assets and start operating smarter, with no rip-and-replace required.",
    items: [
      { title: "Connect assets", description: "Onboard machines and gateways with support for MQTT, OPC-UA, and Modbus." },
      { title: "Configure views", description: "Build dashboards, KPIs, and alert rules tailored to each team." },
      { title: "Operate smarter", description: "Act on real-time insight and continuously improve performance." },
    ],
  },
  cta: {
    title: "Bring your operations into focus",
    subtitle: "See how Operations Hub helps you monitor, respond, and improve across every site.",
    primary: { label: "Start Free", href: "#" },
    secondary: { label: "Contact Sales", href: CONTACT },
  },
};

export const edgeHubConfig: VerticalConfig = {
  slug: "edge-hub",
  eyebrow: "Edge Hub",
  titleTop: "Connect and manage devices",
  titleBottom: "at the edge, at scale",
  subtitle:
    "Onboard, monitor, and update industrial assets and edge devices across every site, with support for the protocols your equipment already speaks.",
  primaryCta: { label: "Start Free", href: "#" },
  secondaryCta: { label: "Contact Sales", href: CONTACT },
  chips: [
    { icon: Wifi, label: "Device management" },
    { icon: RefreshCw, label: "OTA updates" },
    { icon: Cpu, label: "Edge compute" },
  ],
  heroVisual: <OrbitVisual icon={Network} nodes={[Wifi, Cpu, RefreshCw, Radio]} />,
  segments: {
    heading: "The connectivity layer for your fleet",
    subtitle: "From a handful of gateways to thousands of distributed devices, Edge Hub keeps everything connected and current.",
    items: [
      {
        icon: Wifi,
        eyebrow: "Connect",
        title: "Device & gateway management",
        description: "Provision and manage devices at scale with MQTT, OPC-UA, Modbus, and HTTP out of the box.",
        points: ["Zero-touch onboarding", "Protocol support", "Fleet grouping"],
        gradient: "from-[#ffb877] via-[#ff8a3d] to-[#f26a1b]",
      },
      {
        icon: RefreshCw,
        eyebrow: "Update",
        title: "Secure OTA updates",
        description: "Roll out firmware and edge software remotely with staged deployments and automatic rollback.",
        points: ["Staged rollouts", "Automatic rollback", "Signed firmware"],
        gradient: "from-[#5cc6e6] via-[#22a7d0] to-[#0088b3]",
      },
      {
        icon: Cpu,
        eyebrow: "Compute",
        title: "Edge & hybrid deployment",
        description: "Run workloads on cloud, on-premise, or at the edge based on latency and compliance needs.",
        points: ["Low-latency processing", "Offline resilience", "Hybrid topologies"],
        gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
      },
    ],
  },
  features: {
    heading: "A complete edge management toolkit",
    subtitle: "Everything you need to keep a distributed fleet healthy and up to date.",
    items: [
      { icon: Wifi, title: "Multi-Protocol", description: "Talk to industrial equipment over MQTT, OPC-UA, Modbus, and HTTP." },
      { icon: RefreshCw, title: "OTA Updates", description: "Ship firmware and software updates safely with staged rollouts." },
      { icon: Cpu, title: "Edge Runtime", description: "Process data locally for low latency and offline resilience." },
      { icon: Radio, title: "Remote Diagnostics", description: "Inspect device health and logs without a site visit." },
      { icon: ShieldCheck, title: "Secure by Default", description: "Mutual TLS, signed updates, and per-device credentials." },
      { icon: Server, title: "Scales to Millions", description: "Grow from one gateway to a global fleet without re-architecting." },
    ],
  },
  showcase: {
    heading: "Manage every device from one place",
    subtitle: "Edge Hub gives you a single pane of glass for onboarding, monitoring, and updating your entire device fleet.",
    points: [
      { icon: Wifi, title: "Any device, any protocol", description: "Connect the equipment you already have, no gateways to rip out." },
      { icon: RefreshCw, title: "Always up to date", description: "Push updates fleet-wide with confidence and easy rollback." },
      { icon: Cpu, title: "Compute where it counts", description: "Keep critical logic running at the edge, even when offline." },
    ],
    cta: { label: "Explore Edge Hub", href: "#" },
    visual: <OrbitVisual icon={Network} nodes={[Wifi, RefreshCw, Cpu, Server]} />,
  },
  stats: [
    { stat: "1M+", label: "Devices supported" },
    { stat: "4", label: "Core protocols" },
    { stat: "<10 ms", label: "Edge latency" },
    { stat: "0", label: "Downtime rollouts" },
  ],
  steps: {
    heading: "Connect your fleet in three steps",
    subtitle: "Onboard devices and start managing them from a single console.",
    items: [
      { title: "Onboard devices", description: "Register gateways and devices with zero-touch provisioning." },
      { title: "Monitor health", description: "Track connectivity, telemetry, and device status in real time." },
      { title: "Update remotely", description: "Deploy OTA updates safely across the entire fleet." },
    ],
  },
  cta: {
    title: "Bring your edge under control",
    subtitle: "See how Edge Hub connects, monitors, and updates devices at any scale.",
    primary: { label: "Start Free", href: "#" },
    secondary: { label: "Contact Sales", href: CONTACT },
  },
};

export const intelligenceHubConfig: VerticalConfig = {
  slug: "intelligence-hub",
  eyebrow: "Intelligence Hub",
  titleTop: "Predict, detect, and optimize",
  titleBottom: "with industrial AI",
  subtitle:
    "Turn operational data into foresight: predict failures before they happen, detect anomalies in real time, and continuously optimize performance.",
  primaryCta: { label: "Start Free", href: "#" },
  secondaryCta: { label: "Contact Sales", href: CONTACT },
  chips: [
    { icon: BrainCircuit, label: "Predictive AI" },
    { icon: Sparkles, label: "Anomaly detection" },
    { icon: LineChart, label: "Optimization" },
  ],
  heroVisual: <OrbitVisual icon={BrainCircuit} nodes={[Sparkles, LineChart, TrendingUp, AlertTriangle]} />,
  segments: {
    heading: "AI that works on your operational data",
    subtitle: "From predictive maintenance to process optimization, Intelligence Hub applies AI where it moves the needle.",
    items: [
      {
        icon: TrendingUp,
        eyebrow: "Predict",
        title: "Predictive maintenance",
        description: "Anticipate equipment failures before they happen and schedule maintenance on your terms.",
        points: ["Failure prediction", "Remaining useful life", "Maintenance scheduling"],
        gradient: "from-[#ffb877] via-[#ff8a3d] to-[#f26a1b]",
      },
      {
        icon: Sparkles,
        eyebrow: "Detect",
        title: "Anomaly detection",
        description: "Spot abnormal patterns in real time to catch issues long before they become failures.",
        points: ["Real-time detection", "Self-learning baselines", "Root-cause hints"],
        gradient: "from-[#5cc6e6] via-[#22a7d0] to-[#0088b3]",
      },
      {
        icon: LineChart,
        eyebrow: "Optimize",
        title: "Performance optimization",
        description: "Continuously tune processes with data-driven recommendations that improve yield and efficiency.",
        points: ["Process tuning", "Yield optimization", "What-if analysis"],
        gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
      },
    ],
  },
  features: {
    heading: "Industrial AI, ready to deploy",
    subtitle: "Models and tooling designed for real operational data, not a data-science project.",
    items: [
      { icon: BrainCircuit, title: "Predictive Models", description: "Forecast failures and remaining useful life from your telemetry." },
      { icon: Sparkles, title: "Anomaly Detection", description: "Detect abnormal behaviour with self-learning baselines." },
      { icon: LineChart, title: "Optimization", description: "Get recommendations that lift yield, quality, and efficiency." },
      { icon: AlertTriangle, title: "Early Warnings", description: "Surface issues early with confidence-scored alerts." },
      { icon: Workflow, title: "Closed-Loop Actions", description: "Feed insights back into workflows and control systems." },
      { icon: BarChart3, title: "Explainable Insight", description: "Understand the why behind every prediction and alert." },
    ],
  },
  showcase: {
    heading: "From reactive to predictive",
    subtitle: "Intelligence Hub layers AI on top of your existing data so you can act before problems happen, not after.",
    points: [
      { icon: TrendingUp, title: "Fewer surprises", description: "Predict failures and plan maintenance before breakdowns." },
      { icon: Sparkles, title: "Catch it early", description: "Real-time anomaly detection flags issues as they emerge." },
      { icon: LineChart, title: "Always improving", description: "Continuous optimization compounds gains over time." },
    ],
    cta: { label: "Explore Intelligence Hub", href: "#" },
    visual: <OrbitVisual icon={BrainCircuit} nodes={[TrendingUp, Sparkles, LineChart, Workflow]} />,
  },
  stats: [
    { stat: "40%", label: "Fewer failures" },
    { stat: "25%", label: "Lower costs" },
    { stat: "2 weeks", label: "Earlier warnings" },
    { stat: "95%", label: "Detection accuracy" },
  ],
  steps: {
    heading: "Add intelligence in three steps",
    subtitle: "Point AI at your operational data and start acting on foresight.",
    items: [
      { title: "Connect your data", description: "Stream telemetry from assets already on the platform." },
      { title: "Train & tune", description: "Models learn your normal and adapt to your operation." },
      { title: "Act on insight", description: "Receive predictions, anomalies, and recommendations in real time." },
    ],
  },
  cta: {
    title: "Put your data to work",
    subtitle: "See how Intelligence Hub predicts failures, detects anomalies, and optimizes performance.",
    primary: { label: "Start Free", href: "#" },
    secondary: { label: "Contact Sales", href: CONTACT },
  },
};

export const infrastructureHubConfig: VerticalConfig = {
  slug: "infrastructure-hub",
  eyebrow: "Infrastructure Hub",
  titleTop: "Operational intelligence for",
  titleBottom: "mission-critical infrastructure",
  subtitle:
    "Monitor and manage the systems the world depends on: energy, utilities and critical facilities, with the reliability and security they demand.",
  primaryCta: { label: "Start Free", href: "#" },
  secondaryCta: { label: "Contact Sales", href: CONTACT },
  chips: [
    { icon: Zap, label: "Energy & utilities" },
    { icon: Factory, label: "Critical facilities" },
    { icon: Cloud, label: "Distributed sites" },
  ],
  heroVisual: <OrbitVisual icon={Server} nodes={[Zap, Factory, Cloud, ShieldCheck]} />,
  segments: {
    heading: "Built for infrastructure that can't fail",
    subtitle: "Infrastructure Hub brings distributed, mission-critical systems into one resilient operational platform.",
    items: [
      {
        icon: Zap,
        eyebrow: "Energy",
        title: "Grid & utility monitoring",
        description: "Balance supply and demand and reduce losses across metering and distribution infrastructure.",
        points: ["Grid visibility", "Outage prevention", "Demand optimization"],
        gradient: "from-[#ffb877] via-[#ff8a3d] to-[#f26a1b]",
      },
      {
        icon: Factory,
        eyebrow: "Facilities",
        title: "Critical facility operations",
        description: "Bring HVAC, power, and safety systems into one view to cut costs and protect uptime.",
        points: ["Unified building data", "Energy efficiency", "Proactive maintenance"],
        gradient: "from-[#5cc6e6] via-[#22a7d0] to-[#0088b3]",
      },
      {
        icon: Cloud,
        eyebrow: "Scale",
        title: "Distributed site management",
        description: "Operate hundreds of remote sites from a single, secure control plane with local resilience.",
        points: ["Multi-site control", "Edge resilience", "Compliance reporting"],
        gradient: "from-[#64748b] via-[#475569] to-[#1e2939]",
      },
    ],
  },
  features: {
    heading: "Reliability and security, by design",
    subtitle: "The dependability mission-critical operations require, on one platform.",
    items: [
      { icon: Gauge, title: "Real-Time Monitoring", description: "Continuous visibility across distributed, mission-critical assets." },
      { icon: AlertTriangle, title: "Predictive Alerts", description: "Catch faults early to prevent outages and service interruptions." },
      { icon: ShieldCheck, title: "Hardened Security", description: "Encryption, RBAC, and audit trails for regulated environments." },
      { icon: Cloud, title: "Hybrid Deployment", description: "Run in cloud, on-premise, or air-gapped to meet compliance." },
      { icon: Zap, title: "Energy Optimization", description: "Reduce consumption and losses with data-driven control." },
      { icon: RefreshCw, title: "Resilient by Default", description: "Local autonomy keeps sites running through network loss." },
    ],
  },
  showcase: {
    heading: "Keep critical systems running",
    subtitle: "Infrastructure Hub unifies distributed sites into one resilient, secure operational platform you can depend on.",
    points: [
      { icon: ShieldCheck, title: "Secure & compliant", description: "Meet the strictest security and regulatory requirements." },
      { icon: RefreshCw, title: "Always available", description: "Edge resilience keeps operations running through outages." },
      { icon: Zap, title: "Efficient at scale", description: "Optimize energy and cost across every connected site." },
    ],
    cta: { label: "Explore Infrastructure Hub", href: "#" },
    visual: <OrbitVisual icon={Server} nodes={[Zap, Factory, Cloud, ShieldCheck]} />,
  },
  stats: [
    { stat: "99.99%", label: "Availability" },
    { stat: "100s", label: "Sites managed" },
    { stat: "20%", label: "Energy saved" },
    { stat: "24/7", label: "Operations" },
  ],
  steps: {
    heading: "Modernize infrastructure in three steps",
    subtitle: "Connect distributed systems and operate them with confidence.",
    items: [
      { title: "Connect sites", description: "Onboard distributed assets and facilities across your footprint." },
      { title: "Unify operations", description: "Monitor and control everything from one secure platform." },
      { title: "Optimize & protect", description: "Improve efficiency and reliability while staying compliant." },
    ],
  },
  cta: {
    title: "Operate infrastructure with confidence",
    subtitle: "See how Infrastructure Hub keeps mission-critical systems reliable, secure, and efficient.",
    primary: { label: "Start Free", href: "#" },
    secondary: { label: "Contact Sales", href: CONTACT },
  },
};
