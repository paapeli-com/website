import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
