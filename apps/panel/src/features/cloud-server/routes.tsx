import { Navigate, Route, Routes } from "react-router-dom";
import { isRTLLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { CLOUD_SERVER_BASE, CLOUD_SERVER_PAGES } from "@/shell/nav/cloudServerNav";

/* Cloud Server, IaaS's first product, mounted at /IaaS/CloudServer/*.
 *
 * Only the sidebar is designed so far. Each page is its title and nothing
 * else until its own design lands; the routes exist so the sidebar has
 * somewhere to go. */

function Page({ title }: { title: string }) {
  const t = useShellT();
  return <h1 className="px-4 pt-6 text-2xl font-bold text-foreground lg:px-6">{t(title)}</h1>;
}

export default function CloudServerRoutes() {
  const isRTL = isRTLLanguage(useAppLanguage());

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-full">
      <Routes>
        {CLOUD_SERVER_PAGES.map(([segment, title]) => (
          <Route key={segment} path={`/${segment}`} element={<Page title={title} />} />
        ))}
        <Route path="*" element={<Navigate to={`${CLOUD_SERVER_BASE}/servers`} replace />} />
      </Routes>
    </div>
  );
}
