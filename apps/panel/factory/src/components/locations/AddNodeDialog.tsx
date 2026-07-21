import { useState, useEffect, type ReactNode } from "react";
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
import { MapPin, Factory, Cpu, X as XIcon } from "lucide-react";
import { useCreateAssetMutation } from "@paapeli/api";
import { toast } from "sonner";

type NodeType = "location" | "area" | "asset";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  parentType?: "organization" | "location" | "area" | "asset" | null;
  parentName?: string;
  defaultType?: NodeType | null;
  onAdd: (name: string, type: NodeType, tags: string[]) => void;
}

export const AddNodeDialog = ({ open, onOpenChange, parentId, parentType, parentName, defaultType, onAdd }: AddNodeDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState<NodeType | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const createAsset = useCreateAssetMutation();

  // Reset each time it opens; preselect the type when one was chosen from a
  // node's "..." menu (Add Location / Add Unit / Add Asset).
  useEffect(() => {
    if (open) {
      setName("");
      setTags([]);
      setTagInput("");
      setType(defaultType || "");
    }
  }, [open, defaultType]);

  // Tag chip-input — add on Enter or comma, remove with the chip's × or Backspace.
  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  // Allowed child types by parent:
  //   root (organization) → Location, Unit, Asset
  //   location            → Unit, Asset
  //   unit (area)         → Asset
  const allowedTypes: { value: NodeType; label: string; icon: ReactNode }[] = [];
  if (!parentType || parentType === "organization") {
    allowedTypes.push({ value: "location", label: t("locationLabel"), icon: <MapPin className="h-4 w-4" /> });
  }
  if (!parentType || parentType === "organization" || parentType === "location") {
    allowedTypes.push({ value: "area", label: t("areaUnit"), icon: <Factory className="h-4 w-4" /> });
  }
  if (!parentType || parentType === "organization" || parentType === "location" || parentType === "area") {
    allowedTypes.push({ value: "asset", label: t("assets"), icon: <Cpu className="h-4 w-4" /> });
  }

  const handleAdd = () => {
    if (!name.trim() || !type || createAsset.isPending) return;
    // Include a tag still sitting in the input that wasn't committed yet.
    const pending = tagInput.trim().replace(/,$/, "").trim();
    const tagList = pending && !tags.includes(pending) ? [...tags, pending] : tags;
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
          onAdd(name.trim(), type as NodeType, tagList);
          setName("");
          setType("");
          setTags([]);
          setTagInput("");
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
            <Select value={type} onValueChange={(v) => setType(v as NodeType)}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectNodeType")} />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      {opt.label}
                    </div>
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
            <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary text-xs px-2 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-primary/20 rounded p-0.5"
                    aria-label={`Remove ${tag}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(",")) addTag(v.slice(0, -1));
                  else setTagInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  } else if (e.key === "Backspace" && !tagInput && tags.length) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length === 0 ? t("addTagsPlaceholder") : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
              />
            </div>
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
