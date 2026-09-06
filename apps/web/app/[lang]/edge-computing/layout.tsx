import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/edge-computing");

export default function EdgeComputingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
