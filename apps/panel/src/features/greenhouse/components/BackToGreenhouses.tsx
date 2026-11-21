import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { useGreenhouseText } from "../i18n";

/** Crops and crop cycles are reached from the greenhouses, not the menu; this leads back. */
export function BackToGreenhouses() {
  const { g, language, isRTL } = useGreenhouseText();
  const navigate = useNavigate();
  const Back = isRTL ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={() => navigate(localizedPath("/greenhouses", language))}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <Back className="h-4 w-4" /> {g("greenhouses")}
    </button>
  );
}
