import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Disc, FileUp, Info, Link2, Upload, type LucideIcon } from "lucide-react";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Label } from "@/features/factory/components/ui/label";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { IMAGE_GB_MONTHLY } from "../lib/catalog";
import { addImage, MAX_IMAGE_GB, type BootType, type ImageFormat } from "../lib/imageStore";
import { CreateFooter, CreatePage, IMAGES_PATH, PageBreadcrumb, SERVERS_PATH } from "../ui";

/* Upload image: a page of its own rather than a popup, in the create pages'
 * frame (breadcrumb, title, card, sticky footer), and one step: name, where
 * the file comes from, and the two facts the platform cannot read from it,
 * the operating system and the boot type.
 *
 * Upload starts the transfer and returns to the image list, where the upload
 * is followed and, if it fails, retried. Nothing waits on this page.
 */

const FORMATS: ImageFormat[] = ["qcow2", "raw"];
const ACCEPT = ".qcow2,.raw,.img";
const URL_RE = /^https?:\/\/\S+$/i;

/** The format a file name says it is, if it says. */
const formatFromName = (name: string): ImageFormat | null => {
  const lower = name.toLowerCase().split("?")[0];
  if (lower.endsWith(".qcow2")) return "qcow2";
  if (lower.endsWith(".raw") || lower.endsWith(".img")) return "raw";
  return null;
};

export default function UploadImage() {
  const t = useT();
  const shellT = useShellT();
  const { isRTL, formatNumber } = useLanguage();
  const navigate = useNavigate();
  const { currency, format } = useBillingCurrency();
  const goToImages = () => navigate(IMAGES_PATH);

  const [name, setName] = useState("");
  const [source, setSource] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [osFamily, setOsFamily] = useState<"linux" | "windows">("linux");
  const [boot, setBoot] = useState<BootType>("bios");
  const [tried, setTried] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const location = source === "url" ? url.trim() : (file?.name ?? "");
  const detected = location ? formatFromName(location) : null;
  const fileGb = file ? file.size / 1024 ** 3 : 0;

  const nameError = !name.trim() ? t("Give the image a name.") : null;
  const sourceError =
    source === "url"
      ? !URL_RE.test(url.trim())
        ? t("Enter a link that starts with http:// or https://.")
        : !detected
          ? t("The link should end in .qcow2, .raw or .img.")
          : null
      : !file
        ? t("Choose a file.")
        : !detected
          ? t("Choose a .qcow2, .raw or .img file.")
          : fileGb > MAX_IMAGE_GB
            ? t("The file is larger than {n} GB.", { n: formatNumber(MAX_IMAGE_GB) })
            : null;

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    if (!name.trim()) setName(f.name.replace(/\.(qcow2|raw|img)$/i, ""));
  };

  const upload = () => {
    setTried(true);
    if (nameError || sourceError) {
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    addImage({
      name: name.trim(),
      source,
      location,
      format: detected!,
      boot,
      osFamily,
      /* A link's size is only known once it is read; ten GB stands in. */
      sizeGb: source === "file" ? Math.max(1, Math.round(fileGb * 10) / 10) : 10,
    });
    toast.success(t("Upload started. Follow it in the image list."));
    goToImages();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Compute"), path: SERVERS_PATH },
          { label: shellT("Images & Operating Systems"), path: IMAGES_PATH },
          { label: t("Upload image") },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Upload image")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Bring your own operating system image and create servers from it.")}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-5">
          {/* Name */}
          <div>
            <FieldLabel required htmlFor="image-name">
              {t("Image name")}
            </FieldLabel>
            <Input
              id="image-name"
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("For example, ubuntu-web-base")}
              aria-invalid={tried && !!nameError}
              className={cn("max-w-md", tried && nameError && "border-destructive")}
            />
            {tried && nameError && <p className="mt-1.5 text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Source */}
          <div>
            <FieldLabel required>{t("Image source")}</FieldLabel>
            <div role="radiogroup" className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              <SourceCard
                icon={Link2}
                title={t("From a link")}
                description={t("A public link to the image file")}
                selected={source === "url"}
                onSelect={() => setSource("url")}
              />
              <SourceCard
                icon={FileUp}
                title={t("From your computer")}
                description={t("Up to {n} GB", { n: formatNumber(MAX_IMAGE_GB) })}
                selected={source === "file"}
                onSelect={() => setSource("file")}
              />
            </div>

            <div className="mt-4 max-w-2xl">
              {source === "url" ? (
                <>
                  <Input
                    dir="ltr"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/images/server.qcow2"
                    aria-label={t("Image link")}
                    aria-invalid={tried && !!sourceError}
                    className={cn(tried && sourceError && "border-destructive")}
                  />
                </>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInput.current?.click()}
                  onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInput.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                    dragOver
                      ? "border-primary bg-primary/[0.04]"
                      : tried && sourceError
                        ? "border-destructive"
                        : "border-border hover:border-primary/40",
                  )}
                >
                  <Upload className="size-6 text-muted-foreground" />
                  {file ? (
                    <>
                      <p className="mt-3 max-w-full truncate text-sm font-medium text-foreground" dir="ltr">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatNumber(Math.round(fileGb * 10) / 10)} {t("GB")} · {t("Click to choose another file")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-medium text-foreground">{t("Drop the file here, or click to choose")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        .qcow2 · .raw · .img
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </div>
              )}
              {tried && sourceError ? (
                <p className="mt-1.5 text-xs text-destructive">{sourceError}</p>
              ) : (
                detected && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t("Format")}: <span dir="ltr">{detected}</span>
                  </p>
                )
              )}
            </div>
          </div>

          {/* Operating system and boot type */}
          <div className="grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel required>{t("Operating system")}</FieldLabel>
              <RadioGroup
                dir={isRTL ? "rtl" : "ltr"}
                value={osFamily}
                onValueChange={(v) => setOsFamily(v as "linux" | "windows")}
                className="flex gap-6"
              >
                <RadioOption value="linux" label={t("Linux")} />
                <RadioOption value="windows" label={t("Windows")} />
              </RadioGroup>
            </div>
            <div>
              <FieldLabel required>{t("Boot type")}</FieldLabel>
              <RadioGroup
                dir={isRTL ? "rtl" : "ltr"}
                value={boot}
                onValueChange={(v) => setBoot(v as BootType)}
                className="flex gap-6"
              >
                <RadioOption value="bios" label="BIOS" />
                <RadioOption value="uefi" label="UEFI" />
              </RadioGroup>
            </div>
          </div>
        </Card>

        {/* What the platform accepts and what keeping an image costs. */}
        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Storage cost")}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">{format(IMAGE_GB_MONTHLY[currency])}</span>
              <span className="text-sm text-muted-foreground">{t("per GB / month")}</span>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              <AsideLine icon={Disc} label={t("Formats")} value={<span dir="ltr">{FORMATS.join(", ")}</span>} />
              <AsideLine icon={Upload} label={t("Largest image")} value={`${formatNumber(MAX_IMAGE_GB)} ${t("GB")}`} />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              <Info className="mt-px size-4 shrink-0" />
              <span>{t("The upload continues in the image list, where you can follow it and retry it if it fails.")}</span>
            </div>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: goToImages }}
        primary={{ label: t("Upload image"), onClick: upload }}
      />
    </CreatePage>
  );
}

function SourceCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30 hover:bg-muted/30",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 pe-5">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      {selected && (
        <span className="absolute end-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
}

function RadioOption({ value, label }: { value: string; label: string }) {
  const id = `opt-${value}`;
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}

function AsideLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ms-auto font-medium text-foreground">{value}</span>
    </div>
  );
}
