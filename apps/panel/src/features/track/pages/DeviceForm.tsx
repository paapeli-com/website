import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Cpu, Loader2, RefreshCw, ScanBarcode } from "lucide-react";
import {
  useCreateDeviceMutation,
  useGetAssetRootQuery,
  useGetProductDeviceTypesQuery,
  useProvisionAssetRootMutation,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/track/components/ui/card";
import { Button } from "@/features/track/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/track/components/ui/select";
import { ImeiScanner } from "@/features/track/components/ImeiScanner";
import { DeviceCredentialsModal, type CreatedDevice } from "@/features/track/components/DeviceCredentialsModal";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { trackPath } from "@/features/track/lib/trackPath";

/* Register a tracker against the GPS Tracking product.
 *
 * Deliberately smaller than the Smart Factory form: a tracker is identified by
 * its name (its IMEI, in practice) and connects over MQTT, so that is all this
 * asks for, plus the device type. The one field the API also requires is
 * resolved rather than put to the user:
 *
 *   assetId — required by POST /devices/{workspaceId}/{productKey}, but GPS
 *     Tracking has no location tree to choose from, so every device is
 *     attached to the product's root asset. The root is provisioned on demand
 *     if this workspace has never had one.
 *
 * The device type is picked from the product's catalog
 * (GET /products/gpsTracking/device-types), as in the Smart Factory form, and
 * sent through as `type`. "default" is the API's catch-all when the catalog
 * has no enabled types.
 */
const FALLBACK_DEVICE_TYPE = "default";

/* Required, and exactly 15 digits. Not Luhn-checked here: a typed IMEI that
   fails the checksum is more likely an odd tracker than a typo worth blocking
   on. The scanner does check it, to tell the IMEI from the label's other
   barcodes. */
const IMEI_PATTERN = /^\d{15}$/;

const randomToken = (n = 20) =>
  Array.from({ length: n }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)],
  ).join("");

function Field({
  label, hint, value, onChange, placeholder, onGenerate, onScan, scanLabel, inputMode, dir = "ltr",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onGenerate?: () => void;
  onScan?: () => void;
  scanLabel?: string;
  inputMode?: "text" | "numeric";
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          dir={dir}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        {onGenerate && (
          <Button type="button" variant="outline" className="h-11 w-11 shrink-0 p-0" onClick={onGenerate}>
            <RefreshCw className="size-4" />
          </Button>
        )}
        {onScan && (
          <Button type="button" variant="outline" className="h-11 w-11 shrink-0 p-0" onClick={onScan} aria-label={scanLabel}>
            <ScanBarcode className="size-4" />
          </Button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function DeviceForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();

  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [scanning, setScanning] = useState(false);
  const [clientId, setClientId] = useState(() => randomToken());
  const [username, setUsername] = useState(() => "dev-" + randomToken(8).toLowerCase());
  const [password, setPassword] = useState(() => randomToken());
  const [created, setCreated] = useState<CreatedDevice | null>(null);
  const [busy, setBusy] = useState(false);

  const createDevice = useCreateDeviceMutation();
  const provisionRoot = useProvisionAssetRootMutation();
  const { data: root } = useGetAssetRootQuery(workspaceId ?? "", PRODUCT_KEY, !!workspaceId);
  const { data: catalogTypes, isLoading: deviceTypesLoading } = useGetProductDeviceTypesQuery(PRODUCT_KEY);
  const deviceTypeOptions = useMemo(
    () => (catalogTypes ?? []).filter((dt) => dt.enabled),
    [catalogTypes],
  );

  /* Empty until the catalog resolves — the first type is selected then. */
  const [deviceType, setDeviceType] = useState("");
  useEffect(() => {
    if (!deviceType && deviceTypeOptions.length) setDeviceType(deviceTypeOptions[0].deviceType);
  }, [deviceTypeOptions, deviceType]);

  const resetForm = () => {
    setCreated(null);
    setName("");
    setImei("");
    setClientId(randomToken());
    setUsername("dev-" + randomToken(8).toLowerCase());
    setPassword(randomToken());
  };

  const handleCreate = async () => {
    if (busy) return;
    if (!name.trim()) return void toast.error(t("deviceNameRequired"));
    if (!IMEI_PATTERN.test(imei)) return void toast.error(t("imeiInvalid"));
    if (!workspaceId) return void toast.error(t("noWorkspaceSelected"));

    setBusy(true);
    try {
      /* The root asset is this product's only parent. It is created the first
         time a workspace registers a device and reused after that. */
      let assetId = root?.id;
      if (!assetId) {
        const provisioned = await provisionRoot.mutateAsync({ workspaceId, productKey: PRODUCT_KEY });
        assetId = provisioned.id;
      }

      const device = await createDevice.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        name: name.trim(),
        // The API requires a label and this form has no separate field for it.
        label: name.trim(),
        // The backend doesn't accept imei yet; sent now so it lands once it does.
        imei,
        type: deviceType || FALLBACK_DEVICE_TYPE,
        assetId,
        credentialType: "MQTT_BASIC",
        credentialValue: JSON.stringify({ clientId, userName: username, password }),
      });

      // Snapshot what was sent: the password can't be read back later.
      setCreated({ id: device.id, name: device.name, imei, clientId, username, password });
    } catch (error) {
      toast.error(apiErrorMessage(error, t("failedToAddDevice")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-6">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-muted">
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t("newDevice")}</h1>
          <p className="text-sm text-muted-foreground">{t("newDeviceSubtitle")}</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>{t("info")}</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium">{t("deviceType")}</label>
            <Select value={deviceType} onValueChange={setDeviceType} disabled={!deviceTypeOptions.length}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={deviceTypesLoading ? t("loading") : t("noDeviceTypes")} />
              </SelectTrigger>
              <SelectContent>
                {deviceTypeOptions.map((dt) => (
                  <SelectItem key={dt.deviceType} value={dt.deviceType}>
                    <div className="flex items-center gap-2"><Cpu className="size-4" /> {dt.label || dt.deviceType}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!deviceTypesLoading && !deviceTypeOptions.length && (
              <p className="mt-1.5 text-xs text-muted-foreground">{t("noDeviceTypesHint")}</p>
            )}
          </div>
          <Field
            label={t("deviceName")}
            hint={t("deviceNameHint")}
            value={name}
            onChange={setName}
            placeholder="861971080061526"
          />
          <Field
            label={t("imei")}
            hint={t("imeiHint")}
            value={imei}
            onChange={(v) => setImei(v.replace(/\D/g, "").slice(0, 15))}
            placeholder="861971080061526"
            inputMode="numeric"
            onScan={() => setScanning(true)}
            scanLabel={t("scanImei")}
          />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>{t("mqttCredentials")}</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-xs text-muted-foreground">{t("mqttCredentialsHint")}</p>
          <Field label={t("clientId")} value={clientId} onChange={setClientId} onGenerate={() => setClientId(randomToken())} />
          <Field label={t("username")} value={username} onChange={setUsername} onGenerate={() => setUsername("dev-" + randomToken(8).toLowerCase())} />
          <Field label={t("password")} value={password} onChange={setPassword} onGenerate={() => setPassword(randomToken())} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={busy || deviceTypesLoading || !name.trim() || !IMEI_PATTERN.test(imei)} className={cn(busy && "opacity-70")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? t("creating") : t("create")}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>{t("cancel")}</Button>
      </div>

      <DeviceCredentialsModal
        device={created}
        onDone={() => navigate(trackPath("/devices"))}
        onAddAnother={resetForm}
      />

      <ImeiScanner
        open={scanning}
        onClose={() => setScanning(false)}
        onDetected={(scanned) => {
          setImei(scanned);
          setScanning(false);
          toast.success(t("imeiScanned"));
        }}
      />
    </div>
  );
}
