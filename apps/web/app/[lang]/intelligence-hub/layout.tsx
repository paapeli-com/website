import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/intelligence-hub");

export default function IntelligenceHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
