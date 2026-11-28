import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { HomeCrumb } from "@/shell/HomeCrumb";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { LanguageProvider } from "@/features/factory/contexts/LanguageContext";
import { TooltipProvider } from "@/features/factory/components/ui/tooltip";
import { isRTLLanguage, useAppLanguage } from "@/shared/i18n/appLanguage";
import { AI_INFERENCE_BASE } from "@/shell/nav/aiInferenceNav";
import { PROJECTS } from "./lib/catalog";
import { useT } from "./i18n";
import Overview from "./pages/Overview";
import Models from "./pages/Models";
import ModelDetail from "./pages/ModelDetail";
import Playground from "./pages/Playground";
import Usage from "./pages/Usage";
import RequestsPage from "./pages/Requests";
import Limits from "./pages/Limits";
import ApiIntegration from "./pages/ApiIntegration";

/* AI Inference — AI Infra's first product, mounted at /AIInfra/AIInference/*.
 *
 * This module is the feature's lazy chunk boundary (see src/app/features.ts).
 * Auth, the API client, the query client and the toaster belong to the app
 * shell; what is set up here is what this feature adds on top:
 *
 *   - LanguageProvider, because the shared list toolbar this product reuses
 *     reads its own labels through it. This feature's own copy comes from
 *     ./i18n; nothing is added to the factory's table.
 *   - The project selection, which every page filters by.
 *   - dir, stated rather than inherited. Other pages in this panel discovered
 *     the hard way that a nested tree can end up left-to-right inside a
 *     right-to-left page; a product started today should not have to find that
 *     out one card at a time.
 */

interface ProjectContextValue {
  projectId: string;
  projectName: string;
  setProjectId: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

/** The project every page on this product is scoped to. */
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside AI Inference's routes");
  return ctx;
}

function Breadcrumbs() {
  const t = useT();
  const navigate = useNavigate();
  const { projectId, setProjectId } = useProject();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 lg:px-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ol className="contents">
          <HomeCrumb />
        </ol>
        <button
          type="button"
          onClick={() => navigate(AI_INFERENCE_BASE)}
          className="hover:text-foreground"
        >
          {t("AI Infra")}
        </button>
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
        <span className="text-foreground">{t("AI Inference")}</span>
      </nav>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("Project")}</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          {PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function AiInferenceRoutes() {
  const language = useAppLanguage();
  const isRTL = isRTLLanguage(language);
  const location = useLocation();

  /* Switching project changes usage, budget, keys and limits together, so it
     is held here rather than per page. */
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const project = useMemo<ProjectContextValue>(
    () => ({
      projectId,
      projectName: PROJECTS.find((p) => p.id === projectId)?.name ?? projectId,
      setProjectId,
    }),
    [projectId],
  );

  return (
    <LanguageProvider>
      <TooltipProvider delayDuration={150}>
        <ProjectContext.Provider value={project}>
          {/* data-uniform-type: every page here is written in Tailwind
              steps, and reads at those steps in all three languages.
              See the block in src/index.css. */}
          <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="min-h-full">
            <Breadcrumbs />
            {/* Keyed on the path so a page's own state — a prompt, a filter,
                a selection — never leaks into the next one. */}
            <Routes key={location.pathname.split("/").slice(3, 5).join("/") || "start"}>
              <Route path="/" element={<Overview />} />
              <Route path="/models" element={<Models />} />
              <Route path="/models/:modelId" element={<ModelDetail />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/usage/requests" element={<RequestsPage />} />
              <Route path="/usage/limits" element={<Limits />} />
              {/* The old addresses, from before these became Usage's tabs. */}
              <Route path="/requests" element={<Navigate to={`${AI_INFERENCE_BASE}/usage/requests`} replace />} />
              <Route path="/limits" element={<Navigate to={`${AI_INFERENCE_BASE}/usage/limits`} replace />} />
              <Route path="/integration" element={<ApiIntegration />} />
              <Route path="*" element={<Navigate to={AI_INFERENCE_BASE} replace />} />
            </Routes>
          </div>
        </ProjectContext.Provider>
      </TooltipProvider>
    </LanguageProvider>
  );
}
