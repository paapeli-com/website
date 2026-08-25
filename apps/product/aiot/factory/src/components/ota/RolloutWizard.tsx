import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { FirmwareVersion, OtaDevice, RolloutStrategy } from "@/types/ota";
import { Rocket, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmware?: FirmwareVersion;
  devices: OtaDevice[];
  onConfirm: (rollout: { name: string; strategy: RolloutStrategy; deviceIds: string[]; batchSize: number; canaryPct: number; scheduledAt?: string }) => void;
}

export const RolloutWizard = ({ open, onOpenChange, firmware, devices, onConfirm }: Props) => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<RolloutStrategy>("staged");
  const [batchSize, setBatchSize] = useState(10);
  const [canaryPct, setCanaryPct] = useState(10);
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  if (!firmware) return null;

  const eligible = devices.filter((d) => d.deviceType === firmware.deviceType && d.currentVersion !== firmware.version);

  const reset = () => {
    setStep(1);
    setName("");
    setStrategy("staged");
    setBatchSize(10);
    setCanaryPct(10);
    setScheduledAt("");
    setSelectedDevices([]);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      toast({ title: t("otaErrorNameRequired"), variant: "destructive" });
      return;
    }
    if (step === 2 && selectedDevices.length === 0) {
      toast({ title: t("otaErrorNoDevices"), variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleConfirm = () => {
    onConfirm({
      name: name.trim(),
      strategy,
      deviceIds: selectedDevices,
      batchSize,
      canaryPct,
      scheduledAt: strategy === "scheduled" ? scheduledAt : undefined,
    });
    toast({ title: t("otaRolloutCreated"), description: name });
    close();
  };

  const toggleAll = () => {
    setSelectedDevices(selectedDevices.length === eligible.length ? [] : eligible.map((d) => d.id));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {t("otaDeployWizardTitle")} — v{firmware.version}
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground flex justify-between mb-4">
          <span>{t("otaStepStrategy")}</span>
          <span>{t("otaStepDevices")}</span>
          <span>{t("otaStepReview")}</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>{t("otaRolloutName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`v${firmware.version} → ${firmware.deviceType}`} />
            </div>
            <div>
              <Label className="mb-2 block">{t("otaStrategy")}</Label>
              <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as RolloutStrategy)}>
                {[
                  { v: "immediate", label: t("otaStratImmediate"), desc: t("otaStratImmediateDesc") },
                  { v: "staged", label: t("otaStratStaged"), desc: t("otaStratStagedDesc") },
                  { v: "canary", label: t("otaStratCanary"), desc: t("otaStratCanaryDesc") },
                  { v: "scheduled", label: t("otaStratScheduled"), desc: t("otaStratScheduledDesc") },
                ].map((o) => (
                  <label key={o.v} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value={o.v} className="mt-1" />
                    <div>
                      <div className="font-medium">{o.label}</div>
                      <div className="text-xs text-muted-foreground">{o.desc}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {strategy === "staged" && (
              <div>
                <Label>{t("otaBatchSize")}: {batchSize}</Label>
                <Slider value={[batchSize]} min={1} max={50} step={1} onValueChange={(v) => setBatchSize(v[0])} />
              </div>
            )}
            {strategy === "canary" && (
              <div>
                <Label>{t("otaCanaryPct")}: {canaryPct}%</Label>
                <Slider value={[canaryPct]} min={1} max={50} step={1} onValueChange={(v) => setCanaryPct(v[0])} />
              </div>
            )}
            {strategy === "scheduled" && (
              <div>
                <Label>{t("otaScheduleAt")}</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("otaEligibleDevices")}: {eligible.length}
              </div>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedDevices.length === eligible.length ? t("otaDeselectAll") : t("otaSelectAll")}
              </Button>
            </div>
            <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
              {eligible.map((d) => (
                <label key={d.id} className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer">
                  <Checkbox
                    checked={selectedDevices.includes(d.id)}
                    onCheckedChange={(c) =>
                      setSelectedDevices((prev) => (c ? [...prev, d.id] : prev.filter((x) => x !== d.id)))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{d.locationName}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">v{d.currentVersion}</div>
                  <div className={`h-2 w-2 rounded-full ${d.online ? "bg-green-500" : "bg-red-500"}`} />
                </label>
              ))}
              {eligible.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">{t("otaNoEligibleDevices")}</div>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("otaRolloutName")}</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("otaFirmware")}</span><span className="font-medium">v{firmware.version} ({firmware.deviceType})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("otaStrategy")}</span><span className="font-medium">{t(`otaStrat${strategy.charAt(0).toUpperCase() + strategy.slice(1)}` as any)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("otaDevices")}</span><span className="font-medium">{selectedDevices.length}</span></div>
              {strategy === "staged" && <div className="flex justify-between"><span className="text-muted-foreground">{t("otaBatchSize")}</span><span className="font-medium">{batchSize}</span></div>}
              {strategy === "canary" && <div className="flex justify-between"><span className="text-muted-foreground">{t("otaCanaryPct")}</span><span className="font-medium">{canaryPct}%</span></div>}
              {strategy === "scheduled" && <div className="flex justify-between"><span className="text-muted-foreground">{t("otaScheduleAt")}</span><span className="font-medium">{scheduledAt || "-"}</span></div>}
            </div>
            {firmware.signed ? (
              <div className="flex items-center gap-2 text-sm text-green-600 p-3 border border-green-500/30 bg-green-500/5 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                {t("otaSignatureVerified")}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                {t("otaUnsignedWarning")}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2">
          <Button variant="outline" onClick={() => (step === 1 ? close() : setStep(step - 1))}>
            {isRTL ? <ChevronRight className="h-4 w-4 mr-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
            {step === 1 ? t("cancel") : t("back")}
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext}>
              {t("next")}
              {isRTL ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          ) : (
            <Button onClick={handleConfirm}>
              <Rocket className="h-4 w-4 mr-2" />
              {t("otaStartRollout")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
