import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp } from "lucide-react";

interface TrendsInsightsWidgetProps {
  siteId: string;
}

export const TrendsInsightsWidget = ({ siteId: _siteId }: TrendsInsightsWidgetProps) => {
  const { t } = useLanguage();

  return (
    <Card className="bg-[#1a1f2e] border-[#2a3441]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("trendsInsights")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-gray-400">—</div>
      </CardContent>
    </Card>
  );
};
