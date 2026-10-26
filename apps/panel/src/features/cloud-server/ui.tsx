import type { ReactNode } from "react";
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
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "./i18n";

/* The frame both create pages share, taken from Smart Factory's Create alert
 * rule page (AlertRuleForm) so the two read as one panel: the same three-level
 * breadcrumb, the same text-2xl title with one line under it, and the same
 * sticky footer of Cancel, Back and the primary action.
 */

export const SERVERS_PATH = `${CLOUD_SERVER_BASE}/servers`;
export const NEW_SERVER_PATH = `${SERVERS_PATH}/new`;
export const CREATE_SERVER_PATH = `${SERVERS_PATH}/create`;

export function CreateHeader({ description }: { description: string }) {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  return (
    <>
      {/* Compute > Cloud Server > Create cloud server: the sidebar group, the
          page, then this one, as Alarms > Rules > Create rule is. */}
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(SERVERS_PATH)} className="cursor-pointer">
              {shellT("Compute")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(SERVERS_PATH)} className="cursor-pointer">
              {shellT("Cloud Server")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("Create cloud server")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Create cloud server")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </>
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

/** The page frame: the padding the factory pages sit in. */
export function CreatePage({ children }: { children: ReactNode }) {
  return <div className="p-4 lg:p-6">{children}</div>;
}
