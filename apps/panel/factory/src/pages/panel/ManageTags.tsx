import { Fragment, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PanelLayout } from "@/layouts/PanelLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { X as XIcon, Tag } from "lucide-react";
import { useNodeTags, addNodeTag, removeNodeTag } from "@/lib/locationTags";

const ManageTags = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nodeId = params.get("node") || "";

  // Full name path (root → node), passed from the Locations page.
  let pathNames: string[] = [];
  try {
    pathNames = JSON.parse(params.get("path") || "[]");
  } catch {
    pathNames = [];
  }
  if (!pathNames.length) {
    const nm = params.get("name");
    if (nm) pathNames = [nm];
  }

  const tags = useNodeTags(nodeId);
  const [input, setInput] = useState("");

  const locationsPath = language === "en" ? "/locations" : `/${language}/locations`;
  const goLocations = () => navigate(locationsPath);

  const commit = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    addNodeTag(nodeId, v);
    setInput("");
  };

  return (
    <PanelLayout pageTitle={t("manageTags")}>
      {/* Breadcrumb — full path down to the node */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={goLocations} className="cursor-pointer">
              {t("locations")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathNames.map((part, i) => (
            <Fragment key={`${part}-${i}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === pathNames.length - 1 ? (
                  <BreadcrumbPage>{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink onClick={goLocations} className="cursor-pointer">
                    {part}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={t("manageTags")} count={tags.length} countLabel={t("tagsUnit")} />

      {!nodeId ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t("selectLocationPrompt")}
          </CardContent>
        </Card>
      ) : (
        <Card dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl">
          <CardContent className="space-y-2 pt-6">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              {t("tagsLabel")}
            </Label>
            <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary text-xs px-2 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeNodeTag(nodeId, tag)}
                    className="hover:bg-primary/20 rounded p-0.5"
                    aria-label={`Remove ${tag}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(",")) commit(v.slice(0, -1));
                  else setInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commit(input);
                  } else if (e.key === "Backspace" && !input && tags.length) {
                    removeNodeTag(nodeId, tags[tags.length - 1]);
                  }
                }}
                onBlur={() => input && commit(input)}
                placeholder={tags.length === 0 ? t("addTagsPlaceholder") : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("pressEnterTags")}</p>
          </CardContent>
        </Card>
      )}
    </PanelLayout>
  );
};

export default ManageTags;
