import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/oil-gas");

export default function OilGasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
