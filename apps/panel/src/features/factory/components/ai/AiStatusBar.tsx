import { useEffect, useState } from "react";
import { Brain, Loader2, Play, Settings2, AlertTriangle } from "lucide-react";
import type { AiSensitivity } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Label } from "@/features/factory/components/ui/label";
import { Switch } from "@/features/factory/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useAiActions, useAiStatus } from "@/features/factory/hooks/useAi";
import { useAiText } from "@/features/factory/i18n/aiText";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { formatDateTime } from "@/shared/lib/formatDate";

/* Which model made what the page shows, when it last ran and when it runs
   next, with a button to run it now and the product's AI settings. Shown on
   every AI insight page, so nobody mistakes stale or fallback output for a
   fresh TimesFM result. */
export const AiStatusBar = () => {
  const { language, t, formatNumber } = useLanguage();
  const { tr, modelLabel } = useAiText();
  const { toast } = useToast();
  const { data: status } = useAiStatus();
  const { analyzeNow, saveSettings } = useAiActions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState<AiSensitivity>("MEDIUM");

  useEffect(() => {
    if (settingsOpen && status) {
      setEnabled(status.enabled);
      setSensitivity(status.sensitivity);
    }
  }, [settingsOpen, status]);

  const fallback = !!status?.model && !status.model.startsWith("timesfm");

  const run = () =>
    analyzeNow.mutate(undefined, {
      onSuccess: () => toast({ title: tr("analysisQueued"), description: tr("analysisQueuedDesc") }),
      onError: (e) => toast({ title: tr("analyzeNow"), description: apiErrorMessage(e, tr("analyzeNow")), variant: "destructive" }),
    });

  const save = () =>
    saveSettings.mutate(
      { enabled, sensitivity },
      {
        onSuccess: () => {
          toast({ title: tr("saved") });
          setSettingsOpen(false);
        },
        onError: (e) => toast({ title: tr("settings"), description: apiErrorMessage(e, tr("settings")), variant: "destructive" }),
      },
    );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 mb-4 text-xs">
      <div className="flex items-center gap-1.5">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="text-muted-foreground">{tr("model")}:</span>
        {fallback ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" /> {modelLabel(status?.model)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{tr("modelFallbackHint")}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="font-medium">{modelLabel(status?.model)}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{tr("lastAnalyzed")}:</span>
        <span className="font-medium">{formatDateTime(status?.lastRunAt, language)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{tr("nextAnalysis")}:</span>
        <span className="font-medium">{status?.enabled === false ? "—" : formatDateTime(status?.nextRunAt, language)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{tr("devicesAnalyzed")}:</span>
        <span className="font-medium">{formatNumber(status?.devicesAnalyzed ?? 0)}</span>
      </div>
      {status?.lastError && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {tr("lastError")}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm break-words">{status.lastError}</TooltipContent>
        </Tooltip>
      )}
      <div className="ms-auto flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-3.5 w-3.5" /> {tr("settings")}
        </Button>
        <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={run} disabled={analyzeNow.isPending || status?.enabled === false}>
          {analyzeNow.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {tr("analyzeNow")}
        </Button>
      </div>
      {status && !status.enabled && <div className="w-full text-amber-700 dark:text-amber-400">{tr("aiOff")}</div>}
      {status?.enabled && !status.lastRunAt && <div className="w-full text-muted-foreground">{tr("notAnalyzedYet")}</div>}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr("settings")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{tr("enabled")}</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="space-y-1.5">
              <Label>{tr("sensitivity")}</Label>
              <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as AiSensitivity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["LOW", "MEDIUM", "HIGH"] as AiSensitivity[]).map((s) => (
                    <SelectItem key={s} value={s}>{tr(`sens_${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} disabled={saveSettings.isPending}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
