import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { deviceTypeLabel } from "@/features/factory/lib/deviceTypeLabel";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { FieldLabel, OptionalNote } from "@/features/factory/components/FieldLabel";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { Card } from "@/features/factory/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/factory/components/ui/collapsible";
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
import {
  Info,
  Radio,
  Cpu,
  Network,
  Globe,
  MessageSquare,
  Lock,
  CloudDownload,
  Activity,
  BookOpen,
  MapPin,
  ChevronDown,
  X as XIcon,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { ShareWithUsers } from "@/features/factory/components/panel/ShareWithUsers";
import { SecurityConfig, emptySecurity, type SecurityValue } from "@/features/factory/components/panel/SecurityConfig";
import { SensorPicker } from "@/features/factory/components/panel/SensorPicker";
import { TemplatePicker } from "@/features/factory/components/panel/TemplatePicker";
import { DEVICE_TEMPLATES, POPULAR_SENSORS } from "@/features/factory/lib/formOptions";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import {
  useCreateDeviceMutation,
  useGetProductDeviceTypesQuery,
  deviceCredentialsService,
  type DeviceCredentialType,
} from "@paapeli/api";
import { currentProductKey } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";

const PROTOCOLS = [
  { value: "MQTT", icon: Radio },
  { value: "OPC-UA", icon: Cpu },
  { value: "Modbus TCP", icon: Network },
  { value: "HTTP", icon: Globe },
  { value: "CoAP", icon: MessageSquare },
];

// Blank devices have no profile of their own — the API's catch-all type.
const BLANK_DEVICE_TYPE = "default";

// The form's auth methods map onto the API credential types. ACCESS_TOKEN is
// generated server-side, so it carries no value.
const credentialsFor = (
  s: SecurityValue,
): { credentialType: DeviceCredentialType; credentialValue?: string } => {
  switch (s.method) {
    case "basic":
      return {
        credentialType: "MQTT_BASIC",
        credentialValue: JSON.stringify({
          clientId: s.clientId,
          userName: s.username,
          password: s.password,
        }),
      };
    case "ssl":
      return { credentialType: "X509_CERTIFICATE", credentialValue: s.sslCert };
    default:
      return { credentialType: "ACCESS_TOKEN" };
  }
};

const hasPersianText = (value: string) => /[\u0600-\u06FF]/.test(value);
const persianTextClass = (value: string) => hasPersianText(value) ? "font-vazirmatn" : "";

const StepBadge = ({ n }: { n: number }) => (
  <span className="h-6 w-6 rounded-full border-2 border-primary text-primary text-xs font-semibold flex items-center justify-center shrink-0">
    {n}
  </span>
);

const SectionCard = ({
  step,
  title,
  optional,
  right,
  children,
}: {
  step: number;
  title: string;
  optional?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <StepBadge n={step} />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {optional && <OptionalNote />}
      </div>
      {right}
    </div>
    {children}
  </Card>
);


const ToggleCard = ({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: any;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card">
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const DeviceForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const lp = (p: string) => localizedPath(p, language);

  // Location options come from the product asset tree (side menu → Location);
  // the chosen node's id is the device's assetId.
  const { options: locationOptions, isLoading: locationsLoading } = useAssetLocations();
  const createDevice = useCreateDeviceMutation();
  // Workspace selected in the host's account menu — device creation and the
  // credentials read-back are both scoped to /{workspaceId}/{productKey}.
  const workspaceId = useWorkspaceId();

  /* The product's device-type catalog (GET .../products/{key}/device-types).
     Its entries carry the provisioning profile, so the key selected here is
     exactly what the create-device call sends as `type`. */
  const { data: catalogTypes, isLoading: deviceTypesLoading } = useGetProductDeviceTypesQuery(currentProductKey());
  const deviceTypeOptions = useMemo(
    () => (catalogTypes ?? []).filter((dt) => dt.enabled),
    [catalogTypes],
  );

  /* Holds a catalog key ("zx909") or one of the two picker modes below.
     Empty until the catalog resolves — the first type is selected then. */
  const [deviceType, setDeviceType] = useState("");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [deviceName, setDeviceName] = useState("");
  // Location defaults to the tree root, so the user never has to pick one;
  // ?assetId= (a greenhouse or zone sending the user here) chooses it instead.
  const [searchParams] = useSearchParams();
  const [assetId, setAssetId] = useState(() => searchParams.get("assetId") ?? "");
  const [protocol, setProtocol] = useState("MQTT");
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [security, setSecurity] = useState<SecurityValue>(() => emptySecurity());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Popular sensors are single-select; picking one applies its protocol and auto-fills the name.
  const pickSensors = (ids: string[]) => {
    setSelectedSensors(ids);
    const sensor = POPULAR_SENSORS.find((s) => s.id === ids[0]);
    if (sensor) {
      setProtocol(sensor.protocol);
      setDeviceName(sensor.name);
    }
  };

  // Picking a device template auto-fills the name with the template's title.
  const pickTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tpl = DEVICE_TEMPLATES.find((tt) => tt.id === id);
    if (tpl) setDeviceName(t(tpl.name as any));
  };

  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));
  const [description, setDescription] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!assetId && locationOptions.length) setAssetId(locationOptions[0].id);
  }, [locationOptions, assetId]);

  // Preselect the first device type once the catalog arrives.
  useEffect(() => {
    if (!deviceType && deviceTypeOptions.length) setDeviceType(deviceTypeOptions[0].deviceType);
  }, [deviceTypeOptions, deviceType]);

  const locationPath = locationOptions.find((l) => l.id === assetId)?.path || "";

  /* Step 1's picker is what the API's `type` means. It is now a key from the
     product's device-type catalog, so it maps straight through. BLANK_DEVICE_TYPE
     remains the fallback for the two picker modes and for the moment before the
     catalog has loaded — the create call requires a type either way. */
  const apiDeviceType =
    deviceType === "popular"
      ? selectedSensors[0] || BLANK_DEVICE_TYPE
      : deviceType === "templates"
        ? selectedTemplate || BLANK_DEVICE_TYPE
        : deviceType || BLANK_DEVICE_TYPE; // a catalog key, sent through as-is

  const selectedCatalogType = deviceTypeOptions.find((dt) => dt.deviceType === deviceType);

  /* The Gateway template is the only thing on this form that creates a
     gateway — the endpoint's second example ("MQTT basic device") is exactly
     this shape: type "gateway", isGateway true, MQTT_BASIC credentials. */
  const isGateway = deviceType === "templates" && selectedTemplate === "gateway";

  const handleSubmit = async () => {
    if (!deviceName.trim()) {
      toast({ title: t("error"), description: t("deviceNameRequired"), variant: "destructive" });
      return;
    }
    if (!assetId) {
      toast({ title: t("error"), description: t("locationRequired"), variant: "destructive" });
      return;
    }
    if (!workspaceId) {
      toast({ title: t("error"), description: t("noWorkspaceSelected"), variant: "destructive" });
      return;
    }
    try {
      const trimmedName = deviceName.trim();
      const pendingTag = tagInput.trim().replace(/,$/, "").trim();
      const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;
      // Tags travel as the API's `label`, comma-separated (max 255 chars).
      const label = finalTags.join(", ");
      if (label.length > 255) {
        toast({ title: t("error"), description: t("tagsTooLong"), variant: "destructive" });
        return;
      }
      const trimmedDescription = description.trim();
      const created = await createDevice.mutateAsync({
        workspaceId,
        productKey: currentProductKey(),
        name: trimmedName,
        ...(label ? { label } : {}),
        type: apiDeviceType,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        isGateway,
        assetId,
        ...credentialsFor(security),
      });
      const newDeviceId = created.id;
      // For ACCESS_TOKEN the backend mints the token, so the one shown in the
      // form is only a placeholder — read the real credentials back.
      let accessToken = security.method === "accessToken" ? security.accessToken : undefined;
      if (newDeviceId && security.method === "accessToken") {
        try {
          const creds = await deviceCredentialsService.getDeviceCredentials(workspaceId, currentProductKey(), newDeviceId);
          accessToken = creds.credentialsId || accessToken;
        } catch (error) {
          console.warn("Unable to read the new device credentials", error);
        }
      }
      // Hand the credentials to the devices list, which shows them once — this
      // is the only moment the access token is available to display. The device
      // itself is not mirrored anywhere: the list re-reads it from the server.
      try {
        sessionStorage.setItem(
          "paapeli.newDeviceCredentials",
          JSON.stringify({
            deviceId: newDeviceId,
            apiKey: accessToken,
            name: trimmedName,
            protocol,
            location: locationPath,
            tags: finalTags.join(", "),
            description,
            useSsl: security.method === "ssl",
            authMethod: security.method,
            clientId: security.clientId,
            username: security.username,
            password: security.password,
          }),
        );
      } catch (error) {
        console.warn("Unable to store new device credentials", error);
      }
      toast({ title: t("success") || "Success", description: `${trimmedName} created` });
      navigate(lp("/devices?created=1"));
    } catch (error) {
      toast({
        title: t("error"),
        description: apiErrorMessage(error, t("failedToAddDevice")),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <HomeCrumb />
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-default text-muted-foreground">{t("assetsLabel")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/devices"))} className="cursor-pointer">
              {t("devices")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("createNewDevice")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("createNewDevice")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("deviceFormSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* 1. Device Type */}
        <SectionCard step={1} title={t("deviceTypeSection")}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div>
              <FieldLabel required>{t("deviceTypeSection")}</FieldLabel>
              <Select
                value={deviceType}
                onValueChange={(v) => { setDeviceType(v); if (v !== "popular") setSelectedSensors([]); if (v !== "templates") setSelectedTemplate(""); }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={deviceTypesLoading ? t("loading") : t("deviceTypeSection")} />
                </SelectTrigger>
                <SelectContent>
                  {/* The product's own device types. */}
                  {deviceTypesLoading && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("loading")}</div>
                  )}
                  {deviceTypeOptions.map((dt) => (
                    <SelectItem key={dt.deviceType} value={dt.deviceType}>
                      <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> {deviceTypeLabel(dt.label, dt.deviceType, language)}</div>
                    </SelectItem>
                  ))}
                  {/* Not wired to the API yet — selectable again once they are. */}
                  <SelectItem value="popular" disabled>
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> {t("popularSensors")}</div>
                  </SelectItem>
                  <SelectItem value="templates" disabled>
                    <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {t("deviceTemplates")}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedCatalogType ? deviceTypeLabel(selectedCatalogType.description || selectedCatalogType.label, "", language)
                  : deviceType === "popular" ? t("popularSensorsHint")
                  : deviceType === "templates" ? t("deviceTemplatesHint")
                  : ""}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                {deviceType === "popular" ? <Sparkles className="h-5 w-5 text-primary-foreground" />
                  : deviceType === "templates" ? <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                  : <Cpu className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {selectedCatalogType ? deviceTypeLabel(selectedCatalogType.label, selectedCatalogType.deviceType, language)
                    : deviceType === "popular" ? t("popularSensors")
                    : deviceType === "templates" ? t("deviceTemplates")
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCatalogType ? deviceTypeLabel(selectedCatalogType.description, selectedCatalogType.deviceType, language)
                    : deviceType === "popular" ? t("popularSensorsDesc")
                    : deviceType === "templates" ? t("deviceTemplatesDesc")
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Progressive disclosure: only after picking Popular Sensors / Templates */}
          {deviceType === "popular" && <SensorPicker value={selectedSensors} onChange={pickSensors} />}
          {deviceType === "templates" && <TemplatePicker templates={DEVICE_TEMPLATES} value={selectedTemplate} onChange={pickTemplate} />}
        </SectionCard>

        {/* 2. Basic Information */}
        <SectionCard step={2} title={t("basicInformation")} right={<span className="text-xs text-muted-foreground hidden sm:inline">{t("onlyNameRequiredHint")}</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required htmlFor="device-name">{t("name")}</FieldLabel>
              <Input
                id="device-name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={t("enterDeviceName")}
                className={`h-11 ${persianTextClass(deviceName)}`}
                autoFocus
              />
            </div>
            <div>
              <FieldLabel required>{t("location")}</FieldLabel>
              <Select value={assetId} onValueChange={setAssetId} disabled={locationsLoading || locationOptions.length === 0}>
                <SelectTrigger className="h-11">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={locationsLoading ? t("loading") : t("selectLocation")} />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((l) => <SelectItem key={l.id} value={l.id}>{l.path}</SelectItem>)}
                </SelectContent>
              </Select>
              {!locationsLoading && locationOptions.length === 0 && (
                <p className="text-xs text-destructive mt-1.5">{t("noLocationTree")}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <FieldLabel optional>{t("tagsLabel")}</FieldLabel>
              <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring focus-within:border-transparent">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded bg-primary/10 text-primary text-xs px-2 py-1 ${persianTextClass(tag)}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-primary/20 rounded p-0.5"
                      aria-label={`Remove ${tag}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(",")) {
                      addTag(v.slice(0, -1));
                    } else {
                      setTagInput(v);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    } else if (e.key === "Backspace" && !tagInput && tags.length) {
                      removeTag(tags[tags.length - 1]);
                    }
                  }}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={tags.length === 0 ? t("addTagsPlaceholder") : ""}
                  className={`flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1 ${persianTextClass(tagInput)}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{t("pressEnterTags")}</p>
            </div>
            <div>
              <FieldLabel optional>{t("descriptionLabel")}</FieldLabel>
              <Textarea
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("enterDescription")}
                className={persianTextClass(description)}
                rows={3}
              />
            </div>
          </div>
        </SectionCard>

        {/* 3. Credentials / Security */}
        <SectionCard step={3} title={t("credentialsSecurity")}>
          <SecurityConfig value={security} onChange={setSecurity} />
        </SectionCard>

        {/* 4. Advanced (collapsible) — includes Share With Users */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card className="p-5">
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <StepBadge n={4} />
                  <h3 className="text-base font-semibold text-foreground">{t("advancedSettings")}</h3>
                  <span className="text-sm text-muted-foreground">({t("optional")})</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-5">
                <FieldLabel optional>{t("shareWithUsers")}</FieldLabel>
                <ShareWithUsers value={sharedUsers} onChange={setSharedUsers} />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={() => navigate(lp("/devices"))} disabled={createDevice.isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createDevice.isPending || !assetId}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createDevice.isPending ? t("adding") : t("createDeviceCta")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DeviceForm;
