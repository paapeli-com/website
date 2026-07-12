import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Globe, Bell, Radio } from "lucide-react";
import type { NotificationChannelType } from "@/types/alerts";
import { useChannelsStore } from "@/hooks/useAlertStore";
import { useToast } from "@/hooks/use-toast";

export interface FormAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}

interface CreateChannelDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  hideActions?: boolean;
  onActionsChange?: (a: { primary: FormAction; secondary?: FormAction }) => void;
  onCancel?: () => void;
  onCreated?: () => void;
}

const channelIcons: Record<NotificationChannelType, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  webhook: Globe,
  in_app: Bell,
  mqtt: Radio,
};

export const CreateChannelDialog = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated }: CreateChannelDialogProps) => {

  const { t } = useLanguage();
  const { toast } = useToast();
  const { create: createChannel } = useChannelsStore();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<NotificationChannelType>("email");
  const [config, setConfig] = useState<Record<string, string>>({});

  const channels: NotificationChannelType[] = ["email", "sms", "whatsapp", "webhook", "in_app", "mqtt"];
  const channelLabels: Record<NotificationChannelType, string> = {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
    webhook: "Webhook",
    in_app: t("alertChannelInApp"),
    mqtt: "MQTT",
  };

  const configFields: Record<NotificationChannelType, { field: string; placeholder: string; type: string }[]> = {
    email: [{ field: "to", placeholder: "ops@company.com", type: "email" }],
    sms: [{ field: "to", placeholder: "+989123456789", type: "tel" }],
    whatsapp: [{ field: "to", placeholder: "+989123456789", type: "tel" }],
    webhook: [{ field: "url", placeholder: "https://example.com/webhook", type: "url" }],
    in_app: [],
    mqtt: [{ field: "topic", placeholder: "alerts/channel", type: "text" }],
  };

  const handleConfigChange = (field: string, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  const handleCreate = () => {
    const created = createChannel({ name: name.trim(), type: channelType, config, enabled: true });
    toast({ title: t("success"), description: t("alertCreatedToast").replace("{name}", created.name) });
    if (inline) { onCreated?.(); return; }
    onOpenChange?.(false);
    setName("");
    setChannelType("email");
    setConfig({});
  };

  const handleCancel = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };

  const submitDisabled = !name || (configFields[channelType].length > 0 && Object.values(config).some(v => !v));

  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: { label: t("create"), onClick: handleCreate, disabled: submitDisabled },
      secondary: { label: t("cancel"), onClick: handleCancel, variant: "outline" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, name, channelType, config]);

  const Icon = channelIcons[channelType];


  const inner = (
    <>
      {!inline && (
        <DialogHeader>
          <DialogTitle>{t("alertAddChannel")}</DialogTitle>
          <DialogDescription>
            {t("alertChannelDescription")}
          </DialogDescription>
        </DialogHeader>
      )}

      <div className="space-y-3">
        {/* Channel Name */}
        <div className="space-y-2">
          <Label>{t("name")}</Label>
          <Input
            placeholder={t("channelNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Channel Type */}
        <div className="space-y-2">
          <Label>{t("alertChannelType")}</Label>
          <Select value={channelType} onValueChange={(v) => { setChannelType(v as NotificationChannelType); setConfig({}); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map(ch => (
                <SelectItem key={ch} value={ch}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {channelLabels[ch]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Configuration Fields */}
        {configFields[channelType].length > 0 && (
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">{t("alertChannelConfig")}</p>
            {configFields[channelType].map(({ field, placeholder, type }) => {
              const labelKey = field === "to" ? "configFieldTo" : field === "topic" ? "configFieldTopic" : field === "url" ? "configFieldUrl" : field;
              return (
                <div key={field} className="space-y-1">
                  <Label className="text-sm">{t(labelKey as any)}</Label>
                  <Input
                    type={type}
                    placeholder={placeholder}
                    value={config[field] || ""}
                    onChange={(e) => handleConfigChange(field, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Channel Info */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <Badge variant="outline">{channelLabels[channelType]}</Badge>
          </div>
          {Object.entries(config).length > 0 && (
            <div className="text-xs space-y-1">
              {Object.entries(config).map(([k, v]) => {
                const labelKey = k === "to" ? "configFieldTo" : k === "topic" ? "configFieldTopic" : k === "url" ? "configFieldUrl" : k;
                return (
                  <p key={k} className="text-muted-foreground">
                    <span className="font-mono">{t(labelKey as any)}:</span> {v}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {inline ? (
        hideActions ? null : (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>{t("cancel")}</Button>
            <Button onClick={handleCreate} disabled={submitDisabled}>{t("create")}</Button>
          </div>
        )
      ) : (
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{t("cancel")}</Button>
          <Button onClick={handleCreate} disabled={submitDisabled}>{t("create")}</Button>
        </DialogFooter>
      )}
    </>
  );

  if (inline) return <div className="space-y-2">{inner}</div>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {inner}
      </DialogContent>
    </Dialog>
  );
};

