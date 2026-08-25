import { useState, useEffect } from "react";
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
import { useUpdateAssetMutation } from "@paapeli/api";
import { toast } from "sonner";

interface RenameNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  productKey: string;
  nodeId?: string | null;
  /** Only used to target cache invalidation on success, if known. */
  parentId?: string | null;
  currentName: string;
  /**
   * Sent back unchanged — the edit endpoint requires the full name/label pair.
   * Falls back to the new name, since the API rejects a missing label.
   */
  currentLabel?: string;
  onRename: (newName: string) => void;
}

export const RenameNodeDialog = ({
  open,
  onOpenChange,
  workspaceId,
  productKey,
  nodeId,
  parentId,
  currentName,
  currentLabel,
  onRename,
}: RenameNodeDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState(currentName);
  const editAsset = useUpdateAssetMutation();

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleRename = () => {
    const next = name.trim();
    if (!next || !nodeId || editAsset.isPending) return;
    if (next === currentName) {
      onOpenChange(false);
      return;
    }
    editAsset.mutate(
      {
        workspaceId,
        productKey,
        parentAssetId: parentId || undefined,
        id: nodeId,
        name: next,
        label: currentLabel || next,
      },
      {
        onSuccess: () => {
          onRename(next);
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("failedToRenameNode"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rename")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t("name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("enterNodeName")}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={editAsset.isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleRename} disabled={!name.trim() || !nodeId || editAsset.isPending} className="gap-2">
            {editAsset.isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t("rename")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
