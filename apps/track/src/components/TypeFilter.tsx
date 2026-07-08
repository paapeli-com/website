import { AssetType } from "@/data/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export type TypeFilterValue = AssetType | "all";

const OPTS: { value: TypeFilterValue; key: TranslationKey }[] = [
  { value: "all", key: "all" },
  { value: "pet", key: "pets" },
  { value: "person", key: "people" },
  { value: "vehicle", key: "vehicles" },
];

export function TypeFilter({ value, onChange }: { value: TypeFilterValue; onChange: (v: TypeFilterValue) => void }) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex rounded-xl bg-muted p-1">
      {OPTS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(o.key)}
        </button>
      ))}
    </div>
  );
}
