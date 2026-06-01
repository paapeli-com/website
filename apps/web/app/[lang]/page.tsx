'use client';

import { LandingNavbar } from "@/components/LandingNavbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { IndustriesSection } from "@/components/IndustriesSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { TrustedSection } from "@/components/TrustedSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { CustomerLogosSection } from "@/components/CustomerLogosSection";
import { BlogSection } from "@/components/BlogSection";
import { CtaSection } from "@/components/CtaSection";
import { LandingFooter } from "@/components/LandingFooter";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <LandingNavbar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <IndustriesSection />
        <CapabilitiesSection />
        <TrustedSection />
        <HowItWorksSection />
        <CustomerLogosSection />
        <BlogSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default Index;
