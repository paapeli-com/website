import { useGetSmsUsageQuery } from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { currentProductKey } from "@/features/factory/lib/product";
import { InfoNote } from "@/shared/components/InfoNote";

/* The rules an alarm text is held to, read from the gateway's own limits
   (GET /sms/{ws}/{pk}/usage) so the note never promises other numbers than
   the ones enforced, with today's count against the daily limit. */
export const SmsRulesNote = ({ className }: { className?: string }) => {
  const { t, formatNumber } = useLanguage();
  const tt = t as (k: string) => string;
  const workspaceId = useWorkspaceId();
  const { data: usage } = useGetSmsUsageQuery(workspaceId ?? "", currentProductKey());

  const cooldown = usage?.cooldownMinutes ?? 30;
  const limit = usage?.dailyLimit ?? 100;
  const items = [
    tt("smsRuleVerified"),
    tt("smsRuleSkipped"),
    tt("smsRuleCooldown").replace("{n}", formatNumber(cooldown)),
    tt("smsRuleDailyLimit").replace("{n}", formatNumber(limit)),
    tt("smsRuleFallback"),
  ];
  if (usage) {
    items.push(
      tt("smsUsageLine")
        .replace("{today}", formatNumber(usage.sentToday))
        .replace("{limit}", formatNumber(usage.dailyLimit))
        .replace("{month}", formatNumber(usage.sentLast30Days)),
    );
    if (!usage.available) items.push(tt("smsUnavailable"));
    else if (usage.sandbox) items.push(tt("smsSandbox"));
  }

  return <InfoNote title={tt("smsRulesTitle")} items={items} className={className} />;
};
