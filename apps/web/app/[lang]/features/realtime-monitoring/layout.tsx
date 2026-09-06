import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/realtime-monitoring");

export default function FeaturesRealtimeMonitoringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
