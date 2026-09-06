import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/edge-hub");

export default function EdgeHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
