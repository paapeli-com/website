import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/ota-updates");

export default function FeaturesOtaUpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
