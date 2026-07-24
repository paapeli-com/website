import { useState, useEffect, useRef } from "react";
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
import { TagInput } from "@/components/TagInput";
import { useCreateAssetMutation, useGetProductAssetTypesQuery } from "@paapeli/api";
import { toast } from "sonner";

type NodeType = "location" | "area" | "asset";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productKey: string;
  parentId?: string | null;
  parentName?: string;
  defaultType?: NodeType | null;
  onAdd: (name: string, type: string, tags: string[]) => void;
}

export const AddNodeDialog = ({ open, onOpenChange, productKey, parentId, parentName, defaultType, onAdd }: AddNodeDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const tagsRef = useRef<string[]>([]);
  const createAsset = useCreateAssetMutation();
  const { data: assetTypes, isLoading: typesLoading } = useGetProductAssetTypesQuery(productKey, open);

  // Keep a synchronous mirror so a tag still sitting in the input (committed on
  // blur when Create is clicked) is included on submit.
  const updateTags = (next: string[]) => {
    tagsRef.current = next;
    setTags(next);
  };

  // Reset each time it opens; preselect the type when one was chosen from a
  // node's "..." menu (Add Location / Add Unit / Add Asset).
  useEffect(() => {
    if (open) {
      setName("");
      updateTags([]);
      setType(defaultType || "");
    }
  }, [open, defaultType]);

  const allowedTypes = assetTypes || [];

  const handleAdd = () => {
    if (!name.trim() || !type || createAsset.isPending) return;
    const tagList = tagsRef.current;
    createAsset.mutate(
      {
        name: name.trim(),
        type,
        label: null,
        description: null,
        parentId: parentId || null,
        customerId: null,
      },
      {
        onSuccess: () => {
          onAdd(name.trim(), type, tagList);
          setName("");
          setType("");
          updateTags([]);
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
                    {opt.assetType}
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
          <div className="space-y-2">
            <Label>{t("tags")}</Label>
            <TagInput value={tags} onChange={updateTags} placeholder={t("addTagsPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("pressEnterTags")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !type || createAsset.isPending}>
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
