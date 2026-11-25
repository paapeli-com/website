import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetProductDeviceTypesQuery, type OtaTargetKind } from "@paapeli/api";
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
import { HomeCrumb } from "@/shell/HomeCrumb";
import { Upload, Package, Lock } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { currentProductKey } from "@/features/factory/lib/product";
import { useOtaActions, useOtaFirmwareOne } from "@/features/factory/hooks/useOta";
import { apiErrorMessage } from "@/shared/lib/apiError";

/* Uploads a firmware to the gateway, which makes its file a ThingsBoard OTA
   package for the device type's profile. /firmware/new?from={id} starts from
   another firmware's details: a duplicate needs its own version and file. */

const fmtBytes = (n: number) => {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

/** The gateway and ThingsBoard refuse larger files. */
const MAX_FILE_BYTES = 50 * 1024 * 1024;

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
  const [searchParams] = useSearchParams();
  const copyFrom = searchParams.get("from") ?? undefined;
  const isEdit = !!id;
  const lp = (p: string) => localizedPath(p, language);
  const { createFirmware, updateFirmware } = useOtaActions();
  const source = useOtaFirmwareOne(id ?? copyFrom);
  const { data: deviceTypes } = useGetProductDeviceTypesQuery(currentProductKey());

  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [targetKind, setTargetKind] = useState<OtaTargetKind>("DEVICE");
  const [deviceType, setDeviceType] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [checksum, setChecksum] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isLoading = createFirmware.isPending || updateFirmware.isPending;

  useEffect(() => {
    const u = source.data;
    if (!u || loaded) return;
    setName(isEdit ? u.name : `${u.name} ${t("copySuffix")}`);
    setVersion(isEdit ? u.version : "");
    setTargetKind(u.targetKind);
    setDeviceType(u.deviceType);
    setReleaseNotes(u.releaseNotes || "");
    setIsDefault(isEdit ? u.isDefault : false);
    setLoaded(true);
  }, [source.data, loaded, isEdit, t]);

  // A new firmware starts on the product's first enabled type.
  const enabledTypes = (deviceTypes ?? []).filter((d) => d.enabled || d.deviceType === deviceType);
  useEffect(() => {
    if (!deviceType && !id && !copyFrom && enabledTypes.length > 0) setDeviceType(enabledTypes[0].deviceType);
  }, [deviceType, id, copyFrom, enabledTypes]);

  /* Once a rollout used it, its file, version and type are fixed. */
  const locked = isEdit && source.data ? !source.data.fileReplaceable : false;
  const existingFile = isEdit && source.data ? { name: source.data.fileName, size: source.data.fileSize } : null;

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!/\.(bin|hex|zip)$/i.test(f.name)) {
      toast({ title: t("unsupportedFileType"), description: t("useExt"), variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: t("unsupportedFileType"), description: "≤ 50 MB", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !version.trim() || !deviceType || (!isEdit && !file)) {
      toast({ title: t("fillAllRequiredFields"), variant: "destructive" });
      return;
    }
    const request = {
      name: name.trim(),
      version: version.trim(),
      deviceType,
      targetKind,
      releaseNotes: releaseNotes.trim() || null,
      checksum: checksum.trim() || null,
      isDefault,
    };
    try {
      if (isEdit && id) {
        await updateFirmware.mutateAsync({ id, request, file });
        toast({ title: t("updateSavedToast") });
      } else {
        const created = await createFirmware.mutateAsync({ request, file: file! });
        toast({ title: t("updateCreatedToast"), description: `${created.name} ${created.version}` });
      }
      navigate(lp("/firmware"));
    } catch (error) {
      toast({ title: apiErrorMessage(error, t("otaActionFailed")), variant: "destructive" });
    }
  };

  const shownFile = file ? { name: file.name, size: file.size } : existingFile;

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <HomeCrumb />
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

      {locked && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{t("firmwareLockedNote")}</span>
        </div>
      )}
      {!isEdit && deviceTypes && enabledTypes.length === 0 && (
        <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{t("noDeviceTypesYet")}</div>
      )}

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
                dir="ltr"
                disabled={locked}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard step={2} title={t("targetSection")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required>{t("targetKind")}</FieldLabel>
              <Select value={targetKind} onValueChange={(v) => setTargetKind(v as OtaTargetKind)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVICE">{t("device")}</SelectItem>
                  <SelectItem value="GATEWAY">{t("gateway")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel required>{t("deviceTypeRequired")}</FieldLabel>
              <Select value={deviceType} onValueChange={setDeviceType} disabled={locked}>
                <SelectTrigger className="h-11"><SelectValue placeholder={t("deviceTypeRequired")} /></SelectTrigger>
                <SelectContent>
                  {enabledTypes.map(d => (
                    <SelectItem key={d.deviceType} value={d.deviceType}>{d.label || d.deviceType}</SelectItem>
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
            <FieldLabel required={!isEdit}>{t("firmwareFileWithExt")}</FieldLabel>
            <label className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors block ${locked ? "opacity-60 cursor-not-allowed" : "hover:bg-accent/50 cursor-pointer"}`}>
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              {shownFile ? (
                <div>
                  <div className="text-sm font-medium truncate">{shownFile.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{fmtBytes(shownFile.size)} · {t("readyLabel")}</div>
                  {!locked && <div className="text-xs text-primary mt-2">{t("clickChooseDifferent")}</div>}
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium">{t("chooseFirmwareFile")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("acceptedFormats")}</div>
                </>
              )}
              <input type="file" accept=".bin,.hex,.zip" className="hidden" disabled={locked} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {isEdit && !locked && <p className="text-xs text-muted-foreground mt-2">{t("fileOptionalOnEdit")}</p>}
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
                  dir="ltr"
                  disabled={locked || (isEdit && !file)}
                />
                {isEdit && source.data && !file && (
                  <p className="text-xs text-muted-foreground mt-1 break-all" dir="ltr">SHA-256: {source.data.checksum}</p>
                )}
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
