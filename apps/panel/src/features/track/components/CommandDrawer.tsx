import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  useGetDeviceActivitiesQuery,
  useGetProductDeviceCommandsQuery,
  useSendDeviceCommandMutation,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { TrackerAvatar } from "@/features/track/lib/trackerIcons";
import { Drawer } from "@/features/track/components/ui/drawer";
import { Button } from "@/features/track/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/track/components/ui/select";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";

/* Device command drawer, backed by the product's command catalog — the same
 * flow as Smart Factory's SendCommandDialog (factory/pages/panel/DeviceDetails).
 *
 * A device accepts whatever its device type declares in
 * GET /products/gpsTracking/device-types/{type}/commands; the gateway rejects
 * any other key, so there is no fixed list here. Each entry carries a JSON
 * Schema for its parameters, turned into a skeleton body the operator edits.
 * This used to be a set of mock switches that only showed a toast. */

type CommandTarget = { id: string; name: string; type: string; label?: string };

const HISTORY_SIZE = 50;
const COMMAND_ACTIVITY_TYPES = new Set(["COMMAND_SENT", "COMMAND_SUCCEEDED", "COMMAND_FAILED"]);

const paramSkeleton = (schema?: Record<string, unknown>): string => {
  const props = (schema?.properties ?? {}) as Record<string, any>;
  const keys = Object.keys(props);
  if (keys.length === 0) return "";
  const body: Record<string, unknown> = {};
  for (const key of keys) {
    const prop = props[key] ?? {};
    body[key] =
      prop.default ??
      prop.example ??
      (prop.type === "number" || prop.type === "integer" ? 0 : prop.type === "boolean" ? false : "");
  }
  return JSON.stringify(body, null, 2);
};

export function CommandDrawer({ open, onClose, device }: { open: boolean; onClose: () => void; device: CommandTarget }) {
  const { t, relTime } = useLanguage();
  const workspaceId = useActiveWorkspaceId();
  const sendCommand = useSendDeviceCommandMutation();

  const { data: catalog, isLoading: catalogLoading, isError: catalogError } =
    useGetProductDeviceCommandsQuery(PRODUCT_KEY, device.type, open);
  const commands = useMemo(() => (catalog ?? []).filter((c) => c.enabled), [catalog]);

  const [cmd, setCmd] = useState("");
  const [params, setParams] = useState("");
  const selected = commands.find((c) => c.commandKey === cmd);

  // Re-select whenever the drawer opens or the catalog lands, so the
  // selection always names a command this device actually has.
  useEffect(() => {
    if (open) setCmd(commands[0]?.commandKey ?? "");
  }, [open, device.id, commands]);

  useEffect(() => {
    setParams(paramSkeleton(selected?.parameterSchema));
  }, [selected]);

  /* Nothing returns a device's sent commands; the gateway records each one in
     the activity feed, so the history is that feed filtered to COMMAND_*. */
  const { data: activityPage, isLoading: historyLoading } = useGetDeviceActivitiesQuery(
    workspaceId ?? "", PRODUCT_KEY, device.id, 0, HISTORY_SIZE, open,
  );
  const history = (activityPage?.data ?? []).filter((a) => COMMAND_ACTIVITY_TYPES.has(a.type));

  const handleSend = async () => {
    if (!workspaceId) return void toast.error(t("noWorkspaceSelected"));
    if (!selected) return void toast.error(t("noCommands"));

    // The textarea holds the parameters object, not the whole request body.
    let parsed: Record<string, unknown> = {};
    if (params.trim()) {
      try {
        parsed = JSON.parse(params);
      } catch {
        return void toast.error(t("invalidJson"));
      }
    }

    try {
      const result = await sendCommand.mutateAsync({
        workspaceId,
        productKey: PRODUCT_KEY,
        deviceId: device.id,
        command: selected.commandKey,
        params: parsed,
      });
      // `success` is the dispatch result; it says nothing about the tracker
      // executing the command — the history below shows that when it reports.
      if (!result.success) return void toast.error(t("commandFailed"));
      toast.success(t("commandSent"), { description: selected.label });
    } catch (error) {
      toast.error(apiErrorMessage(error, t("commandFailed")));
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={t("commands")}>
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted p-3">
        <TrackerAvatar label={device.label} />
        <p dir="auto" className="text-sm font-semibold">{device.name}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("command")}</label>
          <Select value={cmd} onValueChange={setCmd} disabled={catalogLoading || commands.length === 0}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue
                placeholder={catalogLoading ? t("loading") : catalogError ? t("commandsLoadFailed") : t("noCommands")}
              />
            </SelectTrigger>
            <SelectContent>
              {commands.map((c) => (
                <SelectItem key={c.commandKey} value={c.commandKey}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected?.description && <p className="mt-1.5 text-xs text-muted-foreground">{selected.description}</p>}
        </div>

        {params && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("parameters")}</label>
            <textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              rows={5}
              dir="ltr"
              className="w-full rounded-xl border border-border bg-card p-3 font-mono text-xs outline-none focus:border-primary"
            />
          </div>
        )}

        <Button className="w-full" onClick={handleSend} disabled={sendCommand.isPending || !selected}>
          {sendCommand.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t("sendCommand")}
        </Button>

        <div>
          <p className="mb-2 text-sm font-medium">{t("commandHistory")}</p>
          <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {historyLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
            ) : history.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">{t("noCommandsYet")}</p>
            ) : (
              history.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                  <span className="min-w-0 flex-1 truncate">{a.description || a.type}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-medium",
                      a.type === "COMMAND_FAILED"
                        ? "bg-destructive/10 text-destructive"
                        : a.type === "COMMAND_SUCCEEDED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {a.type === "COMMAND_FAILED" ? t("commandFailed") : a.type === "COMMAND_SUCCEEDED" ? t("delivered") : t("commandSent")}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{relTime(a.occurredAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
