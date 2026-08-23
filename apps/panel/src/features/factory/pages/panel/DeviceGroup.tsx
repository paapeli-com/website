import { useState } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";

const DeviceGroup = () => {
  const { t } = useLanguage();
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  return (
    <>
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noGroupsYet")}</p>
      </div>

      <Sheet open={addPanelOpen} onOpenChange={setAddPanelOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("addGroup")}</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default DeviceGroup;
