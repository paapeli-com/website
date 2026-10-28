import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Disc,
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Server,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { KpiSection } from "@/features/factory/components/panel/KpiSection";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import {
  imageProgress,
  removeImages,
  renameImage,
  retryImage,
  useImages,
  type ImageRecord,
  type ImageStatus,
} from "../lib/imageStore";
import { IMAGES_PATH, PageBreadcrumb, SERVERS_PATH, TruncatedText, UPLOAD_IMAGE_PATH } from "../ui";
import { apiCall } from "../lib/openstackErrors";

/* Images & Operating Systems: the custom images this account has uploaded.
 *
 * The server list's standard, piece for piece: breadcrumb, page header with
 * its count, KPI cards that filter, the shared toolbar with multi-select bulk
 * actions, the device table with fixed columns and hover tooltips, the same
 * pagination and delete confirmation, and the empty state in place of the
 * rows. An upload in progress is a row like any other, with its progress in
 * the status column, so the list is where an upload is followed; one that
 * failed carries Retry in its row.
 *
 * Row actions are kept to what an image is for: making a server from it and,
 * when it failed, retrying it, out in the row; rename, tag and delete in the
 * menu.
 */

type SortKey = "created" | "nameAsc" | "nameDesc" | "size";

export default function Images() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const images = useImages();

  const [now, setNow] = useState(Date.now());
  const anyUploading = images.some((i) => imageProgress(i, now).status === "uploading");
  useEffect(() => {
    if (!anyUploading) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [anyUploading]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ImageStatus>("all");
  const [osFilter, setOsFilter] = useState<"all" | "linux" | "windows">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [renaming, setRenaming] = useState<ImageRecord | null>(null);

  const statusLabel: Record<ImageStatus, string> = {
    uploading: t("Uploading"),
    ready: t("Ready"),
    failed: t("Failed"),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return images
      .filter((i) => {
        const { status } = imageProgress(i, now);
        return (
          (!q || i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)) &&
          (statusFilter === "all" || status === statusFilter) &&
          (osFilter === "all" || i.osFamily === osFilter)
        );
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "size":
            return b.sizeGb - a.sizeGb;
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [images, search, statusFilter, osFilter, sortKey, now]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((i) => selected.includes(i.id));

  const exportCsv = () => {
    const header = ["name", "status", "format", "boot", "os", "sizeGb", "source", "created"];
    const rows = filtered.map((i) => [
      i.name,
      imageProgress(i, now).status,
      i.format,
      i.boot,
      i.osFamily,
      i.sizeGb,
      i.location,
      new Date(i.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `images-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterFields: FilterField[] = [
    {
      key: "status",
      label: fx("status"),
      value: statusFilter,
      onChange: (v) => {
        setStatusFilter(v as "all" | ImageStatus);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        ...(["ready", "uploading", "failed"] as ImageStatus[]).map((s) => ({ value: s, label: statusLabel[s] })),
      ],
    },
    {
      key: "os",
      label: t("Operating system"),
      value: osFilter,
      onChange: (v) => {
        setOsFilter(v as "all" | "linux" | "windows");
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "linux", label: t("Linux") },
        { value: "windows", label: t("Windows") },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
    { key: "created", label: t("Newest first") },
    { key: "size", label: t("Largest first") },
  ];

  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "tag", label: t("Add tag"), icon: Tag, comingSoon: true },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const counts: Record<"all" | ImageStatus, number> = {
    all: images.length,
    ready: images.filter((i) => imageProgress(i, now).status === "ready").length,
    uploading: images.filter((i) => imageProgress(i, now).status === "uploading").length,
    failed: images.filter((i) => imageProgress(i, now).status === "failed").length,
  };
  const kpis: { key: "all" | ImageStatus; label: string; icon: typeof Disc; accent: string; bg: string }[] = [
    { key: "all", label: t("Total images"), icon: Disc, accent: "text-primary", bg: "from-primary/10 to-transparent" },
    { key: "ready", label: t("Ready"), icon: CheckCircle2, accent: "text-emerald-500", bg: "from-emerald-50 to-transparent dark:from-emerald-500/10" },
    { key: "uploading", label: t("Uploading"), icon: Loader2, accent: "text-sky-500", bg: "from-sky-50 to-transparent dark:from-sky-500/10" },
    { key: "failed", label: t("Failed"), icon: AlertCircle, accent: "text-red-500", bg: "from-red-50 to-transparent dark:from-red-500/10" },
  ];

  const uploadButton = (
    <Button
      onClick={() => navigate(UPLOAD_IMAGE_PATH)}
      className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
    >
      <Upload className="h-4 w-4" />
      {t("Upload image")}
    </Button>
  );

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Images & Operating Systems"), path: IMAGES_PATH },
        ]}
      />
      <PageHeader
        title={shellT("Images & Operating Systems")}
        count={images.length}
        countLabel={t("images")}
        actions={uploadButton}
      />

      <KpiSection storageKey="cloud-images" className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const isActive = statusFilter === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  setStatusFilter(k.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "relative rounded-lg border bg-card bg-gradient-to-br px-3 py-2.5 text-start transition-all hover:shadow-sm",
                  k.bg,
                  isActive ? "border-primary shadow-sm ring-2 ring-primary/20" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">{k.label}</span>
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", k.accent)} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold leading-none text-foreground">{formatNumber(counts[k.key])}</span>
                  <span className="text-[11px] text-muted-foreground">{t("images")}</span>
                </div>
              </button>
            );
          })}
        </div>
      </KpiSection>

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name or source"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              setNow(Date.now());
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: [statusFilter, osFilter].filter((v) => v !== "all").length,
              onClear: () => {
                setStatusFilter("all");
                setOsFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3">
            <Table className="min-w-[1040px] table-fixed">
              <colgroup>
                <col className="w-[80px]" />
                <col />
                <col className="w-[13.7%]" />
                <col className="w-[7.3%]" />
                <col className="w-[7.3%]" />
                <col className="w-[8.1%]" />
                <col className="w-[7.3%]" />
                <col className="w-[11.3%]" />
                <col className="w-[130px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-center">
                    <div className="flex w-5 justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pageRows.map((i) => i.id)]))
                              : selected.filter((id) => !pageRows.some((i) => i.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{fx("status")}</TableHead>
                  <TableHead>{t("Format")}</TableHead>
                  <TableHead>{t("Boot type")}</TableHead>
                  <TableHead>{t("Operating system")}</TableHead>
                  <TableHead>{t("Size")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Disc className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No custom images yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Upload your own operating system image and create servers from it.")}
                        </p>
                        <div className="mt-6">{uploadButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9}>
                      <p className="py-12 text-center text-muted-foreground">{t("No images match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((img) => {
                    const { status, progress } = imageProgress(img, now);
                    return (
                      <TableRow key={img.id} className="border-b hover:bg-muted/30">
                        <TableCell className="text-center">
                          <div className="flex w-5 justify-center">
                            <Checkbox
                              checked={selected.includes(img.id)}
                              onCheckedChange={(c) =>
                                setSelected((prev) => (c ? [...prev, img.id] : prev.filter((id) => id !== img.id)))
                              }
                              aria-label={img.name}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Disc className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <TruncatedText text={img.name} className="font-medium text-foreground" />
                              <TruncatedText
                                text={img.source === "snapshot" ? t("Saved from {name}", { name: img.location }) : img.location}
                                ltr={img.source !== "snapshot"}
                                className="text-xs text-muted-foreground"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ImageStatusCell status={status} progress={progress} label={statusLabel[status]} />
                        </TableCell>
                        <TableCell>
                          <span dir="ltr">{img.format}</span>
                        </TableCell>
                        <TableCell>
                          <span dir="ltr">{img.boot === "uefi" ? "UEFI" : "BIOS"}</span>
                        </TableCell>
                        <TableCell>{img.osFamily === "windows" ? t("Windows") : t("Linux")}</TableCell>
                        <TableCell>
                          {formatNumber(img.sizeGb)} {t("GB")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <TruncatedText text={formatDateTime(img.createdAt, language)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {status === "failed" ? (
                              <RowIcon label={t("Retry upload")} onClick={() => retryImage(img.id)}>
                                <RotateCcw className="h-4 w-4 text-primary" />
                              </RowIcon>
                            ) : (
                              <RowIcon
                                label={t("Create server from this image")}
                                onClick={() => toast.info(fx("comingSoon"))}
                                disabled={status !== "ready"}
                              >
                                <Server className="h-4 w-4" />
                              </RowIcon>
                            )}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-44 bg-background">
                                <DropdownMenuItem onClick={() => setRenaming(img)}>
                                  <Pencil className="me-2 h-4 w-4" />
                                  {fx("rename")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(fx("comingSoon"))}>
                                  <Tag className="me-2 h-4 w-4" />
                                  {t("Add tag")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteIds([img.id])}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {status === "uploading" ? t("Cancel upload") : t("Delete image")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > itemsPerPage && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{fx("rowsPerPage")}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ms-3 text-sm text-muted-foreground">
                  {formatNumber(startIndex + 1)}-{formatNumber(Math.min(endIndex, filtered.length))} {fx("of")}{" "}
                  {formatNumber(filtered.length)}
                </span>
              </div>
              <SmartPagination
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onChange={(p) => p >= 1 && p <= totalPages && setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteIds} onOpenChange={(open) => !open && setDeleteIds(null)}>
        <DialogContent data-uniform-type className="sm:max-w-[425px]">
          <DialogHeader className={isRTL ? "text-right" : ""}>
            <DialogTitle className={isRTL ? "text-right" : ""}>{t("Delete images?")}</DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {t("{n} images will be deleted. Servers already made from them are not affected.", {
                n: formatNumber(deleteIds?.length ?? 0),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteIds(null)}>
              {fx("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const done = await apiCall(() => {
                  removeImages(deleteIds ?? []);
                  return true;
                }, t);
                if (!done) {
                  setDeleteIds(null);
                  return;
                }
                setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
                toast.success(t("Images deleted"));
                setDeleteIds(null);
              }}
            >
              {fx("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RenameImageDialog image={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}

/** Ready, failed, or the upload's progress as a bar and a percentage. */
function ImageStatusCell({ status, progress, label }: { status: ImageStatus; progress: number; label: string }) {
  const { formatNumber, isRTL } = useLanguage();
  if (status === "uploading") {
    const pct = Math.floor(progress * 100);
    return (
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {label}
          </span>
          <span className="tabular-nums text-muted-foreground">{formatNumber(pct)}
            {isRTL ? "٪" : "%"}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-sky-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

function RowIcon({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

function RenameImageDialog({ image, onClose }: { image: ImageRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(image?.name ?? ""), [image]);
  const ok = name.trim().length >= 2;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename image")}</DialogTitle>
        </DialogHeader>
        <Input dir="auto" value={name} onChange={(e) => setName(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (image) renameImage(image.id, name.trim());
              onClose();
            }}
          >
            {fx("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
