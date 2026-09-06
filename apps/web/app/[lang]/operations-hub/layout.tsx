import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/operations-hub");

export default function OperationsHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
