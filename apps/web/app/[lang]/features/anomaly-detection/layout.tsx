import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/anomaly-detection");

export default function FeaturesAnomalyDetectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
