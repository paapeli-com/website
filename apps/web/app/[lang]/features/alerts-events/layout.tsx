import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/alerts-events");

export default function FeaturesAlertsEventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
