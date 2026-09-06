import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/smart-cities");

export default function SmartCitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
