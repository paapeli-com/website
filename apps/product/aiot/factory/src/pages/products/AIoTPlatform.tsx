import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cloud, Shield, Zap, Database, Network, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TranslationKey } from "@/i18n/translations";

const AIoTPlatform = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const langPrefix = language === "en" ? "" : `/${language}`;

  const features: { icon: typeof Cloud; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { icon: Cloud, titleKey: "aiotFeatCloudNativeTitle", descKey: "aiotFeatCloudNativeDesc" },
    { icon: Shield, titleKey: "aiotFeatEncryptionTitle", descKey: "aiotFeatEncryptionDesc" },
    { icon: Zap, titleKey: "aiotFeatRealtimeTitle", descKey: "aiotFeatRealtimeDesc" },
    { icon: Database, titleKey: "aiotFeatStorageTitle", descKey: "aiotFeatStorageDesc" },
    { icon: Network, titleKey: "aiotFeatProtocolsTitle", descKey: "aiotFeatProtocolsDesc" },
    { icon: Settings, titleKey: "aiotFeatIntegrationsTitle", descKey: "aiotFeatIntegrationsDesc" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              {t("aiotPlatform")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("aiotPlatformHeroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate(`${langPrefix}/request-demo`)}>
                {t("aiotPlatformGetStarted")}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(`${langPrefix}/request-demo`)}>
                {t("aiotPlatformScheduleDemo")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            {t("aiotPlatformFeaturesTitle")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            {t("aiotPlatformCtaTitle")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("aiotPlatformCtaDesc")}
          </p>
          <Button size="lg" onClick={() => navigate(`${langPrefix}/request-demo`)}>
            {t("aiotPlatformCtaButton")}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AIoTPlatform;
