import { useState, useEffect } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/features/factory/components/ui/dialog";
import { Badge } from "@/features/factory/components/ui/badge";
import { Mail, MessageSquare, Bell, Phone, X } from "lucide-react";
import { getCurrentUser } from "@paapeli/brand/session";
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

const recipientPlaceholders: Record<RecipientKind, string> = {
  email: "ops@company.com",
  phone: "+989123456789",
};

/* Persian and Arabic-Indic digits from a local keyboard become ASCII, so a
   number is stored the same way however it was typed. */
const toAsciiDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/** A recipient in its stored form, or null when it isn't a valid one. */
const normalizeRecipient = (kind: RecipientKind, raw: string): string | null => {
  const value = toAsciiDigits(raw).trim();
  if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.toLowerCase() : null;
  const phone = value.replace(/[\s()-]/g, "");
  return /^\+?\d{7,15}$/.test(phone) ? phone : null;
};

export const CreateChannelDialog = ({ open, onOpenChange, inline, hideActions, onActionsChange, onCancel, onCreated }: CreateChannelDialogProps) => {

  const { t } = useLanguage();
  const { toast } = useToast();
  const { create: createChannel } = useChannelsStore();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<NotificationChannelType>("email");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftInvalid, setDraftInvalid] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const channels: NotificationChannelType[] = ["phone", "sms", "email", "in_app"];
  const channelLabels: Record<NotificationChannelType, string> = {
    phone: t("alertChannelPhone"),
    sms: "SMS",
    email: "Email",
    in_app: t("alertChannelInApp"),
  };

  const kind = recipientKinds[channelType];

  /* The signed-in account's own contact for this kind, offered first in the
     dropdown. The session only carries an email: there is no phone number on
     the profile or the API yet, so phone and SMS have nothing to offer. */
  const profile = getCurrentUser();
  const profileContact = kind === "email" ? profile?.email : undefined;
  const suggestions = kind && profileContact
    ? [normalizeRecipient(kind, profileContact)].filter((v): v is string =>
        !!v && !recipients.includes(v) && v.includes(toAsciiDigits(draft).trim().toLowerCase()))
    : [];

  const addRecipient = (raw: string) => {
    if (!kind) return false;
    const value = normalizeRecipient(kind, raw);
    if (!value) {
      setDraftInvalid(raw.trim() !== "");
      return false;
    }
    setRecipients((list) => (list.includes(value) ? list : [...list, value]));
    setDraft("");
    setDraftInvalid(false);
    return true;
  };

  /* A valid address still sitting in the input counts too, so it isn't lost
     when the form is submitted without pressing Enter. */
  const finalRecipients = () => {
    if (!kind) return [];
    const pending = normalizeRecipient(kind, draft);
    return pending && !recipients.includes(pending) ? [...recipients, pending] : recipients;
  };
  const config: Record<string, string> = kind && finalRecipients().length ? { to: finalRecipients().join(", ") } : {};

  const handleCreate = () => {
    const created = createChannel({ name: name.trim(), type: channelType, config, enabled: true });
    toast({ title: t("success"), description: t("alertCreatedToast").replace("{name}", created.name) });
    if (inline) { onCreated?.(); return; }
    onOpenChange?.(false);
    setName("");
    setChannelType("email");
    setRecipients([]);
    setDraft("");
  };

  const handleCancel = () => {
    if (inline) { onCancel?.(); return; }
    onOpenChange?.(false);
  };

  const submitDisabled = !name.trim() || (!!kind && finalRecipients().length === 0);

  useEffect(() => {
    if (!hideActions || !onActionsChange) return;
    onActionsChange({
      primary: { label: t("create"), onClick: handleCreate, disabled: submitDisabled },
      secondary: { label: t("cancel"), onClick: handleCancel, variant: "outline" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideActions, name, channelType, recipients, draft]);

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
              const next = v as NotificationChannelType;
              // Numbers carry over between phone and SMS; addresses don't fit either.
              if (recipientKinds[next] !== kind) setRecipients([]);
              setChannelType(next);
              setDraft("");
              setDraftInvalid(false);
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
              <div className="relative">
                <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring focus-within:border-transparent">
                  {recipients.map((r) => (
                    <Badge key={r} variant="secondary" className="gap-1" dir="ltr">
                      {r}
                      <button
                        type="button"
                        aria-label={t("delete")}
                        onClick={() => setRecipients((list) => list.filter((x) => x !== r))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    type={kind === "email" ? "email" : "tel"}
                    dir="ltr"
                    value={draft}
                    placeholder={recipients.length ? "" : recipientPlaceholders[kind]}
                    onChange={(e) => { setDraft(e.target.value); setDraftInvalid(false); setSuggestionsOpen(true); }}
                    onFocus={() => setSuggestionsOpen(true)}
                    onBlur={() => {
                      setSuggestionsOpen(false);
                      // Keep what was typed if it's valid; otherwise leave it to fix.
                      if (draft.trim() && normalizeRecipient(kind, draft)) addRecipient(draft);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipient(draft); }
                      if (e.key === "Backspace" && !draft && recipients.length) setRecipients((list) => list.slice(0, -1));
                      if (e.key === "Escape") setSuggestionsOpen(false);
                    }}
                    className="flex-1 min-w-[140px] bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
                  />
                </div>
                {suggestionsOpen && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        // Keep focus in the input so blur doesn't close the list first.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { addRecipient(s); setSuggestionsOpen(false); }}
                        className="flex w-full cursor-default select-none items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <span dir="ltr">{s}</span>
                        <span className="text-xs text-muted-foreground">{t("fromProfile")}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className={`text-xs ${draftInvalid ? "text-destructive" : "text-muted-foreground"}`}>
                {draftInvalid
                  ? t(kind === "email" ? "invalidRecipientEmail" : "invalidRecipientPhone")
                  : t("recipientsHint")}
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
