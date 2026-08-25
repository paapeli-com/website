import { Card, CardContent, CardHeader, CardTitle } from "@/features/factory/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { Badge } from "@/features/factory/components/ui/badge";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { FirmwareVersion } from "@/features/factory/types/ota";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fwA?: FirmwareVersion;
  fwB?: FirmwareVersion;
}

export const VersionCompareDialog = ({ open, onOpenChange, fwA, fwB }: Props) => {
  const { t } = useLanguage();
  if (!fwA || !fwB) return null;

  const metrics = [
    { key: "avgLatencyMs", label: t("otaMetricLatency"), unit: "ms", lowerBetter: true },
    { key: "avgPowerMw", label: t("otaMetricPower"), unit: "mW", lowerBetter: true },
    { key: "crashRatePct", label: t("otaMetricCrash"), unit: "%", lowerBetter: true },
    { key: "uptimePct", label: t("otaMetricUptime"), unit: "%", lowerBetter: false },
    { key: "dataAccuracyPct", label: t("otaMetricAccuracy"), unit: "%", lowerBetter: false },
  ] as const;

  const chartData = metrics.map((m) => ({
    metric: m.label,
    [`v${fwA.version}`]: (fwA.metrics as any)[m.key],
    [`v${fwB.version}`]: (fwB.metrics as any)[m.key],
  }));

  const diff = (a: number, b: number, lowerBetter: boolean) => {
    if (a === b) return { icon: Minus, color: "text-muted-foreground", text: "0%" };
    const pct = ((b - a) / a) * 100;
    const better = lowerBetter ? pct < 0 : pct > 0;
    return {
      icon: pct > 0 ? ArrowUp : ArrowDown,
      color: better ? "text-green-600" : "text-red-600",
      text: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("otaCompareTitle")}: v{fwA.version} ↔ v{fwB.version}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[fwA, fwB].map((fw) => (
            <Card key={fw.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">v{fw.version}</CardTitle>
                  <Badge variant="outline">{fw.deviceType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(fw.releaseDate).toLocaleDateString()} · {fw.size}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{t("otaChangelog")}</div>
                <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                  {fw.changelog.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("otaPerformanceComparison")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {metrics.map((m) => {
                const aVal = (fwA.metrics as any)[m.key];
                const bVal = (fwB.metrics as any)[m.key];
                const d = diff(aVal, bVal, m.lowerBetter);
                const Icon = d.icon;
                return (
                  <div key={m.key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="font-medium">{m.label}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        v{fwA.version}: <strong className="text-foreground">{aVal}{m.unit}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        v{fwB.version}: <strong className="text-foreground">{bVal}{m.unit}</strong>
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${d.color}`}>
                        <Icon className="h-4 w-4" />
                        {d.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="metric" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={`v${fwA.version}`} fill="hsl(var(--primary))" />
                  <Bar dataKey={`v${fwB.version}`} fill="#0077B6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
