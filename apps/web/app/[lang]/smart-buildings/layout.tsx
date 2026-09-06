import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/smart-buildings");

export default function SmartBuildingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
