import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useGateways } from "@/features/factory/hooks/useGateways";
import {
  useConnectors,
  defaultConfig,
  type ConnectorType,
  type OpcUaConfig,
  type MqttConfig,
  type ModbusConfig,
  type OpcUaMapping,
  type MqttMapping,
  type ModbusSlave,
  type DataPoint,
  type ModbusRegister,
} from "@/features/factory/hooks/useConnectors";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
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
import { Cpu, Radio, Network, Plus, Trash2, Server, Shield, ListTree } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";

const CONNECTOR_TYPES: { value: ConnectorType; label: string; icon: any }[] = [
  { value: "opcua", label: "OPC-UA", icon: Cpu },
  { value: "mqtt", label: "MQTT", icon: Radio },
  { value: "modbus", label: "Modbus TCP", icon: Network },
];

const SECURITY_POLICIES = ["None", "Basic128Rsa15", "Basic256", "Basic256Sha256"];
const REGISTER_TYPES = ["int16", "uint16", "int32", "float32", "bits", "string"];

// Local helpers mirror the per-page pattern used in GatewayForm.tsx / DeviceForm.tsx.
const StepBadge = ({ n }: { n: number }) => (
  <span className="h-6 w-6 rounded-full border-2 border-primary text-primary text-xs font-semibold flex items-center justify-center shrink-0">
    {n}
  </span>
);

const SectionCard = ({
  step,
  title,
  icon: Icon,
  children,
}: {
  step: number;
  title: string;
  icon?: any;
  children: React.ReactNode;
}) => (
  <Card className="p-5">
    <div className="flex items-center gap-2.5 mb-5">
      <StepBadge n={step} />
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </Card>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <Label className="text-sm font-medium text-foreground inline-flex items-center gap-1.5 mb-1.5">
    {children}
    {required && <span className="text-destructive">*</span>}
  </Label>
);

// Small editable key/type/value list shared by OPC-UA & MQTT attributes / timeseries
const DataPointList = ({
  label,
  points,
  onChange,
  addLabel,
}: {
  label: string;
  points: DataPoint[];
  onChange: (next: DataPoint[]) => void;
  addLabel: string;
}) => {
  const { t } = useLanguage();
  const set = (i: number, patch: Partial<DataPoint>) =>
    onChange(points.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {points.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input className="h-9" placeholder={t("keyLabel")} value={p.key} onChange={(e) => set(i, { key: e.target.value })} />
          <Input className="h-9 w-28" placeholder={t("registerType")} value={p.type} onChange={(e) => set(i, { type: e.target.value })} />
          <Input className="h-9" placeholder={t("valueLabel")} value={p.value} onChange={(e) => set(i, { value: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onChange(points.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...points, { key: "", type: "path", value: "" }])}>
        <Plus className="h-3.5 w-3.5 me-1" /> {addLabel}
      </Button>
    </div>
  );
};

const ConnectorForm = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gatewayId, connectorId } = useParams<{ gatewayId: string; connectorId: string }>();
  const { items: gateways } = useGateways();
  const { create, update, getById } = useConnectors();
  const lp = (p: string) => localizedPath(p, language);

  const gateway = useMemo(
    () => gateways.find((g) => g.gatewayId === gatewayId || g.id === gatewayId),
    [gateways, gatewayId],
  );
  const existing = connectorId ? getById(connectorId) : undefined;
  const isEdit = !!existing;

  const [type, setType] = useState<ConnectorType>(existing?.type || "opcua");
  const [name, setName] = useState(existing?.name || "");
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [config, setConfig] = useState<any>(existing ? existing.config : defaultConfig("opcua"));
  const [isLoading, setIsLoading] = useState(false);

  const changeType = (next: ConnectorType) => {
    if (isEdit) return; // type locked when editing
    setType(next);
    setConfig(defaultConfig(next));
  };

  const patch = (p: Record<string, any>) => setConfig((c: any) => ({ ...c, ...p }));

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: t("error"), description: t("connectorNameRequired"), variant: "destructive" });
      return;
    }
    if (type === "opcua" && !(config as OpcUaConfig).url?.trim()) {
      toast({ title: t("error"), description: t("serverUrlRequired"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (isEdit && existing) {
        update(existing.id, { name: name.trim(), enabled, config });
        toast({ title: t("connectorUpdated"), description: name });
      } else {
        create({ gatewayId: gateway?.gatewayId || gatewayId || "", name: name.trim(), type, enabled, config });
        toast({ title: t("connectorCreated"), description: name });
      }
      navigate(lp(`/devices/gateways/${gatewayId}?tab=connectors`));
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
            <BreadcrumbLink onClick={() => navigate(lp(`/devices/gateways/${gatewayId}?tab=connectors`))} className="cursor-pointer">
              {gateway?.name || gatewayId}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isEdit ? t("editConnector") : t("addConnector")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? t("editConnector") : t("addConnector")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("addConnectorSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* 1. Type & name */}
        <SectionCard step={1} title={t("connectorTypeSection")}>
          <FieldLabel required>{t("connectorType")}</FieldLabel>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {CONNECTOR_TYPES.map((ct) => {
              const Icon = ct.icon;
              const active = type === ct.value;
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => changeType(ct.value)}
                  disabled={isEdit && !active}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-colors disabled:opacity-40 ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${active ? "text-primary" : "text-foreground"}`}>{ct.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            <div>
              <FieldLabel required>{t("connectorName")}</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("enterConnectorName")} className="h-11" autoFocus />
            </div>
            <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card h-11">
              <Label className="text-sm">{t("enableConnector")}</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </SectionCard>

        {type === "opcua" && <OpcUaSections config={config as OpcUaConfig} patch={patch} />}
        {type === "mqtt" && <MqttSections config={config as MqttConfig} patch={patch} />}
        {type === "modbus" && <ModbusSections config={config as ModbusConfig} setConfig={setConfig} />}
      </div>

      <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-6 bg-background/95 backdrop-blur border-t border-border z-20 px-4 lg:px-6 py-3">
        <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" onClick={() => navigate(lp(`/devices/gateways/${gatewayId}?tab=connectors`))} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? t("adding") : isEdit ? t("saveConnector") : t("createConnector")}
          </Button>
        </div>
      </div>
    </>
  );
};

/* ---------------- OPC-UA ---------------- */
const OpcUaSections = ({ config, patch }: { config: OpcUaConfig; patch: (p: Record<string, any>) => void }) => {
  const { t } = useLanguage();
  const setMapping = (next: OpcUaMapping[]) => patch({ mapping: next });
  const updateMapping = (i: number, p: Partial<OpcUaMapping>) =>
    setMapping(config.mapping.map((m, idx) => (idx === i ? { ...m, ...p } : m)));

  return (
    <>
      <SectionCard step={2} title={t("connectionSection")} icon={Server}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <FieldLabel required>{t("serverUrl")}</FieldLabel>
            <Input className="h-11 font-mono" dir="ltr" value={config.url} onChange={(e) => patch({ url: e.target.value })} placeholder="opc.tcp://host:4840" />
          </div>
          <div>
            <FieldLabel>{t("securityPolicy")}</FieldLabel>
            <Select value={config.security} onValueChange={(v) => patch({ security: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{SECURITY_POLICIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card mt-6">
            <div>
              <Label className="text-sm">{t("enableSubscriptions")}</Label>
              <p className="text-xs text-muted-foreground">{t("enableSubscriptionsDesc")}</p>
            </div>
            <Switch checked={config.enableSubscriptions} onCheckedChange={(v) => patch({ enableSubscriptions: v })} />
          </div>
          <div>
            <FieldLabel>{t("timeoutMs")}</FieldLabel>
            <Input type="number" className="h-11" value={config.timeoutInMillis} onChange={(e) => patch({ timeoutInMillis: +e.target.value })} />
          </div>
          <div>
            <FieldLabel>{t("scanPeriodMs")}</FieldLabel>
            <Input type="number" className="h-11" value={config.scanPeriodInMillis} onChange={(e) => patch({ scanPeriodInMillis: +e.target.value })} />
          </div>
          <div>
            <FieldLabel>{t("pollPeriodMs")}</FieldLabel>
            <Input type="number" className="h-11" value={config.pollPeriodInMillis} onChange={(e) => patch({ pollPeriodInMillis: +e.target.value })} />
          </div>
        </div>
      </SectionCard>

      <IdentitySection value={config.identity} onChange={(identity) => patch({ identity })} />

      <SectionCard step={4} title={t("deviceMappingSection")} icon={ListTree}>
        {config.mapping.length === 0 && <p className="text-sm text-muted-foreground mb-3">{t("noMappingsYet")}</p>}
        <div className="space-y-4">
          {config.mapping.map((m, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("mappingLabel")} #{i + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMapping(config.mapping.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>{t("deviceNodePattern")}</FieldLabel>
                  <Input className="h-9 font-mono" dir="ltr" value={m.deviceNodePattern} onChange={(e) => updateMapping(i, { deviceNodePattern: e.target.value })} placeholder="Root\.Objects\.Device" />
                </div>
                <div>
                  <FieldLabel>{t("deviceNamePattern")}</FieldLabel>
                  <Input className="h-9 font-mono" dir="ltr" value={m.deviceNamePattern} onChange={(e) => updateMapping(i, { deviceNamePattern: e.target.value })} placeholder="${Device.name}" />
                </div>
                <div>
                  <FieldLabel>{t("deviceProfile")}</FieldLabel>
                  <Input className="h-9" value={m.deviceProfile} onChange={(e) => updateMapping(i, { deviceProfile: e.target.value })} placeholder="default" />
                </div>
              </div>
              <DataPointList label={t("attributesLabel")} addLabel={t("addAttribute")} points={m.attributes} onChange={(attributes) => updateMapping(i, { attributes })} />
              <DataPointList label={t("timeseriesLabel")} addLabel={t("addTimeseries")} points={m.timeseries} onChange={(timeseries) => updateMapping(i, { timeseries })} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setMapping([...config.mapping, { deviceNodePattern: "", deviceNamePattern: "", deviceProfile: "default", attributes: [], timeseries: [] }])}>
          <Plus className="h-3.5 w-3.5 me-1" /> {t("addMapping")}
        </Button>
      </SectionCard>
    </>
  );
};

/* ---------------- MQTT ---------------- */
const MqttSections = ({ config, patch }: { config: MqttConfig; patch: (p: Record<string, any>) => void }) => {
  const { t } = useLanguage();
  const setMapping = (next: MqttMapping[]) => patch({ mapping: next });
  const updateMapping = (i: number, p: Partial<MqttMapping>) =>
    setMapping(config.mapping.map((m, idx) => (idx === i ? { ...m, ...p } : m)));

  return (
    <>
      <SectionCard step={2} title={t("connectionSection")} icon={Server}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <FieldLabel required>{t("host")}</FieldLabel>
            <Input className="h-11 font-mono" dir="ltr" value={config.host} onChange={(e) => patch({ host: e.target.value })} placeholder="broker.example.com" />
          </div>
          <div>
            <FieldLabel>{t("port")}</FieldLabel>
            <Input type="number" className="h-11" value={config.port} onChange={(e) => patch({ port: +e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <FieldLabel>{t("clientId")}</FieldLabel>
            <Input className="h-11 font-mono" dir="ltr" value={config.clientId} onChange={(e) => patch({ clientId: e.target.value })} placeholder="paapeli-gateway" />
          </div>
        </div>
      </SectionCard>

      <IdentitySection value={config.security} onChange={(security) => patch({ security })} />

      <SectionCard step={4} title={t("deviceMappingSection")} icon={ListTree}>
        {config.mapping.length === 0 && <p className="text-sm text-muted-foreground mb-3">{t("noMappingsYet")}</p>}
        <div className="space-y-4">
          {config.mapping.map((m, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("mappingLabel")} #{i + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMapping(config.mapping.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>{t("topicFilter")}</FieldLabel>
                  <Input className="h-9 font-mono" dir="ltr" value={m.topicFilter} onChange={(e) => updateMapping(i, { topicFilter: e.target.value })} placeholder="sensor/+/data" />
                </div>
                <div>
                  <FieldLabel>{t("deviceNameExpression")}</FieldLabel>
                  <Input className="h-9 font-mono" dir="ltr" value={m.deviceNameExpression} onChange={(e) => updateMapping(i, { deviceNameExpression: e.target.value })} placeholder="${serialNumber}" />
                </div>
                <div>
                  <FieldLabel>{t("deviceProfileExpression")}</FieldLabel>
                  <Input className="h-9" value={m.deviceProfileExpression} onChange={(e) => updateMapping(i, { deviceProfileExpression: e.target.value })} placeholder="default" />
                </div>
              </div>
              <DataPointList label={t("attributesLabel")} addLabel={t("addAttribute")} points={m.attributes} onChange={(attributes) => updateMapping(i, { attributes })} />
              <DataPointList label={t("timeseriesLabel")} addLabel={t("addTimeseries")} points={m.timeseries} onChange={(timeseries) => updateMapping(i, { timeseries })} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setMapping([...config.mapping, { topicFilter: "", deviceNameExpression: "", deviceProfileExpression: "default", attributes: [], timeseries: [] }])}>
          <Plus className="h-3.5 w-3.5 me-1" /> {t("addMapping")}
        </Button>
      </SectionCard>
    </>
  );
};

/* ---------------- Modbus ---------------- */
const ModbusSections = ({ config, setConfig }: { config: ModbusConfig; setConfig: (fn: any) => void }) => {
  const { t } = useLanguage();
  const setSlaves = (next: ModbusSlave[]) => setConfig((c: ModbusConfig) => ({ ...c, slaves: next }));
  const updateSlave = (i: number, p: Partial<ModbusSlave>) =>
    setSlaves(config.slaves.map((s, idx) => (idx === i ? { ...s, ...p } : s)));

  const RegisterList = ({ slaveIdx, field, label }: { slaveIdx: number; field: "attributes" | "timeseries"; label: string }) => {
    const regs = config.slaves[slaveIdx][field];
    const set = (next: ModbusRegister[]) => updateSlave(slaveIdx, { [field]: next } as any);
    const upd = (i: number, p: Partial<ModbusRegister>) => set(regs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {regs.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input className="h-9 w-32" placeholder={t("tagLabel")} value={r.tag} onChange={(e) => upd(i, { tag: e.target.value })} />
            <Input className="h-9 w-24" type="number" placeholder={t("functionCode")} value={r.functionCode} onChange={(e) => upd(i, { functionCode: +e.target.value })} />
            <Input className="h-9 w-24" type="number" placeholder={t("addressLabel")} value={r.address} onChange={(e) => upd(i, { address: +e.target.value })} />
            <Input className="h-9 w-20" type="number" placeholder={t("objectsCount")} value={r.objectsCount} onChange={(e) => upd(i, { objectsCount: +e.target.value })} />
            <Select value={r.type} onValueChange={(v) => upd(i, { type: v })}>
              <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{REGISTER_TYPES.map((rt) => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => set(regs.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set([...regs, { tag: "", functionCode: 3, address: 0, objectsCount: 1, type: "int16" }])}>
          <Plus className="h-3.5 w-3.5 me-1" /> {t("addRegister")}
        </Button>
      </div>
    );
  };

  return (
    <SectionCard step={2} title={t("slavesLabel")} icon={Network}>
      {config.slaves.length === 0 && <p className="text-sm text-muted-foreground mb-3">{t("noMappingsYet")}</p>}
      <div className="space-y-4">
        {config.slaves.map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("slaveName")} #{i + 1}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSlaves(config.slaves.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <FieldLabel>{t("slaveName")}</FieldLabel>
                <Input className="h-9" value={s.name} onChange={(e) => updateSlave(i, { name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>{t("host")}</FieldLabel>
                <Input className="h-9 font-mono" dir="ltr" value={s.host} onChange={(e) => updateSlave(i, { host: e.target.value })} />
              </div>
              <div>
                <FieldLabel>{t("port")}</FieldLabel>
                <Input className="h-9" type="number" value={s.port} onChange={(e) => updateSlave(i, { port: +e.target.value })} />
              </div>
              <div>
                <FieldLabel>{t("unitId")}</FieldLabel>
                <Input className="h-9" type="number" value={s.unitId} onChange={(e) => updateSlave(i, { unitId: +e.target.value })} />
              </div>
              <div>
                <FieldLabel>{t("pollPeriodMs")}</FieldLabel>
                <Input className="h-9" type="number" value={s.pollPeriodMs} onChange={(e) => updateSlave(i, { pollPeriodMs: +e.target.value })} />
              </div>
              <div>
                <FieldLabel>{t("byteOrder")}</FieldLabel>
                <Select value={s.byteOrder} onValueChange={(v) => updateSlave(i, { byteOrder: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="BIG">BIG</SelectItem><SelectItem value="LITTLE">LITTLE</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>{t("deviceProfile")}</FieldLabel>
                <Input className="h-9" value={s.deviceProfile} onChange={(e) => updateSlave(i, { deviceProfile: e.target.value })} placeholder="default" />
              </div>
            </div>
            <RegisterList slaveIdx={i} field="attributes" label={t("attributesLabel")} />
            <RegisterList slaveIdx={i} field="timeseries" label={t("timeseriesLabel")} />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setSlaves([...config.slaves, { name: "", host: "127.0.0.1", port: 502, unitId: 1, pollPeriodMs: 5000, byteOrder: "BIG", deviceProfile: "default", attributes: [], timeseries: [] }])}>
        <Plus className="h-3.5 w-3.5 me-1" /> {t("addSlave")}
      </Button>
    </SectionCard>
  );
};

/* ---------------- Shared identity ---------------- */
const IdentitySection = ({
  value,
  onChange,
}: {
  value: { type: "anonymous" | "basic" | "cert"; username?: string; password?: string };
  onChange: (v: { type: "anonymous" | "basic" | "cert"; username?: string; password?: string }) => void;
}) => {
  const { t } = useLanguage();
  return (
    <SectionCard step={3} title={t("identitySection")} icon={Shield}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <FieldLabel>{t("identityType")}</FieldLabel>
          <Select value={value.type} onValueChange={(v: any) => onChange({ ...value, type: v })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anonymous">{t("anonymous")}</SelectItem>
              <SelectItem value="basic">{t("basicAuth")}</SelectItem>
              <SelectItem value="cert">{t("certificate")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.type === "basic" && (
          <>
            <div>
              <FieldLabel>{t("username")}</FieldLabel>
              <Input className="h-11" value={value.username || ""} onChange={(e) => onChange({ ...value, username: e.target.value })} />
            </div>
            <div>
              <FieldLabel>{t("password")}</FieldLabel>
              <Input className="h-11" type="password" value={value.password || ""} onChange={(e) => onChange({ ...value, password: e.target.value })} />
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
};

export default ConnectorForm;
