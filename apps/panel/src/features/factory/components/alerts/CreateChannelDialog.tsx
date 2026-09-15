import { useState, useEffect } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/features/factory/components/ui/dialog";
import { Badge } from "@/features/factory/components/ui/badge";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/factory/components/ui/popover";
import { Mail, MessageSquare, Bell, Phone, X, ChevronDown } from "lucide-react";
import { getCurrentUser } from "@paapeli/brand/session";
import { loadMembers, type Member } from "@/features/factory/data/workspaceMembers";
import type { NotificationChannelType } from "@/features/factory/types/alerts";
import { useChannelsStore } from "@/features/factory/hooks/useAlertStore";
import { useToast } from "@/features/factory/hooks/use-toast";

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
  phone: Phone,
  sms: MessageSquare,
  email: Mail,
  in_app: Bell,
};

type RecipientKind = "email" | "phone";

/* Phone calls and SMS go to phone numbers, email to addresses; in-app has no
   recipients to enter. */
const recipientKinds: Record<NotificationChannelType, RecipientKind | null> = {
  phone: "phone",
  sms: "phone",
  email: "email",
  in_app: null,
};

/** A member's address for this kind of channel, if they have one. */
const contactOf = (m: Member, kind: RecipientKind) =>
  (kind === "email" ? m.email : m.phone)?.trim() || undefined;

export const CreateChannelDialog = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated }: CreateChannelDialogProps) => {

  const { t } = useLanguage();
  const { toast } = useToast();
  const { create: createChannel } = useChannelsStore();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<NotificationChannelType>("email");
  // Recipients are picked from the workspace's active members, never typed.
  const [members] = useState<Member[]>(() => {
    const self = getCurrentUser()?.email.toLowerCase();
    const active = loadMembers().filter((m) => m.status === "Active");
    // The signed-in user comes first, as the most likely recipient.
    return [...active.filter((m) => m.email.toLowerCase() === self), ...active.filter((m) => m.email.toLowerCase() !== self)];
  });
  const selfEmail = getCurrentUser()?.email.toLowerCase();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const channels: NotificationChannelType[] = ["phone", "sms", "email", "in_app"];
  const channelLabels: Record<NotificationChannelType, string> = {
    phone: t("alertChannelPhone"),
    sms: "SMS",
    email: "Email",
    in_app: t("alertChannelInApp"),
  };

  const kind = recipientKinds[channelType];

  /* Selected members who can be reached on this channel. A selection carries
     over between types; anyone without an address for the current type (e.g.
     no mobile number for SMS) simply isn't counted. */
  const chosen = kind ? members.filter((m) => selectedIds.includes(m.id) && contactOf(m, kind)) : [];
  const toggleMember = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const matches = members.filter((m) => {
    const q = query.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || (kind && contactOf(m, kind)?.toLowerCase().includes(q));
  });
  const anyReachable = !!kind && members.some((m) => contactOf(m, kind));
  const config: Record<string, string> = kind && chosen.length ? { to: chosen.map((m) => contactOf(m, kind)).join(", ") } : {};

  const handleCreate = () => {
    const created = createChannel({ name: name.trim(), type: channelType, config, enabled: true });
    toast({ title: t("success"), description: t("alertCreatedToast").replace("{name}", created.name) });
    if (inline) { onCreated?.(); return; }
    onOpenChange?.(false);
    setName("");
    setChannelType("email");
    setSelectedIds([]);
    setQuery("");
  };

  const handleCancel = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };

  const submitDisabled = !name.trim() || (!!kind && chosen.length === 0);

  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: { label: t("create"), onClick: handleCreate, disabled: submitDisabled },
      secondary: { label: t("cancel"), onClick: handleCancel, variant: "outline" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, name, channelType, selectedIds]);

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
          <Select
            value={channelType}
            onValueChange={(v) => {
              setChannelType(v as NotificationChannelType);
              setQuery("");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map(ch => {
                const ChannelIcon = channelIcons[ch];
                return (
                  <SelectItem key={ch} value={ch}>
                    <div className="flex items-center gap-2">
                      <ChannelIcon className="h-4 w-4" />
                      {channelLabels[ch]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Configuration Fields */}
        {kind && (
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">{t("alertChannelConfig")}</p>
            <div className="space-y-1">
              <Label className="text-sm">{t("configFieldTo")}</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-start focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <span className="flex flex-1 flex-wrap items-center gap-1.5">
                      {chosen.length === 0 ? (
                        <span className="text-muted-foreground">{t("selectMembers")}</span>
                      ) : (
                        chosen.map((m) => (
                          <Badge key={m.id} variant="secondary" className="gap-1">
                            {m.name}
                            <span
                              role="button"
                              aria-label={t("delete")}
                              // Remove without opening the list.
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); toggleMember(m.id); }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </Badge>
                        ))
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
                  <div className="p-1">
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="h-9" />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {matches.map((m) => {
                      const contact = contactOf(m, kind);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${contact ? "cursor-pointer hover:bg-accent hover:text-accent-foreground" : "cursor-not-allowed opacity-50"}`}
                        >
                          <Checkbox
                            checked={!!contact && selectedIds.includes(m.id)}
                            disabled={!contact}
                            onCheckedChange={() => toggleMember(m.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">
                              {m.name}
                              {m.email.toLowerCase() === selfEmail && <span className="ms-1 text-xs text-muted-foreground">({t("you")})</span>}
                            </span>
                            {contact ? (
                              <span className="block truncate text-xs text-muted-foreground" dir="ltr">{contact}</span>
                            ) : (
                              <span className="block truncate text-xs text-muted-foreground">{t("noPhoneNumber")}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                    {matches.length === 0 && (
                      <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t("noResults")}</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {anyReachable ? t("membersOnlyHint") : t("noMemberPhones")}
              </p>
            </div>
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
              {Object.entries(config).map(([k, v]) => (
                <p key={k} className="text-muted-foreground">
                  <span className="font-mono">{t("configFieldTo")}:</span> <span dir="ltr">{v}</span>
                </p>
              ))}
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
