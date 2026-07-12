import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

const hasPersian = (v: string) => /[\u0600-\u06FF]/.test(v);

const SEGMENT_KEY: Record<string, string> = {
  qazvin: "locQazvin",
  tehran: "locTehran",
  "factory a": "locFactoryA",
  "factory b": "locFactoryB",
  "network room": "locNetworkRoom",
  sulfonation: "locSulfonation",
  "line 1": "locLine1",
  boiler: "locBoiler",
  warehouse: "locWarehouse",
};

interface LocationCellProps {
  path?: string | null;
  className?: string;
}

export const LocationCell = ({ path, className = "" }: LocationCellProps) => {
  const { t, language } = useLanguage();
  const full = (path || "").trim();
  if (!full) return <span className="text-muted-foreground">—</span>;

  const tx = (seg: string) => {
    const key = SEGMENT_KEY[seg.toLowerCase()];
    return key ? t(key as any) : seg;
  };

  const parts = full.split(/\s*[>/]\s*/).filter(Boolean).map(tx);
  const last = parts[parts.length - 1] || full;
  const translatedFull = parts.join(" > ");
  const isI18n = language !== "en";
  const fontClass = (isI18n || hasPersian(last)) ? "font-vazirmatn" : "";
  const sizeClass = isI18n ? "text-[15px]" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 text-foreground ${sizeClass} ${className}`}>
      <span className={fontClass}>{last}</span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex cursor-help text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className={`max-w-xs ${(isI18n || hasPersian(translatedFull)) ? "font-vazirmatn" : ""}`}>
            {translatedFull}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};
