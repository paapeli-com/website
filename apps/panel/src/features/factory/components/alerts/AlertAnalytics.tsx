import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { NoData, NoDataValue } from "@/features/factory/components/NoData";
import { Clock, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

/* Alert analytics has no endpoint behind it.
 *
 * Every figure on this tab used to come from a hand-written constant: an
 * alerts-over-time line chart, a severity pie, a per-location bar chart, a top
 * devices table, plus MTTA/MTTR. Rendered as real charts they are impossible
 * to tell apart from measured plant data, so the panels keep their titles and
 * layout but state that there is nothing behind them.
 *
 * Restoring a panel is a matter of feeding it the query and putting its chart
 * back — the recharts markup for each is in this file's history.
 */

const KPIS = [
  { key: "alertTotalAlerts", icon: AlertTriangle },
  { key: "alertMTTA", icon: Clock },
  { key: "alertMTTR", icon: CheckCircle },
  { key: "alertCriticalCount", icon: TrendingUp },
] as const;

const PANELS = [
  { key: "alertsOverTime", height: "h-[250px]" },
  { key: "alertBySeverity", height: "h-[250px]" },
  { key: "alertByLocation", height: "h-[200px]" },
  { key: "alertTopDevices", height: "h-[200px]" },
] as const;

export const AlertAnalytics = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{t(key)}</span>
              </div>
              <p className="text-2xl font-bold"><NoDataValue /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {PANELS.map(({ key, height }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t(key)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${height} flex items-center justify-center`}>
                <NoData />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
