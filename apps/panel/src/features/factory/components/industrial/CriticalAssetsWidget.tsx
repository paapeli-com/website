import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { getAssetsBySite } from "@/features/factory/data/mockIndustrialData";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";

interface CriticalAssetsWidgetProps {
  siteId: string;
}

export const CriticalAssetsWidget = ({ siteId }: CriticalAssetsWidgetProps) => {
  const { t, isRTL } = useLanguage();
  const assets = getAssetsBySite(siteId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-500";
      case "warning": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const statusLabel = (s: string) => {
    if (s === "critical") return t("criticalLabel");
    if (s === "warning") return t("warningLabel");
    return s;
  };

  const align = isRTL ? "text-right" : "text-left";

  return (
    <Card className="bg-[#1a1f2e] border-[#2a3441]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{t("criticalAssetsOverview")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-[#2a3441]">
                <th className={`${align} py-2`}>{t("assetCol")}</th>
                <th className={`${align} py-2`}>{t("statusCol")}</th>
                <th className={`${align} py-2`}>{t("predictedCol")}</th>
                <th className={`${align} py-2`}>{t("lastAnomalyCol")}</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 5).map((asset) => (
                <tr key={asset.id} className="border-b border-[#2a3441] last:border-0">
                  <td className="py-2 text-white">{asset.name}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`} />
                      <span className="capitalize text-gray-300">{statusLabel(asset.status)}</span>
                    </div>
                  </td>
                  <td className="py-2 text-gray-400">{asset.predictedFailure || "—"}</td>
                  <td className="py-2 text-gray-400">{asset.lastAnomaly || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
