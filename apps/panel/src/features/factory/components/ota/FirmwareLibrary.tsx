import { Card, CardContent } from "@/features/factory/components/ui/card";
import { formatDate } from "@/shared/lib/formatDate";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { FirmwareVersion } from "@/features/factory/types/ota";
import { Search, FileBadge2, Rocket, GitCompareArrows, ShieldCheck } from "lucide-react";
import { useState, useMemo } from "react";

interface Props {
  firmwares: FirmwareVersion[];
  onCompare: (a: FirmwareVersion, b: FirmwareVersion) => void;
  onDeploy: (fw: FirmwareVersion) => void;
}

const statusColor: Record<string, string> = {
  released: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  testing: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  draft: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  deprecated: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export const FirmwareLibrary = ({ firmwares, onCompare, onDeploy }: Props) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const types = useMemo(() => Array.from(new Set(firmwares.map((f) => f.deviceType))), [firmwares]);

  const filtered = firmwares.filter((f) => {
    const matchSearch = (f.name + f.version).toLowerCase().includes(search.toLowerCase());
    const matchType = type === "all" || f.deviceType === type;
    return matchSearch && matchType;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id],
    );
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      const a = firmwares.find((f) => f.id === selected[0])!;
      const b = firmwares.find((f) => f.id === selected[1])!;
      onCompare(a, b);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("otaSearchFirmware")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("otaAllDeviceTypes")}</SelectItem>
            {types.map((tp) => (
              <SelectItem key={tp} value={tp}>
                {tp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCompare} disabled={selected.length !== 2} variant="outline">
          <GitCompareArrows className="h-4 w-4 mr-2" />
          {t("otaCompareSelected")} ({selected.length}/2)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((fw) => {
          const isSel = selected.includes(fw.id);
          return (
            <Card
              key={fw.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSel ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => toggleSelect(fw.id)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileBadge2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold truncate">{fw.deviceType}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">v{fw.version}</div>
                  </div>
                  <Badge variant="outline" className={statusColor[fw.status]}>
                    {t(`otaStatus_${fw.status}` as any)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">{t("otaSize")}</div>
                    <div className="font-medium">{fw.size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">{t("otaInstalled")}</div>
                    <div className="font-medium">{fw.installedCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">{t("otaSuccessRate")}</div>
                    <div className="font-medium text-green-600">{fw.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">{t("otaReleased")}</div>
                    <div className="font-medium">{formatDate(fw.releaseDate)}</div>
                  </div>
                </div>

                {fw.signed && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("otaSigned")}
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeploy(fw);
                  }}
                  disabled={fw.status === "deprecated"}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  {t("otaDeploy")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">{t("otaNoFirmware")}</div>
      )}
    </div>
  );
};
