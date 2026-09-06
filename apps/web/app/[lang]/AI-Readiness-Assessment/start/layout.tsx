import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/AI-Readiness-Assessment/start", { noindex: true });

export default function AIReadinessAssessmentStartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
