import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/status");

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
