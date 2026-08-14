import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { Rollout } from "@/types/ota";
import { Pause, Play, Undo2, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  rollouts: Rollout[];
  onUpdate: (id: string, status: Rollout["status"]) => void;
}

const statusMeta: Record<Rollout["status"], { color: string; icon: any }> = {
  scheduled: { color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30", icon: Clock },
  in_progress: { color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: Loader2 },
  paused: { color: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30", icon: Pause },
  completed: { color: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30", icon: CheckCircle2 },
  failed: { color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30", icon: XCircle },
  rolled_back: { color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30", icon: Undo2 },
};

export const RolloutsList = ({ rollouts, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleAction = (r: Rollout, action: "pause" | "resume" | "rollback") => {
    if (action === "pause") onUpdate(r.id, "paused");
    if (action === "resume") onUpdate(r.id, "in_progress");
    if (action === "rollback") onUpdate(r.id, "rolled_back");
    toast({ title: t(`otaAction_${action}` as any), description: r.name });
  };

  return (
    <div className="space-y-3">
      {rollouts.map((r) => {
        const meta = statusMeta[r.status];
        const Icon = meta.icon;
        return (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{r.name}</h3>
                    <Badge variant="outline" className={meta.color}>
                      <Icon className={`h-3 w-3 mr-1 ${r.status === "in_progress" ? "animate-spin" : ""}`} />
                      {t(`otaRolloutStatus_${r.status}` as any)}
                    </Badge>
                    <Badge variant="secondary">{t(`otaStrat${r.strategy.charAt(0).toUpperCase() + r.strategy.slice(1)}` as any)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.deviceType} · {new Date(r.createdAt).toLocaleString()} · {r.author}
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.status === "in_progress" && (
                    <Button size="sm" variant="outline" onClick={() => handleAction(r, "pause")}>
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      {t("otaPause")}
                    </Button>
                  )}
                  {r.status === "paused" && (
                    <Button size="sm" variant="outline" onClick={() => handleAction(r, "resume")}>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      {t("otaResume")}
                    </Button>
                  )}
                  {(r.status === "in_progress" || r.status === "paused" || r.status === "completed") && (
                    <Button size="sm" variant="outline" onClick={() => handleAction(r, "rollback")}>
                      <Undo2 className="h-3.5 w-3.5 mr-1" />
                      {t("otaRollback")}
                    </Button>
                  )}
                </div>
              </div>

              <Progress value={r.progressPct} className="h-2 mb-3" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{t("otaTotal")}</div>
                  <div className="font-semibold">{r.totalDevices}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("otaSucceeded")}</div>
                  <div className="font-semibold text-green-600">{r.successCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("otaFailed")}</div>
                  <div className="font-semibold text-red-600">{r.failedCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("otaPending")}</div>
                  <div className="font-semibold">{r.pendingCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {rollouts.length === 0 && <div className="text-center py-12 text-muted-foreground">{t("otaNoRollouts")}</div>}
    </div>
  );
};
