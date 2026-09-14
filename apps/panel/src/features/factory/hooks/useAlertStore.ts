import { useCallback, useEffect, useState } from "react";
import type { EscalationPolicy, NotificationChannel } from "@/features/factory/types/alerts";

// Alert rules are no longer stored here — they live on the alarm-rule API
// (see AlertRulesList / AlertRuleWizard).
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
