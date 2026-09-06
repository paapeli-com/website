import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/intelligence-insight");

export default function IntelligenceInsightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
