import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/AI-Readiness-Assessment/report", { noindex: true });

export default function AIReadinessAssessmentReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
