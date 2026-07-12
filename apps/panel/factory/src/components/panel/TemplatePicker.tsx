import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { type FormTemplate } from "@/lib/formOptions";
import {
  Router, Thermometer, LayoutGrid, Cpu, Factory, Server, Network, ShieldCheck, Search, Check, Box,
} from "lucide-react";

const ICONS: Record<string, any> = { Router, Thermometer, LayoutGrid, Cpu, Factory, Server, Network, ShieldCheck };

interface Props {
  templates: FormTemplate[];
  value: string;
  onChange: (id: string) => void;
}

export const TemplatePicker = ({ templates, value, onChange }: Props) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const filtered = templates.filter((tpl) => {
    const q = query.trim().toLowerCase();
    return !q || t(tpl.name as any).toLowerCase().includes(q) || t(tpl.descKey as any).toLowerCase().includes(q);
  });

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="relative">
        <Search className="h-4 w-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchTemplates")} className="h-10 ps-8 bg-background" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((tpl) => {
          const Icon = ICONS[tpl.icon] || Box;
          const active = value === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange(active ? "" : tpl.id)}
              className={`relative flex items-start gap-3 p-3 rounded-lg border-2 text-start transition-colors bg-background ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span className={`h-9 w-9 rounded-md inline-flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t(tpl.name as any)}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{t(tpl.descKey as any)}</span>
              </span>
              {active && <Check className="h-4 w-4 text-primary absolute top-2 end-2" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-6">{t("noTemplatesFound")}</p>
        )}
      </div>
    </div>
  );
};

export default TemplatePicker;
