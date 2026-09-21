import { Send, Share2 } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { NotificationChannels } from "@/features/factory/components/alerts/NotificationChannels";
import { EscalationPolicies } from "@/features/factory/components/alerts/EscalationPolicies";
import { BackLink, EntryCard, SectionHead } from "@/features/factory/components/alerts/AlertSection";

/* Channels and escalation used to be two tabs of their own, which put four of
   the six tabs on the strip in front of people who were looking for their
   alarms. They are both answers to the same question — what happens once an
   alarm fires — so they live behind one tab, a door each. */

export type SettingsView = "menu" | "channels" | "escalation";

interface AlertSettingsProps {
  view: SettingsView;
  onViewChange: (view: SettingsView) => void;
  onCreateChannel: () => void;
  onCreateEscalation: () => void;
  onEditEscalation: (alarmRuleId: string) => void;
}

export const AlertSettings = ({
  view,
  onViewChange,
  onCreateChannel,
  onCreateEscalation,
  onEditEscalation,
}: AlertSettingsProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;

  if (view === "channels") {
    return (
      <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <BackLink label={tt("alertTabSettings")} onClick={() => onViewChange("menu")} />
        <SectionHead title={tt("alertTabChannels")} subtitle={tt("alertChannelsCardDesc")} />
        <NotificationChannels onCreateClick={onCreateChannel} />
      </div>
    );
  }

  if (view === "escalation") {
    return (
      <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <BackLink label={tt("alertTabSettings")} onClick={() => onViewChange("menu")} />
        <SectionHead title={tt("alertTabEscalation")} subtitle={tt("alertEscalationCardDesc")} />
        <EscalationPolicies onCreateClick={onCreateEscalation} onEditClick={onEditEscalation} />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <SectionHead title={tt("alertTabSettings")} subtitle={tt("alertSettingsDesc")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <EntryCard
          icon={Send}
          title={tt("alertTabChannels")}
          description={tt("alertChannelsCardDesc")}
          onClick={() => onViewChange("channels")}
        />
        <EntryCard
          icon={Share2}
          title={tt("alertTabEscalation")}
          description={tt("alertEscalationCardDesc")}
          onClick={() => onViewChange("escalation")}
        />
      </div>
    </div>
  );
};
