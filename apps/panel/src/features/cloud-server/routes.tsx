import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { LanguageProvider } from "@/features/factory/contexts/LanguageContext";
import { TooltipProvider } from "@/features/factory/components/ui/tooltip";
import { Button } from "@/features/factory/components/ui/button";
import { isRTLLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_PAGES } from "@/shell/nav/cloudServerNav";
import { useT } from "./i18n";
import CreateServer from "./pages/CreateServer";
import ChooseServerType from "./pages/ChooseServerType";
import ServerCreated from "./pages/ServerCreated";

/* Cloud Server, IaaS's first product, mounted at /IaaS/CloudServer/*.
 *
 * The create wizard is designed; every other page is its title until its own
 * design lands. The servers page carries only the button into the wizard, not
 * a list yet.
 *
 * LanguageProvider because the Smart Factory form kit the wizard is built from
 * reads its own labels ("Optional") through it. data-uniform-type so the type
 * sits at the same Tailwind steps in all three languages. */

function Page({ title, children }: { title: string; children?: React.ReactNode }) {
  const t = useShellT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-6 lg:px-6">
      <h1 className="text-xl font-bold text-foreground">{t(title)}</h1>
      {children}
    </div>
  );
}

function ServersPage() {
  const t = useT();
  const navigate = useNavigate();
  return (
    <Page title="Cloud Server">
      <Button onClick={() => navigate(`${CLOUD_SERVER_BASE}/servers/new`)}>
        <Plus className="me-1.5 size-4" />
        {t("Create cloud server")}
      </Button>
    </Page>
  );
}

export default function CloudServerRoutes() {
  const isRTL = isRTLLanguage(useAppLanguage());

  return (
    <LanguageProvider>
      <TooltipProvider delayDuration={150}>
        <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="min-h-full">
          <Routes>
            <Route path="/servers" element={<ServersPage />} />
            <Route path="/servers/new" element={<ChooseServerType />} />
            <Route path="/servers/create" element={<CreateServer />} />
            <Route path="/servers/created" element={<ServerCreated />} />
            {CLOUD_SERVER_PAGES.filter(([segment]) => segment !== "servers").map(([segment, title]) => (
              <Route key={segment} path={`/${segment}`} element={<Page title={title} />} />
            ))}
            <Route path="*" element={<Navigate to={`${CLOUD_SERVER_BASE}/servers`} replace />} />
          </Routes>
        </div>
      </TooltipProvider>
    </LanguageProvider>
  );
}
