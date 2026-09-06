import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/ota");

export default function OtaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
