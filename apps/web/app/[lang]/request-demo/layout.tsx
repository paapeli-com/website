import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/request-demo");

export default function RequestDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
