import { Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/features/factory/contexts/LanguageContext";
import { TooltipProvider } from "@/features/factory/components/ui/tooltip";
import { isRTLLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_PAGES } from "@/shell/nav/cloudServerNav";
import Servers from "./pages/Servers";
import CreateServer from "./pages/CreateServer";
import AutoScaleGroups from "./pages/AutoScaleGroups";
import CreateAutoScale from "./pages/CreateAutoScale";
import AutoScaleGroup from "./pages/AutoScaleGroup";
import ServerCreated from "./pages/ServerCreated";
import Images from "./pages/Images";
import DedicatedServers from "./pages/DedicatedServers";
import CreateDedicated from "./pages/CreateDedicated";
import UploadImage from "./pages/UploadImage";

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
            {/* Keyed by mode: going from the cloud wizard to the GPU one (its
                "Need a GPU?" link) would otherwise reuse the same instance and
                carry the cloud form's state, plan and all, across. */}
            <Route path="/servers" element={<Servers key="cloud" />} />
            {/* The old single-or-group choice: a server is made from the wizard,
                a group from Auto Scale. Kept as a redirect for old links. */}
            <Route path="/servers/new" element={<Navigate to={`${CLOUD_SERVER_BASE}/servers/create`} replace />} />
            <Route path="/servers/create" element={<CreateServer key="cloud" />} />
            <Route path="/servers/created" element={<ServerCreated />} />
            {/* GPU servers: the same list and wizard, in GPU mode. */}
            <Route path="/gpu-servers" element={<Servers key="gpu" kind="gpu" />} />
            <Route path="/gpu-servers/create" element={<CreateServer key="gpu" mode="gpu" />} />
            <Route path="/auto-scale" element={<AutoScaleGroups />} />
            <Route path="/auto-scale/create" element={<CreateAutoScale />} />
            <Route path="/auto-scale/:groupId" element={<AutoScaleGroup />} />
            <Route path="/dedicated-servers" element={<DedicatedServers />} />
            <Route path="/dedicated-servers/create" element={<CreateDedicated />} />
            <Route path="/images" element={<Images />} />
            <Route path="/images/upload" element={<UploadImage />} />
            {CLOUD_SERVER_PAGES.filter(([segment]) => !["servers", "gpu-servers", "images", "dedicated-servers", "auto-scale"].includes(segment)).map(([segment, title]) => (
              <Route key={segment} path={`/${segment}`} element={<Page title={title} />} />
            ))}
            <Route path="*" element={<Navigate to={`${CLOUD_SERVER_BASE}/servers`} replace />} />
          </Routes>
        </div>
      </TooltipProvider>
    </LanguageProvider>
  );
}
