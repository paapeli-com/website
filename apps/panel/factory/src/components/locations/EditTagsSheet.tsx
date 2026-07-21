import { Fragment } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Tag, ChevronRight } from "lucide-react";
import { useNodeTags, setNodeTags } from "@/lib/locationTags";
import { TagInput } from "@/components/TagInput";

interface EditTagsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  /** Full name path from the root down to the node. */
  path: string[];
}

/**
 * Side panel for editing a location node's tags — mirrors the Edit Device
 * sheet so tag editing stays consistent across the app. Contains only the
 * node's path (as context) and the shared tag input.
 */
export const EditTagsSheet = ({ open, onOpenChange, nodeId, path }: EditTagsSheetProps) => {
  const { t, isRTL } = useLanguage();
  const tags = useNodeTags(nodeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRTL ? "left" : "right"}
        dir={isRTL ? "rtl" : "ltr"}
        className="w-full sm:max-w-lg flex flex-col"
      >
        <SheetHeader className={isRTL ? "text-right sm:text-right" : "text-left sm:text-left"}>
          <SheetTitle className="flex items-center gap-2">
            {t("manageTags")}
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {tags.length} {t("tagsUnit")}
            </span>
          </SheetTitle>
          {path.length > 0 && (
            <SheetDescription asChild>
              <span className="flex flex-wrap items-center gap-1">
                {path.map((part, i) => (
                  <Fragment key={`${part}-${i}`}>
                    {i > 0 && <ChevronRight className={`h-3 w-3 opacity-50 ${isRTL ? "rotate-180" : ""}`} />}
                    <span className={i === path.length - 1 ? "text-foreground font-medium" : ""}>{part}</span>
                  </Fragment>
                ))}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-2 py-4 flex-1 overflow-y-auto">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            {t("tagsLabel")}
          </Label>
          <TagInput
            value={tags}
            onChange={(next) => setNodeTags(nodeId, next)}
            placeholder={t("addTagsPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("pressEnterTags")}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditTagsSheet;
