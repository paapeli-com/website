import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { getKPIBySite } from "@/features/factory/data/mockIndustrialData";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { AlertTriangle } from "lucide-react";

interface OverviewKPIWidgetProps {
  siteId: string;
}

export const OverviewKPIWidget = ({ siteId }: OverviewKPIWidgetProps) => {
  const { t } = useLanguage();
  const kpi = getKPIBySite(siteId);

  if (!kpi) return null;

  return (
    <Card className="bg-[#1a1f2e] border-[#2a3441]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{t("overview")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded bg-[#232a3b]">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-red-500">{kpi.activeAlarms.critical}</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-xs text-gray-400">{t("criticalLabel")}</span>
          </div>

          <div className="text-center p-3 rounded bg-[#232a3b]">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-orange-500">{kpi.activeAlarms.warning}</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <span className="text-xs text-gray-400">{t("warningLabel")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
