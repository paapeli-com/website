import { useState, useEffect } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/features/factory/components/ui/dialog";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import { useCreateAssetChildMutation } from "@paapeli/api";
import { useAllowedChildTypes } from "@/features/factory/hooks/useAllowedChildTypes";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  productKey: string;
  parentId?: string | null;
  parentName?: string;
  /** Raw asset type of the parent — the allowed child types are looked up from it. */
  parentAssetType?: string;
  /** Asset type preselected when the user picked one from a node's "..." menu. */
  defaultType?: string | null;
  onAdd: (name: string, type: string) => void;
}

export const AddNodeDialog = ({ open, onOpenChange, workspaceId, productKey, parentId, parentName, parentAssetType, defaultType, onAdd }: AddNodeDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [label, setLabel] = useState("");
  const createAsset = useCreateAssetChildMutation();
  // Only the types the server allows directly under this parent, labelled from
  // the product's asset-type catalogue.
  const { options: allowedTypes, isLoading: typesLoading } = useAllowedChildTypes(
    productKey,
    parentAssetType,
    open,
  );

  // Reset each time it opens; preselect the type when one was chosen from a
  // node's "..." menu (Add Location / Add Unit / Add Asset).
  useEffect(() => {
    if (open) {
      setName("");
      setLabel("");
      setType(defaultType || "");
    }
  }, [open, defaultType]);

  const handleAdd = () => {
    if (!name.trim() || !type || !parentId || createAsset.isPending) return;
    createAsset.mutate(
      {
        workspaceId,
        productKey,
        parentAssetId: parentId,
        name: name.trim(),
        type,
        // The API requires a label; default it to the name when left blank.
        label: label.trim() || name.trim(),
      },
      {
        onSuccess: () => {
          onAdd(name.trim(), type);
          setName("");
          setType("");
          setLabel("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Failed to create asset"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addNew")}</DialogTitle>
          {parentName && (
            <p className="text-sm text-muted-foreground">
              {t("addingUnder")}: <span className="font-medium text-foreground">{parentName}</span>
            </p>
          )}
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("selectNodeType")}</Label>
            <Select value={type} onValueChange={setType} disabled={typesLoading || allowedTypes.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={typesLoading ? t("loading") : t("selectNodeType")} />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((opt) => (
                  <SelectItem key={opt.assetType} value={opt.assetType}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!typesLoading && allowedTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noAllowedChildTypes")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("enterNodeName")}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("label")}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("enterLabel")}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !type || !parentId || createAsset.isPending}>
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
