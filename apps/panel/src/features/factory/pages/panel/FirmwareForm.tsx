import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { Card } from "@/features/factory/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { Upload, Package } from "lucide-react";

type TargetType =
  | "Temperature Sensors"
  | "Pressure Sensors"
  | "Vibration Sensors"
  | "Flow Meters"
  | "Gateways"
  | "Energy Meters";

interface FirmwareUpdate {
  id: string;
  name: string;
  version: string;
  targetKind: "Device" | "Gateway";
  targetType: TargetType;
  devices: number;
  status: "Active" | "Completed" | "Failed" | "Draft";
  createdBy: string;
  createdAt: string;
  isDefault?: boolean;
  fileName?: string;
  fileSize?: number;
  checksum?: string;
  releaseNotes?: string;
}

const LS_UPDATES = "paapeli.ota.updates";

const TARGET_TYPE_KEYS: Record<TargetType, string> = {
  "Temperature Sensors": "tempSensors",
  "Pressure Sensors": "pressureSensors",
  "Vibration Sensors": "vibrationSensors",
  "Flow Meters": "flowMeters",
  "Energy Meters": "energyMeters",
  "Gateways": "gateways",
};

const DEV_TYPES: TargetType[] = [
  "Temperature Sensors",
  "Pressure Sensors",
  "Vibration Sensors",
  "Flow Meters",
  "Energy Meters",
  "Gateways",
];

const fmtBytes = (n: number) => {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const StepBadge = ({ n }: { n: number }) => (
  <span className="h-6 w-6 rounded-full border-2 border-primary text-primary text-xs font-semibold flex items-center justify-center shrink-0">
    {n}
  </span>
);

const SectionCard = ({
  step,
  title,
  optionalLabel,
  children,
}: {
  step: number;
  title: string;
  optionalLabel?: string;
  children: React.ReactNode;
}) => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <StepBadge n={step} />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {optionalLabel && <span className="text-sm text-muted-foreground">{optionalLabel}</span>}
      </div>
    </div>
    {children}
  </Card>
);

const FieldLabel = ({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) => (
  <Label
    htmlFor={htmlFor}
    className="text-xs font-medium text-foreground inline-flex items-center gap-1.5 mb-1.5"
  >
    {children}
    {required && <span className="text-destructive">*</span>}
  </Label>
);

const FirmwareForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [targetKind, setTargetKind] = useState<"Device" | "Gateway">("Device");
  const [targetType, setTargetType] = useState<TargetType>("Temperature Sensors");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [checksum, setChecksum] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    try {
      const list: FirmwareUpdate[] = JSON.parse(localStorage.getItem(LS_UPDATES) || "[]");
      const u = list.find(x => x.id === id);
      if (u) {
        setName(u.name);
        setVersion(u.version);
        setTargetKind(u.targetKind);
        setTargetType(u.targetType);
        setReleaseNotes(u.releaseNotes || "");
        setChecksum(u.checksum || "");
        setIsDefault(!!u.isDefault);
        if (u.fileName) setFileMeta({ name: u.fileName, size: u.fileSize || 0 });
      }
    } catch {}
  }, [id, isEdit]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!/\.(bin|hex|zip)$/i.test(f.name)) {
      toast({ title: t("unsupportedFileType"), description: t("useExt"), variant: "destructive" });
      return;
    }
    setFileMeta({ name: f.name, size: f.size });
  };

  const handleSubmit = () => {
    if (!name.trim() || !version.trim() || !targetType || !fileMeta) {
      toast({ title: t("fillAllRequiredFields"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const list: FirmwareUpdate[] = JSON.parse(localStorage.getItem(LS_UPDATES) || "[]");
      if (isEdit) {
        const next = list.map(u => u.id === id ? {
          ...u,
          name: name.trim(),
          version: version.trim(),
          targetKind,
          targetType,
          fileName: fileMeta.name,
          fileSize: fileMeta.size,
          releaseNotes: releaseNotes.trim() || undefined,
          checksum: checksum.trim() || undefined,
          isDefault,
        } : u);
        localStorage.setItem(LS_UPDATES, JSON.stringify(next));
        toast({ title: t("updateSavedToast") });
      } else {
        const created: FirmwareUpdate = {
          id: `fw-${Date.now()}`,
          name: name.trim(),
          version: version.trim(),
          targetKind,
          targetType,
          devices: 0,
          status: "Draft",
          createdBy: "You",
          createdAt: new Date().toISOString(),
          fileName: fileMeta.name,
          fileSize: fileMeta.size,
          releaseNotes: releaseNotes.trim() || undefined,
          checksum: checksum.trim() || undefined,
          isDefault,
        };
        localStorage.setItem(LS_UPDATES, JSON.stringify([created, ...list]));
        toast({ title: t("updateCreatedToast"), description: `${created.name} ${created.version}` });
      }
      navigate(lp("/firmware"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/firmware"))} className="cursor-pointer">
              {t("otaBreadcrumb")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isEdit ? t("editUpdate") : t("createNewUpdate")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? t("editFirmwareUpdate") : t("createNewFirmwareUpdate")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("uploadConfigureMetadata")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard step={1} title={t("basicInformation")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required htmlFor="fw-name">{t("updateName")}</FieldLabel>
              <Input
                id="fw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("updateNamePh")}
                className="h-11"
                autoFocus
              />
            </div>
            <div>
              <FieldLabel required htmlFor="fw-version">{t("version")}</FieldLabel>
              <Input
                id="fw-version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder={t("versionPlaceholder")}
                className="h-11"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard step={2} title={t("targetSection")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required>{t("targetKind")}</FieldLabel>
              <Select value={targetKind} onValueChange={(v) => setTargetKind(v as "Device" | "Gateway")}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Device">{t("device")}</SelectItem>
                  <SelectItem value="Gateway">{t("gateway")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel required>{t("deviceProfileOrType")}</FieldLabel>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEV_TYPES.map(d => (
                    <SelectItem key={d} value={d}>{t(TARGET_TYPE_KEYS[d] as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-5 border-t pt-4">
            <div>
              <p className="text-sm font-medium">{t("markDefaultTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("markDefaultDesc")}</p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard step={3} title={t("firmwareFile")}>
            <FieldLabel required>{t("firmwareFileWithExt")}</FieldLabel>
            <label className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 cursor-pointer transition-colors block">
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              {fileMeta ? (
                <div>
                  <div className="text-sm font-medium truncate">{fileMeta.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{fmtBytes(fileMeta.size)} · {t("readyLabel")}</div>
                  <div className="text-xs text-primary mt-2">{t("clickChooseDifferent")}</div>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium">{t("chooseFirmwareFile")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("acceptedFormats")}</div>
                </>
              )}
              <input type="file" accept=".bin,.hex,.zip" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </SectionCard>

          <SectionCard step={4} title={t("metadata")} optionalLabel={t("optionalLabel")}>
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="fw-checksum">{t("checksum")}</FieldLabel>
                <Input
                  id="fw-checksum"
                  value={checksum}
                  onChange={(e) => setChecksum(e.target.value)}
                  placeholder={t("checksumPh")}
                  className="h-11"
                />
              </div>
              <div>
                <FieldLabel htmlFor="fw-notes">{t("releaseNotes")}</FieldLabel>
                <Textarea
                  id="fw-notes"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder={t("whatsNewPh")}
                  rows={3}
                />
              </div>
            </div>
          </SectionCard>
        </div>

      </div>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={() => navigate(lp("/firmware"))} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Package className="h-4 w-4" />
            {isLoading ? t("saving") : isEdit ? t("saveChanges") : t("createUpdateAction")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default FirmwareForm;
