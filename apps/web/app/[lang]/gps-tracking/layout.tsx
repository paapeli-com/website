import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/gps-tracking");

export default function GpsTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
