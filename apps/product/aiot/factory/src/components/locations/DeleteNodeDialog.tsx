import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteAssetMutation } from "@paapeli/api";
import { toast } from "sonner";

interface DeleteNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  productKey: string;
  nodeId?: string | null;
  /** Only used to target cache invalidation on success, if known. */
  parentId?: string | null;
  nodeName: string;
  onConfirm: () => void;
}

export const DeleteNodeDialog = ({ open, onOpenChange, workspaceId, productKey, nodeId, parentId, nodeName, onConfirm }: DeleteNodeDialogProps) => {
  const { t } = useLanguage();
  const deleteAsset = useDeleteAssetMutation();

  const handleConfirm = () => {
    if (!nodeId || deleteAsset.isPending) return;
    deleteAsset.mutate(
      { workspaceId, productKey, assetId: nodeId, parentAssetId: parentId || undefined },
      {
        onSuccess: () => {
          onConfirm();
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("failedToDeleteNode"));
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDeleteNode")}
            <br />
            <strong className="text-foreground mt-1 inline-block">{nodeName}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAsset.isPending}>{t("cancel")}</AlertDialogCancel>
          {/* preventDefault keeps the dialog open until the request settles */}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={!nodeId || deleteAsset.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {deleteAsset.isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
