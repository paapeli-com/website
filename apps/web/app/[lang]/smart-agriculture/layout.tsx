import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/smart-agriculture");

export default function SmartAgricultureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
