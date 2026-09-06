import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/infrastructure-hub");

export default function InfrastructureHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
