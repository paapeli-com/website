import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { HistoryEntry } from "@/types/ota";
import { CheckCircle2, FileBadge2, PlayCircle, Undo2 } from "lucide-react";

interface Props {
  history: HistoryEntry[];
}

const actionMeta: Record<string, { icon: any; color: string; key: string }> = {
  released: { icon: FileBadge2, color: "text-blue-600 bg-blue-500/15", key: "otaHistoryAction_released" },
  rollout_started: { icon: PlayCircle, color: "text-amber-600 bg-amber-500/15", key: "otaHistoryAction_rollout_started" },
  rollout_completed: { icon: CheckCircle2, color: "text-green-600 bg-green-500/15", key: "otaHistoryAction_rollout_completed" },
  rolled_back: { icon: Undo2, color: "text-purple-600 bg-purple-500/15", key: "otaHistoryAction_rolled_back" },
  deprecated: { icon: FileBadge2, color: "text-slate-600 bg-slate-500/15", key: "otaHistoryAction_deprecated" },
};

export const OtaHistoryTimeline = ({ history }: Props) => {
  const { t, isRTL } = useLanguage();
  const sorted = [...history].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <div className={`absolute top-0 bottom-0 ${isRTL ? "right-4" : "left-4"} w-px bg-border`} />
          <div className="space-y-5">
            {sorted.map((h) => {
              const meta = actionMeta[h.action] || actionMeta.released;
              const Icon = meta.icon;
              return (
                <div key={h.id} className={`relative flex gap-4 ${isRTL ? "pr-12" : "pl-12"}`}>
                  <div className={`absolute ${isRTL ? "right-0" : "left-0"} h-9 w-9 rounded-full ${meta.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t(meta.key as any)}</span>
                      <span className="text-sm text-muted-foreground">v{h.firmwareVersion}</span>
                      <span className="text-xs text-muted-foreground">· {h.deviceType}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(h.timestamp).toLocaleString()} · {h.author}
                      {h.affectedDevices > 0 && ` · ${h.affectedDevices} ${t("otaDevices")}`}
                    </div>
                    {h.notes && <div className="text-sm text-muted-foreground mt-1 italic">{h.notes}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
