import { useState } from "react";
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
} from "lucide-react";

const LOCATIONS = [
  "Factory A > Line 1",
  "Factory A > Sulfonation",
  "Factory A > Utilities",
  "Factory B > Boiler",
  "Factory B > Packaging",
  "Factory C > WTP",
];

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

  const [deviceType, setDeviceType] = useState("blank");
  const [deviceName, setDeviceName] = useState("");
  const [location, setLocation] = useState("");
  const [protocol, setProtocol] = useState("MQTT");
  const [gateway, setGateway] = useState("");
  const [useSsl, setUseSsl] = useState(false);
  const [useOta, setUseOta] = useState(false);
  const [useMonitoring, setUseMonitoring] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));
  const [description, setDescription] = useState("");
  const [externalId, setExternalId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!deviceName.trim()) {
      toast({ title: t("error"), description: t("deviceNameRequired"), variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: t("error"), description: t("locationRequired"), variant: "destructive" });
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
        location,
        gateway: gateway || undefined,
        useSsl,
        useOta,
        useMonitoring,
        tags: finalTags.join(", "),
        description,
        externalId,
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
            gateway: item.gateway,
            tags: item.tags,
            description: item.description,
            externalId: item.externalId,
            useSsl: !!item.useSsl,
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

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("createNewDevice")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("deviceFormSubtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          <BookOpen className="h-4 w-4" />
          {t("browseTemplates")}
        </Button>
      </div>

      <div className="space-y-4">
        {/* 1. Device Type */}
        <SectionCard step={1} title={t("deviceTypeSection")}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div>
              <FieldLabel required>{t("deviceTypeSection")}</FieldLabel>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {t("blankDevice")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">{t("customDeviceFromScratch")}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("blankDevice")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("customDeviceNoPredefined")}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 2. Basic Information */}
        <SectionCard step={2} title={t("basicInformation")}>
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
              <FieldLabel required hint>{t("location")}</FieldLabel>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-11">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("selectLocation")} />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* 3 + 4 row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 3. Connectivity */}
          <SectionCard step={3} title={t("connectivity")}>
            <FieldLabel required hint>{t("protocolLabel")}</FieldLabel>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {PROTOCOLS.map((p) => {
                const Icon = p.icon;
                const active = protocol === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setProtocol(p.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${active ? "text-primary" : "text-foreground"}`}>
                      {p.value}
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldLabel hint>{t("gatewayLabel")} <span className="text-muted-foreground font-normal">({t("optional")})</span></FieldLabel>
            <Select value={gateway} onValueChange={setGateway}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("selectGatewayOptional")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gw-1">Gateway 01 — Factory A</SelectItem>
                <SelectItem value="gw-2">Gateway 02 — Factory B</SelectItem>
              </SelectContent>
            </Select>
          </SectionCard>

          {/* 4. Quick Configuration */}
          <SectionCard step={4} title={t("quickConfiguration")}>
            <div className="space-y-2.5">
              <ToggleCard icon={Lock} title={t("sslTls")} desc={t("encryptConnection")} checked={useSsl} onChange={setUseSsl} />
              <ToggleCard icon={CloudDownload} title={t("otaShort")} desc={t("enableOtaUpdates")} checked={useOta} onChange={setUseOta} />
              <ToggleCard icon={Activity} title={t("monitoring")} desc={t("enableHealthMonitoring")} checked={useMonitoring} onChange={setUseMonitoring} />
            </div>
          </SectionCard>
        </div>

        {/* 5. Advanced */}
        <Card className="p-5">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StepBadge n={5} />
              <h3 className="text-base font-semibold text-foreground">{t("advancedSettings")}</h3>
              <span className="text-sm text-muted-foreground">({t("optional")})</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div>
              <FieldLabel hint>{t("tagsLabel")}</FieldLabel>
              <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
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
            <div>
              <FieldLabel hint>{t("externalIdLabel")}</FieldLabel>
              <Input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder={t("externalIdentifierOptional")}
                className="h-11"
              />
            </div>
          </div>
        </Card>
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
