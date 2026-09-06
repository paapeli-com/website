import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/predictive-analytics");

export default function FeaturesPredictiveAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
