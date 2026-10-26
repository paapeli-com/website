import { Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/features/factory/contexts/LanguageContext";
import { TooltipProvider } from "@/features/factory/components/ui/tooltip";
import { isRTLLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_PAGES } from "@/shell/nav/cloudServerNav";
import Servers from "./pages/Servers";
import CreateServer from "./pages/CreateServer";
import ChooseServerType from "./pages/ChooseServerType";
import ServerCreated from "./pages/ServerCreated";

/* Cloud Server, IaaS's first product, mounted at /IaaS/CloudServer/*.
 *
 * The server list and the create flow are designed; every other page is its
 * title until its own design lands.
 *
 * LanguageProvider because the Smart Factory kit these pages are built from
 * (the list toolbar, pagination, form labels) reads its own labels through it.
 * data-uniform-type so the type sits at the same Tailwind steps in all three
 * languages. */

function Page({ title }: { title: string }) {
  const t = useShellT();
  return <h1 className="px-4 pt-6 text-xl font-bold text-foreground lg:px-6">{t(title)}</h1>;
}

export default function CloudServerRoutes() {
  const isRTL = isRTLLanguage(useAppLanguage());

  return (
    <LanguageProvider>
      <TooltipProvider delayDuration={150}>
        <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="min-h-full">
          <Routes>
            <Route path="/servers" element={<Servers />} />
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
