import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Badge } from "@/features/factory/components/ui/badge";
import { Input } from "@/features/factory/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { OtaDevice } from "@/features/factory/types/ota";
import { CheckCircle2, Clock, Download, Loader2, XCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  devices: OtaDevice[];
}

const statusMeta: Record<string, { color: string; icon: any; key: string }> = {
  up_to_date: { color: "text-green-600", icon: CheckCircle2, key: "otaDevStatus_up_to_date" },
  pending: { color: "text-blue-600", icon: Clock, key: "otaDevStatus_pending" },
  downloading: { color: "text-amber-600", icon: Download, key: "otaDevStatus_downloading" },
  installing: { color: "text-amber-600", icon: Loader2, key: "otaDevStatus_installing" },
  success: { color: "text-green-600", icon: CheckCircle2, key: "otaDevStatus_success" },
  failed: { color: "text-red-600", icon: XCircle, key: "otaDevStatus_failed" },
  skipped: { color: "text-slate-500", icon: AlertCircle, key: "otaDevStatus_skipped" },
};

export const DeviceFleetTable = ({ devices }: Props) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = useMemo(() => Array.from(new Set(devices.map((d) => d.deviceType))), [devices]);

  const filtered = devices.filter((d) => {
    const m1 = (d.name + d.locationName).toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === "all" || d.status === statusFilter;
    const m3 = typeFilter === "all" || d.deviceType === typeFilter;
    return m1 && m2 && m3;
  });

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("otaSearchDevices")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("otaAllDeviceTypes")}</SelectItem>
              {types.map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("otaAllStatuses")}</SelectItem>
              {Object.keys(statusMeta).map((s) => (
                <SelectItem key={s} value={s}>{t(statusMeta[s].key as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("otaDevice")}</TableHead>
                <TableHead>{t("otaLocation")}</TableHead>
                <TableHead>{t("otaCurrentVersion")}</TableHead>
                <TableHead>{t("otaTargetVersion")}</TableHead>
                <TableHead>{t("otaStatusCol")}</TableHead>
                <TableHead>{t("otaConnection")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const meta = statusMeta[d.status] || statusMeta.up_to_date;
                const Icon = meta.icon;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.locationName}</TableCell>
                    <TableCell><Badge variant="secondary">v{d.currentVersion}</Badge></TableCell>
                    <TableCell>{d.targetVersion ? <Badge variant="outline" className="border-primary/40 text-primary">v{d.targetVersion}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1.5 text-sm ${meta.color}`}>
                        <Icon className={`h-4 w-4 ${d.status === "installing" || d.status === "downloading" ? "animate-spin" : ""}`} />
                        {t(meta.key as any)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {d.online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("otaNoDevices")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
