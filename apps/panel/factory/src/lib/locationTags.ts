import { useEffect, useState } from "react";

/**
 * Location/asset tags are a client-side concept — the asset API tree has no
 * `tags` field — so we keep them in a small localStorage-backed store keyed by
 * node id. The detail-panel Tags card, its "All Tags" popover, and the routed
 * Manage Tags page all read/write through here so they stay in sync.
 */
const KEY = "paapeli_location_tags";
type TagStore = Record<string, string[]>;

const read = (): TagStore => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const listeners = new Set<() => void>();

const write = (store: TagStore) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / private-mode errors */
  }
  listeners.forEach((l) => l());
};

const normalize = (tags: string[]) =>
  Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));

export const getNodeTags = (id: string): string[] => (id ? read()[id] || [] : []);

export const setNodeTags = (id: string, tags: string[]) => {
  if (!id) return;
  const store = read();
  const clean = normalize(tags);
  if (clean.length) store[id] = clean;
  else delete store[id];
  write(store);
};

export const addNodeTag = (id: string, tag: string) => {
  const v = tag.trim();
  if (!v) return;
  setNodeTags(id, [...getNodeTags(id), v]);
};

export const removeNodeTag = (id: string, tag: string) => {
  setNodeTags(
    id,
    getNodeTags(id).filter((t) => t !== tag),
  );
};

/** Seed tags for a freshly created node, only when none are stored yet. */
export const seedNodeTags = (id: string, tags: string[]) => {
  if (!id || !tags?.length) return;
  const store = read();
  if (store[id] === undefined) {
    store[id] = normalize(tags);
    write(store);
  }
};

export const subscribeTags = (fn: () => void) => {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
};

/** Reactive tags for a node — updates whenever the store changes. */
export const useNodeTags = (id: string): string[] => {
  const [tags, setTags] = useState<string[]>(() => getNodeTags(id));
  useEffect(() => {
    setTags(getNodeTags(id));
    return subscribeTags(() => setTags(getNodeTags(id)));
  }, [id]);
  return tags;
};
