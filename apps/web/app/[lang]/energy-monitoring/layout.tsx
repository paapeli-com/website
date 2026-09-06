import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/energy-monitoring");

export default function EnergyMonitoringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
