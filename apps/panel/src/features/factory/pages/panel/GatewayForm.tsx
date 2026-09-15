import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useGateways } from "@/features/factory/hooks/useGateways";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
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
import {
  Router,
  Info,
  Radio,
  Cpu,
  Network,
  Globe,
  Wifi,
  Lock,
  CloudDownload,
  Activity,
  BookOpen,
  MapPin,
  ChevronDown,
  LayoutGrid,
  X as XIcon,
} from "lucide-react";
import { ShareWithUsers } from "@/features/factory/components/panel/ShareWithUsers";
import { SecurityConfig, emptySecurity, type SecurityValue } from "@/features/factory/components/panel/SecurityConfig";
import { TemplatePicker } from "@/features/factory/components/panel/TemplatePicker";
import { GATEWAY_TEMPLATES } from "@/features/factory/lib/formOptions";
import { getLocationOptions, getDefaultLocationPath } from "@/features/factory/lib/locations";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { apiErrorMessage } from "@/shared/lib/apiError";

const PROTOCOLS = [
  { value: "MQTT", icon: Radio },
  { value: "OPC-UA", icon: Cpu },
  { value: "Modbus TCP", icon: Network },
  { value: "HTTP", icon: Globe },
  { value: "LoRaWAN", icon: Wifi },
];

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
    <div className="flex items-center justify-between gap-3 mb-5">
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

const GatewayForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { create: createGateway } = useGateways();
  const lp = (p: string) => localizedPath(p, language);

  // Location options come from the Location feature (side menu → Location).
  const locationOptions = useMemo(() => getLocationOptions(), []);
  const defaultLocation = useMemo(() => getDefaultLocationPath(), []);

  const [gatewayType, setGatewayType] = useState("blank");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [name, setName] = useState("");
  // Location defaults to the root location, so the user never has to pick one.
  const [location, setLocation] = useState(() => getDefaultLocationPath());
  const [protocol, setProtocol] = useState("MQTT");
  const [model, setModel] = useState("Generic");
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [security, setSecurity] = useState<SecurityValue>(() => emptySecurity());
  // Tags are added one at a time with Enter or a comma, like the device form.
  // The gateway store keeps them as one comma-separated string.
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    setTagList((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (tag: string) => setTagList((prev) => prev.filter((x) => x !== tag));
  // A tag still being typed when the form is submitted counts too.
  const pendingTag = tagInput.trim().replace(/,$/, "").trim();
  const tags = (pendingTag && !tagList.includes(pendingTag) ? [...tagList, pendingTag] : tagList).join(", ");
  const [description, setDescription] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Picking a gateway template auto-fills the name with the template's title.
  const pickTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tpl = GATEWAY_TEMPLATES.find((tt) => tt.id === id);
    if (tpl) setName(t(tpl.name as any));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: t("error"), description: t("gatewayNameRequired"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const created = createGateway({
        name, protocol, model, location: location || defaultLocation, description,
        useSsl: security.method === "ssl", tags,
        authMethod: security.method,
        authUsername: security.method === "basic" ? security.username : undefined,
        authClientId: security.method === "basic" ? security.clientId : undefined,
        sslCert: security.method === "ssl" ? security.sslCert : undefined,
        pairingKey: security.method === "accessToken" ? security.accessToken : undefined,
        sharedUsers,
      });
      sessionStorage.setItem(
        "paapeli.newGatewayCredentials",
        JSON.stringify({ name: created.name, gatewayId: created.gatewayId, pairingKey: created.pairingKey, authMethod: security.method, protocol, model, location, description, useSsl: security.method === "ssl", tags }),
      );
      toast({ title: t("success") || "Success", description: `${created.name} created` });
      // Open the new gateway directly so the user lands in the onboarding flow.
      navigate(lp(`/devices/gateways/${created.gatewayId}?created=1`));
    } catch (error) {
      toast({ title: t("error"), description: apiErrorMessage(error, "Failed to create gateway"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-default text-muted-foreground">{t("assetsLabel")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(lp("/devices/gateways"))} className="cursor-pointer">
              {t("gateways")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("addGateway")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("addGateway")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("gatewayFormSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* 1. Gateway Type */}
        <SectionCard step={1} title={t("gatewayTypeSection")}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div>
              <FieldLabel>{t("gatewayTypeSection")}</FieldLabel>
              <Select
                value={gatewayType}
                onValueChange={(v) => { setGatewayType(v); if (v !== "templates") setSelectedTemplate(""); }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">
                    <div className="flex items-center gap-2"><Router className="h-4 w-4" /> {t("blankGateway")}</div>
                  </SelectItem>
                  <SelectItem value="templates">
                    <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {t("gatewayTemplate")}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {gatewayType === "blank" ? t("blankGatewayHint") : t("gatewayTemplateHint")}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                {gatewayType === "templates" ? <LayoutGrid className="h-5 w-5 text-primary-foreground" /> : <Router className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{gatewayType === "blank" ? t("blankGateway") : t("gatewayTemplate")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gatewayType === "blank" ? t("blankGatewayDesc") : t("gatewayTemplateDesc")}</p>
              </div>
            </div>
          </div>

          {gatewayType === "templates" && <TemplatePicker templates={GATEWAY_TEMPLATES} value={selectedTemplate} onChange={pickTemplate} />}
        </SectionCard>

        {/* 2. Basic Information */}
        <SectionCard step={2} title={t("basicInformation")} right={<span className="text-xs text-muted-foreground hidden sm:inline">{t("onlyNameRequiredHint")}</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required hint htmlFor="gw-name">{t("name")}</FieldLabel>
              <Input
                id="gw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enterGatewayName")}
                className="h-11"
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
                    {tagList.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary text-xs px-2 py-1">
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
                        if (v.endsWith(",")) addTag(v.slice(0, -1));
                        else setTagInput(v);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag(tagInput);
                        } else if (e.key === "Backspace" && !tagInput && tagList.length) {
                          removeTag(tagList[tagList.length - 1]);
                        }
                      }}
                      onBlur={() => tagInput && addTag(tagInput)}
                      placeholder={tagList.length === 0 ? t("addTagsPlaceholder") : ""}
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
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
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <FieldLabel hint>{t("shareWithUsers")}</FieldLabel>
                <ShareWithUsers value={sharedUsers} onChange={setSharedUsers} subject="gateway" />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>


      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={() => navigate(lp("/devices/gateways"))} disabled={isLoading}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? t("adding") : t("createGatewayCta")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default GatewayForm;
