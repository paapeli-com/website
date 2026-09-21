import { ArrowLeft, ArrowRight, Droplets, Thermometer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { BackLink, SectionHead } from "@/features/factory/components/alerts/AlertSection";

/* Starting points for a rule, not data.
 *
 * The four ATPL-* templates that used to render here were invented tenant
 * records — named, categorised, with conditions nobody had written — and
 * "Use template" only navigated, so picking one changed nothing. These two
 * are the opposite: they are ours, not the account's, and choosing one
 * carries into the rule form, which opens with the tag and the comparison
 * already set and the device and threshold left to fill in.
 *
 * Add a template by adding a row here and a case in the wizard's presets. */
export const RULE_TEMPLATES: {
  id: string;
  icon: LucideIcon;
  nameKey: string;
  descKey: string;
}[] = [
  { id: "temperature", icon: Thermometer, nameKey: "tplHighTempName", descKey: "tplHighTempDesc" },
  { id: "humidity", icon: Droplets, nameKey: "tplHighHumidityName", descKey: "tplHighHumidityDesc" },
];

interface AlertTemplatesProps {
  onUseTemplate: (templateId: string) => void;
  onBack: () => void;
}

export const AlertTemplates = ({ onUseTemplate, onBack }: AlertTemplatesProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <BackLink label={tt("alertTabRules")} onClick={onBack} />
      <SectionHead title={tt("alertTemplatesTitle")} subtitle={tt("alertTemplatesSubtitle")} />

      <div className="grid gap-3">
        {RULE_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{tt(template.nameKey)}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tt(template.descKey)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-2" onClick={() => onUseTemplate(template.id)}>
                  {tt("alertUseTemplate")}
                  <Arrow className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
