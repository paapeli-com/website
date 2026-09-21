import type { ReactNode } from "react";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Table } from "@/features/factory/components/ui/table";
import { Badge } from "@/features/cloud-management/ui";
import { D, type Lang } from "./dictionary";

/* The page's own translator, over the dictionary beside it. `{name}` slots are
   filled by the caller, because Persian and Arabic put a workspace name
   somewhere English would not. */
export function useTr() {
  const language = useAppLanguage() as Lang;
  return (key: string, vars?: Record<string, string>) => {
    const row = D[key];
    let out = row ? row[language] ?? row.en : key;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, v);
    return out;
  };
}

/* The device list's table, to the class. Its type scale and row height are
   what every list on the panel is measured against, so this page borrows the
   container rather than approximating it. */
export const TableShell = ({ children, minWidth }: { children: ReactNode; minWidth?: string }) => (
  <div className="overflow-x-auto overflow-y-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
    <div style={minWidth ? { minWidth } : undefined}>
      <Table>{children}</Table>
    </div>
  </div>
);

/* Toolbar, table and pagination in one card — the shape the device and
   gateway lists use, and now every list in the panel. */
export const ListCard = ({ children }: { children: ReactNode }) => (
  <Card>
    <CardContent className="pt-6">{children}</CardContent>
  </Card>
);

const TONE: Record<string, "ok" | "info" | "warn" | "bad" | "gray"> = {
  statusActive: "ok",
  statusAccepted: "ok",
  statusInvited: "info",
  statusPending: "warn",
  statusSuspended: "bad",
  statusDeclined: "bad",
  statusExpired: "gray",
};

/** A status pill in the panel's own colours rather than the mockup's hexes. */
export const StatusBadge = ({ statusKey }: { statusKey: string }) => {
  const tr = useTr();
  return <Badge tone={TONE[statusKey] ?? "gray"}>{tr(statusKey)}</Badge>;
};

/** The one-line explanation of what on this page is real and what is not. */
export const BackendNote = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3">
    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-primary text-[10px] font-bold text-primary">
      i
    </span>
    <span className="text-xs leading-relaxed text-muted-foreground">{text}</span>
  </div>
);
