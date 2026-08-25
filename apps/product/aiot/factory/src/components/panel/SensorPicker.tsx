import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { POPULAR_SENSORS, SENSOR_CATEGORIES, type SensorCategory } from "@/lib/formOptions";
import {
  Search, Check, Thermometer, Droplet, Gauge, Zap, Waves, Wind, Activity,
} from "lucide-react";

const CATEGORY_BADGE: Record<SensorCategory, string> = {
  environment: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
  electrical: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10",
  mechanical: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/10",
  flow: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/10",
  other: "bg-muted text-muted-foreground hover:bg-muted",
};

const sensorIcon = (cat: SensorCategory) => {
  switch (cat) {
    case "environment": return Thermometer;
    case "electrical": return Zap;
    case "mechanical": return Gauge;
    case "flow": return Wind;
    default: return Activity;
  }
};

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export const SensorPicker = ({ value, onChange }: Props) => {
  const { t, formatNumber } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | SensorCategory>("all");

  // Single-select: clicking selects only that sensor (clicking the selected one clears it).
  const toggle = (id: string) =>
    onChange(value.includes(id) ? [] : [id]);

  const filtered = POPULAR_SENSORS.filter((s) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || t(s.descKey as any).toLowerCase().includes(q);
    const matchCat = category === "all" || s.category === category;
    return matchQ && matchCat;
  });

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="relative">
        <Search className="h-4 w-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchSensor")} className="h-10 ps-8 bg-background" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${
            category === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
          }`}
        >
          {t("catAll")}
        </button>
        {SENSOR_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${
              category === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
            }`}
          >
            {t(`cat_${c}` as any)}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-2">
        {filtered.map((s) => {
          const Icon = sensorIcon(s.category);
          const active = value.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border-2 text-start transition-colors bg-background ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span className={`h-9 w-9 rounded-md inline-flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{s.name}</span>
                <span className="block text-xs text-muted-foreground truncate">{t(s.descKey as any)}</span>
              </span>
              <Badge className={`text-[11px] font-normal shrink-0 ${CATEGORY_BADGE[s.category]}`}>{t(`cat_${s.category}` as any)}</Badge>
              {active && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">{t("noSensorsFound")}</p>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{formatNumber(value.length)} {t("sensorsSelected")}</p>
      )}
    </div>
  );
};

export default SensorPicker;
