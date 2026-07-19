import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAssetMutation } from "@paapeli/api";
import { toast } from "sonner";

type NodeType = "location" | "area" | "asset";

const ASSET_TYPE_OPTIONS = [{ value: "default", label: "default" }] as const;

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentType?: "organization" | "location" | "area" | "asset" | null;
  onAdd: (name: string, type: NodeType) => void;
}

export const AddNodeDialog = ({ open, onOpenChange, onAdd }: AddNodeDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<string>("default");
  const createAsset = useCreateAssetMutation();

  const handleAdd = () => {
    if (!name.trim() || !assetType || createAsset.isPending) return;
    createAsset.mutate(
      {
        name: name.trim(),
        type: assetType,
        label: null,
        description: null,
        parentId: null,
        customerId: null,
      },
      {
        onSuccess: () => {
          onAdd(name.trim(), "asset");
          setName("");
          setAssetType("default");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create asset");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addNew")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("selectNodeType")}</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectNodeType")} />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !assetType || createAsset.isPending}>
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
