import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/features/factory/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/features/factory/components/ui/breadcrumb";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_GPU_PATH } from "@/shell/nav/cloudServerNav";
import { useT } from "./i18n";

/* The frame both create pages share, taken from Smart Factory's Create alert
 * rule page (AlertRuleForm) so the two read as one panel: the same three-level
 * breadcrumb, the same text-2xl title with one line under it, and the same
 * sticky footer of Cancel, Back and the primary action.
 */

export const SERVERS_PATH = `${CLOUD_SERVER_BASE}/servers`;
export const NEW_SERVER_PATH = `${SERVERS_PATH}/new`;
export const CREATE_SERVER_PATH = `${SERVERS_PATH}/create`;
export const SERVER_CREATED_PATH = `${SERVERS_PATH}/created`;
/* GPU servers: their own list and their own wizard, the same pages in GPU
   mode. */
export const GPU_SERVERS_PATH = CLOUD_SERVER_GPU_PATH;
export const CREATE_GPU_SERVER_PATH = `${GPU_SERVERS_PATH}/create`;
export const DEDICATED_PATH = `${CLOUD_SERVER_BASE}/dedicated-servers`;
export const CREATE_DEDICATED_PATH = `${DEDICATED_PATH}/create`;
export const IMAGES_PATH = `${CLOUD_SERVER_BASE}/images`;
export const UPLOAD_IMAGE_PATH = `${IMAGES_PATH}/upload`;

export function CreateHeader({
  description,
  title,
  gpu,
}: {
  description: string;
  title?: string;
  /** Under GPU Servers rather than Cloud Server. */
  gpu?: boolean;
}) {
  const t = useT();
  const heading = title ?? t("Create cloud server");
  const shellT = useShellT();
  const navigate = useNavigate();
  const listPath = gpu ? GPU_SERVERS_PATH : SERVERS_PATH;
  return (
    <>
      {/* Compute > Cloud Server > Create cloud server: the sidebar group, the
          page, then this one, as Alarms > Rules > Create rule is. */}
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(listPath)} className="cursor-pointer">
              {shellT("Compute")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(listPath)} className="cursor-pointer">
              {shellT(gpu ? "GPU Servers" : "Cloud Server")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{heading}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  );
}

/** A list page's breadcrumb, the create pages' component: the sidebar group,
    then the page, the last item being where you are. */
export function PageBreadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  const navigate = useNavigate();
  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === items.length - 1 || !item.path ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink onClick={() => navigate(item.path!)} className="cursor-pointer">
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type Action = { label: string; onClick: () => void; disabled?: boolean };

/** AlertRuleForm's footer, button for button. */
export function CreateFooter({ cancel, back, primary }: { cancel: Action; back?: Action; primary: Action }) {
  const { isRTL } = useLanguage();
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <div className={cn("flex items-center justify-end gap-3", isRTL && "flex-row-reverse")}>
        <Button variant="ghost" onClick={cancel.onClick} className="min-w-[100px]">
          {cancel.label}
        </Button>
        {back && (
          <Button variant="outline" onClick={back.onClick} disabled={back.disabled} className="min-w-[100px]">
            {back.label}
          </Button>
        )}
        <Button
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {primary.label}
        </Button>
      </div>
    </div>
  );
}

/** Text cut with an ellipsis when its column is too narrow, carrying the full
    text as a tooltip then and only then. Re-measured on resize, so a column
    that widens drops the tooltip again. */
export function TruncatedText({
  text,
  className,
  ltr,
  mono,
}: {
  text: string;
  className?: string;
  ltr?: boolean;
  mono?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);
  return (
    <span
      ref={ref}
      dir={ltr ? "ltr" : undefined}
      title={cut ? text : undefined}
      className={cn("block min-w-0 truncate", mono && "font-mono text-xs", className)}
    >
      {text}
    </span>
  );
}

/** The page frame: the padding the factory pages sit in. */
export function CreatePage({ children }: { children: ReactNode }) {
  return <div className="p-4 lg:p-6">{children}</div>;
}
