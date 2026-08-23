'use client';

import { LandingNavbar } from "@/components/LandingNavbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { IndustriesSection } from "@/components/IndustriesSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { TrustedSection } from "@/components/TrustedSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { BlogSection } from "@/components/BlogSection";
import { CtaSection } from "@/components/CtaSection";
import { LandingFooter } from "@/components/LandingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <LandingNavbar overlay />

      <main>
        <HeroSection />
        <RevealOnScroll>
          <FeaturesSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <IndustriesSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <CapabilitiesSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <TrustedSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <HowItWorksSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <BlogSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <CtaSection />
        </RevealOnScroll>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Index;
