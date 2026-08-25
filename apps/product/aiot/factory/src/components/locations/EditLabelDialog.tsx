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

interface EditLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  productKey: string;
  nodeId?: string | null;
  /** Only used to target cache invalidation on success, if known. */
  parentId?: string | null;
  /** Sent unchanged — the edit endpoint requires the full name/label pair. */
  nodeName: string;
  currentLabel?: string;
  onSave: (newLabel: string) => void;
}

/**
 * Single-field modal for a node's label, mirroring the rename dialog. Both hit
 * the same asset edit endpoint (PUT /assets/{workspaceId}/{productKey}/{assetId}), which takes name and
 * label together, so each dialog passes the field it doesn't own through as-is.
 */
export const EditLabelDialog = ({
  open,
  onOpenChange,
  workspaceId,
  productKey,
  nodeId,
  parentId,
  nodeName,
  currentLabel,
  onSave,
}: EditLabelDialogProps) => {
  const { t } = useLanguage();
  const [label, setLabel] = useState(currentLabel || "");
  const editAsset = useUpdateAssetMutation();

  useEffect(() => {
    if (open) setLabel(currentLabel || "");
  }, [open, currentLabel]);

  const handleSave = () => {
    const next = label.trim();
    if (!next || !nodeId || editAsset.isPending) return;
    if (next === (currentLabel || "")) {
      onOpenChange(false);
      return;
    }
    editAsset.mutate(
      {
        workspaceId,
        productKey,
        parentAssetId: parentId || undefined,
        id: nodeId,
        name: nodeName,
        label: next,
      },
      {
        onSuccess: () => {
          onSave(next);
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("failedToUpdateLabel"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editLabel")}</DialogTitle>
          {nodeName && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{nodeName}</span>
            </p>
          )}
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t("label")}</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("enterLabel")}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={editAsset.isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!label.trim() || !nodeId || editAsset.isPending} className="gap-2">
            {editAsset.isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLabelDialog;
