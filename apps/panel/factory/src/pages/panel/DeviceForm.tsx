import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevices } from "@/hooks/useDevices";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Smartphone,
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
import { ShareWithUsers } from "@/components/panel/ShareWithUsers";
import { SecurityConfig, emptySecurity, type SecurityValue } from "@/components/panel/SecurityConfig";
import { SensorPicker } from "@/components/panel/SensorPicker";
import { TemplatePicker } from "@/components/panel/TemplatePicker";
import { DEVICE_TEMPLATES, POPULAR_SENSORS } from "@/lib/formOptions";
import { getLocationOptions, getDefaultLocationPath } from "@/lib/locations";

const PROTOCOLS = [
  { value: "MQTT", icon: Radio },
  { value: "OPC-UA", icon: Cpu },
  { value: "Modbus TCP", icon: Network },
  { value: "HTTP", icon: Globe },
  { value: "CoAP", icon: MessageSquare },
];

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
        {optional && <span className="text-sm text-muted-foreground">(Optional)</span>}
      </div>
      {right}
    </div>
    {children}
  </Card>
);

const FieldLabel = ({
  children,
  required,
  hint,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: boolean;
  htmlFor?: string;
}) => (
  <Label
    htmlFor={htmlFor}
    className="text-sm font-medium text-foreground inline-flex items-center gap-1.5 mb-1.5"
  >
    {children}
    {required && <span className="text-destructive">*</span>}
  </Label>
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
  const { create } = useDevices();

  const lp = (p: string) => (language === "en" ? p : `/${language}${p}`);

  // Location options come from the Location feature (side menu → Location).
  const locationOptions = useMemo(() => getLocationOptions(), []);
  const defaultLocation = useMemo(() => getDefaultLocationPath(), []);

  const [deviceType, setDeviceType] = useState("blank");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [deviceName, setDeviceName] = useState("");
  // Location defaults to the root location, so the user never has to pick one.
  const [location, setLocation] = useState(() => getDefaultLocationPath());
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!deviceName.trim()) {
      toast({ title: t("error"), description: t("deviceNameRequired"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const trimmedName = deviceName.trim();
      const pendingTag = tagInput.trim().replace(/,$/, "").trim();
      const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;
      const item = create({
        name: trimmedName,
        protocol,
        location: location || defaultLocation,
        useSsl: security.method === "ssl",
        authMethod: security.method,
        authUsername: security.method === "basic" ? security.username : undefined,
        authClientId: security.method === "basic" ? security.clientId : undefined,
        sslCert: security.method === "ssl" ? security.sslCert : undefined,
        apiKey: security.method === "accessToken" ? security.accessToken : undefined,
        sharedUsers,
        tags: finalTags.join(", "),
        description,
      });
      try {
        sessionStorage.setItem(
          "paapeli.newDeviceCredentials",
          JSON.stringify({
            deviceId: item.deviceId,
            apiKey: item.apiKey,
            name: item.name,
            protocol: item.protocol,
            location: item.location,
            tags: item.tags,
            description: item.description,
            useSsl: !!item.useSsl,
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
        description: error instanceof Error ? error.message : t("failedToAddDevice"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PanelLayout>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
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
              <FieldLabel>{t("deviceTypeSection")}</FieldLabel>
              <Select
                value={deviceType}
                onValueChange={(v) => { setDeviceType(v); if (v !== "popular") setSelectedSensors([]); if (v !== "templates") setSelectedTemplate(""); }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">
                    <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> {t("blankDevice")}</div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> {t("popularSensors")}</div>
                  </SelectItem>
                  <SelectItem value="templates">
                    <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {t("deviceTemplates")}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {deviceType === "blank" ? t("customDeviceFromScratch")
                  : deviceType === "popular" ? t("popularSensorsHint")
                  : t("deviceTemplatesHint")}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                {deviceType === "popular" ? <Sparkles className="h-5 w-5 text-primary-foreground" />
                  : deviceType === "templates" ? <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                  : <Smartphone className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {deviceType === "blank" ? t("blankDevice") : deviceType === "popular" ? t("popularSensors") : t("deviceTemplates")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deviceType === "blank" ? t("customDeviceNoPredefined")
                    : deviceType === "popular" ? t("popularSensorsDesc")
                    : t("deviceTemplatesDesc")}
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
              <FieldLabel required hint htmlFor="device-name">{t("name")}</FieldLabel>
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
              <FieldLabel hint>{t("location")}</FieldLabel>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-11">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("selectLocation")} />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((l) => <SelectItem key={l.id} value={l.path}>{l.path}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <FieldLabel hint>{t("tagsLabel")}</FieldLabel>
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
              <FieldLabel hint>{t("descriptionLabel")}</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("enterDescriptionOptional")}
                className={persianTextClass(description)}
                rows={3}
              />
            </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <FieldLabel hint>{t("shareWithUsers")}</FieldLabel>
                <ShareWithUsers value={sharedUsers} onChange={setSharedUsers} />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={() => navigate(lp("/devices"))} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? t("adding") : t("createDeviceCta")}
          </Button>
        </div>
      </div>
    </PanelLayout>
  );
};

export default DeviceForm;
