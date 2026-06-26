export const formatRelativeTime = (
  iso: string | undefined,
  t: (k: any) => string,
  fmt?: (n: number | string) => string,
): string => {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (!d) return '—';
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  const num = (n: number) => (fmt ? fmt(n) : String(n));
  if (s < 5) return t('justNow');
  if (s < 60) return t('secAgo').replace('{n}', num(s));
  const m = Math.floor(s / 60);
  if (m < 60) return t('minAgo').replace('{n}', num(m));
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? t('hourAgo') : t('hoursAgo').replace('{n}', num(h));
  return new Date(iso).toLocaleDateString();
};
