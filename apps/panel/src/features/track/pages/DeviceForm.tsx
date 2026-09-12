import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Loader2, RefreshCw } from "lucide-react";
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
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { trackPath } from "@/features/track/lib/trackPath";

/* Register a tracker against the GPS Tracking product.
 *
 * Deliberately smaller than the Smart Factory form: a tracker is identified by
 * its name (its IMEI, in practice) and connects over MQTT, so that is all this
 * asks for. The two fields the API also requires are resolved rather than put
 * to the user:
 *
 *   assetId — required by POST /devices/{workspaceId}/{productKey}, but GPS
 *     Tracking has no location tree to choose from, so every device is
 *     attached to the product's root asset. The root is provisioned on demand
 *     if this workspace has never had one.
 *   type — the device-type key. Taken from the product's catalog
 *     (GET /products/gpsTracking/device-types); "default" is the API's
 *     catch-all when the catalog is empty.
 */
const FALLBACK_DEVICE_TYPE = "default";

const randomToken = (n = 20) =>
  Array.from({ length: n }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)],
  ).join("");

function Field({
  label, hint, value, onChange, placeholder, onGenerate, dir = "ltr",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onGenerate?: () => void;
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
          dir={dir}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        {onGenerate && (
          <Button type="button" variant="outline" className="h-11 w-11 shrink-0 p-0" onClick={onGenerate}>
            <RefreshCw className="size-4" />
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
  const [clientId, setClientId] = useState(() => randomToken());
  const [username, setUsername] = useState(() => "dev-" + randomToken(8).toLowerCase());
  const [password, setPassword] = useState(() => randomToken());
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const createDevice = useCreateDeviceMutation();
  const provisionRoot = useProvisionAssetRootMutation();
  const { data: root } = useGetAssetRootQuery(workspaceId ?? "", PRODUCT_KEY, !!workspaceId);
  const { data: deviceTypes } = useGetProductDeviceTypesQuery(PRODUCT_KEY);

  const deviceType = useMemo(
    () => (deviceTypes ?? []).find((dt) => dt.enabled)?.deviceType ?? FALLBACK_DEVICE_TYPE,
    [deviceTypes],
  );

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard is unavailable outside a secure context — the value is on
         screen and selectable, so there is nothing to recover from. */
    }
  };

  const handleCreate = async () => {
    if (busy) return;
    if (!name.trim()) return void toast.error(t("deviceNameRequired"));
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
        type: deviceType,
        assetId,
        credentialType: "MQTT_BASIC",
        credentialValue: JSON.stringify({ clientId, userName: username, password }),
      });

      setCreated({ id: device.id, name: device.name });
      toast.success(t("deviceCreated"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("failedToAddDevice")));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-2xl p-4 lg:p-6">
        <h1 className="mb-5 text-xl font-bold">{t("deviceCreated")}</h1>
        <Card>
          <CardHeader><CardTitle>{created.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("deviceId")}</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={created.id}
                  dir="ltr"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-muted px-3.5 font-mono text-xs"
                />
                <Button type="button" variant="outline" className="h-11 w-11 shrink-0 p-0" onClick={() => copy(created.id)}>
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(trackPath("/devices"))}>{t("devices")}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreated(null);
                  setName("");
                  setClientId(randomToken());
                  setUsername("dev-" + randomToken(8).toLowerCase());
                  setPassword(randomToken());
                }}
              >
                {t("newDevice")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <CardHeader><CardTitle>{t("deviceName")}</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <Field
            label={t("deviceName")}
            hint={t("deviceNameHint")}
            value={name}
            onChange={setName}
            placeholder="861971080061526"
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
        <Button onClick={handleCreate} disabled={busy || !name.trim()} className={cn(busy && "opacity-70")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? t("creating") : t("create")}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>{t("cancel")}</Button>
      </div>
    </div>
  );
}
