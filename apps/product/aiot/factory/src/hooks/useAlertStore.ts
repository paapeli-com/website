import { useCallback, useEffect, useState } from "react";
import type { AlertRule, EscalationPolicy, NotificationChannel } from "@/types/alerts";

const RULES_KEY = "paapeli-alert-rules-v1";
const ESC_KEY = "paapeli-alert-escalations-v1";
const CH_KEY = "paapeli-alert-channels-v1";
const EVENT = "paapeli:alert-store-updated";

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export const useAlertRulesStore = () => {
  const [items, setItems] = useState<AlertRule[]>(() => load<AlertRule>(RULES_KEY));
  useEffect(() => {
    const sync = () => setItems(load<AlertRule>(RULES_KEY));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const create = useCallback((rule: Partial<AlertRule>): AlertRule => {
    const now = new Date().toISOString();
    const item: AlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: rule.name || "Untitled Rule",
      description: rule.description || "",
      ruleType: rule.ruleType || "threshold",
      severity: rule.severity || "medium",
      enabled: rule.enabled ?? true,
      deviceIds: rule.deviceIds || [],
      deviceType: rule.deviceType,
      locationId: rule.locationId,
      gatewayId: rule.gatewayId,
      conditionGroups: rule.conditionGroups || [],
      escalationPolicyId: rule.escalationPolicyId,
      notificationChannelIds: rule.notificationChannelIds || [],
      assignedTeam: rule.assignedTeam,
      assignedUserId: rule.assignedUserId,
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    };
    const next = [item, ...load<AlertRule>(RULES_KEY)];
    save(RULES_KEY, next);
    setItems(next);
    return item;
  }, []);

  return { items, create };
};

export const useEscalationsStore = () => {
  const [items, setItems] = useState<EscalationPolicy[]>(() => load<EscalationPolicy>(ESC_KEY));
  useEffect(() => {
    const sync = () => setItems(load<EscalationPolicy>(ESC_KEY));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const create = useCallback((p: Partial<EscalationPolicy>): EscalationPolicy => {
    const item: EscalationPolicy = {
      id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: p.name || "Untitled Policy",
      description: p.description || "",
      levels: p.levels || [],
      slaMinutes: p.slaMinutes ?? 60,
      enabled: p.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...load<EscalationPolicy>(ESC_KEY)];
    save(ESC_KEY, next);
    setItems(next);
    return item;
  }, []);

  return { items, create };
};

export const useChannelsStore = () => {
  const [items, setItems] = useState<NotificationChannel[]>(() => load<NotificationChannel>(CH_KEY));
  useEffect(() => {
    const sync = () => setItems(load<NotificationChannel>(CH_KEY));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const create = useCallback((c: Partial<NotificationChannel>): NotificationChannel => {
    const item: NotificationChannel = {
      id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: c.name || "Untitled Channel",
      type: c.type || "email",
      config: c.config || {},
      enabled: c.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...load<NotificationChannel>(CH_KEY)];
    save(CH_KEY, next);
    setItems(next);
    return item;
  }, []);

  return { items, create };
};
