import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/smart-manufacturing");

export default function SmartManufacturingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
