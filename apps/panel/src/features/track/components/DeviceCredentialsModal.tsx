import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { Modal } from "@/features/track/components/ui/modal";
import { Button } from "@/features/track/components/ui/button";

/* Shown once, right after a tracker is registered — modelled on Smart
 * Factory's credentials dialog (features/factory/pages/panel/Devices.tsx).
 *
 * Trackers always use MQTT_BASIC, so this is the MQTT-only slice of that
 * dialog. The password can't be read back from the API afterwards, which is
 * why the dialog only closes through its buttons, never on a backdrop tap. */

export type CreatedDevice = {
  id: string;
  name: string;
  imei: string;
  clientId: string;
  username: string;
  password: string;
};

const MQTT_HOST = "mqtt.paapeli.com";
const MQTT_PORT = 1883;
const TELEMETRY_TOPIC = "v1/devices/me/telemetry";

export function DeviceCredentialsModal({
  device,
  onDone,
  onAddAnother,
}: {
  device: CreatedDevice | null;
  onDone: () => void;
  onAddAnother: () => void;
}) {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500);
    } catch {
      /* Clipboard is unavailable outside a secure context — the value is on
         screen and selectable, so there is nothing to recover from. */
    }
  };

  if (!device) return null;

  const snippet = [
    `mqtt_server = "${MQTT_HOST}";`,
    `mqtt_port   = ${MQTT_PORT};`,
    `client_id   = "${device.clientId}";`,
    `username    = "${device.username}";`,
    `password    = "${device.password}";`,
    `topic       = "${TELEMETRY_TOPIC}";`,
  ].join("\n");

  const rows: { field: string; label: string; value: string }[] = [
    { field: "imei", label: t("imei"), value: device.imei },
    { field: "deviceId", label: t("deviceId"), value: device.id },
    { field: "clientId", label: t("clientId"), value: device.clientId },
    { field: "username", label: t("username"), value: device.username },
    { field: "password", label: t("password"), value: device.password },
  ];

  const CopyButton = ({ value, field, className }: { value: string; field: string; className?: string }) => (
    <Button
      type="button"
      variant="outline"
      className={className ?? "h-9 w-9 shrink-0 p-0"}
      onClick={() => copy(value, field)}
      aria-label={t("copy")}
    >
      {copiedField === field ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </Button>
  );

  return (
    <Modal
      open
      onClose={onDone}
      closeOnBackdrop={false}
      title={t("deviceCreatedSuccessfully")}
      className="max-h-[85vh] max-w-lg overflow-y-auto"
    >
      <p className="-mt-1 mb-4 text-sm text-muted-foreground">{t("saveCredentialsWarning")}</p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">{t("deviceName")}</label>
          <input
            readOnly
            value={device.name}
            dir="auto"
            className="h-9 w-full rounded-lg border border-border bg-muted px-3 text-sm font-medium"
          />
        </div>

        {rows.map(({ field, label, value }) => (
          <div key={field}>
            <label className="mb-1 block text-xs font-semibold">{label}</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={value}
                dir="ltr"
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 font-mono text-xs"
              />
              <CopyButton value={value} field={field} />
            </div>
          </div>
        ))}

        <div>
          <label className="mb-1 block text-xs font-semibold">{t("sendTelemetryInstructions")}</label>
          <div className="relative">
            <pre
              dir="ltr"
              className="overflow-x-auto whitespace-pre rounded-lg bg-muted p-3 pe-10 text-left font-mono text-[11px] leading-relaxed"
            >
              {snippet}
            </pre>
            <CopyButton value={snippet} field="snippet" className="absolute end-2 top-2 h-7 w-7 p-0" />
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-xs text-amber-800 dark:text-amber-200">⚠️ {t("credentialsOnceWarning")}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onAddAnother}>{t("newDevice")}</Button>
        <Button onClick={onDone}>{t("done")}</Button>
      </div>
    </Modal>
  );
}
