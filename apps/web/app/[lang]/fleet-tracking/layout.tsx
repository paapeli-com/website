import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/fleet-tracking");

export default function FleetTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
